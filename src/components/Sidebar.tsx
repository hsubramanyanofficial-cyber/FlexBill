/**
 * FlexBill Dual-Mode Responsive Navigation Panel
 * @license Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  Box, 
  Users, 
  Warehouse, 
  BarChart3, 
  Settings,
  Store,
  HelpCircle,
  HelpCircleIcon
} from 'lucide-react';
import { useAppStore } from '../store/appStore';

export default function Sidebar() {
  const { currentScreen, setScreen, storeConfig, auth } = useAppStore();

  const handleNav = (screen: typeof currentScreen) => {
    setScreen(screen);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, minRole: 'cashier' },
    { id: 'pos', label: 'POS Terminal', icon: CreditCard, minRole: 'cashier' },
    { id: 'products', label: 'Products', icon: Box, minRole: 'manager' },
    { id: 'customers', label: 'Customers', icon: Users, minRole: 'cashier' },
    { id: 'inventory', label: 'Inventory', icon: Warehouse, minRole: 'manager' },
    { id: 'reports', label: 'Reports', icon: BarChart3, minRole: 'manager' },
    { id: 'settings', label: 'Settings', icon: Settings, minRole: 'admin' },
  ] as const;

  const filteredItems = navItems.filter((item) => {
    if (auth.role === 'admin') return true;
    if (auth.role === 'manager') {
      return item.minRole !== 'admin';
    }
    // Cashier role
    return item.minRole === 'cashier';
  });

  return (
    <>
      {/* 1. Tablet & Desktop Sidebar (md and up) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 text-slate-100 min-h-screen shrink-0 relative overflow-hidden select-none border-r border-slate-900">
        
        {/* Sleek App Branding Frame */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-900">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm select-none shadow-md shadow-indigo-600/30">
            FB
          </div>
          <div>
            <h2 className="text-xs font-black text-white tracking-widest leading-none mb-1">FLEXBILL POS</h2>
            <p className="text-[9px] text-indigo-400 font-mono tracking-wider font-bold">OFFLINE FIRST</p>
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleNav(item.id)}
                className={`flex items-center gap-3.5 w-full px-4.5 py-3 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-white' : 'text-slate-450 group-hover:text-white'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Support Card / Config Info */}
        <div className="p-4 mx-4 mb-6 bg-slate-900/60 rounded-2xl border border-slate-900/80">
          <p className="text-[11px] font-bold text-slate-200 mb-1">FlexBill Assist</p>
          <p className="text-[10px] text-slate-400 leading-relaxed mb-3 font-medium">
            Standard IndexedDB local storage active. Sync is automatic.
          </p>
          <div className="text-[9px] font-bold font-mono text-slate-500 flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg w-max border border-slate-800">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 animate-pulse" />
            Active Terminal
          </div>
        </div>

      </aside>

      {/* 2. Mobile Nav Bar Frame (Lower than md scale) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950 border-t border-slate-900 flex items-center justify-around px-2 z-40 shadow-xl select-none">
        {filteredItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              id={`mob-nav-${item.id}`}
              onClick={() => handleNav(item.id)}
              className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-lg transition-all ${
                isActive ? 'text-indigo-400' : 'text-slate-400'
              }`}
            >
              <Icon size={18} />
              <span className="text-[9px] mt-1 font-medium select-none truncate max-w-[60px]">
                {item.label === 'POS Terminal' ? 'POS' : item.label}
              </span>
            </button>
          );
        })}
        {filteredItems.length > 5 && (
          <button
            type="button"
            id="mob-nav-settings"
            onClick={() => handleNav('settings')}
            className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-lg transition-all ${
              currentScreen === 'settings' ? 'text-indigo-400' : 'text-slate-400'
            }`}
          >
            <Settings size={18} />
            <span className="text-[9px] mt-1 font-medium">Settings</span>
          </button>
        )}
      </nav>
    </>
  );
}
