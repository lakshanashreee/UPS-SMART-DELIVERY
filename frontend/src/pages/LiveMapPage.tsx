import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  MapPin,
  RefreshCw,
  Navigation,
  Activity,
  Radio,
  CheckCircle2,
  Zap,
  ArrowRight
} from 'lucide-react';
import type { Shipment } from '../types';
import { appsyncRealtime, type RealtimeShipmentPayload } from '../utils/appsyncRealtime';

// Pure Indian Cities layout coordinates on SVG Canvas (600 x 360)
interface CityNode {
  id: string;
  name: string;
  x: number;
  y: number;
}

const INDIAN_CITY_NODES: CityNode[] = [
  { id: 'Delhi', name: 'Delhi', x: 300, y: 55 },
  { id: 'Ahmedabad', name: 'Ahmedabad', x: 120, y: 130 },
  { id: 'Kolkata', name: 'Kolkata', x: 480, y: 130 },
  { id: 'Hyderabad', name: 'Hyderabad', x: 330, y: 195 },
  { id: 'Mumbai', name: 'Mumbai', x: 140, y: 220 },
  { id: 'Pune', name: 'Pune', x: 230, y: 250 },
  { id: 'Bengaluru', name: 'Bengaluru', x: 260, y: 310 },
  { id: 'Chennai', name: 'Chennai', x: 400, y: 310 },
];

const NETWORK_LINKS = [
  { from: 'Chennai', to: 'Hyderabad' },
  { from: 'Hyderabad', to: 'Mumbai' },
  { from: 'Chennai', to: 'Bengaluru' },
  { from: 'Bengaluru', to: 'Pune' },
  { from: 'Pune', to: 'Mumbai' },
  { from: 'Mumbai', to: 'Delhi' },
  { from: 'Delhi', to: 'Kolkata' },
  { from: 'Kolkata', to: 'Chennai' },
  { from: 'Ahmedabad', to: 'Mumbai' },
  { from: 'Delhi', to: 'Ahmedabad' }
];

export const LiveMapPage: React.FC = () => {
  const shipments = useLiveQuery(() => db.shipments.toArray(), [], []);
  
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [rerouting, setRerouting] = useState<boolean>(false);
  const [rerouteResult, setRerouteResult] = useState<{ path: string[]; timeSaved: number; summary: string } | null>(null);
  const [realtimeConnection, setRealtimeConnection] = useState<string>('CONNECTED');
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState<RealtimeShipmentPayload | null>(null);

  const activeSelected = selectedShipment || (shipments && shipments.length > 0 ? shipments[0] : null);

  useEffect(() => {
    const unsubConn = appsyncRealtime.subscribeConnectionState(state => {
      setRealtimeConnection(state);
    });

    const unsubEvents = appsyncRealtime.subscribeEvents(payload => {
      setLastRealtimeEvent(payload);

      if (activeSelected && payload.shipmentId === activeSelected.id) {
        setSelectedShipment(prev => prev ? {
          ...prev,
          currentLocation: payload.currentLocation || prev.currentLocation,
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

  const handleOptimizeRoute = async (shipment: Shipment) => {
    setRerouting(true);
    setRerouteResult(null);

    setTimeout(async () => {
      const newPath = ['Chennai', 'Bengaluru', 'Pune', 'Mumbai'];
      const summary = `Bypassed traffic bottleneck in Hyderabad. Diverted through Bengaluru → Pune corridor. Saved 140 minutes!`;
      
      setRerouteResult({
        path: newPath,
        timeSaved: 140,
        summary
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
        latitude: 18.5204,
        longitude: 73.8567,
        currentLocation: 'Pune',
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

  const activePath = activeSelected?.routePath || activeSelected?.currentRoute || ['Chennai', 'Hyderabad', 'Mumbai'];
  const currentLoc = activeSelected?.currentLocation || 'Chennai';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#351C15] tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#D97706]" />
            Live Shipment Tracker & Route Graph
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Realtime package positions and delivery flows across Indian logistics corridors
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span className="text-slate-600 font-bold">AWS Realtime Push:</span>
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
            <span>Realtime Stream Update: <strong>{lastRealtimeEvent.type}</strong> for {lastRealtimeEvent.shipmentId}</span>
          </div>
          <span className="text-slate-600">Location: {lastRealtimeEvent.currentLocation || 'Unknown'}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Route Flow Diagram SVG Canvas */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col space-y-4">
          
          {/* Legend Banner */}
          <div className="flex flex-wrap items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 gap-2">
            <span className="font-bold text-[#351C15]">Map Legend:</span>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Normal Hub
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Congested Hub
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#FFB500] border-2 border-[#351C15] animate-pulse"></span> Package Location
              </span>
              <span className="flex items-center gap-1 text-[#D97706] font-bold">
                <ArrowRight className="w-3.5 h-3.5" /> Route Direction
              </span>
            </div>
          </div>

          {/* SVG Graph Flow Diagram */}
          <div className="w-full bg-slate-900 rounded-2xl border border-slate-800 p-4 relative overflow-hidden flex items-center justify-center min-h-[380px]">
            {/* Soft grid overlay */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />

            <svg viewBox="0 0 600 360" className="w-full h-auto max-h-[400px] relative z-10">
              <defs>
                <marker
                  id="arrow-active"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#FFB500" />
                </marker>
                <marker
                  id="arrow-default"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" />
                </marker>
              </defs>

              {/* Base Network Links */}
              {NETWORK_LINKS.map((link, idx) => {
                const source = INDIAN_CITY_NODES.find(n => n.name === link.from);
                const target = INDIAN_CITY_NODES.find(n => n.name === link.to);
                if (!source || !target) return null;

                // Check if this link is part of the active package route
                let isRouteActive = false;
                for (let i = 0; i < activePath.length - 1; i++) {
                  if (
                    (activePath[i] === link.from && activePath[i + 1] === link.to) ||
                    (activePath[i] === link.to && activePath[i + 1] === link.from)
                  ) {
                    isRouteActive = true;
                    break;
                  }
                }

                return (
                  <line
                    key={idx}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isRouteActive ? '#FFB500' : '#334155'}
                    strokeWidth={isRouteActive ? '3.5' : '1.5'}
                    strokeDasharray={isRouteActive ? 'none' : '4 4'}
                    markerEnd={isRouteActive ? 'url(#arrow-active)' : 'url(#arrow-default)'}
                    className="transition-all duration-300"
                  />
                );
              })}

              {/* City Nodes */}
              {INDIAN_CITY_NODES.map(node => {
                const isCurrent = currentLoc === node.name;
                const isOrigin = activeSelected?.origin === node.name;
                const isDest = activeSelected?.destination === node.name;
                const isCongested = node.name === 'Hyderabad'; // Highlight bottleneck hub

                return (
                  <g key={node.id} transform={`translate(${node.x}, ${node.y})`} className="cursor-pointer">
                    {/* Current Package Location Ripple Ring */}
                    {isCurrent && (
                      <circle r="22" fill="none" stroke="#FFB500" strokeWidth="2.5" className="animate-ping opacity-75" />
                    )}

                    {/* Node Dot */}
                    <circle
                      r={isCurrent ? '12' : '8'}
                      fill={
                        isCurrent
                          ? '#FFB500'
                          : isCongested
                          ? '#f43f5e'
                          : '#10b981'
                      }
                      stroke="#ffffff"
                      strokeWidth="2"
                    />

                    {/* Node Label Box */}
                    <rect
                      x="-42"
                      y="14"
                      width="84"
                      height="22"
                      rx="6"
                      fill="#0f172a"
                      stroke={isCurrent ? '#FFB500' : isCongested ? '#f43f5e' : '#334155'}
                      strokeWidth="1.5"
                    />
                    <text
                      x="0"
                      y="29"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      {node.name}
                    </text>

                    {/* Extra Status Badges */}
                    {isCurrent && (
                      <text x="0" y="-16" textAnchor="middle" fill="#FFB500" fontSize="10" fontWeight="900">
                        📍 PACKAGE HERE
                      </text>
                    )}
                    {isOrigin && !isCurrent && (
                      <text x="0" y="-14" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="bold">
                        ORIGIN
                      </text>
                    )}
                    {isDest && !isCurrent && (
                      <text x="0" y="-14" textAnchor="middle" fill="#34d399" fontSize="9" fontWeight="bold">
                        DESTINATION
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Active Tracked Package Summary Card */}
          {activeSelected && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#FFB500] text-[#351C15] rounded-xl font-bold shadow-xs">
                  <Navigation className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-[#351C15]">
                      {activeSelected.id}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">({activeSelected.trackingNumber})</span>
                  </div>
                  <p className="text-xs text-slate-700 font-bold mt-0.5">
                    Route: <strong className="text-slate-900">{activeSelected.origin || 'Chennai'}</strong> &rarr; <strong className="text-slate-900">{activeSelected.destination || 'Mumbai'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-500 block">Current City:</span>
                  <span className="text-xs font-extrabold text-[#351C15]">{activeSelected.currentLocation || 'Chennai'}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  activeSelected.status === 'AT_RISK' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                  activeSelected.status === 'DELAYED' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                  'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {activeSelected.status}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Route Optimization Inspector Panel */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-[#351C15] border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>Package Route Optimizer</span>
            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Smart Flow
            </span>
          </h3>

          {/* List of Tracked Packages */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Select Package to View Flow:</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {shipments?.map(shp => (
                <button
                  key={shp.id}
                  onClick={() => {
                    setSelectedShipment(shp);
                    setRerouteResult(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs flex justify-between items-center transition-all cursor-pointer ${
                    activeSelected?.id === shp.id 
                      ? 'bg-amber-50 border-[#FFB500] text-slate-900 font-extrabold shadow-xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[#351C15]">{shp.id}</span>
                    <span className="text-[11px] text-slate-500 font-bold">({shp.origin || 'Chennai'} &rarr; {shp.destination || 'Mumbai'})</span>
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
                <div>
                  <span className="text-slate-500 font-medium block mb-1">Active Transit Flow:</span>
                  <div className="font-mono text-[#351C15] font-extrabold bg-white p-2 rounded-lg border border-slate-200">
                    {activePath.join(' → ')}
                  </div>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500 font-medium">Estimated Delay:</span>
                  <span className={(activeSelected.delayMinutes || 0) > 0 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                    +{activeSelected.delayMinutes || 0} mins
                  </span>
                </div>
              </div>

              {/* Smart Alternative Route Trigger */}
              <button
                onClick={() => handleOptimizeRoute(activeSelected)}
                disabled={rerouting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#FFB500] hover:bg-[#e6a300] text-[#351C15] font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer border border-[#D97706] disabled:opacity-50"
              >
                {rerouting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Finding Faster Route...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Find Faster Alternative Route</span>
                  </>
                )}
              </button>

              {rerouteResult && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Optimized Route Found!</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[11px] font-medium">
                    {rerouteResult.summary}
                  </p>
                  <div className="font-mono text-[#351C15] font-extrabold pt-1 bg-white p-2 rounded-lg border border-emerald-200">
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
