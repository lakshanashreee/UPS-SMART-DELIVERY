import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Package, Search, Filter, AlertTriangle } from 'lucide-react';

export const ShipmentsPage: React.FC = () => {
  const shipments = useLiveQuery(() => db.shipments.toArray(), [], []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredShipments = shipments?.filter(s => {
    const matchesSearch = s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || s.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-400" />
            Shipments & Risk Inventory
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            REQ-1: Live package status tracking and delivery deadline risk flags.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search tracking number or shipment ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50"
          >
            <option value="ALL">All Statuses</option>
            <option value="AT_RISK">At Risk Only</option>
            <option value="DELAYED">Delayed</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="REROUTED">Rerouted</option>
          </select>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Tracking Number</th>
                <th className="p-3.5">Origin &rarr; Destination</th>
                <th className="p-3.5">Current Hub</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Risk Level</th>
                <th className="p-3.5">Delay (min)</th>
                <th className="p-3.5">ETA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredShipments?.map(shipment => (
                <tr key={shipment.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-amber-400">
                    {shipment.trackingNumber}
                  </td>
                  <td className="p-3.5 text-slate-200">
                    {shipment.originHubId} &rarr; {shipment.destinationHubId}
                  </td>
                  <td className="p-3.5 font-mono text-slate-300">
                    {shipment.currentHubId}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      shipment.status === 'AT_RISK'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : shipment.status === 'DELAYED'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {shipment.status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`font-semibold ${
                      shipment.riskLevel === 'HIGH' || shipment.riskLevel === 'CRITICAL'
                        ? 'text-rose-400 flex items-center gap-1'
                        : 'text-slate-400'
                    }`}>
                      {(shipment.riskLevel === 'HIGH' || shipment.riskLevel === 'CRITICAL') && <AlertTriangle className="w-3.5 h-3.5" />}
                      {shipment.riskLevel}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-slate-200">
                    {shipment.delayMinutes > 0 ? `+${shipment.delayMinutes}m` : '0m'}
                  </td>
                  <td className="p-3.5 text-slate-400 font-mono">
                    {new Date(shipment.eta || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}

              {(!filteredShipments || filteredShipments.length === 0) && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                    No shipments found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
