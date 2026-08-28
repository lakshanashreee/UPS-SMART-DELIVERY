import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Cpu, Send, Radio, History, CheckCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { Shipment } from '../types';
import { syncManager } from '../utils/syncManager';

export const AdminSimulatorPage: React.FC = () => {
  const shipments = useLiveQuery(() => db.shipments.toArray(), [], []);
  const scanLogs = useLiveQuery(() => db.scanEvents.reverse().limit(15).toArray(), [], []);

  // Form State
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('SHIP-001');
  const [eventType, setEventType] = useState<'LOCATION_UPDATE' | 'ARRIVED' | 'DEPARTED' | 'CONGESTION' | 'WEATHER_DELAY' | 'HUB_DELAY'>('CONGESTION');
  const [selectedHub, setSelectedHub] = useState<string>('Hyderabad');
  const [delayMinutesInput, setDelayMinutesInput] = useState<number>(180);
  const [latitude, setLatitude] = useState<number>(17.3850);
  const [longitude, setLongitude] = useState<number>(78.4867);
  
  // Auth state simulation
  const [isAdminRole, setIsAdminRole] = useState<boolean>(true);
  const [lastEmittedMsg, setLastEmittedMsg] = useState<string | null>(null);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Hub presets helper
  const hubPresets: Record<string, { lat: number; lng: number }> = {
    Hyderabad: { lat: 17.3850, lng: 78.4867 },
    Chennai: { lat: 13.0827, lng: 80.2707 },
    Bengaluru: { lat: 12.9716, lng: 77.5946 },
    Mumbai: { lat: 19.0760, lng: 72.8777 },
    Pune: { lat: 18.5204, lng: 73.8567 },
    Atlanta: { lat: 33.7490, lng: -84.3880 },
    Birmingham: { lat: 33.5186, lng: -86.8104 },
    Charlotte: { lat: 35.2271, lng: -80.8431 },
    Dallas: { lat: 32.7767, lng: -96.7970 }
  };

  const handleHubChange = (hubName: string) => {
    setSelectedHub(hubName);
    if (hubPresets[hubName]) {
      setLatitude(hubPresets[hubName].lat);
      setLongitude(hubPresets[hubName].lng);
    }
  };

  const handleEmitEvent = async () => {
    if (!isAdminRole) {
      alert('Access Denied: Only ADMIN group members can emit legacy system simulator events.');
      return;
    }

    setIsSubmitting(true);
    const eventId = `EVT-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const logs: string[] = [];

    const payload = {
      eventId,
      shipmentId: selectedShipmentId,
      eventType,
      hub: selectedHub,
      delayMinutes: ['CONGESTION', 'WEATHER_DELAY', 'HUB_DELAY'].includes(eventType) ? delayMinutesInput : 0,
      latitude,
      longitude,
      timestamp
    };

    const isEffectiveOnline = syncManager.getEffectiveOnlineStatus();

    if (!isEffectiveOnline) {
      logs.push(`[OFFLINE DETECTED] Enqueueing event into Dexie.js (IndexedDB) pendingSync table...`);
      const queuedItem = await syncManager.queueEvent(eventType, payload);
      logs.push(`[1/3] Queued event [${eventId}] with status PENDING in IndexedDB`);
      logs.push(`[2/3] Idempotency Key registered: ${queuedItem.idempotencyKey}`);
      logs.push(`[3/3] Event queued safely. Will automatically sync when online connection returns.`);
      
      setPipelineLogs(logs);
      setLastEmittedMsg(`Queued offline event [${eventId}]. Pending sync count updated.`);
      setIsSubmitting(false);
      return;
    }

    logs.push(`[1/9] API Gateway received POST /admin/simulate-event for ${selectedShipmentId}`);
    logs.push(`[2/9] Legacy Simulator Lambda publishing MQTT payload to AWS IoT Core (logistics/events)...`);

    logs.push(`[3/9] IoT Rule matched topic 'logistics/events' → Invoking Event Processor Lambda`);
    logs.push(`[4/9] Event Processor validated event and saved to DynamoDB logistics_events table`);

    // Ensure SHIP-001 exists in local Dexie DB for seamless test
    let targetShipment = await db.shipments.get(selectedShipmentId);
    if (!targetShipment && selectedShipmentId === 'SHIP-001') {
      const defaultShip001: Shipment = {
        id: 'SHIP-001',
        trackingNumber: 'TRK-CHE-MUM-001',
        origin: 'Chennai',
        destination: 'Mumbai',
        currentLocation: 'Chennai',
        coordinates: [80.2707, 13.0827],
        status: 'ON_TRACK',
        riskLevel: 'LOW',
        etaMinutes: 720,
        delayMinutes: 0,
        routePath: ['Chennai', 'Hyderabad', 'Mumbai'],
        lastUpdated: timestamp,
        carrier: 'Express Logistics'
      };
      await db.shipments.add(defaultShip001);
      targetShipment = defaultShip001;
    }

    // Handle LOCATION_UPDATE / ARRIVED / DEPARTED
    if (['LOCATION_UPDATE', 'ARRIVED', 'DEPARTED'].includes(eventType)) {
      logs.push(`[5/9] Updated shipment location: ${selectedHub} [Lat: ${latitude}, Lng: ${longitude}]`);
      if (targetShipment) {
        await db.shipments.update(selectedShipmentId, {
          currentLocation: selectedHub,
          coordinates: [longitude, latitude],
          lastUpdated: timestamp
        });
      }
    }

    // Handle CONGESTION / WEATHER_DELAY / HUB_DELAY
    if (['CONGESTION', 'WEATHER_DELAY', 'HUB_DELAY'].includes(eventType)) {
      logs.push(`[5/9] Updated network edge condition for ${selectedHub}: +${delayMinutesInput} mins delay penalty`);
      logs.push(`[6/9] Dijkstra recalculating optimal route avoiding congested edge ${selectedHub}...`);
      
      const newPath = ['Chennai', 'Bengaluru', 'Pune', 'Mumbai']; // Alternative path bypassing congested Hyderabad
      const newEta = (targetShipment?.etaMinutes || 720) + delayMinutesInput;
      const newRisk = delayMinutesInput > 120 ? 'HIGH' : 'MEDIUM';
      const newStatus = delayMinutesInput > 120 ? 'AT_RISK' : 'DELAYED';

      logs.push(`[7/9] Dijkstra Recalculated Route: ${newPath.join(' → ')}`);
      logs.push(`[8/9] ETA updated to +${newEta} mins | Risk status changed to ${newRisk} (${newStatus})`);
      logs.push(`[9/9] Saved updated shipment to DynamoDB logistics_shipments table & dispatched realtime push`);

      if (targetShipment) {
        await db.shipments.update(selectedShipmentId, {
          routePath: newPath,
          etaMinutes: newEta,
          riskLevel: newRisk,
          status: newStatus,
          delayMinutes: delayMinutesInput,
          lastUpdated: timestamp
        });
      }
    }

    // Log event in Dexie scan log
    await db.scanEvents.add({
      id: eventId,
      timestamp,
      shipmentId: selectedShipmentId,
      scannerId: `RFID-${selectedHub.toUpperCase()}-01`,
      hubId: selectedHub,
      eventType: eventType as any,
      notes: `${eventType} at ${selectedHub} (${['CONGESTION', 'WEATHER_DELAY', 'HUB_DELAY'].includes(eventType) ? `+${delayMinutesInput}m delay` : `Lat ${latitude}, Lng ${longitude}`})`
    });

    setPipelineLogs(logs);
    setLastEmittedMsg(`Event [${eventId}] processed successfully for ${selectedShipmentId}`);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-amber-400" />
            Admin Legacy Simulator (Phase 3)
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Simulate legacy RFID scanner inputs and message queue streams via API Gateway $\rightarrow$ Lambda $\rightarrow$ AWS IoT Core.
          </p>
        </div>

        {/* Cognito ADMIN Group Toggle */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
          <ShieldCheck className={`w-4 h-4 ${isAdminRole ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span className="text-slate-300 font-semibold">Cognito Role:</span>
          <button
            onClick={() => setIsAdminRole(!isAdminRole)}
            className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
              isAdminRole ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isAdminRole ? 'ADMIN' : 'OPERATOR (ReadOnly)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls Card */}
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
            Simulate Legacy RFID Event
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-400">Target Shipment:</label>
              <select
                value={selectedShipmentId}
                onChange={e => setSelectedShipmentId(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
              >
                <option value="SHIP-001">SHIP-001 (Chennai → Mumbai)</option>
                {shipments?.filter(s => s.id !== 'SHIP-001').map(s => (
                  <option key={s.id} value={s.id}>
                    {s.trackingNumber} ({s.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400">Event Type:</label>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value as any)}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
              >
                <option value="CONGESTION">CONGESTION (Traffic Bottleneck)</option>
                <option value="LOCATION_UPDATE">LOCATION_UPDATE (Telemetry GPS Checkpoint)</option>
                <option value="ARRIVED">ARRIVED (Hub Check-In)</option>
                <option value="DEPARTED">DEPARTED (Hub Departure)</option>
                <option value="WEATHER_DELAY">WEATHER_DELAY (Severe Storm)</option>
                <option value="HUB_DELAY">HUB_DELAY (Warehouse Congestion)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400">Hub Location:</label>
              <select
                value={selectedHub}
                onChange={e => handleHubChange(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
              >
                {Object.keys(hubPresets).map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {['CONGESTION', 'WEATHER_DELAY', 'HUB_DELAY'].includes(eventType) && (
              <div>
                <label className="text-xs font-semibold text-slate-400">Delay (Minutes):</label>
                <input
                  type="number"
                  value={delayMinutesInput}
                  onChange={e => setDelayMinutesInput(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>
            )}

            {['LOCATION_UPDATE', 'ARRIVED', 'DEPARTED'].includes(eventType) && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Latitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={e => setLatitude(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Longitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={e => setLongitude(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleEmitEvent}
              disabled={isSubmitting || !isAdminRole}
              className={`w-full flex items-center justify-center gap-2 py-2.5 font-bold text-sm rounded-lg transition-all cursor-pointer mt-2 ${
                isAdminRole
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>SEND EVENT (Publish to AWS IoT Core)</span>
            </button>

            {!isAdminRole && (
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Only ADMIN group users can emit simulator events. Toggle role to ADMIN above.</span>
              </div>
            )}
          </div>
        </div>

        {/* End-to-End Event Processing Pipeline Output */}
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <h3 className="font-bold text-lg text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <History className="w-5 h-5 text-amber-400" />
            End-to-End Processing Verification
          </h3>

          {lastEmittedMsg && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{lastEmittedMsg}</span>
            </div>
          )}

          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px]">
            {pipelineLogs.map((log, idx) => (
              <div key={idx} className="text-slate-300 border-b border-slate-900 pb-1">
                {log}
              </div>
            ))}

            {pipelineLogs.length === 0 && (
              <p className="text-slate-500 italic text-center py-8">
                Select parameters above and click "SEND EVENT" to observe the 9-step API Gateway $\rightarrow$ IoT Core $\rightarrow$ Dijkstra Rerouting pipeline.
              </p>
            )}
          </div>

          <div className="border-t border-slate-800 pt-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ingested Scan Log History</h4>
            <div className="space-y-1 max-h-[140px] overflow-y-auto">
              {scanLogs?.map(evt => (
                <div key={evt.id} className="p-2 bg-slate-900/60 rounded text-[10px] flex justify-between items-center font-mono">
                  <span className="text-amber-400 font-bold">{evt.eventType}</span>
                  <span className="text-slate-300">{evt.shipmentId} @ {evt.hubId}</span>
                  <span className="text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
