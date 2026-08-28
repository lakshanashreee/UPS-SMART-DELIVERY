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
    this.version(5).stores({
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

export async function resetDemoDataToDefault() {
  const sampleHubs: HubNode[] = [
    { id: 'HUB-CHE', name: 'Chennai Hub', city: 'Chennai', lat: 13.0827, lng: 80.2707, capacityPercentage: 60, delayMultiplier: 1.0 },
    { id: 'HUB-HYD', name: 'Hyderabad Hub', city: 'Hyderabad', lat: 17.3850, lng: 78.4867, capacityPercentage: 90, delayMultiplier: 2.2 },
    { id: 'HUB-BLR', name: 'Bengaluru Hub', city: 'Bengaluru', lat: 12.9716, lng: 77.5946, capacityPercentage: 50, delayMultiplier: 1.0 },
    { id: 'HUB-PUN', name: 'Pune Hub', city: 'Pune', lat: 18.5204, lng: 73.8567, capacityPercentage: 40, delayMultiplier: 1.0 },
    { id: 'HUB-MUM', name: 'Mumbai Logistics Center', city: 'Mumbai', lat: 19.0760, lng: 72.8777, capacityPercentage: 80, delayMultiplier: 1.5 },
    { id: 'HUB-DEL', name: 'Delhi Central Hub', city: 'Delhi', lat: 28.6139, lng: 77.2090, capacityPercentage: 88, delayMultiplier: 2.0 },
    { id: 'HUB-CCU', name: 'Kolkata Gateway', city: 'Kolkata', lat: 22.5726, lng: 88.3639, capacityPercentage: 45, delayMultiplier: 1.0 },
    { id: 'HUB-AMD', name: 'Ahmedabad Logistics Hub', city: 'Ahmedabad', lat: 23.0225, lng: 72.5714, capacityPercentage: 60, delayMultiplier: 1.1 },
    { id: 'HUB-JAI', name: 'Jaipur Gateway', city: 'Jaipur', lat: 26.9124, lng: 75.7873, capacityPercentage: 40, delayMultiplier: 1.0 },
    { id: 'HUB-VTZ', name: 'Visakhapatnam Hub', city: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, capacityPercentage: 35, delayMultiplier: 1.0 }
  ];

  const sampleEdges: NetworkEdgeItem[] = [
    { id: 'EDGE-CHE-HYD', source: 'Chennai', target: 'Hyderabad', weight: 360, status: 'CONGESTED', delayPenalty: 180 },
    { id: 'EDGE-HYD-MUM', source: 'Hyderabad', target: 'Mumbai', weight: 360, status: 'CONGESTED', delayPenalty: 180 },
    { id: 'EDGE-CHE-BLR', source: 'Chennai', target: 'Bengaluru', weight: 210, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-BLR-PUN', source: 'Bengaluru', target: 'Pune', weight: 300, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-PUN-MUM', source: 'Pune', target: 'Mumbai', weight: 90, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-MUM-AMD', source: 'Mumbai', target: 'Ahmedabad', weight: 300, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-AMD-JAI', source: 'Ahmedabad', target: 'Jaipur', weight: 360, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-JAI-DEL', source: 'Jaipur', target: 'Delhi', weight: 180, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-DEL-CCU', source: 'Delhi', target: 'Kolkata', weight: 540, status: 'CONGESTED', delayPenalty: 210 },
    { id: 'EDGE-HYD-CCU', source: 'Hyderabad', target: 'Kolkata', weight: 600, status: 'CONGESTED', delayPenalty: 150 },
    { id: 'EDGE-CCU-VTZ', source: 'Kolkata', target: 'Visakhapatnam', weight: 480, status: 'CLEAR', delayPenalty: 0 },
    { id: 'EDGE-VTZ-HYD', source: 'Visakhapatnam', target: 'Hyderabad', weight: 350, status: 'CLEAR', delayPenalty: 0 }
  ];

  const sampleShipments: Shipment[] = [
    {
      id: 'SHIP-001',
      trackingNumber: 'TRK-CHE-MUM-001',
      origin: 'Chennai',
      destination: 'Mumbai',
      currentLocation: 'Chennai',
      coordinates: [80.2707, 13.0827],
      status: 'AT_RISK',
      riskLevel: 'HIGH',
      etaMinutes: 720,
      routePath: ['Chennai', 'Hyderabad', 'Mumbai'],
      originalRoute: ['Chennai', 'Hyderabad', 'Mumbai'],
      currentRoute: ['Chennai', 'Hyderabad', 'Mumbai'],
      delayMinutes: 180,
      lat: 13.0827,
      lng: 80.2707,
      lastUpdated: new Date().toISOString(),
      carrier: 'Express Cargo'
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
      delayMinutes: 210,
      lat: 28.6139,
      lng: 77.2090,
      lastUpdated: new Date().toISOString(),
      carrier: 'North-East Express'
    },
    {
      id: 'SHP-1004',
      trackingNumber: 'TRK-HYD-CCU-104',
      origin: 'Hyderabad',
      destination: 'Kolkata',
      currentLocation: 'Hyderabad',
      coordinates: [78.4867, 17.3850],
      status: 'AT_RISK',
      riskLevel: 'HIGH',
      etaMinutes: 600,
      routePath: ['Hyderabad', 'Kolkata'],
      originalRoute: ['Hyderabad', 'Kolkata'],
      currentRoute: ['Hyderabad', 'Kolkata'],
      delayMinutes: 150,
      lat: 17.3850,
      lng: 78.4867,
      lastUpdated: new Date().toISOString(),
      carrier: 'Deccan Freight'
    },
    {
      id: 'SHP-1003',
      trackingNumber: 'TRK-BLR-CHE-103',
      origin: 'Bengaluru',
      destination: 'Chennai',
      currentLocation: 'Bengaluru',
      coordinates: [77.5946, 12.9716],
      status: 'ON_TRACK',
      riskLevel: 'LOW',
      etaMinutes: 210,
      routePath: ['Bengaluru', 'Chennai'],
      originalRoute: ['Bengaluru', 'Chennai'],
      currentRoute: ['Bengaluru', 'Chennai'],
      delayMinutes: 0,
      lat: 12.9716,
      lng: 77.5946,
      lastUpdated: new Date().toISOString(),
      carrier: 'South India Express'
    },
    {
      id: 'SHP-1002',
      trackingNumber: 'TRK-BOM-DEL-102',
      origin: 'Mumbai',
      destination: 'Delhi',
      currentLocation: 'Ahmedabad',
      coordinates: [72.5714, 23.0225],
      status: 'ON_TRACK',
      riskLevel: 'LOW',
      etaMinutes: 480,
      routePath: ['Mumbai', 'Ahmedabad', 'Jaipur', 'Delhi'],
      originalRoute: ['Mumbai', 'Ahmedabad', 'Jaipur', 'Delhi'],
      currentRoute: ['Mumbai', 'Ahmedabad', 'Jaipur', 'Delhi'],
      delayMinutes: 0,
      lat: 23.0225,
      lng: 72.5714,
      lastUpdated: new Date().toISOString(),
      carrier: 'Western Logistics'
    },
    {
      id: 'SHP-1005',
      trackingNumber: 'TRK-PNQ-DEL-105',
      origin: 'Pune',
      destination: 'Delhi',
      currentLocation: 'Pune',
      coordinates: [73.8567, 18.5204],
      status: 'ON_TRACK',
      riskLevel: 'LOW',
      etaMinutes: 720,
      routePath: ['Pune', 'Mumbai', 'Ahmedabad', 'Jaipur', 'Delhi'],
      originalRoute: ['Pune', 'Mumbai', 'Ahmedabad', 'Jaipur', 'Delhi'],
      currentRoute: ['Pune', 'Mumbai', 'Ahmedabad', 'Jaipur', 'Delhi'],
      delayMinutes: 0,
      lat: 18.5204,
      lng: 73.8567,
      lastUpdated: new Date().toISOString(),
      carrier: 'Intercity Connect'
    }
  ];

  const sampleMetadata: MetadataItem[] = [
    { key: 'lastSyncedAt', value: new Date().toISOString(), lastSyncedAt: new Date().toISOString() },
    { key: 'dbVersion', value: '5.0.0' }
  ];

  await db.hubs.clear();
  await db.hubs.bulkAdd(sampleHubs);

  await db.networkEdges.clear();
  await db.networkEdges.bulkAdd(sampleEdges);

  await db.shipments.clear();
  await db.shipments.bulkAdd(sampleShipments);

  await db.metadata.clear();
  await db.metadata.bulkAdd(sampleMetadata);
}

export async function seedInitialData() {
  const count = await db.shipments.count();
  // Only populate if empty so user rerouting persists across page refreshes!
  if (count === 0) {
    await resetDemoDataToDefault();
  }
}
