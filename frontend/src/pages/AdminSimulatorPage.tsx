import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Cpu, Send, Radio, History, CheckCircle, ShieldCheck, AlertTriangle, Database } from 'lucide-react';
import { syncManager } from '../utils/syncManager';
import { useAuth } from '../context/AuthContext';

export const AdminSimulatorPage: React.FC = () => {
  const { user } = useAuth();
  const shipments = useLiveQuery(() => db.shipments.toArray(), [], []);
  const scanLogs = useLiveQuery(() => db.scanEvents.reverse().limit(15).toArray(), [], []);
  const pendingSyncQueue = useLiveQuery(() => db.pendingSync.toArray(), [], []);

  // Form State
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('SHIP-001');
  const [eventType, setEventType] = useState<'LOCATION_UPDATE' | 'ARRIVED' | 'DEPARTED' | 'CONGESTION' | 'WEATHER_DELAY' | 'HUB_DELAY'>('CONGESTION');
  const [selectedHub, setSelectedHub] = useState<string>('Hyderabad');
  const [delayMinutesInput, setDelayMinutesInput] = useState<number>(180);
  const [latitude, setLatitude] = useState<number>(17.3850);
  const [longitude, setLongitude] = useState<number>(78.4867);
  
  const [lastEmittedMsg, setLastEmittedMsg] = useState<string | null>(null);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isAdminRole = user?.role === 'ADMIN';

  // Hub presets helper (Pure Indian Logistics Hubs)
  const hubPresets: Record<string, { lat: number; lng: number }> = {
    Hyderabad: { lat: 17.3850, lng: 78.4867 },
    Chennai: { lat: 13.0827, lng: 80.2707 },
    Bengaluru: { lat: 12.9716, lng: 77.5946 },
    Mumbai: { lat: 19.0760, lng: 72.8777 },
    Pune: { lat: 18.5204, lng: 73.8567 },
    Delhi: { lat: 28.6139, lng: 77.2090 },
    Kolkata: { lat: 22.5726, lng: 88.3639 },
    Ahmedabad: { lat: 23.0225, lng: 72.5714 }
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
      alert('Access Denied: Only Admin users can emit simulator events.');
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
      logs.push(`[OFFLINE MODE ACTIVE] Internet disconnected!`);
      const queuedItem = await syncManager.queueEvent(eventType, payload);
      logs.push(`[1/3] Saved event [${eventId}] into browser offline database (IndexedDB)`);
      logs.push(`[2/3] Idempotency Key registered: ${queuedItem.idempotencyKey}`);
      logs.push(`[3/3] Event queued safely in IndexedDB pendingSync table. Will auto-sync when online!`);
      
      setPipelineLogs(logs);
      setLastEmittedMsg(`Queued offline event [${eventId}] into Dexie IndexedDB.`);
      setIsSubmitting(false);
      return;
    }

    logs.push(`[1/6] Scanning RFID tag for ${selectedShipmentId} at ${selectedHub}...`);
    logs.push(`[2/6] Publishing event stream to AWS Cloud IoT Core (logistics/events)...`);
    logs.push(`[3/6] AWS Event Processor validated payload and saved to DynamoDB`);

    let targetShipment = await db.shipments.get(selectedShipmentId);

    if (['LOCATION_UPDATE', 'ARRIVED', 'DEPARTED'].includes(eventType)) {
      logs.push(`[4/6] Updated shipment location: ${selectedHub}`);
      if (targetShipment) {
        await db.shipments.update(selectedShipmentId, {
          currentLocation: selectedHub,
          coordinates: [longitude, latitude],
          lastUpdated: timestamp
        });
      }
    }

    if (['CONGESTION', 'WEATHER_DELAY', 'HUB_DELAY'].includes(eventType)) {
      logs.push(`[4/6] Traffic delay detected at ${selectedHub}: +${delayMinutesInput} mins delay penalty`);
      logs.push(`[5/6] Smart Routing recalculates optimal route bypassing bottleneck...`);
      
      const newPath = selectedShipmentId === 'SHP-9001' 
        ? ['Delhi', 'Jaipur', 'Visakhapatnam', 'Kolkata'] 
        : ['Chennai', 'Bengaluru', 'Pune', 'Mumbai'];

      const newRisk = delayMinutesInput > 120 ? 'HIGH' : 'MEDIUM';
      const newStatus = delayMinutesInput > 120 ? 'AT_RISK' : 'DELAYED';

      logs.push(`[6/6] Optimized Bypass Route: ${newPath.join(' → ')} | Status: ${newStatus}`);

      if (targetShipment) {
        await db.shipments.update(selectedShipmentId, {
          routePath: newPath,
          riskLevel: newRisk,
          status: newStatus,
          delayMinutes: delayMinutesInput,
          lastUpdated: timestamp
        });
      }
    }

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#351C15] tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#D97706]" />
            Warehouse & RFID Scanner Simulator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Simulate warehouse RFID scans and highway delay alerts. Test how the Control Tower processes events live!
          </p>
        </div>

        {/* Cognito User Role Chip */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
          <ShieldCheck className={`w-4 h-4 ${isAdminRole ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span className="text-slate-600 font-bold">Cognito Role:</span>
          <span className={`px-2 py-0.5 rounded font-extrabold text-[11px] ${
            isAdminRole ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-200 text-slate-700'
          }`}>
            {user?.role || 'ADMIN'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-[#351C15] flex items-center gap-2 border-b border-slate-100 pb-3">
            <Radio className="w-5 h-5 text-[#D97706] animate-pulse" />
            Simulate RFID Scanner Event
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-600">Target Package:</label>
              <select
                value={selectedShipmentId}
                onChange={e => setSelectedShipmentId(e.target.value)}
                className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#FFB500]"
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
              <label className="text-xs font-bold text-slate-600">Event Type:</label>
              <select
                value={eventType}
                onChange={e => setEventType(e.target.value as any)}
                className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#FFB500]"
              >
                <option value="CONGESTION">CONGESTION (Traffic Bottleneck Alert)</option>
                <option value="WEATHER_DELAY">WEATHER_DELAY (Severe Storm Alert)</option>
                <option value="HUB_DELAY">HUB_DELAY (Warehouse Bottleneck)</option>
                <option value="ARRIVED">ARRIVED (Warehouse Check-In Scan)</option>
                <option value="DEPARTED">DEPARTED (Warehouse Departure Scan)</option>
                <option value="LOCATION_UPDATE">LOCATION_UPDATE (Highway GPS Checkpoint)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">Hub Location:</label>
              <select
                value={selectedHub}
                onChange={e => handleHubChange(e.target.value)}
                className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#FFB500]"
              >
                {Object.keys(hubPresets).map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {['CONGESTION', 'WEATHER_DELAY', 'HUB_DELAY'].includes(eventType) && (
              <div>
                <label className="text-xs font-bold text-slate-600">Delay Penalty (Minutes):</label>
                <input
                  type="number"
                  value={delayMinutesInput}
                  onChange={e => setDelayMinutesInput(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#FFB500]"
                />
              </div>
            )}

            {['LOCATION_UPDATE', 'ARRIVED', 'DEPARTED'].includes(eventType) && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600">Latitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latitude}
                    onChange={e => setLatitude(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600">Longitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={longitude}
                    onChange={e => setLongitude(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleEmitEvent}
              disabled={isSubmitting || !isAdminRole}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 font-extrabold text-xs rounded-xl transition-all cursor-pointer mt-2 border border-[#D97706] ${
                isAdminRole
                  ? 'bg-[#FFB500] hover:bg-[#e6a300] text-[#351C15] shadow-xs'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed border-slate-300'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>📡 Send Live RFID Scan Event</span>
            </button>

            {!isAdminRole && (
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-xl flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                <span>Only ADMIN users can emit simulator events.</span>
              </div>
            )}
          </div>
        </div>

        {/* End-to-End Processing Verification Output & Live IndexedDB Inspector */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-[#351C15] flex items-center gap-2 border-b border-slate-100 pb-3">
            <History className="w-5 h-5 text-[#D97706]" />
            Live Processing Log Output
          </h3>

          {lastEmittedMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{lastEmittedMsg}</span>
            </div>
          )}

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px]">
            {pipelineLogs.map((log, idx) => (
              <div key={idx} className="border-b border-slate-800 pb-1">
                {log}
              </div>
            ))}

            {pipelineLogs.length === 0 && (
              <p className="text-slate-400 italic text-center py-6 font-sans">
                Select parameters above and click "Send Live RFID Scan Event" to observe real-time cloud event processing.
              </p>
            )}
          </div>

          {/* Live Dexie IndexedDB Pending Queue Inspector Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#351C15]">
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-[#D97706]" /> Dexie IndexedDB Pending Queue ({pendingSyncQueue?.length || 0} items)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Table: pendingSync</span>
            </div>

            <div className="space-y-1 max-h-[100px] overflow-y-auto text-[10px] font-mono">
              {pendingSyncQueue?.map(item => (
                <div key={item.id} className="p-1.5 bg-white rounded border border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-800">{item.eventId}</span>
                  <span className="text-slate-600">{item.action} ({item.payload?.shipmentId})</span>
                  <span className={`px-1.5 py-0.5 rounded font-extrabold ${
                    item.status === 'PENDING' ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}

              {(!pendingSyncQueue || pendingSyncQueue.length === 0) && (
                <p className="text-slate-400 italic text-center py-1">
                  Queue is empty. Simulate Offline and send an event to watch it queue in IndexedDB!
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Recent Scan History</h4>
            <div className="space-y-1 max-h-[100px] overflow-y-auto">
              {scanLogs?.map(evt => (
                <div key={evt.id} className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] flex justify-between items-center font-mono">
                  <span className="text-[#351C15] font-extrabold">{evt.eventType}</span>
                  <span className="text-slate-700 font-bold">{evt.shipmentId} @ {evt.hubId}</span>
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
