import { db } from '../db';

export type RealtimeConnectionState = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'RECONNECTING';

export interface RealtimeShipmentPayload {
  type: 'SHIPMENT_UPDATED' | 'SHIPMENT_LOCATION_UPDATED' | 'SHIPMENT_ROUTE_UPDATED' | 'SHIPMENT_RISK_UPDATED' | 'SHIPMENT_STATUS_UPDATED';
  shipmentId: string;
  latitude: number;
  longitude: number;
  currentLocation?: string;
  status: 'ON_TRACK' | 'IN_TRANSIT' | 'DELAYED' | 'REROUTED' | 'DELIVERED' | 'AT_RISK';
  riskScore: number; // e.g. 0.87
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  eta?: string;
  etaMinutes?: number;
  routePath?: string[];
  delayMinutes?: number;
  timestamp?: string;
}

type RealtimeListener = (event: RealtimeShipmentPayload) => void;
type ConnectionStateListener = (state: RealtimeConnectionState) => void;

class AppSyncRealtimeClient {
  private connectionState: RealtimeConnectionState = 'CONNECTED';
  private eventListeners: Set<RealtimeListener> = new Set();
  private connectionListeners: Set<ConnectionStateListener> = new Set();
  private channelName: string = '/logistics/shipments';

  constructor() {
    this.initConnection();
  }

  private initConnection() {
    // Simulate AppSync Events WebSocket Connection State
    this.connectionState = 'CONNECTED';
    this.notifyConnectionState();

    // Listen to window online/offline events to simulate AppSync WebSocket lifecycle
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.connectionState = 'CONNECTING';
        this.notifyConnectionState();
        setTimeout(() => {
          this.connectionState = 'CONNECTED';
          this.notifyConnectionState();
        }, 1000);
      });

      window.addEventListener('offline', () => {
        this.connectionState = 'DISCONNECTED';
        this.notifyConnectionState();
      });
    }
  }

  public subscribeEvents(listener: RealtimeListener) {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  public subscribeConnectionState(listener: ConnectionStateListener) {
    this.connectionListeners.add(listener);
    listener(this.connectionState);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  public getConnectionState(): RealtimeConnectionState {
    return this.connectionState;
  }

  public getChannelName(): string {
    return this.channelName;
  }

  public async publishRealtimeUpdate(payload: RealtimeShipmentPayload): Promise<void> {
    console.log(`[AppSync Events ${this.channelName}] Publishing WebSocket payload:`, payload);

    // 1. Update IndexedDB local database reactively
    try {
      const existing = await db.shipments.get(payload.shipmentId);
      const now = payload.timestamp || new Date().toISOString();

      if (existing) {
        await db.shipments.update(payload.shipmentId, {
          status: payload.status as any,
          riskLevel: payload.riskLevel as any,
          currentLocation: payload.currentLocation || existing.currentLocation,
          coordinates: [payload.longitude, payload.latitude],
          lat: payload.latitude,
          lng: payload.longitude,
          routePath: payload.routePath || existing.routePath,
          currentRoute: payload.routePath || existing.currentRoute,
          etaMinutes: payload.etaMinutes !== undefined ? payload.etaMinutes : existing.etaMinutes,
          delayMinutes: payload.delayMinutes !== undefined ? payload.delayMinutes : existing.delayMinutes,
          lastUpdated: now
        });
      }
    } catch (err) {
      console.warn('Dexie DB update error during realtime event handling:', err);
    }

    // 2. Notify all active UI WebSocket subscriber listeners
    this.eventListeners.forEach(listener => listener(payload));
  }

  private notifyConnectionState() {
    this.connectionListeners.forEach(listener => listener(this.connectionState));
  }
}

export const appsyncRealtime = new AppSyncRealtimeClient();
