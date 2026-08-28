import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Package, 
  Cpu, 
  ShieldCheck,
  LogOut,
  User,
  Truck
} from 'lucide-react';
import type { ActivePage } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Live Control Map', icon: MapPin },
    { id: 'shipments', label: 'Shipments & Risks', icon: Package },
    { id: 'simulator', label: 'Legacy Feed Simulator', icon: Cpu },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen sticky top-0 z-30 shadow-sm">
      <div>
        {/* Brand Header */}
        <div className="p-4 bg-[#351C15] border-b border-[#4D291F] flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFB500] rounded-xl flex items-center justify-center text-[#351C15] shadow-md border border-[#351C15]">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-white tracking-tight text-sm leading-tight">
              Control Tower
            </h1>
            <p className="text-[11px] font-semibold text-amber-300">Smart Logistics MVP</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as ActivePage)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-amber-100 text-amber-950 border border-amber-300 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#D97706]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Session & Logout Footer */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50 space-y-3">
        <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#351C15] text-[#FFB500] flex items-center justify-center font-extrabold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{user?.username || 'admin@logistics.com'}</p>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded border border-amber-300 inline-block">
              {user?.role || 'ADMIN'}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer border border-slate-300"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
          <span className="flex items-center gap-1 text-emerald-600 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Cognito Auth
          </span>
          <span>AWS us-east-1</span>
        </div>
      </div>
    </aside>
  );
};
