/**
 * FlexBill Master Inventory Audit Ledger
 * @license Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Warehouse, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle, 
  RefreshCw, 
  History, 
  Check, 
  FileText,
  Search,
  CheckCircle2,
  Box
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { Product } from '../../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function InventoryManagement() {
  const { products, movements, storeConfig, restockProduct } = useAppStore();
  const currencySymbol = storeConfig?.currencySymbol || '₹';
  const storeType = storeConfig?.type || 'grocery';

  const [search, setSearch] = useState('');
  const [restockQty, setRestockQty] = useState<number>(100);
  const [activeRestockId, setActiveRestockId] = useState<string | null>(null);

  // 1. Compile low stock products
  const lowStockProds = useMemo(() => {
    return products.filter(p => p.stock <= p.minStock);
  }, [products]);

  // 2. Bar chart data: Top 6 product stock levels
  const barChartData = useMemo(() => {
    return products
      .slice(0, 7)
      .map(p => ({
        name: p.name.substring(0, 12),
        Stock: p.stock,
        MinThreshold: p.minStock
      }));
  }, [products]);

  // 3. Filter products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.sku.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const handleRestockSubmit = async (pId: string) => {
    if (!pId) return;
    await restockProduct(pId, restockQty, 'Warehouse adjustment procurement');
    setRestockQty(100);
    setActiveRestockId(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      
      {/* Header section */}
      <div className="flex items-center justify-between border-b pb-4 border-gray-100">
        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight leading-none mb-1">Central Warehouse Stock Ledger</h2>
          <p className="text-[10px] text-gray-500">Track raw movements, emergency audits, low supply indicators, and order estimates.</p>
        </div>
      </div>

      {storeType === 'restaurant' ? (
        <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-3xl text-center space-y-2">
          <Warehouse size={32} className="text-indigo-600 mx-auto" />
          <h3 className="text-sm font-bold text-indigo-950">Modular stock tracking is deactivated</h3>
          <p className="text-xs text-indigo-700 max-w-md mx-auto leading-relaxed">
            In Restaurant mode, FlexBill assumes infinite ingredient availability. Inventory movements are bypassed for direct KOT dispatches of chef items.
          </p>
        </div>
      ) : (
        <>
          {/* Main Analytics charts and low alarm blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Stock Levels Chart left side */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs space-y-4">
              <div>
                <h3 className="text-xs font-bold text-gray-900">Current Stock Levels</h3>
                <p className="text-[10px] text-gray-400">Available units vs Safe Threshold boundaries</p>
              </div>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={8} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={8} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', borderRadius: '12px', border: 'none' }}
                      labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#818cf8', fontSize: '10px' }}
                    />
                    <Bar dataKey="Stock" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="MinThreshold" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Low Alarm triggers suggestions right side */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs space-y-4">
              <div>
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 font-sans">
                  <AlertTriangle className="text-rose-500 shrink-0" size={14} />
                  Restock Procurement Forecast
                </h3>
                <p className="text-[10px] text-gray-400">Low stock products requesting placement</p>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {lowStockProds.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400 bg-emerald-50/20 border border-emerald-100/50 rounded-2xl">
                    <CheckCircle2 size={24} className="text-emerald-700 animate-bounce mb-1" />
                    <p className="text-[10px] font-bold text-emerald-800">Warehouse Stocks healthy!</p>
                  </div>
                ) : (
                  lowStockProds.map(p => (
                    <div key={p.id} className="p-3 border border-gray-100 hover:border-indigo-100 rounded-xl transition">
                      <div className="flex justify-between items-start text-[10px] mb-3 leading-tight">
                        <div>
                          <h4 className="font-bold text-gray-800 truncate max-w-[120px]">{p.name}</h4>
                          <span className="text-[9px] text-rose-500 font-mono font-bold block mt-0.5">Stock: {p.stock} / Min: {p.minStock}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900 font-mono">Cost: {currencySymbol}{p.costPrice}</p>
                          <span className="text-[8px] uppercase font-bold text-indigo-650 bg-indigo-50 px-1 py-0.5 rounded inline-block mt-0.5">Procure suggested</span>
                        </div>
                      </div>

                      {activeRestockId === p.id ? (
                        <div className="flex items-center gap-1.5 border-t pt-2 mt-2 leading-none">
                          <input
                            type="number"
                            value={restockQty}
                            onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value)))}
                            className="w-16 border rounded text-xs px-2 py-1 bg-white text-center font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleRestockSubmit(p.id)}
                            className="px-3 py-1 bg-indigo-600 hover:bg-slate-900 text-white rounded text-[10px] font-bold transition flex items-center gap-1 h-7 cursor-pointer"
                          >
                            <Check size={11} /> Confirm
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRestockId(p.id);
                            setRestockQty(100);
                          }}
                          className="w-full text-center py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Trigger Stock Order
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Bottom Grid: Live catalogs search and manual increment logs vs historical audited movements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Product fast adjustment tool */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs space-y-4">
              <div>
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Warehouse size={14} className="text-indigo-600" />
                  Manual Inventory Adjustment
                </h3>
                <p className="text-[10px] text-gray-400">Manually augment stocks or adjust damaged items instantly</p>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Quick lookup items, SKU, etc..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-4 py-1.5 border border-gray-150 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredProducts.slice(0, 5).map(p => (
                  <div key={p.id} className="p-3 bg-gray-50/60 rounded-xl flex items-center justify-between border hover:bg-gray-50 transition">
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 truncate max-w-[160px]">{p.name}</h4>
                      <p className="text-[10px] text-gray-500 font-mono font-semibold">Stock: {p.stock} units • SKU: {p.sku}</p>
                    </div>

                    {activeRestockId === p.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={restockQty}
                          onChange={(e) => setRestockQty(Number(e.target.value))}
                          className="w-14 text-center text-xs border bg-white rounded py-1 font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => handleRestockSubmit(p.id)}
                          className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRestockId(p.id);
                          setRestockQty(50);
                        }}
                        className="px-3 py-1 bg-white border hover:bg-indigo-50 rounded-lg text-[10px] font-bold transition cursor-pointer text-indigo-600"
                      >
                        Adjust
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Audit log movements lists */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs space-y-4">
              <div>
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <History size={14} className="text-indigo-600" />
                  Real-time Stock Audit log
                </h3>
                <p className="text-[10px] text-gray-400">Physical changes resulting from retail checkouts and adjustments</p>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {movements.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs">Zero historic logs booked under this session.</div>
                ) : (
                  movements.map(m => (
                    <div key={m.id} className="p-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-100/10 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${m.changeAmount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {m.changeAmount > 0 ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-800 leading-none mb-1">{m.productName}</h4>
                          <p className="text-[9px] text-gray-400 font-mono">
                            {m.notes || 'No description'} • {new Date(m.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-xs font-mono font-bold ${m.changeAmount > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {m.changeAmount > 0 ? `+${m.changeAmount}` : m.changeAmount}
                        </p>
                        <span className="text-[8px] text-gray-400 font-mono uppercase font-bold block mt-1">Audit: {m.user}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
