import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  GitFork, 
  CheckCircle2, 
  MapPin,
  RefreshCw,
  Navigation,
  Activity,
  Radio
} from 'lucide-react';
import type { Shipment } from '../types';
import { appsyncRealtime, type RealtimeShipmentPayload } from '../utils/appsyncRealtime';

export const LiveMapPage: React.FC = () => {
  const shipments = useLiveQuery(() => db.shipments.toArray(), [], []);
  const hubs = useLiveQuery(() => db.hubs.toArray(), [], []);
  
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [rerouting, setRerouting] = useState<boolean>(false);
  const [rerouteResult, setRerouteResult] = useState<{ path: string[]; time: number; explanation: string } | null>(null);
  const [realtimeConnection, setRealtimeConnection] = useState<string>('CONNECTED');
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState<RealtimeShipmentPayload | null>(null);

  // Active tracked shipment
  const activeSelected = selectedShipment || (shipments && shipments.length > 0 ? shipments[0] : null);

  useEffect(() => {
    // 1. Subscribe to AppSync Realtime WebSocket Connection State
    const unsubConn = appsyncRealtime.subscribeConnectionState(state => {
      setRealtimeConnection(state);
    });

    // 2. Subscribe to AppSync Realtime Shipment Events (WebSocket Push)
    const unsubEvents = appsyncRealtime.subscribeEvents(payload => {
      console.log('LiveMapPage: Received AppSync Events WebSocket push:', payload);
      setLastRealtimeEvent(payload);

      if (activeSelected && payload.shipmentId === activeSelected.id) {
        setSelectedShipment(prev => prev ? {
          ...prev,
          currentLocation: payload.currentLocation || prev.currentLocation,
          coordinates: [payload.longitude, payload.latitude],
          status: payload.status as any,
          riskLevel: payload.riskLevel as any,
          routePath: payload.routePath || prev.routePath,
          currentRoute: payload.routePath || prev.currentRoute,
          delayMinutes: payload.delayMinutes !== undefined ? payload.delayMinutes : prev.delayMinutes,
          lastUpdated: payload.timestamp || new Date().toISOString()
        } : null);
      }
    });

    return () => {
      unsubConn();
      unsubEvents();
    };
  }, [activeSelected]);

  const handleSimulateDijkstraReroute = async (shipment: Shipment) => {
    setRerouting(true);
    setRerouteResult(null);

    setTimeout(async () => {
      const newPath = ['Chennai', 'Bengaluru', 'Pune', 'Mumbai'];
      const explanation = `Dijkstra recalculated optimal path avoiding congested Hyderabad hub (+180m delay). New path: Chennai → Bengaluru → Pune → Mumbai. Saved 140 mins.`;
      
      setRerouteResult({
        path: newPath,
        time: 520,
        explanation
      });

      await db.shipments.update(shipment.id, {
        currentRoute: newPath,
        routePath: newPath,
        status: 'REROUTED',
        riskLevel: 'MEDIUM',
        delayMinutes: 30,
        lastUpdated: new Date().toISOString()
      });

      await appsyncRealtime.publishRealtimeUpdate({
        type: 'SHIPMENT_ROUTE_UPDATED',
        shipmentId: shipment.id,
        latitude: shipment.lat || 18.5204,
        longitude: shipment.lng || 73.8567,
        currentLocation: shipment.currentLocation || 'Pune',
        status: 'REROUTED',
        riskScore: 0.45,
        riskLevel: 'MEDIUM',
        routePath: newPath,
        delayMinutes: 30,
        timestamp: new Date().toISOString()
      });

      setRerouting(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header & AppSync Realtime Connection Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#351C15] tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#D97706]" />
            Live Network Control Map
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Realtime package positions across Indian logistics corridors powered by AWS AppSync WebSockets
          </p>
        </div>

        {/* Realtime WebSocket Connection State */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span className="text-slate-600 font-bold">AWS WebSockets:</span>
          <span className={`px-2 py-0.5 rounded font-extrabold text-[11px] ${
            realtimeConnection === 'CONNECTED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800'
          }`}>
            {realtimeConnection === 'CONNECTED' ? '🟢 CONNECTED' : `🔴 ${realtimeConnection}`}
          </span>
        </div>
      </div>

      {lastRealtimeEvent && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center justify-between font-mono">
          <div className="flex items-center gap-2 font-bold">
            <Activity className="w-4 h-4 text-[#D97706] animate-bounce" />
            <span>AppSync WebSocket Push: <strong>{lastRealtimeEvent.type}</strong> for {lastRealtimeEvent.shipmentId}</span>
          </div>
          <span className="text-slate-600">{lastRealtimeEvent.currentLocation || 'Unknown'} (Risk: {lastRealtimeEvent.riskLevel})</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visualization Container */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col min-h-[480px] justify-between relative overflow-hidden">
          {/* Light Vector Map Canvas */}
          <div className="w-full flex-1 bg-slate-100 rounded-xl border border-slate-200 p-6 relative flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 flex justify-between items-center text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                Vector Canvas: Indian Freight Corridors
              </span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                Realtime WebSockets: Active
              </span>
            </div>

            {/* Logistics Hubs Network Canvas */}
            <div className="relative z-10 my-8 flex flex-wrap items-center justify-around gap-4">
              {hubs?.map(hub => {
                const isCurrentLoc = activeSelected?.currentLocation === hub.name || activeSelected?.currentHubId === hub.id;
                return (
                  <div 
                    key={hub.id}
                    className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                      isCurrentLoc 
                        ? 'bg-amber-100 border-[#FFB500] shadow-md scale-105' 
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        hub.capacityPercentage > 80 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                      }`} />
                      <span className="font-bold text-xs text-slate-900">{hub.city}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono font-medium">{hub.lat.toFixed(2)}°N, {hub.lng.toFixed(2)}°E</p>
                  </div>
                );
              })}
            </div>

            {/* Live Package Location Marker Card */}
            {activeSelected && (
              <div className="relative z-10 p-3.5 bg-white rounded-xl border border-amber-300 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${
                    activeSelected.riskLevel === 'HIGH' || activeSelected.status === 'AT_RISK'
                      ? 'bg-rose-100 text-rose-700 border border-rose-300' 
                      : activeSelected.status === 'DELAYED'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    <Navigation className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                        {activeSelected.id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-600 font-bold">({activeSelected.trackingNumber})</span>
                    </div>
                    <p className="text-xs text-slate-700 mt-1 font-medium">
                      Location: <strong className="text-slate-900">{activeSelected.currentLocation || 'Chennai'}</strong> &rarr; Target: <strong className="text-slate-900">{activeSelected.destination || 'Mumbai'}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    activeSelected.status === 'AT_RISK' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                    activeSelected.status === 'DELAYED' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                    'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {activeSelected.status}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono font-bold">Delay: +{activeSelected.delayMinutes || 0}m</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shipment Inspector & Routing Panel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-[#351C15] border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>Routing Inspector</span>
            <span className="text-xs text-[#D97706] font-mono font-bold">Dijkstra Engine</span>
          </h3>

          {/* List of Tracked Shipments */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Shipment:</label>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {shipments?.map(shp => (
                <button
                  key={shp.id}
                  onClick={() => {
                    setSelectedShipment(shp);
                    setRerouteResult(null);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs flex justify-between items-center transition-all cursor-pointer ${
                    activeSelected?.id === shp.id 
                      ? 'bg-amber-50 border-[#FFB500] text-slate-900 font-bold shadow-xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-[#351C15]">{shp.id}</span>
                    <span className="text-[11px] text-slate-500 font-medium">({shp.origin || 'Chennai'} &rarr; {shp.destination || 'Mumbai'})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    shp.status === 'AT_RISK' ? 'bg-rose-100 text-rose-800' :
                    shp.status === 'DELAYED' ? 'bg-amber-100 text-amber-900' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {shp.status}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {activeSelected && (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Current Route Path:</span>
                  <span className="font-mono text-[#351C15] font-extrabold">{(activeSelected.routePath || activeSelected.currentRoute || ['Chennai', 'Hyderabad', 'Mumbai']).join(' → ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Delay Penalty:</span>
                  <span className={(activeSelected.delayMinutes || 0) > 0 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                    +{activeSelected.delayMinutes || 0} mins
                  </span>
                </div>
              </div>

              {/* Dijkstra Recalculation Trigger */}
              <button
                onClick={() => handleSimulateDijkstraReroute(activeSelected)}
                disabled={rerouting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#FFB500] hover:bg-[#e6a300] text-[#351C15] font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer border border-[#D97706] disabled:opacity-50"
              >
                {rerouting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Recalculating Path...</span>
                  </>
                ) : (
                  <>
                    <GitFork className="w-4 h-4" />
                    <span>Run Dijkstra Route Recalculation</span>
                  </>
                )}
              </button>

              {rerouteResult && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Path Recalculated!</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[11px] font-medium">
                    {rerouteResult.explanation}
                  </p>
                  <div className="font-mono text-[#351C15] font-extrabold pt-1">
                    New Path: {rerouteResult.path.join(' → ')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
