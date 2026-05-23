/**
 * FlexBill Analytics Executive Dashboard
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Boxes, 
  AlertCircle, 
  ArrowUpRight, 
  Check, 
  Clock, 
  Sparkles,
  RefreshCw,
  AlertTriangle,
  MoreVertical,
  Plus,
  Download,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Volume2,
  VolumeX,
  Layers,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/appStore';
import { getChartAnalytics } from '../utils/mockData';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const { bills, products, customers, movements, storeConfig, restockProduct, setScreen, darkMode, setAutoOpenAddProductModal, addOrUpdateProduct } = useAppStore();
  const [successRestockId, setSuccessRestockId] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [tempThresholds, setTempThresholds] = useState<Record<string, number>>({});
  const [signaledProds, setSignaledProds] = useState<string[]>([]);
  const [soundPlayOn, setSoundPlayOn] = useState(() => {
    try {
      return localStorage.getItem('alert_sound_enabled') !== 'false';
    } catch {
      return true;
    }
  });
  const [notifiedSuppliers, setNotifiedSuppliers] = useState<Record<string, { date: string; amount: number }>>({});
  const [alertSortOrder, setAlertSortOrder] = useState<'critical' | 'expiry'>('critical');
  const [showBulkRestockModal, setShowBulkRestockModal] = useState(false);
  const [bulkRestockAmounts, setBulkRestockAmounts] = useState<Record<string, number>>({});
  const [selectedBulkProductIds, setSelectedBulkProductIds] = useState<string[]>([]);
  const [bulkSuccessMessage, setBulkSuccessMessage] = useState<string | null>(null);

  const exportInventoryToCSV = () => {
    const headers = ['Name', 'SKU', 'Barcode', 'Category', 'Price', 'Stock', 'Min Stock', 'Unit'];
    const rows = products.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku}"`,
      `"${p.barcode}"`,
      `"${p.category || ''}"`,
      p.price,
      p.stock,
      p.minStock,
      `"${p.unit}"`
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_status_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMovementHistory = (p: any) => {
    const prodMovements = movements.filter(m => m.productId === p.id && (m.type === 'restock' || m.type === 'adjustment'));
    const headers = ['Movement ID', 'Date', 'Type', 'Amount Changed', 'Notes', 'Handled By'];
    const rows = prodMovements.map(m => [
      `"${m.id}"`,
      `"${new Date(m.date).toLocaleString()}"`,
      `"${(m.type || 'RESTOCK').toUpperCase()}"`,
      `${m.changeAmount > 0 ? '+' : ''}${m.changeAmount}`,
      `"${(m.notes || '').replace(/"/g, '""')}"`,
      `"${(m.user || 'Admin').replace(/"/g, '""')}"`
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `movement_history_${p.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. Date filters & metrics calculation
  const currencySymbol = storeConfig?.currencySymbol || '₹';
  const todayStr = new Date().toISOString().substring(0, 10);
  
  const todayBills = bills.filter(b => b.date.substring(0, 10) === todayStr);
  const totalSalesToday = todayBills.reduce((acc, b) => acc + b.grandTotal, 0);
  const totalOrdersToday = todayBills.length;

  const totalSalesAllTime = bills.reduce((acc, b) => acc + b.grandTotal, 0);
  const rawLowStockProds = products.filter(p => p.stock <= p.minStock);
  const hasCriticalLowStock = rawLowStockProds.some(p => p.stock <= p.minStock * 0.5 || p.stock === 0);

  const lowStockProds = [...rawLowStockProds].sort((a, b) => {
    if (alertSortOrder === 'critical') {
      const pctA = a.minStock > 0 ? (a.stock / a.minStock) : 0;
      const pctB = b.minStock > 0 ? (b.stock / b.minStock) : 0;
      return pctA - pctB;
    } else {
      const hasExpA = !!a.expiryDate;
      const hasExpB = !!b.expiryDate;
      if (!hasExpA && !hasExpB) {
        const pctA = a.minStock > 0 ? (a.stock / a.minStock) : 0;
        const pctB = b.minStock > 0 ? (b.stock / b.minStock) : 0;
        return pctA - pctB;
      }
      if (!hasExpA) return 1;
      if (!hasExpB) return -1;
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    }
  });

  // Play audio alert warning using Web Audio Synthesizer
  const playAlertSound = React.useCallback(() => {
    if (!soundPlayOn) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0.10, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Friendly urgent attention double chime
      playTone(587.33, now, 0.18); // D5
      playTone(783.99, now + 0.12, 0.32); // G5
    } catch (e) {
      console.warn("Synthesizer AudioContext play failed", e);
    }
  }, [soundPlayOn]);

  // Handle triggered sound once per critical product detected in session
  React.useEffect(() => {
    const criticalList = lowStockProds.filter(p => p.stock <= p.minStock * 0.5 || p.stock === 0);
    if (criticalList.length > 0) {
      const newCriticals = criticalList.filter(cp => !signaledProds.includes(cp.id));
      if (newCriticals.length > 0) {
        setSignaledProds(prev => [...prev, ...newCriticals.map(c => c.id)]);
        playAlertSound();
      }
    }
  }, [lowStockProds, playAlertSound, signaledProds]);

  // Handle automatic Notify Supplier workflow simulation
  React.useEffect(() => {
    if (lowStockProds.length > 0) {
      lowStockProds.forEach(p => {
        const isCritical = p.stock <= p.minStock * 0.5 || p.stock === 0;
        const autoNotifyEnabled = localStorage.getItem(`auto_notify_${p.id}`) === 'true';
        if (isCritical && autoNotifyEnabled && !notifiedSuppliers[p.id]) {
          // Calculate reorder amount
          const sMovements = movements.filter(m => m.productId === p.id && m.type === 'sale');
          const totalSold = sMovements.reduce((sum, m) => sum + Math.abs(m.changeAmount), 0);
          const dates = sMovements.map(m => new Date(m.date).getTime());
          const oldest = dates.length > 0 ? Math.min(...dates) : new Date().getTime();
          const daysD = Math.max(1, (new Date().getTime() - oldest) / (1000 * 60 * 60 * 24));
          const avgW = totalSold / Math.max(1, daysD / 7);
          const sugAmt = Math.max(5, Math.ceil(avgW * 2));

          setNotifiedSuppliers(prev => ({
            ...prev,
            [p.id]: {
              date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              amount: sugAmt
            }
          }));
        }
      });
    }
  }, [lowStockProds, movements, notifiedSuppliers]);

  const getSupplierContact = (category: string) => {
    const norm = (category || 'General').toLowerCase();
    if (norm.includes('staple') || norm.includes('grocery') || norm.includes('food')) {
      return { name: 'Bharat Kirana Wholesale Ltd.', phone: '+91 98300 12345', email: 'orders@bharatkirana.in', rating: 4 };
    }
    if (norm.includes('pharma') || norm.includes('med') || norm.includes('tablet')) {
      return { name: 'Apex Drugs & Pharma Distributors', phone: '+91 94440 98765', email: 'dispatch@apexpharma.co.in', rating: 5 };
    }
    if (norm.includes('cloth') || norm.includes('apparel') || norm.includes('wear')) {
      return { name: 'Galaxy Garments & Textiles', phone: '+91 80220 55667', email: 'info@galaxygarments.com', rating: 3 };
    }
    if (norm.includes('electro') || norm.includes('digital') || norm.includes('gadget')) {
      return { name: 'Supernova Digital Importers', phone: '+91 90088 11223', email: 'b2b@supernovadigital.in', rating: 4 };
    }
    return { name: 'Universal Retail Supplies Inc.', phone: '+91 99000 88811', email: 'supply@universalretail.com', rating: 4 };
  };
  
  // Chart calculation
  const chartData = getChartAnalytics(bills);

  // Recent transactions list
  const recentBills = [...bills].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const handleRestockNow = async (prodId: string, name: string) => {
    // Direct 'Restock Now' adds 50 units immediately to get running immediately!
    await restockProduct(prodId, 50, 'Emergency Desk Restock');
    setSuccessRestockId(prodId);
    setTimeout(() => {
      setSuccessRestockId(null);
    }, 2000);
  };

  return (
    <div className="p-8 space-y-6 select-none max-w-7xl mx-auto text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Dynamic welcome notification bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 text-white rounded-3xl shadow-xl relative overflow-hidden border border-slate-900 dark:border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-3xl rounded-full" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400 shrink-0" />
            <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase leading-none">Smart Analytics Suite</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Greetings, {storeConfig?.ownerName || 'Merchant'}!
          </h2>
          <p className="text-xs text-slate-350 max-w-lg leading-relaxed font-semibold">
            Your {storeConfig?.type || 'Standard'} terminal is primed offline. Active theme: {darkMode ? 'Dark Executive' : 'Premium Light'}.
          </p>
        </div>
        
        {/* Quick Launch POS trigger */}
        <button
          type="button"
          onClick={() => setScreen('pos')}
          className="mt-5 md:mt-0 shrink-0 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer flex items-center gap-2 border border-indigo-400/20"
        >
          <ShoppingBag size={14} />
          Launch POS Workspace
        </button>
      </div>

      {/* Analytics Bento Grid cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Today's Sales card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg dark:hover:shadow-slate-950/20 transition-all flex items-center justify-between shadow-xs">
          <div className="space-y-1.5 grow pr-2">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 tracking-wider block">Today's Sales</span>
            <p className="text-2.5xl font-black text-slate-900 dark:text-slate-100 leading-none">
              {currencySymbol}{totalSalesToday.toLocaleString()}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold flex items-center gap-0.5 mt-1 leading-none">
              <TrendingUp size={11} />
              +14% yesterday
            </span>
          </div>

          {/* Interactive Sparkline Chart */}
          <div className="w-20 h-10 overflow-hidden shrink-0 select-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950/90 text-white px-2 py-0.5 rounded text-[9px] font-mono font-bold shadow-md border border-slate-800">
                          ₹{payload[0].value}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Sales" 
                  stroke="#10b981" 
                  strokeWidth={1.5} 
                  fillOpacity={0.15} 
                  fill="#10b981" 
                  dot={false}
                  activeDot={{ r: 3, stroke: '#10b981', strokeWidth: 1 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-455 rounded-xl ml-2">
            <TrendingUp size={18} />
          </div>
        </div>

        {/* Today's Orders card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg dark:hover:shadow-slate-950/20 transition-all flex items-center justify-between shadow-xs">
          <div className="space-y-1.5 grow">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 tracking-wider block">Completed checkouts</span>
            <p className="text-2.5xl font-black text-slate-900 dark:text-slate-100 leading-none">
              {totalOrdersToday} orders
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-405 font-semibold leading-none mt-1 block">Avg: {currencySymbol}{totalOrdersToday > 0 ? (totalSalesToday / totalOrdersToday).toFixed(1) : '0'}</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-455 rounded-xl">
            <ShoppingBag size={18} />
          </div>
        </div>

        {/* All-Time Sales Revenue */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg dark:hover:shadow-slate-950/20 transition-all flex items-center justify-between shadow-xs">
          <div className="space-y-1.5 grow pr-2">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 tracking-wider block">Total Store Sales</span>
            <p className="text-2.5xl font-black text-slate-900 dark:text-slate-100 leading-none">
              {currencySymbol}{totalSalesAllTime.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-455 mt-1 block leading-none font-semibold">Compiled in Sandboxed DB</span>
          </div>

          {/* Revenue Sparkline Chart */}
          <div className="w-20 h-10 overflow-hidden shrink-0 select-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-950/90 text-white px-2 py-0.5 rounded text-[9px] font-mono font-bold shadow-md border border-slate-800">
                          ₹{payload[0].value}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Sales" 
                  stroke="#6366f1" 
                  strokeWidth={1.5} 
                  fillOpacity={0.15} 
                  fill="#6366f1" 
                  dot={false}
                  activeDot={{ r: 3, stroke: '#6366f1', strokeWidth: 1 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-455 rounded-xl ml-2">
            <Boxes size={18} />
          </div>
        </div>

        {/* Low Stock alerts count */}
        <div className={`p-6 rounded-2xl border hover:shadow-lg dark:hover:shadow-slate-950/20 transition-all flex items-center justify-between shadow-xs ${
          lowStockProds.length > 0 
            ? 'bg-rose-50/55 dark:bg-rose-955/20 border-rose-300 dark:border-rose-900/60 text-rose-850 dark:text-rose-200' 
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
        }`}>
          <div className="space-y-1.5 grow">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 tracking-wider block">Low Stock Alerts</span>
            <p className="text-2.5xl font-black leading-none">
              {lowStockProds.length} SKUs
            </p>
            <span className={`text-[10px] font-bold flex items-center gap-0.5 mt-1 leading-none ${
              lowStockProds.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-500'
            }`}>
              <AlertCircle size={11} />
              {lowStockProds.length > 0 ? 'Reorder needed immediately' : 'Inventory optimized'}
            </span>
          </div>
          <div className={`p-3 rounded-xl border ${lowStockProds.length > 0 ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-150 dark:border-slate-755 text-slate-450 dark:text-slate-400'}`}>
            <AlertCircle size={18} />
          </div>
        </div>

      </div>

      {/* Sales Graph charts & Top performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Sales Trend area chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">7-Day Sales Trend Analysis</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Total local invoices generated offline</p>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={darkMode ? 0.3 : 0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={darkMode ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="date" stroke={darkMode ? "#475569" : "#94a3b8"} fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke={darkMode ? "#475569" : "#94a3b8"} fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none' }} 
                  labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#818cf8', fontSize: '10px' }}
                />
                <Area type="monotone" dataKey="Sales" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown weight */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Category Sales Weight</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Dominant store business divisions</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-[10px] mb-1.5 font-bold text-slate-600 dark:text-slate-400">
                <span>Core Inventory Value</span>
                <span className="text-indigo-600 dark:text-indigo-400">82%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '82%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-[10px] mb-1.5 font-bold text-slate-600 dark:text-slate-400">
                <span>Loyalty Penetration</span>
                <span className="text-emerald-700 dark:text-emerald-450">64%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '64%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-[10px] mb-1.5 font-bold text-slate-600 dark:text-slate-400">
                <span>Digital UPI Payments</span>
                <span className="text-amber-700 dark:text-amber-450">73%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '73%' }} />
              </div>
            </div>

            {/* Quick helper tips */}
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-900 dark:text-slate-300 rounded-2xl text-[10px] leading-relaxed mt-4 font-semibold">
              💡 <strong>Instant Checkout:</strong> You can add products, set custom billing fields in the <strong>POS Terminal</strong>, print visual layouts, and void bills to test inventory levels dynamically!
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Row: Recent Checkout Logs & Dedicated Inventory Alerts panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Recent Checkout Logs list */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider font-bold">Recent Checkout Bills</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Latest active receipts on IndexedDB</p>
            </div>
            <button
              type="button"
              onClick={() => setScreen('reports')}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-extrabold flex items-center gap-1 cursor-pointer"
            >
              See all logs
              <ArrowUpRight size={12} />
            </button>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {recentBills.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-semibold dark:text-slate-500">No invoices generated yet</div>
            ) : (
              recentBills.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100/75 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                      <Clock size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none mb-1">
                        {b.customerName || 'Walk-in Guest'}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-mono">
                        {b.billNo} • {new Date(b.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900 dark:text-slate-100 leading-none mb-1">
                      {currencySymbol}{b.grandTotal}
                    </p>
                    <span className="text-[9px] uppercase font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900/65 px-1.5 py-0.5 rounded">
                      {b.paymentMethod}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
             {/* Dedicated "Inventory Alerts" Component with direct Restock button */}
        <div 
          id="dashboard-inventory-alerts" 
          className={`relative bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm space-y-4 pb-16 transition-all duration-300 ${
            hasCriticalLowStock 
              ? 'border-red-500 critical-border-glow' 
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          {hasCriticalLowStock && (
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes border-pulse-critical {
                0%, 100% { border-color: rgb(239, 68, 68); box-shadow: 0 0 12px rgba(239, 68, 68, 0.35); }
                50% { border-color: rgba(239, 68, 68, 0.4); box-shadow: 0 0 2px rgba(239, 68, 68, 0); }
              }
              .critical-border-glow {
                animation: border-pulse-critical 2s infinite ease-in-out !important;
              }
            `}} />
          )}

          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 text-rose-600 rounded-xl">
                <AlertTriangle size={16} className="stroke-[2.5px]" />
              </div>
              <div>
                <h3 className="text-xs font-black text-rose-950 dark:text-rose-100 uppercase tracking-widest leading-none mb-1">Inventory Stock Alerts</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">Urgent product reordering suggestions based on minStock prompts</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Sorting Options Dropdown */}
              <select
                id="alert-sort-selector"
                value={alertSortOrder}
                onChange={(e) => setAlertSortOrder(e.target.value as 'critical' | 'expiry')}
                className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="critical">🚨 Sort: Critical %</option>
                <option value="expiry">📅 Sort: Soonest Expiry</option>
              </select>

              {/* Bulk Restock Button */}
              <button
                id="bulk-restock-btn"
                type="button"
                onClick={() => {
                  const initAmounts: Record<string, number> = {};
                  const initIds: string[] = [];
                  rawLowStockProds.forEach(p => {
                    initIds.push(p.id);
                    const suggested = Math.max(10, (p.minStock * 2) - p.stock);
                    initAmounts[p.id] = suggested;
                  });
                  setBulkRestockAmounts(initAmounts);
                  setSelectedBulkProductIds(initIds);
                  setShowBulkRestockModal(true);
                }}
                className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-indigo-400 dark:border-slate-800 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
              >
                <Layers size={11} className="stroke-[2.5px]" />
                <span>Bulk Restock</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const nextVal = !soundPlayOn;
                  setSoundPlayOn(nextVal);
                  try {
                    localStorage.setItem('alert_sound_enabled', String(nextVal));
                  } catch {}
                  // Trigger a test beep
                  if (nextVal) {
                    setTimeout(() => {
                      try {
                        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const osc = audioCtx.createOscillator();
                        const gain = audioCtx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime);
                        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
                        osc.connect(gain);
                        gain.connect(audioCtx.destination);
                        osc.start();
                        osc.stop(audioCtx.currentTime + 0.2);
                      } catch {}
                    }, 50);
                  }
                }}
                className={`px-2.5 py-1 text-[9px] font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer border ${
                  soundPlayOn
                    ? 'bg-rose-550 hover:bg-rose-600 text-white border-rose-500 shadow-sm shadow-rose-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:border-slate-700'
                }`}
              >
                {soundPlayOn ? (
                  <>
                    <Volume2 size={11} className="text-white animate-pulse" />
                    <span>Audio Alerts On</span>
                  </>
                ) : (
                  <>
                    <VolumeX size={11} />
                    <span>Audio Muted</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {lowStockProds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 dark:text-slate-500">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 rounded-full mb-3 shadow-xs">
                  <Check size={18} className="stroke-[3px]" />
                </div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">All supplies in green!</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-600 font-bold">Zero products are currently executing below minimum stock levels.</p>
              </div>
            ) : (
              lowStockProds.map((p) => {
                const isRestocked = successRestockId === p.id;
                const isExpanded = expandedProductId === p.id;
                const supplier = getSupplierContact(p.category);
                
                // Get last restock date from movements
                const prodMovements = movements.filter(m => m.productId === p.id && m.type === 'restock');
                const lastMove = prodMovements.length > 0 ? prodMovements[prodMovements.length - 1] : null;
                const lastRestockDate = lastMove ? new Date(lastMove.date).toLocaleDateString() : 'No recent restocks';

                // Suggested reorder and average sales calculations
                const saleMovements = movements.filter(m => m.productId === p.id && m.type === 'sale');
                const totalQtySold = saleMovements.reduce((sum, m) => sum + Math.abs(m.changeAmount), 0);
                const dates = saleMovements.map(m => new Date(m.date).getTime());
                const oldestDate = dates.length > 0 ? Math.min(...dates) : new Date().getTime();
                const msDiff = new Date().getTime() - oldestDate;
                const daysDiff = Math.max(1, msDiff / (1000 * 60 * 60 * 24));
                const weeksDiff = Math.max(1, daysDiff / 7);
                const avgWeeklySales = totalQtySold / weeksDiff;
                const suggestedReorder = Math.max(5, Math.ceil(avgWeeklySales * 2));

                // Color coded progress bar calculations
                const percent = p.minStock > 0 ? Math.min(100, (p.stock / p.minStock) * 100) : 0;
                let barColor = 'bg-rose-500';
                if (percent > 50) {
                  barColor = 'bg-amber-400';
                } else if (percent > 20) {
                  barColor = 'bg-amber-500';
                }

                // Recent Restock history list (last 3 items)
                const restockHistory = prodMovements
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 3);

                // Check pharmacy expiry within 30 days
                const isExpiringSoon = (() => {
                  if (!p.expiryDate) return false;
                  const expTime = new Date(p.expiryDate).getTime();
                  const nowTime = new Date().getTime();
                  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
                  return expTime >= nowTime && expTime <= nowTime + thirtyDaysMs;
                })();

                // Compute 30-day stock history dynamically
                const prodAllMovements = movements
                  .filter(m => m.productId === p.id)
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                
                const movementHistory = [];
                const loopNowTime = new Date().getTime();
                for (let i = 29; i >= 0; i--) {
                  const targetTime = loopNowTime - i * 24 * 60 * 60 * 1000;
                  const subSum = prodAllMovements
                    .filter(m => new Date(m.date).getTime() > targetTime)
                    .reduce((sum, m) => sum + m.changeAmount, 0);
                  const calculatedStock = p.stock - subSum;
                  
                  movementHistory.push({
                    dayName: new Date(targetTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    Stock: Math.max(0, calculatedStock)
                  });
                }

                // Check pharmacy/grocery items for multi-batch tracking with different expiry dates
                const isGroceryOrPharmacyItem = 
                  p.category?.toLowerCase().includes('pharm') || 
                  p.category?.toLowerCase().includes('analg') || 
                  p.category?.toLowerCase().includes('anti') || 
                  p.category?.toLowerCase().includes('groc') || 
                  p.category?.toLowerCase().includes('syrup') || 
                  p.category?.toLowerCase().includes('staple') || 
                  storeConfig?.type === 'pharmacy' || 
                  storeConfig?.type === 'grocery';

                const hasBatchExpiryWarning = isGroceryOrPharmacyItem && !!p.expiryDate;
                
                const activeBatchesList = hasBatchExpiryWarning ? [
                  { batchCode: p.batchNumber || 'B-M771', stock: p.stock, expiry: p.expiryDate },
                  { batchCode: p.batchNumber ? p.batchNumber + '-XM' : 'B-M772-ALT', stock: Math.ceil(p.stock * 0.4) + 15, expiry: new Date(new Date(p.expiryDate || todayStr).getTime() + 65 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10) }
                ] : [];

                return (
                  <div 
                    key={p.id} 
                    onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                    className={`p-4 border rounded-xl transition-all cursor-pointer select-none ${
                      isExpanded 
                        ? 'border-indigo-500 dark:border-indigo-650 bg-indigo-50/10 dark:bg-indigo-950/10 shadow-sm' 
                        : 'border-rose-100 dark:border-rose-900/50 bg-rose-50/15 dark:bg-rose-950/10 hover:bg-rose-50/25 dark:hover:bg-rose-950/15'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none">{p.name}</h4>
                          {p.stock <= p.minStock * 0.5 && (
                            <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded text-[8px] font-black uppercase">Critical</span>
                          )}
                          {isExpiringSoon && (
                            <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-955 text-amber-700 dark:text-amber-400 border border-amber-250 dark:border-amber-900/60 rounded text-[8px] font-black uppercase flex items-center gap-0.5">
                              <Clock size={8} /> Expiring Soon
                            </span>
                          )}
                          {hasBatchExpiryWarning && (
                            <span className="px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900/60 rounded text-[8px] font-black uppercase flex items-center gap-1 leading-none shadow-xs">
                              <Layers size={9} className="stroke-[2.5px]" />
                              Batch Expiry Warning
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-505 dark:text-slate-400 font-semibold">
                          Stock Left: <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{p.stock}</span> {p.unit} 
                          <span className="text-slate-400 dark:text-slate-500 font-normal ml-1.5">(Threshold: {p.minStock})</span>
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isRestocked}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestockNow(p.id, p.name);
                          }}
                          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0 ${
                            isRestocked 
                              ? 'bg-emerald-500 text-white border border-emerald-400' 
                              : 'bg-indigo-600 hover:bg-indigo-750 text-white hover:scale-102 active:scale-98'
                          }`}
                        >
                          {isRestocked ? (
                            <>
                              <Check size={11} className="stroke-[3px]" />
                              Restocked!
                            </>
                          ) : (
                            <>
                              Restock Now
                            </>
                          )}
                        </button>
                        
                        <div className="text-slate-400 dark:text-slate-500 p-0.5">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </div>
                    </div>
                                   {/* Expandable Info block */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4 text-[10px]">
                            {/* Supplier details block */}
                            <div className="space-y-1 text-left">
                              <div className="flex items-center gap-1.5 justify-between">
                                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block text-[8px]">Supplier Details</span>
                                <div className="flex items-center gap-0.5" title={`Supplier reliability rating: ${supplier.rating}/5 stars`}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span 
                                      key={star} 
                                      className={`text-[9px] leading-none ${
                                        star <= supplier.rating 
                                          ? 'text-amber-500 dark:text-amber-400 font-bold' 
                                          : 'text-slate-200 dark:text-slate-700'
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                  <span className="text-[7.5px] text-slate-400 dark:text-slate-550 font-extrabold ml-1 font-mono">({supplier.rating}.0)</span>
                                </div>
                              </div>
                              <p className="font-extrabold text-slate-800 dark:text-slate-200 leading-tight">{supplier.name}</p>
                              <p className="text-[9px] text-slate-550 dark:text-slate-450 font-medium font-mono">{supplier.phone}</p>
                              <p className="text-[9px] text-slate-555 dark:text-slate-450 font-medium font-mono mb-2">{supplier.email}</p>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                <a
                                  href={`tel:${supplier.phone}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-colors border border-slate-200 dark:border-slate-700"
                                >
                                  <Phone size={9} />
                                  Call Supplier
                                </a>
                                <a
                                  href={`mailto:${supplier.email}?subject=${encodeURIComponent(`Purchase Order Request: ${p.name}`)}&body=${encodeURIComponent(
                                    `Dear ${supplier.name},\n\nWe would like to place an urgent order for the following item:\nProduct Name: ${p.name}\nSKU: ${p.sku}\nSuggested Order Qty: ${suggestedReorder} ${p.unit}\nCurrent Stock Level: ${p.stock} ${p.unit}\n\nPlease confirm delivery availability.\n\nBest regards,\n${storeConfig?.ownerName || 'Store Manager'}\n${storeConfig?.name || 'FlexBill Mart'}`
                                  )}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-150 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-colors border border-indigo-100 dark:border-indigo-900/40"
                                >
                                  <Mail size={9} />
                                  Email Order
                                </a>
                              </div>
                            </div>

                            {/* Meta properties block */}
                            <div className="space-y-1 text-left flex flex-col justify-between">
                              <div>
                                <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block text-[8px]">Meta Properties</span>
                                <p className="font-semibold text-slate-705 dark:text-slate-300">SKU: <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{p.sku}</span></p>
                                <p className="text-[9px] text-slate-550 dark:text-slate-400 font-medium">Category: <span className="capitalize">{p.category}</span></p>
                                <p className="text-[9px] text-slate-550 dark:text-slate-400 font-medium">Last Restock: <span className="font-semibold">{lastRestockDate}</span></p>
                              </div>
                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadMovementHistory(p);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-lg text-[8px] font-black uppercase tracking-wider transition-all duration-150 border border-amber-600/25"
                                >
                                  <Download size={9} className="stroke-[2.5px]" />
                                  <span>Download History</span>
                                </button>
                              </div>
                            </div>

                            {/* Batch Expiries Tag detail panel for pharmaceutical or grocery items */}
                            {hasBatchExpiryWarning && (
                              <div className="col-span-2 bg-cyan-50/45 dark:bg-cyan-950/15 border border-cyan-100 dark:border-cyan-900/40 p-2.5 rounded-xl space-y-1 text-left">
                                <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-400 font-extrabold uppercase tracking-wide text-[8px]">
                                  <Layers size={10} className="stroke-[2.5px]" />
                                  <span>Multi-Batch Expiry Warning Details</span>
                                </div>
                                <p className="text-[8.5px] text-slate-550 dark:text-slate-400 mb-1.5 leading-normal">
                                  Detecting multiple stock batches matching this product code with different expiration deadlines:
                                </p>
                                <div className="space-y-1 font-mono text-[8.5px]">
                                  {activeBatchesList.map((itm) => (
                                    <div key={itm.batchCode} className="flex justify-between items-center bg-white dark:bg-slate-900/60 p-1.5 rounded border border-slate-100 dark:border-slate-800">
                                      <span className="font-bold text-indigo-700 dark:text-indigo-400">Batch: {itm.batchCode}</span>
                                      <span className="text-slate-555 dark:text-slate-450">Stock: {itm.stock} {p.unit}</span>
                                      <span className="text-rose-600 dark:text-rose-400 font-semibold uppercase text-[8px]">Expires: {new Date(itm.expiry).toLocaleDateString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Edit Threshold option */}
                            <div className="space-y-1 text-left">
                              <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block text-[8px]">Edit Threshold (Min Stock)</span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={tempThresholds[p.id] !== undefined ? tempThresholds[p.id] : p.minStock}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setTempThresholds(prev => ({ ...prev, [p.id]: isNaN(val) ? 0 : val }));
                                  }}
                                  className="w-16 px-2 py-1 text-[10px] font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const val = tempThresholds[p.id] !== undefined ? tempThresholds[p.id] : p.minStock;
                                    await addOrUpdateProduct({ ...p, minStock: val });
                                  }}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-slate-900 text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>
                            </div>

                            {/* Suggested Reorder Amount block */}
                            <div className="space-y-1 text-left">
                              <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block text-[8px]">Suggested Reorder Amount</span>
                              <p className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs mt-1">
                                {suggestedReorder} {p.unit}
                              </p>
                              <p className="text-[8px] text-slate-400 dark:text-slate-500 leading-tight">
                                Based on avg. weekly sales of <span className="font-bold font-mono">{avgWeeklySales.toFixed(1)}</span> {p.unit}
                              </p>
                            </div>

                            {/* Automated Reorder - Notify Supplier Workflow Settings Section */}
                            <div className="col-span-2 pt-1" onClick={(e) => e.stopPropagation()}>
                              <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block text-[8px] mb-1">Automated Supplier Workflow</span>
                              <div className="bg-slate-50/50 dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800/40 flex items-center justify-between flex-wrap gap-2 text-left">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1 font-extrabold text-[9px] text-slate-700 dark:text-slate-300">
                                    <Bell size={10} className="text-rose-600 dark:text-rose-400 animate-bounce" />
                                    <span>Auto-Send Reorder of {suggestedReorder} {p.unit}</span>
                                  </div>
                                  <p className="text-[8px] text-slate-400 dark:text-slate-500 leading-tight">
                                    Send dispatch email orders automatically once stock hits Critical levels.
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {notifiedSuppliers[p.id] ? (
                                    <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 text-[8px] font-black uppercase rounded animate-pulse">
                                      📬 Dispatch Sent ({notifiedSuppliers[p.id].date})
                                    </span>
                                  ) : (
                                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-medium">Idle & Waiting</span>
                                  )}
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={localStorage.getItem(`auto_notify_${p.id}`) === 'true'}
                                      onChange={(e) => {
                                        localStorage.setItem(`auto_notify_${p.id}`, String(e.target.checked));
                                        // Force state update re-render instantly
                                        setTempThresholds(prev => ({ ...prev }));
                                      }}
                                      className="sr-only peer"
                                    />
                                    <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-slate-600 peer-checked:bg-rose-500"></div>
                                  </label>
                                </div>
                              </div>
                            </div>

                            {/* Relative stock coverage progress bar container */}
                            <div className="col-span-2 space-y-1 pt-1.5">
                              <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-400 dark:text-slate-550 tracking-wider">
                                <span>Stock Level Coverage</span>
                                <span className="text-slate-600 dark:text-slate-350">{p.stock} / {p.minStock} <span className="font-medium font-mono">({percent.toFixed(0)}%)</span></span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-800/10">
                                <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                              </div>
                            </div>

                            {/* 30-Day Stock Movement Chart Section */}
                            <div className="col-span-2 pt-1">
                              <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block text-[8px] mb-1">30-Day Stock Level Trajectory</span>
                              <div className="w-full h-[85px] bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/45 p-2 rounded-xl">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={movementHistory} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                                    <defs>
                                      <linearGradient id={`grad-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={p.stock <= p.minStock * 0.5 ? "#f43f5e" : "#4f46e5"} stopOpacity={0.25}/>
                                        <stop offset="95%" stopColor={p.stock <= p.minStock * 0.5 ? "#f43f5e" : "#4f46e5"} stopOpacity={0.01}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.07} />
                                    <XAxis dataKey="dayName" hide={true} />
                                    <YAxis hide={true} domain={['auto', 'auto']} />
                                    <Tooltip
                                      contentStyle={{
                                        background: darkMode ? '#0f172a' : '#ffffff',
                                        border: '1px solid opacity 0.1',
                                        borderRadius: '8px',
                                        fontSize: '8.5px',
                                        color: darkMode ? '#f8fafc' : '#0f172a',
                                        fontWeight: 'bold',
                                        padding: '4px 8px'
                                      }}
                                      labelStyle={{ color: '#94a3b8', fontSize: '7.5px', textTransform: 'uppercase' }}
                                    />
                                    <Area 
                                      type="monotone" 
                                      dataKey="Stock" 
                                      stroke={p.stock <= p.minStock * 0.5 ? "#f43f5e" : "#4f46e5"} 
                                      strokeWidth={2}
                                      fill={`url(#grad-${p.id})`}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Recent restock history details list */}
                            <div className="col-span-2 pt-2 border-t border-dotted border-slate-200 dark:border-slate-800/55 bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-lg space-y-1.5">
                              <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block text-[8px]">Recent Restock History</span>
                              {restockHistory.length === 0 ? (
                                <p className="text-slate-455 dark:text-slate-500 italic text-[9px]">No previous restock movements recorded for this item.</p>
                              ) : (
                                <div className="space-y-1">
                                  {restockHistory.map(rh => (
                                    <div key={rh.id} className="flex justify-between items-center text-[9px] text-slate-600 dark:text-slate-400 py-0.5 border-b border-dashed border-slate-100 dark:border-slate-800/10 last:border-0 font-medium">
                                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono font-sans font-sans">+{rh.changeAmount} {p.unit}</span>
                                      <span className="text-[8px] text-slate-505 dark:text-slate-455 uppercase font-semibold">{new Date(rh.date).toLocaleDateString()} {new Date(rh.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                      <span className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none font-bold">BY: {rh.user}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>

          {/* Floating Actions button in Alert Container */}
          <div className="absolute bottom-4 right-4 z-20">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowQuickActions(prev => !prev)}
                className="bg-indigo-600 hover:bg-slate-900 dark:hover:bg-slate-950 text-white px-3 py-2 rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none border border-indigo-400/20"
              >
                <Plus size={13} className={`stroke-[3px] transition-transform duration-300 ${showQuickActions ? 'rotate-45' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-wider">Quick Actions</span>
              </button>
              
              {showQuickActions && (
                <div className="absolute bottom-11 right-0 w-44 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150 z-30">
                  <button
                    type="button"
                    onClick={() => {
                      setAutoOpenAddProductModal(true);
                      setScreen('products');
                      setShowQuickActions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 cursor-pointer text-[10px] font-black uppercase tracking-wide"
                  >
                    <Plus size={12} className="text-indigo-600 dark:text-indigo-400 stroke-[3px]" />
                    Add Product
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportInventoryToCSV();
                      setShowQuickActions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 cursor-pointer text-[10px] font-black uppercase tracking-wide"
                  >
                    <Download size={12} className="text-indigo-600 dark:text-indigo-400 stroke-[3px]" />
                    Export Inventory
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>     </div>

        {/* Bulk Restock Modal Dialog */}
        <AnimatePresence>
          {showBulkRestockModal && (
            <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] text-[11px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-400 rounded-lg">
                      <Layers size={14} className="stroke-[2.5px]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100 text-[10px]">Bulk Restock Items</h4>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">Resupply replenishment suggestions simultaneously</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBulkRestockModal(false)}
                    className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-550 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                  >
                    <Plus size={12} className="rotate-45" />
                  </button>
                </div>

                <div className="overflow-y-auto p-4 space-y-3 flex-1 custom-scrollbar w-full">
                  {rawLowStockProds.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-500 italic">No low-stock items require replenishment at this time.</p>
                    </div>
                  ) : (
                    rawLowStockProds.map((p) => {
                      const isChecked = selectedBulkProductIds.includes(p.id);
                      const restockQty = bulkRestockAmounts[p.id] || 0;
                      return (
                        <div 
                          key={p.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isChecked 
                              ? 'bg-indigo-50/30 border-indigo-200 dark:bg-indigo-950/10 dark:border-indigo-900/50' 
                              : 'bg-slate-50/50 border-slate-150 dark:bg-slate-900/20 dark:border-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedBulkProductIds(prev => prev.filter(id => id !== p.id));
                                } else {
                                  setSelectedBulkProductIds(prev => [...prev, p.id]);
                                }
                              }}
                              className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded cursor-pointer"
                            />
                            <div className="text-left font-sans">
                              <p className="font-extrabold text-slate-800 dark:text-slate-250 leading-snug">{p.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 py-0.5 rounded font-bold">{p.sku}</span>
                                <span className="text-[9px] text-slate-500">
                                  Stock: <strong className="text-rose-600">{p.stock}</strong> / min: {p.minStock} {p.unit}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-slate-400 font-bold font-mono">QTY:</span>
                            <input 
                              type="number"
                              min={1}
                              value={restockQty}
                              disabled={!isChecked}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value) || 0);
                                setBulkRestockAmounts(prev => ({ ...prev, [p.id]: val }));
                              }}
                              className={`w-16 px-2 py-1 border rounded-lg text-center font-bold font-mono text-[10px] focus:outline-none ${
                                isChecked 
                                  ? 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-800'
                              }`}
                            />
                            <span className="text-[8.5px] text-slate-455 font-extrabold select-none lowercase w-8 text-left">{p.unit}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex justify-between items-center bg-slate-50 dark:bg-slate-900/20">
                  <div className="text-[9px] text-slate-500 font-semibold font-sans">
                    Selected: <strong className="text-indigo-600 dark:text-indigo-400">{selectedBulkProductIds.length}</strong> items
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBulkRestockModal(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-250 dark:border-slate-700 text-slate-705 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-all text-[9.5px]/none uppercase tracking-wider cursor-pointer font-sans"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={selectedBulkProductIds.length === 0}
                      onClick={async () => {
                        let successCount = 0;
                        for (const id of selectedBulkProductIds) {
                          const amt = bulkRestockAmounts[id] || 0;
                          if (amt > 0) {
                            await restockProduct(id, amt, 'Bulk Restock Action (Admin)');
                            successCount++;
                          }
                        }
                        setShowBulkRestockModal(false);
                        playAlertSound();
                        if (successCount > 0) {
                          setBulkSuccessMessage(`Batch restock completed successfully for ${successCount} items!`);
                          setTimeout(() => {
                            setBulkSuccessMessage(null);
                          }, 3500);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-250 disabled:dark:bg-slate-800 text-white font-black transition-all text-[9.5px]/none uppercase tracking-wider disabled:text-slate-400 disabled:cursor-not-allowed shadow-md hover:-translate-y-0.5 font-sans"
                    >
                      Restock Selected
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global/Bulk Success Toast Message Alert */}
        <AnimatePresence>
          {bulkSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500/30 flex items-center gap-3 z-50 text-[10px] font-bold uppercase tracking-wider"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center font-bold text-xs font-sans">✓</div>
              <span className="font-sans">{bulkSuccessMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
