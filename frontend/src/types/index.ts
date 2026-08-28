export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ShipmentStatus = 'IN_TRANSIT' | 'DELAYED' | 'REROUTED' | 'DELIVERED' | 'AT_RISK' | 'ON_TRACK';

export interface HubNode {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  capacityPercentage: number;
  delayMultiplier: number;
}

export interface NetworkEdgeItem {
  id: string;
  source: string;
  target: string;
  weight: number;
  status: 'CLEAR' | 'CONGESTED' | 'BLOCKED';
  delayPenalty: number;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  originHubId?: string;
  destinationHubId?: string;
  currentHubId?: string;
  nextHubId?: string;
  origin?: string;
  destination?: string;
  currentLocation?: string;
  coordinates?: [number, number];
  status: ShipmentStatus;
  riskLevel: RiskLevel;
  eta?: string;
  etaMinutes?: number;
  originalRoute?: string[];
  currentRoute?: string[];
  routePath?: string[];
  delayMinutes: number;
  lat?: number;
  lng?: number;
  lastUpdated: string;
  carrier?: string;
}

export interface RFIDScanEvent {
  id: string;
  timestamp: string;
  shipmentId: string;
  scannerId: string;
  hubId: string;
  eventType: 'LOCATION_UPDATE' | 'ARRIVED' | 'DEPARTED' | 'CONGESTION' | 'WEATHER_DELAY' | 'HUB_DELAY' | 'CHECK_IN' | 'CHECK_OUT' | 'DELAY_WARNING' | 'BOTTLENECK_DETECTED';
  notes?: string;
  lat?: number;
  lng?: number;
  delayMinutes?: number;
}

export interface PendingSyncItem {
  id?: number;
  eventId: string;
  timestamp: string;
  action: 'LOCATION_UPDATE' | 'ARRIVED' | 'DEPARTED' | 'CONGESTION' | 'WEATHER_DELAY' | 'HUB_DELAY' | 'SCAN_EVENT' | 'REROUTE_REQUEST' | 'STATUS_UPDATE';
  payload: Record<string, any>;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  idempotencyKey: string;
  retryCount: number;
}

export interface MetadataItem {
  key: string;
  value: string;
  lastSyncedAt?: string;
}

export type SyncState = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNCED';

export type ActivePage = 'dashboard' | 'map' | 'shipments' | 'simulator';
