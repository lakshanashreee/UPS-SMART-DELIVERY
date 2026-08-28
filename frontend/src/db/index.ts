import Dexie, { type Table } from 'dexie';
import type { Shipment, HubNode, RFIDScanEvent, PendingSyncItem, NetworkEdgeItem, MetadataItem } from '../types';

export class LogisticsDatabase extends Dexie {
  shipments!: Table<Shipment, string>;
  hubs!: Table<HubNode, string>;
  networkEdges!: Table<NetworkEdgeItem, string>;
  events!: Table<RFIDScanEvent, string>;
  scanEvents!: Table<RFIDScanEvent, string>;
  pendingSync!: Table<PendingSyncItem, number>;
  syncQueue!: Table<PendingSyncItem, number>;
  metadata!: Table<MetadataItem, string>;

  constructor() {
    super('LogisticsControlTowerDB');
    this.version(2).stores({
      shipments: 'id, trackingNumber, status, riskLevel, currentLocation',
      hubs: 'id, name, city',
      networkEdges: 'id, source, target, status',
      events: 'id, eventId, shipmentId, hubId, timestamp',
      scanEvents: 'id, shipmentId, hubId, timestamp',
      pendingSync: '++id, eventId, timestamp, action, status, idempotencyKey',
      syncQueue: '++id, timestamp, action, status',
      metadata: 'key, lastSyncedAt'
    });
  }
}

export const db = new LogisticsDatabase();

// Seed initial mockup data if database is fresh
export async function seedInitialData() {
  const count = await db.shipments.count();
  if (count > 0) return;

  const sampleHubs: HubNode[] = [
    { id: 'HUB-CHE', name: 'Chennai Hub', city: 'Chennai', lat: 13.0827, lng: 80.2707, capacityPercentage: 60, delayMultiplier: 1.0 },
    { id: 'HUB-HYD', name: 'Hyderabad Hub', city: 'Hyderabad', lat: 17.3850, lng: 78.4867, capacityPercentage: 75, delayMultiplier: 1.2 },
    { id: 'HUB-BLR', name: 'Bengaluru Hub', city: 'Bengaluru', lat: 12.9716, lng: 77.5946, capacityPercentage: 50, delayMultiplier: 1.0 },
    { id: 'HUB-PUN', name: 'Pune Hub', city: 'Pune', lat: 18.5204, lng: 73.8567, capacityPercentage: 40, delayMultiplier: 1.0 },
    { id: 'HUB-MUM', name: 'Mumbai Logistics Center', city: 'Mumbai', lat: 19.0760, lng: 72.8777, capacityPercentage: 80, delayMultiplier: 1.5 },
    { id: 'HUB-CHI', name: 'Chicago Central Hub', city: 'Chicago, IL', lat: 41.8781, lng: -87.6298, capacityPercentage: 85, delayMultiplier: 1.8 },
    { id: 'HUB-IND', name: 'Indianapolis Gateway', city: 'Indianapolis, IN', lat: 39.7684, lng: -86.1581, capacityPercentage: 45, delayMultiplier: 1.0 },
    { id: 'HUB-CMH', name: 'Columbus Logistics Center', city: 'Columbus, OH', lat: 39.9612, lng: -82.9988, capacityPercentage: 60, delayMultiplier: 1.1 }
  ];

  const sampleEdges: NetworkEdgeItem[] = [
    { id: 'EDGE-CHE-HYD', source: 'Chennai', target: 'Hyderabad', weight: 360, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-HYD-MUM', source: 'Hyderabad', target: 'Mumbai', weight: 360, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-CHE-BLR', source: 'Chennai', target: 'Bengaluru', weight: 210, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-BLR-PUN', source: 'Bengaluru', target: 'Pune', weight: 300, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-PUN-MUM', source: 'Pune', target: 'Mumbai', weight: 90, status: 'CLEAR', delayPenalty: 0 }
  ];

  const sampleShipments: Shipment[] = [
    {
      id: 'SHIP-001',
      trackingNumber: 'TRK-CHE-MUM-001',
      origin: 'Chennai',
      destination: 'Mumbai',
      currentLocation: 'Chennai',
      coordinates: [80.2707, 13.0827],
      status: 'ON_TRACK',
      riskLevel: 'LOW',
      etaMinutes: 720,
      routePath: ['Chennai', 'Hyderabad', 'Mumbai'],
      originalRoute: ['Chennai', 'Hyderabad', 'Mumbai'],
      currentRoute: ['Chennai', 'Hyderabad', 'Mumbai'],
      delayMinutes: 0,
      lat: 13.0827,
      lng: 80.2707,
      lastUpdated: new Date().toISOString(),
      carrier: 'Express Freight Corp'
    },
    {
      id: 'SHP-9001',
      trackingNumber: '1Z999AA10123456784',
      origin: 'Chicago',
      destination: 'Columbus',
      currentLocation: 'Chicago',
      coordinates: [-87.6298, 41.8781],
      status: 'AT_RISK',
      riskLevel: 'HIGH',
      etaMinutes: 240,
      routePath: ['Chicago', 'Indianapolis', 'Columbus'],
      originalRoute: ['Chicago', 'Indianapolis', 'Columbus'],
      currentRoute: ['Chicago', 'Indianapolis', 'Columbus'],
      delayMinutes: 45,
      lat: 41.8781,
      lng: -87.6298,
      lastUpdated: new Date().toISOString(),
      carrier: 'Midwest Intermodal'
    }
  ];

  const sampleMetadata: MetadataItem[] = [
    { key: 'lastSyncedAt', value: new Date().toISOString(), lastSyncedAt: new Date().toISOString() },
    { key: 'dbVersion', value: '2.0.0' }
  ];

  await db.hubs.bulkAdd(sampleHubs);
  await db.networkEdges.bulkAdd(sampleEdges);
  await db.shipments.bulkAdd(sampleShipments);
  await db.metadata.bulkAdd(sampleMetadata);
}
