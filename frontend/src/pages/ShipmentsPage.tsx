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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#351C15] tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-[#D97706]" />
            Shipments & Risk Inventory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Live package tracking ledger, risk flags, and ETA impact
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
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-[#FFB500] outline-none shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#FFB500] outline-none shadow-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="AT_RISK">At Risk Only</option>
            <option value="DELAYED">Delayed</option>
            <option value="ON_TRACK">On Track</option>
            <option value="REROUTED">Rerouted</option>
          </select>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-700 font-extrabold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Tracking Number</th>
                <th className="p-3.5">Origin &rarr; Destination</th>
                <th className="p-3.5">Current Location</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Risk Level</th>
                <th className="p-3.5">Delay (min)</th>
                <th className="p-3.5">ETA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredShipments?.map(shipment => (
                <tr key={shipment.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3.5 font-mono font-extrabold text-[#351C15]">
                    {shipment.trackingNumber}
                  </td>
                  <td className="p-3.5 text-slate-900 font-bold">
                    {shipment.origin || shipment.originHubId || 'Chennai'} &rarr; {shipment.destination || shipment.destinationHubId || 'Mumbai'}
                  </td>
                  <td className="p-3.5 font-mono text-slate-800 font-bold">
                    {shipment.currentLocation || shipment.currentHubId || 'Chennai'}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                      shipment.status === 'AT_RISK'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : shipment.status === 'DELAYED'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}>
                      {shipment.status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`font-bold ${
                      shipment.riskLevel === 'HIGH' || shipment.riskLevel === 'CRITICAL'
                        ? 'text-rose-700 flex items-center gap-1'
                        : 'text-slate-600'
                    }`}>
                      {(shipment.riskLevel === 'HIGH' || shipment.riskLevel === 'CRITICAL') && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                      {shipment.riskLevel}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono font-extrabold text-slate-900">
                    {shipment.delayMinutes > 0 ? `+${shipment.delayMinutes}m` : '0m'}
                  </td>
                  <td className="p-3.5 text-slate-600 font-mono font-bold">
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
