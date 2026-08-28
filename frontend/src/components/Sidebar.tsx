import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Package, 
  Cpu, 
  Truck, 
  ShieldCheck
} from 'lucide-react';
import type { ActivePage } from '../types';

interface SidebarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Live Control Map', icon: MapPin },
    { id: 'shipments', label: 'Shipments & Risks', icon: Package },
    { id: 'simulator', label: 'Legacy Feed Simulator', icon: Cpu },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 backdrop-blur-md z-30">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-xl shadow-lg shadow-amber-500/20 text-slate-950 font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-100 tracking-tight text-base leading-tight">
              Control Tower
            </h1>
            <p className="text-xs font-medium text-amber-400">UPS Use Case 2026</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as ActivePage)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-500 space-y-2">
        <div className="flex items-center gap-2 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Security Protocol Active</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          AWS Region: <span className="font-mono text-slate-400">us-east-1</span>  
          <br />
          No hardcoded credentials
        </p>
      </div>
    </aside>
  );
};
