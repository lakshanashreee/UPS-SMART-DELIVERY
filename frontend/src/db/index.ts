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

// Seed pure Indian Logistics Hubs and purge any legacy US hubs
export async function seedInitialData() {
  // Purge legacy US hubs if present in local browser database
  await db.hubs.where('id').anyOf(['HUB-CHI', 'HUB-CMH', 'HUB-IND']).delete();
  await db.hubs.where('city').anyOf(['Chicago', 'Columbus', 'Indianapolis']).delete();
  
  // Clean old US shipments if present
  const oldUsShipment = await db.shipments.get('SHP-9001');
  if (oldUsShipment && (oldUsShipment.origin === 'Chicago' || oldUsShipment.destination === 'Columbus')) {
    await db.shipments.update('SHP-9001', {
      origin: 'Delhi',
      destination: 'Kolkata',
      currentLocation: 'Delhi',
      coordinates: [77.2090, 28.6139],
      lat: 28.6139,
      lng: 77.2090,
      trackingNumber: 'TRK-DEL-CCU-901'
    });
  }

  const sampleHubs: HubNode[] = [
    { id: 'HUB-CHE', name: 'Chennai Hub', city: 'Chennai', lat: 13.0827, lng: 80.2707, capacityPercentage: 60, delayMultiplier: 1.0 },
    { id: 'HUB-HYD', name: 'Hyderabad Hub', city: 'Hyderabad', lat: 17.3850, lng: 78.4867, capacityPercentage: 75, delayMultiplier: 1.2 },
    { id: 'HUB-BLR', name: 'Bengaluru Hub', city: 'Bengaluru', lat: 12.9716, lng: 77.5946, capacityPercentage: 50, delayMultiplier: 1.0 },
    { id: 'HUB-PUN', name: 'Pune Hub', city: 'Pune', lat: 18.5204, lng: 73.8567, capacityPercentage: 40, delayMultiplier: 1.0 },
    { id: 'HUB-MUM', name: 'Mumbai Logistics Center', city: 'Mumbai', lat: 19.0760, lng: 72.8777, capacityPercentage: 80, delayMultiplier: 1.5 },
    { id: 'HUB-DEL', name: 'Delhi Central Hub', city: 'Delhi', lat: 28.6139, lng: 77.2090, capacityPercentage: 85, delayMultiplier: 1.8 },
    { id: 'HUB-CCU', name: 'Kolkata Gateway', city: 'Kolkata', lat: 22.5726, lng: 88.3639, capacityPercentage: 45, delayMultiplier: 1.0 },
    { id: 'HUB-AMD', name: 'Ahmedabad Logistics Hub', city: 'Ahmedabad', lat: 23.0225, lng: 72.5714, capacityPercentage: 60, delayMultiplier: 1.1 }
  ];

  const sampleEdges: NetworkEdgeItem[] = [
    { id: 'EDGE-CHE-HYD', source: 'Chennai', target: 'Hyderabad', weight: 360, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-HYD-MUM', source: 'Hyderabad', target: 'Mumbai', weight: 360, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-CHE-BLR', source: 'Chennai', target: 'Bengaluru', weight: 210, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-BLR-PUN', source: 'Bengaluru', target: 'Pune', weight: 300, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-PUN-MUM', source: 'Pune', target: 'Mumbai', weight: 90, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-MUM-DEL', source: 'Mumbai', target: 'Delhi', weight: 480, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-DEL-CCU', source: 'Delhi', target: 'Kolkata', weight: 540, status: 'CLEAR', delayPenalty: 0 }
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
      trackingNumber: 'TRK-DEL-CCU-901',
      origin: 'Delhi',
      destination: 'Kolkata',
      currentLocation: 'Delhi',
      coordinates: [77.2090, 28.6139],
      status: 'AT_RISK',
      riskLevel: 'HIGH',
      etaMinutes: 540,
      routePath: ['Delhi', 'Kolkata'],
      originalRoute: ['Delhi', 'Kolkata'],
      currentRoute: ['Delhi', 'Kolkata'],
      delayMinutes: 45,
      lat: 28.6139,
      lng: 77.2090,
      lastUpdated: new Date().toISOString(),
      carrier: 'North-East Express'
    }
  ];

  const sampleMetadata: MetadataItem[] = [
    { key: 'lastSyncedAt', value: new Date().toISOString(), lastSyncedAt: new Date().toISOString() },
    { key: 'dbVersion', value: '2.0.0' }
  ];

  const hubCount = await db.hubs.count();
  if (hubCount === 0) {
    await db.hubs.bulkAdd(sampleHubs);
  } else {
    // Ensure all 8 Indian hubs exist
    for (const hub of sampleHubs) {
      await db.hubs.put(hub);
    }
  }

  const edgeCount = await db.networkEdges.count();
  if (edgeCount === 0) {
    await db.networkEdges.bulkAdd(sampleEdges);
  }

  const shipCount = await db.shipments.count();
  if (shipCount === 0) {
    await db.shipments.bulkAdd(sampleShipments);
  }

  const metaCount = await db.metadata.count();
  if (metaCount === 0) {
    await db.metadata.bulkAdd(sampleMetadata);
  }
}
