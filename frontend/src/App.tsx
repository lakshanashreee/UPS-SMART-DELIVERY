import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { OfflineSyncBadge } from './components/OfflineSyncBadge';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { ShipmentsPage } from './pages/ShipmentsPage';
import { AdminSimulatorPage } from './pages/AdminSimulatorPage';
import { seedInitialData } from './db';
import type { ActivePage } from './types';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');

  useEffect(() => {
    // Seed Dexie IndexedDB with initial mock data
    seedInitialData().catch(console.error);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
              Phase 0 Foundation Shell
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Smart Delivery & Delay Tracker
            </span>
          </div>

          {/* Network & Dexie Offline Sync Status Indicator */}
          <OfflineSyncBadge />
        </header>

        {/* Page View Wrapper */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activePage === 'dashboard' && <DashboardPage onNavigate={setActivePage} />}
          {activePage === 'map' && <LiveMapPage />}
          {activePage === 'shipments' && <ShipmentsPage />}
          {activePage === 'simulator' && <AdminSimulatorPage />}
        </div>
      </main>
    </div>
  );
};

export default App;
