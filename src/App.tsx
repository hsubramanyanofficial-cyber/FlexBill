/**
 * FlexBill PWA POS & Universal Billing Terminal Entry Point
 * @license Apache-2.0
 */

import React, { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginSignup from './features/auth/LoginSignup';
import Onboarding from './features/onboarding/Onboarding';
import Dashboard from './pages/Dashboard';
import POSScreen from './features/billing/POSScreen';
import ProductManagement from './features/products/ProductManagement';
import CustomerManagement from './features/customers/CustomerManagement';
import InventoryManagement from './features/inventory/InventoryManagement';
import ReportsPanel from './features/reports/ReportsPanel';
import SettingsPanel from './features/settings/SettingsPanel';

export default function App() {
  const { 
    currentScreen, 
    auth, 
    storeConfig, 
    initializeStore, 
    setScreen 
  } = useAppStore();

  // On mount bootstrapper pulls catalogs and states from client database
  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // If session is deactivated, return authentication terminals
  if (!auth.isLoggedIn) {
    return <LoginSignup />;
  }

  // If user is validated, but business config has not been onboarded, route to store setup wizard
  if (!storeConfig) {
    return <Onboarding />;
  }

  // Selected subviews render switcher
  const renderScreen = () => {
    switch (currentScreen) {
      case 'onboard':
        return <Onboarding />;
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POSScreen />;
      case 'products':
        return <ProductManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'reports':
        return <ReportsPanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-150 transition-colors duration-200">
      
      {/* 1. Left Desk Dock sidebar for larger tablets and PCs */}
      <Sidebar />
      
      {/* 2. Main content block */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header line with Search Everywhere, System messaging and Operator stats */}
        <Header />
        
        {/* Scrolling middle active screen block */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 scroll-smooth">
          {renderScreen()}
        </main>

      </div>

    </div>
  );
}
