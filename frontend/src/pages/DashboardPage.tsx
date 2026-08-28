import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  GitFork,
  Activity,
  Radio,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import type { ActivePage } from '../types';
import { appsyncRealtime } from '../utils/appsyncRealtime';

interface DashboardPageProps {
  onNavigate: (page: ActivePage) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const shipments = useLiveQuery(() => db.shipments.toArray(), [], []);
  const hubs = useLiveQuery(() => db.hubs.toArray(), [], []);
  const scanEvents = useLiveQuery(() => db.scanEvents.toArray(), [], []);
  const [realtimeConn, setRealtimeConn] = useState<string>('CONNECTED');

  useEffect(() => {
    const unsub = appsyncRealtime.subscribeConnectionState(state => {
      setRealtimeConn(state);
    });
    return unsub;
  }, []);

  const totalCount = shipments?.length || 0;
  const atRiskShipments = shipments?.filter(s => 
    s.status === 'AT_RISK' || s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL' || (s.delayMinutes || 0) > 60
  ) || [];
  
  const atRiskCount = atRiskShipments.length;
  const delayedCount = shipments?.filter(s => s.status === 'DELAYED').length || 0;
  const onTimeCount = totalCount - atRiskCount - delayedCount;
  const activeEventsCount = scanEvents?.length || 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Realtime Connection Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#351C15] tracking-tight flex items-center gap-2">
            Control Tower Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Realtime UPS shipment monitoring across Indian logistics hubs
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* AppSync Connection State */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span className="text-slate-600 font-bold">AWS Realtime WebSockets:</span>
            <span className={`px-2 py-0.5 rounded font-extrabold text-[11px] ${
              realtimeConn === 'CONNECTED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800'
            }`}>
              {realtimeConn === 'CONNECTED' ? '🟢 CONNECTED' : `🔴 ${realtimeConn}`}
            </span>
          </div>

          <button
            onClick={() => onNavigate('map')}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFB500] hover:bg-[#e6a300] text-[#351C15] font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer border border-[#D97706]"
          >
            <span>Open Live Map</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Shipments</span>
            <Package className="w-5 h-5 text-sky-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalCount}</div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1 font-medium">
            <Activity className="w-3.5 h-3.5 text-sky-600" />
            <span>Monitored in Realtime</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm">
          <div className="flex justify-between items-center text-emerald-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">On-Time</span>
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-700">{onTimeCount > 0 ? onTimeCount : 0}</div>
          <p className="text-[11px] text-emerald-700/80 mt-2 font-medium">
            Normal velocity
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm">
          <div className="flex justify-between items-center text-rose-800 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">At-Risk</span>
            <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
          </div>
          <div className="text-3xl font-extrabold text-rose-700">{atRiskCount}</div>
          <p className="text-[11px] text-rose-700/80 mt-2 font-medium">
            Requires rerouting
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
          <div className="flex justify-between items-center text-amber-900 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Delayed</span>
            <Clock className="w-5 h-5 text-[#D97706]" />
          </div>
          <div className="text-3xl font-extrabold text-amber-700">{delayedCount}</div>
          <p className="text-[11px] text-amber-800/80 mt-2 font-medium">
            Minor congestion
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Events</span>
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-purple-700">{activeEventsCount}</div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Scanned RFID logs
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* At-Risk Shipments Panel */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-[#351C15] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              At-Risk Shipments Panel
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-300">
              {atRiskCount} Flagged
            </span>
          </div>

          <div className="space-y-3">
            {atRiskShipments.map(shipment => {
              const riskScore = shipment.riskLevel === 'HIGH' || shipment.status === 'AT_RISK' ? 0.87 : 0.45;
              const etaDisplay = shipment.etaMinutes ? `+${shipment.etaMinutes} mins` : '12 hrs';

              return (
                <div 
                  key={shipment.id}
                  className="p-4 rounded-xl bg-slate-50 border border-rose-200 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                        {shipment.id}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-600">({shipment.trackingNumber})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-100 text-rose-800 rounded-full border border-rose-300 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Risk Score: {riskScore} ({shipment.riskLevel || 'HIGH'})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-500 flex items-center gap-1 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-[#D97706]" />
                        Current Location:
                      </span>
                      <span className="font-bold text-slate-900">{shipment.currentLocation || 'Chennai'}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 flex items-center gap-1 font-semibold">
                        <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
                        Destination:
                      </span>
                      <span className="font-bold text-slate-900">{shipment.destination || 'Mumbai'}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 flex items-center gap-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        ETA Delay Impact:
                      </span>
                      <span className="font-bold text-amber-800">{etaDisplay}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-xs">
                    <span className="text-slate-600 font-medium">
                      Status: <strong className="text-rose-700 font-bold">{shipment.status}</strong> (+{shipment.delayMinutes || 180}m congestion penalty)
                    </span>

                    <button
                      onClick={() => onNavigate('map')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFB500] hover:bg-[#e6a300] text-[#351C15] font-extrabold text-xs rounded-lg shadow-xs transition-all cursor-pointer border border-[#D97706]"
                    >
                      <GitFork className="w-3.5 h-3.5" />
                      <span>Open Map & Recalculate</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {atRiskShipments.length === 0 && (
              <div className="p-8 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">All Shipments On Schedule</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">No risk alerts currently detected across Indian logistics hubs.</p>
              </div>
            )}
          </div>
        </div>

        {/* Hub Bottleneck Overview */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-[#351C15] border-b border-slate-100 pb-3">
            Indian Logistics Hub Capacities
          </h3>
          <div className="space-y-3">
            {hubs?.map(hub => (
              <div key={hub.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">{hub.name}</span>
                  <span className={`font-mono font-bold ${hub.capacityPercentage > 80 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {hub.capacityPercentage}% Cap
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${hub.capacityPercentage > 80 ? 'bg-rose-500' : 'bg-[#FFB500]'}`}
                    style={{ width: `${hub.capacityPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
