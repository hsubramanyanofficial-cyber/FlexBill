/**
 * FlexBill reports & analytics ledger
 * @license Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Printer, 
  TrendingUp, 
  Percent, 
  DollarSign, 
  FileSpreadsheet, 
  RefreshCw,
  Clock,
  Check,
  CheckCircle,
  Tag
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { Bill } from '../../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function ReportsPanel() {
  const { bills, storeConfig, products } = useAppStore();
  const currencySymbol = storeConfig?.currencySymbol || '₹';

  const [filterRange, setFilterRange] = useState<'today' | 'week' | 'month'>('week');
  const [csvExportSuccess, setCsvExportSuccess] = useState(false);

  // 1. Math date filters
  const filteredBills = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);
    
    return bills.filter(b => {
      const bDate = new Date(b.date);
      if (filterRange === 'today') {
        return bDate.toISOString().substring(0, 10) === todayStr;
      }
      if (filterRange === 'week') {
        const diff = now.getTime() - bDate.getTime();
        return diff <= 7 * 24 * 60 * 60 * 1000;
      }
      // Month
      const diff = now.getTime() - bDate.getTime();
      return diff <= 30 * 24 * 60 * 60 * 1000;
    });
  }, [bills, filterRange]);

  // 2. Summary stats cards calculation
  const stats = useMemo(() => {
    const orderCount = filteredBills.length;
    const grossSales = filteredBills.reduce((acc, b) => acc + b.grandTotal, 0);
    const taxCollected = filteredBills.reduce((acc, b) => acc + b.taxTotal, 0);
    const discountsSum = filteredBills.reduce((acc, b) => acc + b.discountTotal, 0);
    const avgOrder = orderCount > 0 ? grossSales / orderCount : 0;

    return {
      orderCount,
      grossSales: Number(grossSales.toFixed(2)),
      taxCollected: Number(taxCollected.toFixed(2)),
      discountsSum: Number(discountsSum.toFixed(2)),
      avgOrder: Number(avgOrder.toFixed(2))
    };
  }, [filteredBills]);

  // 3. Compile charts of sales vs tax
  const graphData = useMemo(() => {
    const temp: { [key: string]: { date: string; Sales: number; Orders: number; Gst: number } } = {};
    
    filteredBills.forEach(b => {
      const dt = new Date(b.date);
      const label = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      if (!temp[label]) {
        temp[label] = { date: label, Sales: 0, Orders: 0, Gst: 0 };
      }
      temp[label].Sales += b.grandTotal;
      temp[label].Orders += 1;
      temp[label].Gst += b.taxTotal;
    });

    return Object.values(temp).map(v => ({
      ...v,
      Sales: Number(v.Sales.toFixed(2)),
      Gst: Number(v.Gst.toFixed(2))
    }));
  }, [filteredBills]);

  // 4. Pie charts categories distribution
  const pieData = useMemo(() => {
    const m: { [key: string]: number } = {};
    filteredBills.forEach(b => {
      b.items.forEach(it => {
        // Fallback or find category from products list
        const pObj = products.find(p => p.id === it.productId);
        const cat = pObj?.category || 'General';
        m[cat] = (m[cat] || 0) + it.total;
      });
    });

    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];
    return Object.entries(m).map(([name, value], i) => ({
      name,
      value: Number(value.toFixed(2)),
      color: colors[i % colors.length]
    }));
  }, [filteredBills, products]);

  //5. Top selling products
  const topProducts = useMemo(() => {
    const temp: { [key: string]: { name: string; qty: number; total: number } } = {};
    
    filteredBills.forEach(b => {
      b.items.forEach(it => {
        if (!temp[it.productId]) {
          temp[it.productId] = { name: it.name, qty: 0, total: 0 };
        }
        temp[it.productId].qty += it.quantity;
        temp[it.productId].total += it.total;
      });
    });

    return Object.values(temp)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .map(x => ({
        ...x,
        total: Number(x.total.toFixed(2))
      }));
  }, [filteredBills]);

  // 6. CSV Exporter mechanism
  const exportCSV = () => {
    if (filteredBills.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Invoice No,Date,Customer Name,Phone,Subtotal,Tax,Discount,Grand Total,Payment Method,Synced\r\n';

    filteredBills.forEach(b => {
      const cName = b.customerName ? b.customerName.replace(/,/g, ' ') : 'Walk-in Guest';
      const cPhone = b.customerPhone || 'N/A';
      const row = `${b.billNo},${new Date(b.date).toLocaleDateString()},${cName},${cPhone},${b.subtotal},${b.taxTotal},${b.discountTotal},${b.grandTotal},${b.paymentMethod},${b.synced}`;
      csvContent += row + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Report_${filterRange}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Flash success notification badge
    setCsvExportSuccess(true);
    setTimeout(() => setCsvExportSuccess(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      
      {/* Header controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight leading-none mb-1">Invoices, revenue & audits analytics</h2>
          <p className="text-[10px] text-gray-500">Inspect peak order hours, gross metrics, tax lists, and download reports.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          
          <div className="flex bg-white border rounded-xl p-1 leading-none text-xs">
            {(['today', 'week', 'month'] as const).map(rng => (
              <button
                key={rng}
                type="button"
                onClick={() => setFilterRange(rng)}
                className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                  filterRange === rng ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {rng}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={exportCSV}
            disabled={filteredBills.length === 0}
            className="px-4 py-2 bg-indigo-50 border border-indigo-100 hover:bg-slate-900 text-indigo-600 hover:text-white rounded-xl text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {csvExportSuccess ? <Check size={14} className="text-emerald-600 font-bold" /> : <Download size={14} />}
            {csvExportSuccess ? 'Export Done' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Summary indicators row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Gross Sales */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1 tracking-wider">Gross revenue</span>
          <p className="text-sm font-black text-gray-900">{currencySymbol}{stats.grossSales.toLocaleString()}</p>
        </div>

        {/* Total orders */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1 tracking-wider">Checkout invoices</span>
          <p className="text-sm font-black text-gray-900">{stats.orderCount} bills</p>
        </div>

        {/* GST aggregate collected */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1 tracking-wider">Tax aggregate (GST)</span>
          <p className="text-sm font-black text-gray-900">{currencySymbol}{stats.taxCollected.toLocaleString()}</p>
        </div>

        {/* Discounts write-offs sum */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs">
          <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1 tracking-wider">Discounts sum</span>
          <p className="text-sm font-black text-rose-600">-{currencySymbol}{stats.discountsSum.toLocaleString()}</p>
        </div>

        {/* Average invoice ticket */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-2xs col-span-2 lg:col-span-1">
          <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1 tracking-wider">Avg ticket size</span>
          <p className="text-sm font-black text-gray-900">{currencySymbol}{stats.avgOrder.toLocaleString()}</p>
        </div>

      </div>

      {/* Recharts Analytics details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 7-Day sales progression curve */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 lg:col-span-2 shadow-2xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-900">Total revenue & tax schedule progression chart</h3>
            <p className="text-[10px] text-gray-400">Comparing gross checkout totals with tax elements (GST)</p>
          </div>

          <div className="h-64">
            {graphData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs">No invoices matching the dates</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={8} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={8} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#818cf8', fontSize: '10px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="Sales" name="Gross Sales" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="Gst" name="Tax Elements" fill="#10b981" radius={[4, 4, 0, 0]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Categories split Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-900">Category sales breakdown</h3>
            <p className="text-[10px] text-gray-400">Revenue split across divisions</p>
          </div>

          <div className="h-44 relative flex items-center justify-center">
            {pieData.length === 0 ? (
              <p className="text-gray-400 text-[10px]">No sales recorded</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${currencySymbol}${value}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie legends list */}
          <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
            {pieData.map(e => (
              <div key={e.name} className="flex justify-between items-center text-[10px] font-semibold text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.color }} />
                  {e.name}
                </span>
                <span className="font-mono text-gray-900">{currencySymbol}{e.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Top Performing products and historical bills audit table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Top Products column */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs space-y-4 font-medium">
          <div>
            <h3 className="text-xs font-bold text-gray-900">Top Performing Items</h3>
            <p className="text-[10px] text-gray-400">Ranked by volume quantities sold</p>
          </div>

          <div className="space-y-3 shrink-0 max-h-72 overflow-y-auto pr-1">
            {topProducts.length === 0 ? (
              <p className="text-center py-10 text-[10px] text-gray-400">No products sold in this filter</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-xs py-2 bg-gray-50/50 hover:bg-gray-50 rounded-xl px-3 transition border">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">#{i+1}</span>
                    <span className="font-bold text-gray-800 truncate max-w-[120px]">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 font-mono leading-none mb-0.5">{p.qty} units</p>
                    <span className="text-[9px] text-gray-400 block font-mono">Rev: {currencySymbol}{p.total}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detailed historic transaction log list */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 md:col-span-2 shadow-2xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-900">Audit Receipts Master Index</h3>
            <p className="text-[10px] text-gray-400">Total transaction summaries booked offline</p>
          </div>

          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left border-collapse leading-normal text-xs">
              <thead>
                <tr className="bg-gray-50 border-b text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                  <th className="px-3 py-2">Invoice No</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2 text-right">Sum Subtotal</th>
                  <th className="px-3 py-2 text-right font-black">Net Charged</th>
                  <th className="px-3 py-2">Pay Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-450 py-10">Zero invoices generated under this schedule</td>
                  </tr>
                ) : (
                  filteredBills.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-3 py-2 font-mono font-bold text-gray-900">{b.billNo}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-gray-405">{new Date(b.date).toLocaleDateString()}</td>
                      <td className="px-3 py-2 truncate max-w-[100px]">{b.customerName || 'Walk-in'}</td>
                      <td className="px-3 py-2 text-right font-mono text-gray-450">{currencySymbol}{b.subtotal}</td>
                      <td className="px-3 py-2 text-right font-mono font-black text-indigo-700">{currencySymbol}{b.grandTotal}</td>
                      <td className="px-3 py-2 uppercase text-[10px] font-bold text-gray-500">{b.paymentMethod}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
