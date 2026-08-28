import { db } from '../db';
import type { PendingSyncItem, SyncState } from '../types';

type Listener = (state: SyncState, pendingCount: number) => void;

class SyncManager {
  private isBrowserOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSimulatedOffline: boolean = false;
  private currentSyncState: SyncState = 'ONLINE';
  private listeners: Set<Listener> = new Set();
  private isSyncInProgress: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleConnectivityChange(true));
      window.addEventListener('offline', () => this.handleConnectivityChange(false));
    }
    this.updateState();
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    this.notify();
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getEffectiveOnlineStatus(): boolean {
    return this.isBrowserOnline && !this.isSimulatedOffline;
  }

  public getSimulatedOffline(): boolean {
    return this.isSimulatedOffline;
  }

  public setSimulatedOffline(offline: boolean) {
    this.isSimulatedOffline = offline;
    this.updateState();
    if (this.getEffectiveOnlineStatus()) {
      this.triggerSync();
    }
  }

  public toggleSimulatedOffline(): boolean {
    this.setSimulatedOffline(!this.isSimulatedOffline);
    return this.isSimulatedOffline;
  }

  private async handleConnectivityChange(online: boolean) {
    this.isBrowserOnline = online;
    this.updateState();
    if (this.getEffectiveOnlineStatus()) {
      await this.triggerSync();
    }
  }

  private async updateState() {
    const isOnline = this.getEffectiveOnlineStatus();
    if (!isOnline) {
      this.currentSyncState = 'OFFLINE';
    } else if (!this.isSyncInProgress && this.currentSyncState !== 'SYNCED') {
      this.currentSyncState = 'ONLINE';
    }
    this.notify();
  }

  private async notify() {
    let pendingCount = 0;
    try {
      pendingCount = await db.pendingSync.where('status').equals('PENDING').count();
    } catch (err) {
      console.warn('Pending sync count lookup error:', err);
    }
    this.listeners.forEach(l => l(this.currentSyncState, pendingCount));
  }

  public async queueEvent(action: PendingSyncItem['action'], payload: Record<string, any>): Promise<PendingSyncItem> {
    const eventId = payload.eventId || `EVT-${Date.now()}`;
    const idempotencyKey = payload.idempotencyKey || eventId;

    // Idempotency guard: check if event already queued or synced
    const existing = await db.pendingSync.where('idempotencyKey').equals(idempotencyKey).first();
    if (existing) {
      console.warn(`Idempotency guard: Event ${idempotencyKey} already exists in sync queue.`);
      return existing;
    }

    const item: PendingSyncItem = {
      eventId,
      timestamp: new Date().toISOString(),
      action,
      payload,
      status: 'PENDING',
      idempotencyKey,
      retryCount: 0
    };

    const id = await db.pendingSync.add(item);
    item.id = id;

    // Also record in events log table
    await db.events.add({
      id: eventId,
      timestamp: item.timestamp,
      shipmentId: payload.shipmentId || 'UNKNOWN',
      scannerId: `RFID-${(payload.hub || 'HUB').toUpperCase()}-01`,
      hubId: payload.hub || 'HUB',
      eventType: payload.eventType || action as any,
      notes: `Queued offline: ${action}`
    });

    this.notify();

    // If online, auto-sync immediately
    if (this.getEffectiveOnlineStatus()) {
      this.triggerSync();
    }

    return item;
  }

  public async triggerSync(): Promise<void> {
    if (!this.getEffectiveOnlineStatus() || this.isSyncInProgress) {
      return;
    }

    const pendingItems = await db.pendingSync.where('status').equals('PENDING').toArray();
    if (pendingItems.length === 0) {
      this.currentSyncState = 'ONLINE';
      this.notify();
      return;
    }

    this.isSyncInProgress = true;
    this.currentSyncState = 'SYNCING';
    this.notify();

    try {
      const now = new Date().toISOString();

      // Process and apply queued offline events to IndexedDB local storage
      for (const item of pendingItems) {
        if (item.payload && item.payload.shipmentId) {
          const shpId = item.payload.shipmentId;
          const hub = item.payload.hub || 'Bengaluru';
          const delayMins = item.payload.delayMinutes || 0;
          const eventType = item.payload.eventType || item.action;

          if (['CONGESTION', 'WEATHER_DELAY', 'HUB_DELAY'].includes(eventType)) {
            const newPath = shpId === 'SHP-9001' 
              ? ['Delhi', 'Jaipur', 'Visakhapatnam', 'Kolkata']
              : ['Chennai', 'Bengaluru', 'Pune', 'Mumbai'];

            await db.shipments.update(shpId, {
              routePath: newPath,
              status: delayMins > 120 ? 'AT_RISK' : 'DELAYED',
              riskLevel: delayMins > 120 ? 'HIGH' : 'MEDIUM',
              delayMinutes: delayMins,
              lastUpdated: now
            });
          } else if (['LOCATION_UPDATE', 'ARRIVED', 'DEPARTED'].includes(eventType)) {
            await db.shipments.update(shpId, {
              currentLocation: hub,
              lastUpdated: now
            });
          }
        }

        if (item.id) {
          await db.pendingSync.update(item.id, { status: 'SYNCED' });
        }
      }

      await db.metadata.put({
        key: 'lastSyncedAt',
        value: now,
        lastSyncedAt: now
      });

      this.currentSyncState = 'SYNCED';
      this.notify();

      setTimeout(() => {
        if (this.getEffectiveOnlineStatus()) {
          this.currentSyncState = 'ONLINE';
          this.notify();
        }
      }, 2500);
    } catch (err) {
      console.error('Error during auto-sync execution:', err);
      this.currentSyncState = 'ONLINE';
      this.notify();
    } finally {
      this.isSyncInProgress = false;
    }
  }
}

export const syncManager = new SyncManager();
