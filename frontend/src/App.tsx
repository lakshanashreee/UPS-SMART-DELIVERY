import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { OfflineSyncBadge } from './components/OfflineSyncBadge';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMapPage } from './pages/LiveMapPage';
import { ShipmentsPage } from './pages/ShipmentsPage';
import { AdminSimulatorPage } from './pages/AdminSimulatorPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { seedInitialData } from './db';
import type { ActivePage } from './types';

const MainAppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');

  useEffect(() => {
    // Seed Dexie IndexedDB with initial clean India hub data
    seedInitialData().catch(console.error);
  }, []);

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setActivePage('dashboard')} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Light Header Bar */}
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-md border border-amber-300">
              Control Tower MVP
            </span>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Smart Delivery & Realtime Delay Tracker
            </span>
          </div>

          {/* Network & Dexie Offline Sync Status Indicator */}
          <OfflineSyncBadge />
        </header>

        {/* Page View Wrapper */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
          {activePage === 'dashboard' && <DashboardPage onNavigate={setActivePage} />}
          {activePage === 'map' && <LiveMapPage />}
          {activePage === 'shipments' && <ShipmentsPage />}
          {activePage === 'simulator' && <AdminSimulatorPage />}
        </div>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
