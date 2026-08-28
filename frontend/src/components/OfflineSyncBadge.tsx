import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react';
import { syncManager } from '../utils/syncManager';
import type { SyncState } from '../types';

export const OfflineSyncBadge: React.FC = () => {
  const [syncState, setSyncState] = useState<SyncState>('ONLINE');
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(syncManager.getSimulatedOffline());

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((state, count) => {
      setSyncState(state);
      setPendingCount(count);
      setIsSimulatedOffline(syncManager.getSimulatedOffline());
    });
    return unsubscribe;
  }, []);

  const handleToggleOffline = () => {
    const newState = syncManager.toggleSimulatedOffline();
    setIsSimulatedOffline(newState);
  };

  const handleManualSync = () => {
    syncManager.triggerSync();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 text-xs">
      {/* 1. Status Indicator Badges */}
      <div className="flex items-center gap-1.5 font-semibold">
        {syncState === 'ONLINE' && (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>🟢 ONLINE</span>
          </span>
        )}

        {syncState === 'OFFLINE' && (
          <span className="flex items-center gap-1.5 text-rose-400">
            <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>🔴 OFFLINE</span>
          </span>
        )}

        {syncState === 'SYNCING' && (
          <span className="flex items-center gap-1.5 text-amber-400">
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>🔄 SYNCING...</span>
          </span>
        )}

        {syncState === 'SYNCED' && (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>✓ SYNCED</span>
          </span>
        )}
      </div>

      <div className="h-3 w-px bg-slate-800" />

      {/* 2. Pending Sync Counter */}
      <div className="flex items-center gap-2">
        {pendingCount > 0 ? (
          <button
            onClick={handleManualSync}
            disabled={syncState === 'OFFLINE' || syncState === 'SYNCING'}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
            title="Click to process queued events"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncState === 'SYNCING' ? 'animate-spin' : ''}`} />
            <span>{pendingCount} event{pendingCount > 1 ? 's' : ''} waiting to sync</span>
          </button>
        ) : (
          <span className="text-slate-400 text-[11px]">
            0 events pending
          </span>
        )}
      </div>

      <div className="h-3 w-px bg-slate-800" />

      {/* 3. Demo Control Toggle Switch */}
      <button
        onClick={handleToggleOffline}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
          isSimulatedOffline
            ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/20'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
        }`}
        title="Simulate offline mode for live hackathon presentation"
      >
        {isSimulatedOffline ? (
          <>
            <ToggleRight className="w-4 h-4 text-rose-400" />
            <span>Simulated Offline: ON</span>
          </>
        ) : (
          <>
            <ToggleLeft className="w-4 h-4 text-slate-400" />
            <span>Simulate Offline</span>
          </>
        )}
      </button>
    </div>
  );
};
