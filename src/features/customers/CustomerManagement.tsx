/**
 * FlexBill Customer Loyalty & CRM Ledger
 * @license Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Award, 
  Trash2, 
  Edit3, 
  ShoppingBag,
  Clock,
  UserPlus2,
  X,
  Check
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { Customer } from '../../types';

export default function CustomerManagement() {
  const { customers, bills, storeConfig, addOrUpdateCustomer, removeCustomer } = useAppStore();
  const currencySymbol = storeConfig?.currencySymbol || '₹';

  const [search, setSearch] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // Tab/Panel selector to inspect single customer transaction history log
  const [selectedInspectCustPhone, setSelectedInspectCustPhone] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.phone.includes(search)
    );
  }, [customers, search]);

  const openAdd = () => {
    setEditingCustomer(null);
    setForm({ name: '', phone: '', email: '', notes: '' });
    setShowEditor(true);
  };

  const openInspect = (phone: string) => {
    setSelectedInspectCustPhone(phone);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      notes: c.notes || ''
    });
    setShowEditor(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingCustomer ? editingCustomer.id : `C-${Date.now()}`;
    const custObj: Customer = {
      id,
      name: form.name,
      phone: form.phone,
      email: form.email,
      loyaltyPoints: editingCustomer ? editingCustomer.loyaltyPoints : 0,
      totalSpent: editingCustomer ? editingCustomer.totalSpent : 0,
      lastVisit: editingCustomer ? editingCustomer.lastVisit : new Date().toISOString().split('T')[0],
      notes: form.notes
    };
    await addOrUpdateCustomer(custObj);
    setShowEditor(false);
  };

  // Inspect customer receipts
  const activeInspectCustHistory = useMemo(() => {
    if (!selectedInspectCustPhone) return [];
    return bills.filter(b => b.customerPhone === selectedInspectCustPhone);
  }, [bills, selectedInspectCustPhone]);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto select-none">
      
      {/* Search and control Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight leading-none mb-1">Customer loyalty directory</h2>
          <p className="text-[10px] text-gray-500">Track regular buyers, loyalty thresholds, contact sheets, and histories.</p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="shrink-0 px-4 py-2.5 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} />
          Register Member
        </button>
      </div>

      {/* Main filter directory panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Directory List Table left side */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs flex items-center justify-between gap-4">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-4 py-1.5 border border-gray-150 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-3xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse leading-normal">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    <th className="px-5 py-3">Member details</th>
                    <th className="px-5 py-3">Contact info</th>
                    <th className="px-5 py-3 text-right">Collected points</th>
                    <th className="px-5 py-3 text-right">Aggregate buyouts</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-gray-400">No member profiles found matching criteria</td>
                    </tr>
                  ) : (
                    filteredCustomers.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="px-5 py-3.5">
                          <h4 className="font-bold text-gray-900">{c.name}</h4>
                          {c.notes && <p className="text-[9px] text-gray-450 italic mt-0.5 mt-1">{c.notes}</p>}
                        </td>

                        <td className="px-5 py-3.5 space-y-1 text-[10px] text-gray-500 font-mono">
                          <div className="flex items-center gap-1.5"><Phone size={11} className="text-gray-400" /> {c.phone}</div>
                          {c.email && <div className="flex items-center gap-1.5"><Mail size={11} className="text-gray-400" /> {c.email}</div>}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-amber-700 font-bold font-mono rounded-full border border-yellow-100 text-[10px]">
                            <Award size={11} />
                            {c.loyaltyPoints}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right text-gray-900 font-black">
                          {currencySymbol}{c.totalSpent.toLocaleString()}
                        </td>

                        <td className="px-5 py-3.5 text-right space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openInspect(c.phone)}
                            className="p-1 px-2.5 bg-gray-100 hover:bg-slate-900 hover:text-white rounded-lg transition-colors font-bold text-[10px]"
                            title="Receipts Ledger"
                          >
                            Logs
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors inline-block"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`Remove "${c.name}" membership profile?`)) {
                                await removeCustomer(c.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors inline-block"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Transaction Inspectors panel right side */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5ClassName">
              <ShoppingBag size={14} className="text-indigo-600" />
              Member checkout histories
            </h3>
            <p className="text-[10px] text-gray-400">Select an operator line on left profile chart to audit receipts.</p>
          </div>

          {!selectedInspectCustPhone ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
              <div className="p-2.5 bg-gray-50 rounded-full mb-1"><Clock size={16} /></div>
              <p className="text-[10px]">No inspecting client selected</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[480px] overflow-y-auto">
              <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between border">
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Inspecting contact</h4>
                  <p className="text-[9px] font-mono text-gray-400 mt-0.5">{selectedInspectCustPhone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInspectCustPhone(null)}
                  className="p-1 bg-white hover:bg-gray-200 rounded text-gray-500"
                >
                  Clear
                </button>
              </div>

              {activeInspectCustHistory.length === 0 ? (
                <p className="text-center py-10 text-[10px] text-gray-400">Zero historic local invoices found for member</p>
              ) : (
                activeInspectCustHistory.map(b => (
                  <div key={b.id} className="p-3.5 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition-colors space-y-3 font-medium">
                    <div className="flex justify-between items-start text-[10px]">
                      <div>
                        <p className="font-bold text-gray-900 font-mono">{b.billNo}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">{new Date(b.date).toLocaleDateString()}</p>
                      </div>
                      <span className="font-black text-indigo-600">{currencySymbol}{b.grandTotal}</span>
                    </div>

                    <div className="space-y-1.5 text-[9px] text-gray-500">
                      {b.items.map((it: any) => (
                        <div key={it.productId} className="flex justify-between">
                          <span>{it.name} x {it.quantity}</span>
                          <span>{currencySymbol}{it.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>

      {/* Editor Modal Overlay */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-gray-100 shadow-xl overflow-hidden flex flex-col justify-between">
            <div className="px-5 py-4 border-b border-gray-55 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-900">
                {editingCustomer ? 'Update CRM Membership Account' : 'Register New CRM Member'}
              </h3>
              <button
                type="button"
                onClick={() => setShowEditor(false)}
                className="text-gray-400 hover:text-gray-65"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Customer Name*</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Priyanjali Sen"
                    className="w-full text-xs px-3 py-2 border border-gray-200 focus:outline-none focus:border-indigo-500 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Mobile Contact No*</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 981273645"
                    className="w-full text-xs px-3 py-2 border border-gray-200 focus:outline-none rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Corporate Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. sen@google.com"
                    className="w-full text-xs px-3 py-2 border border-gray-200 focus:outline-none rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Internal Notes</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Outstanding dues, wholesale member..."
                    className="w-full text-xs px-3 py-2 border border-gray-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="w-1/2 py-2 border rounded-xl font-semibold hover:bg-gray-50 text-xs text-gray-500"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
