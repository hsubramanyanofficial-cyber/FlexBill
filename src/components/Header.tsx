/**
 * FlexBill UI Layout Header
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { Bell, Search, Cloud, CloudOff, Store, Power, User, X, Check, AlertTriangle, Sun, Moon } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export default function Header() {
  const { 
    auth, 
    storeConfig, 
    notifications, 
    isOnline, 
    logout, 
    readNotification, 
    clearNotifications,
    setScreen,
    setSearchQuery,
    searchQuery,
    darkMode,
    toggleDarkMode
  } = useAppStore();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <div className="p-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full"><Check size={14} /></div>;
      case 'warning':
        return <div className="p-1 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-full"><AlertTriangle size={14} /></div>;
      default:
        return <div className="p-1 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-full"><Bell size={14} /></div>;
    }
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all select-none">
      
      {/* Brand & Store Profile Code */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-150 font-black text-lg select-none">
          {storeConfig?.name ? storeConfig.name.substring(0, 1).toUpperCase() : 'F'}
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1">
            {storeConfig?.name || 'FlexBill Setup'}
          </h1>
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
            <Store size={10} className="text-slate-500 dark:text-slate-400" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide font-mono">
              {storeConfig?.type || 'Not Configured'} MODE
            </span>
          </div>
        </div>
      </div>

      {/* Global Context-Aware Products / Customers Search Box */}
      <div className="hidden md:flex items-center w-full max-w-sm ml-6 relative">
        <label htmlFor="header-global-search" className="absolute left-3.5 text-slate-400 cursor-pointer">
          <Search size={14} />
        </label>
        <input
          id="header-global-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search items, SKU, barcodes..."
          className="w-full text-xs pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-700/80 focus:bg-white dark:focus:bg-slate-950 border border-slate-250 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/50 rounded-xl transition-all text-slate-950 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
        />
        {searchQuery && (
          <button 
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Right Wing: Online Widget, Notifications Engine, and Logout Trigger */}
      <div className="flex items-center gap-4">
        
        {/* Connection Widget */}
        <div 
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold leading-none transition-all ${
            isOnline 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-amber-50 border-amber-200 text-amber-700 font-bold'
          }`}
          title={isOnline ? 'Online with Cloud Ingress' : 'Local Offline-First Mode Sandbox Active'}
        >
          {isOnline ? <Cloud size={13} className="text-emerald-600" /> : <CloudOff size={13} className="text-amber-600" />}
          <span className="hidden sm:inline">{isOnline ? 'Cloud Sync Ready' : 'Local Offline Sandbox'}</span>
        </div>

        {/* Notifications Tray */}
        <div className="relative">
          <button
            type="button"
            id="notif-bell-btn"
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl border border-slate-100/80 transition-all cursor-pointer shadow-xs bg-slate-50/50"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center px-1 text-[9px] font-bold text-white bg-indigo-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Tray Panel */}
          {showNotifDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifDropdown(false)} />
              <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden transform origin-top-right animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">System Messages</span>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={async () => {
                        await clearNotifications();
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <Bell size={16} />
                      </div>
                      <p className="text-xs text-slate-500 font-medium">No active alerts or stock triggers</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`flex gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                          !notif.read ? 'bg-indigo-50/20' : ''
                        }`}
                        onClick={async () => {
                          await readNotification(notif.id);
                        }}
                      >
                        <div className="mt-0.5 shrink-0">
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="grow">
                          <h4 className="text-xs font-bold text-slate-800 leading-snug mb-0.5">
                            {notif.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[9px] text-slate-400 font-mono mt-1 block font-bold">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!notif.read && (
                          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0 self-center animate-pulse" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Card & Settings link */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="hidden lg:block text-right">
            <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none">
              {auth.name || 'Admin'}
            </p>
            <p className="text-[9px] text-indigo-600 dark:text-indigo-400 leading-tight uppercase font-mono mt-1 font-extrabold tracking-wider">
              {auth.role}
            </p>
          </div>
          
          {/* Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun size={15} className="text-amber-500" /> : <Moon size={15} />}
          </button>

          <button
            type="button"
            onClick={() => setScreen('settings')}
            className="flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer"
            title="Account Settings"
          >
            <User size={15} />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
            title="Log out of Terminal"
          >
            <Power size={15} />
          </button>
        </div>

      </div>
    </header>
  );
}
