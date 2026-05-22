/**
 * FlexBill POS Terminal Billing Workspace
 * @license Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Trash2, 
  Minus, 
  Plus, 
  Percent, 
  CreditCard, 
  DollarSign, 
  QrCode, 
  Printer, 
  RotateCcw, 
  X, 
  UserPlus, 
  User, 
  Sparkles,
  ArrowRight,
  Calculator,
  Pill,
  Check,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Keyboard,
  Undo2
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { Product, CartItem, Customer } from '../../types';
import jsPDF from 'jspdf';

export default function POSScreen() {
  const {
    products,
    cart,
    customers,
    selectedCustomer,
    selectedTable,
    cartDiscount,
    storeConfig,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    setCartDiscount,
    setSelectedTable,
    selectCustomer,
    checkoutCart,
    addNotification,
    searchQuery,
    setSearchQuery,
    voidLastTransaction,
    bills,
    darkMode
  } = useAppStore();

  const currencySymbol = storeConfig?.currencySymbol || '₹';
  const storeType = storeConfig?.type || 'grocery';

  // Component UI state
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment' | 'receipt'>('cart');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [upiReference, setUpiReference] = useState<string>('');
  const [activeBill, setActiveBill] = useState<any | null>(null);
  const [showScanFlash, setShowScanFlash] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  
  // Custom Customer Add form modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  // Grocery Weight Scale Slider Modal State
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [customWeight, setCustomWeight] = useState<number>(1.0);

  // Keyboard calculator helper
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState('');

  // 1. Categories compile
  const categories = useMemo(() => {
    const list = new Set<string>();
    list.add('All');
    products.forEach((p) => {
      if (p.category) list.add(p.category);
    });
    return Array.from(list);
  }, [products]);

  // 2. Filter products based on category AND header query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      const matchSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery);
      return matchCat && matchSearch;
    });
  }, [products, activeCategory, searchQuery]);

  // 3. Customer search autocomplete
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    return customers.filter((c) => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  // 4. Cart Totals math
  const totals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;

    cart.forEach((item) => {
      const price = item.customPrice ?? item.product.price;
      const sub = price * item.quantity;
      const rate = item.product.taxRate;
      
      // Calculate tax amount inside inclusive total price
      const itemTax = sub - (sub / (1 + rate / 100));
      subtotal += (sub - itemTax);
      taxTotal += itemTax;
    });

    const grandTotalRaw = subtotal + taxTotal - cartDiscount;
    const grandTotal = Math.max(0, Number(grandTotalRaw.toFixed(2)));

    return {
      subtotal: Number(subtotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      grandTotal
    };
  }, [cart, cartDiscount]);

  // Group taxes by tax rate for detailed CGST / SGST splits
  const taxComponents = useMemo(() => {
    if (!activeBill) return [];
    const groups: { [rate: number]: { taxAmount: number } } = {};
    activeBill.items.forEach((it: any) => {
      const rate = it.taxRate || 0;
      if (rate > 0) {
        if (!groups[rate]) {
          groups[rate] = { taxAmount: 0 };
        }
        groups[rate].taxAmount += it.taxAmount || 0;
      }
    });
    
    return Object.keys(groups).map((rateStr) => {
      const rate = Number(rateStr);
      const totalTax = groups[rate].taxAmount;
      return {
        rate,
        cgstRate: rate / 2,
        sgstRate: rate / 2,
        cgstAmount: Number((totalTax / 2).toFixed(2)),
        sgstAmount: Number((totalTax / 2).toFixed(2)),
        totalTax: Number(totalTax.toFixed(2))
      };
    });
  }, [activeBill]);

  // 5. Add trigger with appropriate modular forms
  const playScanSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 1320; // Crisp high-frequency barcode scanner beep
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime); 
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12); 
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn('Audio context playback block: ', e);
    }
  };

  const triggerScanFlash = () => {
    setShowScanFlash(true);
    playScanSound();
    const timer = setTimeout(() => {
      setShowScanFlash(false);
    }, 250);
    return () => clearTimeout(timer);
  };

  const handleProductSelect = (product: Product) => {
    if (product.stock <= 0 && storeType !== 'restaurant') {
      addNotification('Out of Stock Alert', `Product "${product.name}" is completely out of stock. Purchase is blocked.`, 'error');
      return;
    }
    
    if (product.isSellByWeight) {
      // Trigger weight slider modal!
      setCustomWeight(1.0);
      setWeightModalProduct(product);
    } else {
      triggerScanFlash();
      addToCart(product, 1);
    }
  };

  const confirmWeightAdd = () => {
    if (weightModalProduct) {
      triggerScanFlash();
      addToCart(weightModalProduct, Number(customWeight.toFixed(2)));
      setWeightModalProduct(null);
    }
  };

  // 6. Complete standard checkout
  const handleCheckoutSubmit = async () => {
    const cashVal = paymentMethod === 'cash' ? Number(cashReceived) || totals.grandTotal : undefined;
    const refVal = paymentMethod === 'upi' ? upiReference : undefined;
    
    const bill = await checkoutCart(paymentMethod, cashVal, refVal);
    if (bill) {
      setActiveBill(bill);
      setCheckoutStep('receipt');
      setUpiReference('');
    }
  };

  // Quick cash buttons helper
  const quickCashOptions = [100, 200, 500, 1000, 2000];

  // 7. Generate PDF Thermal Bill via jsPDF
  const downloadReceiptPDF = () => {
    if (!activeBill) return;

    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 150] // thermal print specifications e.g. 80mm
    });

    doc.setFont('SourceCodePro-Regular', 'normal');
    doc.setFontSize(8);

    // Business Header
    doc.text(storeConfig?.name || 'FLEXBILL RETAIL', 40, 10, { align: 'center' });
    doc.setFontSize(6);
    doc.text(storeConfig?.address || 'MG Road, Bangalore', 40, 13, { align: 'center' });
    doc.text(`Phone: ${storeConfig?.phone || '9876543200'}`, 40, 16, { align: 'center' });
    if (storeConfig?.gstin) {
      doc.text(`GSTIN: ${storeConfig.gstin}`, 40, 19, { align: 'center' });
    }
    
    doc.text('------------------------------------------', 40, 23, { align: 'center' });
    doc.text(`Bill No: ${activeBill.billNo}`, 5, 27);
    doc.text(`Date: ${new Date(activeBill.date).toLocaleString()}`, 5, 30);
    doc.text(`Customer: ${activeBill.customerName || 'Walk-in Guest'}`, 5, 33);
    doc.text('------------------------------------------', 40, 37, { align: 'center' });

    // Header Products Table
    doc.text('Item Name            Qty   Price     Total', 5, 41);
    doc.text('------------------------------------------', 40, 44, { align: 'center' });

    let y = 48;
    activeBill.items.forEach((item: any) => {
      const nameShort = item.name.substring(0, 18);
      doc.text(`${nameShort}`, 5, y);
      doc.text(`${item.quantity}`, 40, y, { align: 'right' });
      doc.text(`${currencySymbol}${item.price}`, 55, y, { align: 'right' });
      doc.text(`${currencySymbol}${item.total}`, 75, y, { align: 'right' });
      y += 4;
    });

    doc.text('------------------------------------------', 40, y, { align: 'center' });
    y += 4;
    doc.text(`Subtotal:`, 5, y);
    doc.text(`${currencySymbol}${activeBill.subtotal}`, 75, y, { align: 'right' });
    
    y += 4;
    doc.text(`GST Tax:`, 5, y);
    doc.text(`${currencySymbol}${activeBill.taxTotal}`, 75, y, { align: 'right' });

    if (activeBill.taxTotal > 0) {
      const halfTax = (activeBill.taxTotal / 2).toFixed(2);
      y += 3;
      doc.setFontSize(5.5);
      doc.text(`  (CGST 50% Share):`, 5, y);
      doc.text(`${currencySymbol}${halfTax}`, 75, y, { align: 'right' });
      y += 3;
      doc.text(`  (SGST 50% Share):`, 5, y);
      doc.text(`${currencySymbol}${halfTax}`, 75, y, { align: 'right' });
      doc.setFontSize(6);
    }

    if (activeBill.discountTotal > 0) {
      y += 4;
      doc.text(`Discount:`, 5, y);
      doc.text(`-${currencySymbol}${activeBill.discountTotal}`, 75, y, { align: 'right' });
    }

    y += 4;
    doc.text(`Grand Total:`, 5, y);
    doc.text(`${currencySymbol}${activeBill.grandTotal}`, 75, y, { align: 'right' });

    y += 5;
    doc.text(`Paid via: ${activeBill.paymentMethod.toUpperCase()}`, 5, y);
    if (activeBill.paymentMethod === 'upi' && activeBill.referenceNo) {
      y += 3.5;
      doc.text(`UPI Ref No: ${activeBill.referenceNo}`, 5, y);
    }
    if (activeBill.cashReceived !== undefined) {
      y += 3.5;
      doc.text(`Cash Tendered: ${currencySymbol}${activeBill.cashReceived}`, 5, y);
      y += 3.5;
      doc.text(`Change Given: ${currencySymbol}${activeBill.changeReturned}`, 5, y);
    }

    y += 8;
    doc.text(storeConfig?.invoiceFooter || 'Thank you! Visit again.', 40, y, { align: 'center' });
    
    doc.save(`Invoice_${activeBill.billNo}.pdf`);
  };

  const handleCreateCustomer = () => {
    if (!newCustomerForm.name || !newCustomerForm.phone) return;
    const newC: Customer = {
      id: `C-${Date.now()}`,
      name: newCustomerForm.name,
      phone: newCustomerForm.phone,
      email: newCustomerForm.email,
      loyaltyPoints: 0,
      totalSpent: 0,
      notes: newCustomerForm.notes
    };
    useAppStore.getState().addOrUpdateCustomer(newC);
    selectCustomer(newC);
    setNewCustomerForm({ name: '', phone: '', email: '', notes: '' });
    setShowCustomerModal(false);
  };

  // 8. Global Keyboard Shortcut for PDF Download and other POS actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is actively writing in inputs/selects to avoid firing shortcuts during text input
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'SELECT' || 
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.getAttribute('contenteditable') === 'true'
      );

      // 1. Help shortcuts modal check
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      // 2. Escape to close everything / go back to cart
      if (e.key === 'Escape') {
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
          e.preventDefault();
        } else if (showCustomerModal) {
          setShowCustomerModal(false);
          e.preventDefault();
        } else if (weightModalProduct) {
          setWeightModalProduct(null);
          e.preventDefault();
        } else if (checkoutStep === 'payment') {
          setCheckoutStep('cart');
          e.preventDefault();
        }
        return;
      }

      // 3. Ctrl+P / Cmd+P to download receipt
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        if (checkoutStep === 'receipt' && activeBill) {
          e.preventDefault();
          downloadReceiptPDF();
          return;
        }
      }

      // POS quick shortcuts (disable if user is typing in inputs, except F-keys which are fine)
      if (e.key === 'F2') {
        e.preventDefault();
        const searchInput = document.getElementById('product-search-input');
        if (searchInput) {
          (searchInput as HTMLInputElement).focus();
          (searchInput as HTMLInputElement).select();
        }
      }

      if (e.key === 'F4') {
        e.preventDefault();
        setShowCustomerModal(true);
      }

      if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0 && checkoutStep === 'cart') {
          setCheckoutStep('payment');
        }
      }

      if (e.key === 'F9') {
        e.preventDefault();
        if (checkoutStep === 'payment') {
          handleCheckoutSubmit();
        }
      }

      if (e.key === 'F10') {
        e.preventDefault();
        if (cart.length > 0) {
          if (window.confirm('Clear entire cart invoice items?')) {
            clearCart();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    cart, 
    checkoutStep, 
    showShortcutsModal, 
    showCustomerModal, 
    weightModalProduct, 
    paymentMethod, 
    cashReceived, 
    upiReference, 
    totals, 
    activeBill
  ]);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-50 select-none relative">
      
      {/* LEFT WING: Product search, categories and catalog cards */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 border-r border-slate-200 overflow-hidden">
        
        {/* Categories Bar */}
        <div className="px-6 py-4.5 border-b border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCategory(c)}
                className={`px-4.5 py-2 text-[11px] font-black rounded-xl transition-all cursor-pointer truncate ${
                  activeCategory === c
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-500'
                    : 'bg-slate-100 text-slate-700 border border-slate-200/60 hover:bg-slate-200/80'
                }`}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Quick barcode search box */}
          <div className="hidden sm:flex items-center relative w-48 xl:w-64">
            <Search size={13} className="absolute left-3 text-slate-400" />
            <input
              id="product-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Live filters..."
              className="w-full text-xs pl-8.5 pr-3 py-2 border border-slate-250 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-150/10 placeholder:text-slate-405"
            />
          </div>
        </div>

        {/* Dynamic Store Headers */}
        {storeType === 'restaurant' && (
          <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100/80 flex items-center gap-3 shrink-0">
            <span className="text-[10px] uppercase font-black text-indigo-700 tracking-wider">RESTAURANT ASSIGNMENT</span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Takeaway'].map((tbl) => (
                <button
                  key={tbl}
                  type="button"
                  onClick={() => setSelectedTable(tbl)}
                  className={`px-3 py-1.5 text-[9px] font-bold rounded-lg transition-all border ${
                    selectedTable === tbl 
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/10' 
                      : 'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-100'
                  }`}
                >
                  {tbl}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product Cards Catalog Scrolling Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 lg:pb-6">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
                <Search size={20} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No products matching catalogue</h3>
              <p className="text-[10px] text-slate-400 max-w-sm mt-1 leading-relaxed">
                Add products from the Product Manager or adjust category tags to start checkout.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((p) => {
                const isLow = p.stock <= p.minStock && storeType !== 'restaurant';
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleProductSelect(p)}
                    className="flex flex-col text-left p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-lg transition-all group select-none relative cursor-pointer"
                  >
                    {/* Corner low stock alarms */}
                    {isLow && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-md text-[8px] tracking-wider uppercase border border-rose-200">
                        Low Stock
                      </span>
                    )}

                    {/* Sector specific visuals */}
                    <div className="text-[9px] text-slate-400 font-bold font-mono flex items-center justify-between mb-2">
                      <span className="bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded-md text-[8px] text-slate-600 font-extrabold">{p.category.toUpperCase()}</span>
                      <span>{p.sku}</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2 grow mb-4">
                      {p.name}
                    </h4>

                    {/* Sector Specific Properties Display */}
                    <div className="mb-3.5 space-y-1">
                      {storeType === 'pharmacy' && p.expiryDate && (
                        <div className="flex items-center gap-1 text-[9px] text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2 rounded-lg py-0.5 w-max">
                          <Pill size={10} />
                          <span>Exp: {p.expiryDate}</span>
                        </div>
                      )}
                      
                      {storeType === 'restaurant' && (
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg inline-block border ${p.isVeg ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                          {p.isVeg ? 'VEGETARIAN' : 'NON-VEG'}
                        </span>
                      )}

                      {storeType === 'clothing' && (p.size || p.color) && (
                        <span className="text-[9px] bg-slate-100 text-slate-700 font-extrabold px-2 py-0.5 rounded-lg border border-slate-250">
                          {p.size} • {p.color}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        {storeType !== 'restaurant' && (
                          <p className="text-[10px] text-slate-400 font-mono font-bold">Stock: {p.stock} {p.unit}</p>
                        )}
                        <p className="text-xs font-black text-slate-950 mt-1">
                          {currencySymbol}{p.price}
                          {p.isSellByWeight && <span className="text-[9px] font-semibold text-slate-550 font-mono">/kg</span>}
                        </p>
                      </div>

                      <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-150 text-indigo-600 flex items-center justify-center font-black text-sm select-none group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        +
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* RIGHT WING: Billing Cart and calculations */}
      <div className="w-full lg:w-96 xl:w-[420px] bg-white border-t lg:border-t-0 border-slate-200 flex flex-col h-full overflow-hidden shrink-0 z-10 shadow-sm">
        
        {/* Customer select widget */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center justify-between gap-2">
            
            {/* Active customer info */}
            {selectedCustomer ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-150 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                  {selectedCustomer.name.substring(0,1).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-none mb-1">{selectedCustomer.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold font-mono">{selectedCustomer.phone} • Points: {selectedCustomer.loyaltyPoints}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 select-none">
                <User size={15} />
                <span className="text-xs font-bold text-slate-500">Walk-in Guest Checkout</span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              {/* Reset customer */}
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={() => selectCustomer(null)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg shrink-0 transition"
                  title="Deselect customer"
                >
                  <X size={14} />
                </button>
              )}

              {/* Search customer button */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Find Customer..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="text-xs border border-slate-250 bg-white px-2.5 py-1.5 rounded-xl focus:outline-none focus:border-indigo-500 w-28 placeholder:text-slate-400 font-bold"
                />

                {/* Dropdown search autocomplete results */}
                {customerSearch && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setCustomerSearch('')} />
                    <div className="absolute right-0 top-9 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto shrink-0">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-3 text-[10px] text-slate-400 text-center font-bold">No customers found</div>
                      ) : (
                        filteredCustomers.map((cust) => (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => {
                              selectCustomer(cust);
                              setCustomerSearch('');
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 text-[11px] font-bold text-slate-800 border-b border-slate-100 last:border-0 block transition-colors"
                          >
                            {cust.name} <span className="text-slate-555 font-mono">({cust.phone})</span>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Plus trigger to mock add client fast */}
              <button
                type="button"
                onClick={() => setShowCustomerModal(true)}
                className="p-1.5 bg-indigo-50 border border-indigo-100/80 text-indigo-600 hover:bg-indigo-100 rounded-xl transition shrink-0 cursor-pointer"
                title="Add Customer"
              >
                <UserPlus size={14} />
              </button>
            </div>

          </div>
        </div>

        {/* Cart Item Scrolling list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-slate-100 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="w-12 h-12 bg-slate-50 border border-slate-200 text-slate-400 rounded-xl flex items-center justify-center mb-3"><Calculator size={18} /></div>
              <p className="text-xs font-bold text-slate-600">Cart is empty</p>
              <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-relaxed font-semibold">Touch any catalog product card on the left panel to register items into cart.</p>
            </div>
          ) : (
            cart.map((item) => {
              const itemPrice = item.customPrice ?? item.product.price;
              const subtotal = itemPrice * item.quantity;
              return (
                <div key={item.product.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="grow">
                    <h5 className="text-xs font-black text-slate-800 leading-snug mb-0.5">{item.product.name}</h5>
                    <p className="text-[10px] text-indigo-700 font-mono font-bold">
                      {currencySymbol}{itemPrice} x {item.quantity} {item.product.unit}
                    </p>
                  </div>
                  
                  {/* Cart Action Buttons */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shrink-0 shadow-xs bg-slate-50">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                        className="px-2.5 py-1 hover:bg-slate-100 text-slate-600 transition font-bold"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="px-2 text-[11px] font-black text-slate-800 bg-white font-mono min-w-[24px] text-center border-x border-slate-150 py-1">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                        className="px-2.5 py-1 hover:bg-slate-100 text-slate-600 transition font-bold"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-150 transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Computations widget */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 shrink-0 space-y-3 font-medium">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            <span>Subtotal (Excl Tax):</span>
            <span className="font-mono text-slate-900 font-black">{currencySymbol}{totals.subtotal.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            <span>GST Combined Tax Total:</span>
            <span className="font-mono text-slate-900 font-black">{currencySymbol}{totals.taxTotal.toLocaleString()}</span>
          </div>

          {/* Discount override drawer trigger */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            <span>Custom Bill Discount:</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={cartDiscount}
                onChange={(e) => setCartDiscount(Math.max(0, Number(e.target.value)))}
                placeholder="₹ Amount"
                className="w-20 text-center text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-black focus:ring-4 focus:ring-indigo-150/10 font-mono"
              />
              <span className="font-mono text-rose-600 font-extrabold">-{currencySymbol}{cartDiscount}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-250/60 pt-3 text-sm">
            <span className="font-black text-slate-900 text-xs uppercase tracking-widest">GRAND CHARGE TOTAL:</span>
            <span className="font-black text-lg text-indigo-600 font-mono">{currencySymbol}{totals.grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Void Last Transaction / Undo bar */}
        {bills.length > 0 && cart.length === 0 && (
          <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border-t border-rose-100 dark:border-rose-900/40 px-4 flex items-center justify-between transition-colors">
            <div className="flex items-center gap-1.5 min-w-0">
              <Undo2 size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate leading-none">
                Last Invoice: #{bills[0].billNo} ({currencySymbol}{bills[0].grandTotal})
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (window.confirm(`Are you absolutely sure you want to VOID and delete the last transaction (Invoice #${bills[0].billNo})? This will return all ${bills[0].items.length} items to stock.`)) {
                  const success = await voidLastTransaction();
                  if (success) {
                    addNotification('Transaction Reverted', `Last transaction #${bills[0]?.billNo || ''} was successfully voided from local databases.`, 'error');
                  }
                }
              }}
              className="text-[10px] bg-rose-100 dark:bg-rose-950 dark:text-rose-350 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 font-black uppercase transition-all cursor-pointer leading-none"
            >
              Void Bill
            </button>
          </div>
        )}

        {/* Bottom checkout buttons */}
        <div className="p-4.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-2 gap-3 shrink-0">
          <button
            type="button"
            onClick={clearCart}
            disabled={cart.length === 0}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            <RotateCcw size={14} />
            Empty Cart
          </button>

          <button
            type="button"
            onClick={() => {
              if (cart.length > 0) {
                setCheckoutStep('payment');
                setCashReceived('');
              }
            }}
            disabled={cart.length === 0}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black tracking-wider uppercase shadow-md shadow-indigo-600/15 border border-indigo-500 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            Checkout Screen
            <ArrowRight size={14} />
          </button>
        </div>

      </div>

      {/* MODAL 1: Checkout & payment settings modal window */}
      <AnimatePresence>
        {checkoutStep === 'payment' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs select-none"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 space-y-5 flex flex-col justify-between"
            >
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Final Payment Dispatch</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="p-1 pb-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-indigo-50/50 border border-indigo-100/30 rounded-2xl flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-705 uppercase tracking-wide">Amount to Collection:</span>
                  <span className="text-xl font-black text-indigo-600 font-mono">{currencySymbol}{totals.grandTotal}</span>
                </div>

                {/* Payment Methods */}
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Payment Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-3.5 border rounded-2xl flex flex-col items-center justify-center text-center font-black text-[10px] uppercase tracking-wider cursor-pointer transition-all ${
                        paymentMethod === 'cash' 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs shadow-indigo-600/5' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <DollarSign size={16} className="mb-1.5" />
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3.5 border rounded-2xl flex flex-col items-center justify-center text-center font-black text-[10px] uppercase tracking-wider cursor-pointer transition-all ${
                        paymentMethod === 'card' 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs shadow-indigo-600/5' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <CreditCard size={16} className="mb-1.5" />
                      Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3.5 border rounded-2xl flex flex-col items-center justify-center text-center font-black text-[10px] uppercase tracking-wider cursor-pointer transition-all ${
                        paymentMethod === 'upi' 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs shadow-indigo-600/5' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <QrCode size={16} className="mb-1.5" />
                      UPI / QR
                    </button>
                  </div>
                </div>

                {/* Cash received calculator fields if PaymentMode === cash */}
                {paymentMethod === 'cash' && (
                  <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Cash Handed Over</label>
                      <input
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder={`${totals.grandTotal}`}
                        className="w-full text-center text-lg font-black font-mono border border-slate-250 rounded-2xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 text-slate-950 focus:ring-4 focus:ring-indigo-150/10 transition-all font-mono"
                      />
                    </div>

                    {/* Calculator quick additions */}
                    <div className="grid grid-cols-5 gap-1.5">
                      {quickCashOptions.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setCashReceived(String(v))}
                          className="p-1 px-1.5 bg-slate-100 hover:bg-slate-205 hover:text-slate-900 border border-slate-200 rounded-lg text-[9px] font-mono text-slate-700 font-extrabold cursor-pointer transition-colors"
                        >
                          +{v}
                        </button>
                      ))}
                    </div>

                    {/* Change calculations */}
                    {Number(cashReceived) >= totals.grandTotal && (
                      <div className="p-4 border border-emerald-100 bg-emerald-50/60 rounded-2xl flex justify-between items-center text-xs animate-in fade-in transition-all">
                        <span className="font-bold text-slate-700">Return Cash Change:</span>
                        <span className="font-black text-emerald-700 font-mono text-base">{currencySymbol}{(Number(cashReceived) - totals.grandTotal).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Mock QR overlay for UPI payouts */}
                {paymentMethod === 'upi' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-5 border border-indigo-100 bg-indigo-50/20 rounded-2xl flex flex-col items-center justify-center space-y-3 pt-6 text-center">
                      <QrCode size={110} className="text-slate-900" />
                      <p className="text-[10px] text-slate-400 font-bold">BHIM Dynamic UPI Charge: Scan QR payload of {currencySymbol}{totals.grandTotal}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">UPI Reference / Merchant Payment ID</label>
                      <input
                        type="text"
                        value={upiReference}
                        onChange={(e) => setUpiReference(e.target.value)}
                        placeholder="e.g. UPI827392849204"
                        className="w-full text-center text-xs font-black font-mono border border-slate-250 rounded-2xl p-3 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500 text-slate-950 focus:ring-4 focus:ring-indigo-150/10 transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('cart')}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Back To Cart
                </button>

                <button
                  type="submit"
                  onClick={handleCheckoutSubmit}
                  disabled={paymentMethod === 'cash' && cashReceived !== '' && Number(cashReceived) < totals.grandTotal}
                  className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl disabled:opacity-50 text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
                >
                  <Check size={14} />
                  Generate Bill
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Epson 58mm Thermal paper receipt visual mock */}
      {checkoutStep === 'receipt' && activeBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs select-none overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-sm border border-gray-100 p-6 shadow-2xl space-y-5 select-none relative max-h-[90vh] flex flex-col justify-between">
            
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                <CheckCircle2 size={14} />
                Transaction Authenticated
              </span>
              
              <button
                type="button"
                onClick={() => {
                  setCheckoutStep('cart');
                  setActiveBill(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable visual paper receipt container */}
            <div className="flex-1 overflow-y-auto bg-gray-100/50 border rounded-2xl p-4 flex flex-col items-center">
              
              {/* Paper Roll Mock layout */}
              <div className="w-[300px] shrink-0 bg-white border border-gray-200 p-6 font-mono text-gray-800 text-[10px] space-y-4 shadow-sm relative leading-relaxed select-text">
                
                {/* Jagged borders mockup at top */}
                <div className="absolute top-0 inset-x-0 h-1 bg-repeat-x flex opacity-25" style={{ backgroundImage: 'linear-gradient(45deg, #bbb 25%, transparent 25%, transparent 75%, #bbb 75%, #bbb), linear-gradient(45deg, #bbb 25%, #fff 25%, #fff 75%, #bbb 75%, #bbb)', backgroundSize: '6px 6px', backgroundPosition: '0 0, 3px 0' }} />

                <div className="text-center space-y-1">
                  {storeConfig?.logoUrl && (
                    <div className="flex justify-center pb-2">
                      <img 
                        src={storeConfig.logoUrl} 
                        alt="Store Logo" 
                        referrerPolicy="no-referrer"
                        className="max-h-12 max-w-[120px] object-contain rounded"
                      />
                    </div>
                  )}
                  <h4 className="text-xs font-black uppercase tracking-tight text-gray-950">{storeConfig?.name || 'FLEXBILL INC'}</h4>
                  <p className="text-[8px] text-gray-500">{storeConfig?.address || 'Metro Plaza, MG Road Bangalore'}</p>
                  <p className="text-[8px] text-gray-500">PH: {storeConfig?.phone || '930219321'}</p>
                  {storeConfig?.gstin && <p className="text-[8px] text-gray-500">GSTIN: {storeConfig.gstin}</p>}
                </div>

                <p className="border-t border-dashed border-gray-300 pt-3">
                  Bill No: {activeBill.billNo}<br />
                  Time: {new Date(activeBill.date).toLocaleDateString()} {new Date(activeBill.date).toLocaleTimeString()}<br />
                  Guest: {activeBill.customerName || 'Walk-in Customer'}<br />
                  Operator: Cashier Desk A
                </p>

                <div className="border-t border-dashed border-gray-300 pt-3">
                  <div className="grid grid-cols-12 gap-1 font-black pb-1.5 border-b border-gray-200">
                    <span className="col-span-6">Item Description</span>
                    <span className="col-span-2 text-right">Qty</span>
                    <span className="col-span-4 text-right">Total</span>
                  </div>
                  
                  <div className="pt-2 space-y-2">
                    {activeBill.items.map((it: any) => (
                      <div key={it.productId} className="grid grid-cols-12 gap-1 font-medium text-gray-900 leading-normal">
                        <span className="col-span-6 truncate">{it.name}</span>
                        <span className="col-span-2 text-right">{it.quantity}</span>
                        <span className="col-span-4 text-right font-black">{currencySymbol}{it.total}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-300 pt-3 space-y-1 text-right">
                  <div className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded">
                    <span>Tax Inclusive Sub:</span>
                    <span className="font-mono text-gray-900">{currencySymbol}{activeBill.subtotal}</span>
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span>Combined GST Tax:</span>
                    <span className="font-mono text-gray-900">{currencySymbol}{activeBill.taxTotal}</span>
                  </div>
                  {activeBill.taxTotal > 0 && taxComponents.length > 0 && (
                    <div className="mx-2 my-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[9px] text-slate-705 text-right font-medium animate-in fade-in transition-all">
                      <div className="grid grid-cols-4 text-[8px] font-bold text-slate-400 border-b border-dashed border-slate-200 pb-1">
                        <span className="text-left">GST %</span>
                        <span>CGST (50%)</span>
                        <span>SGST (50%)</span>
                        <span className="text-slate-500">TAX AMT</span>
                      </div>
                      <div className="pt-1 space-y-0.5">
                        {taxComponents.map((c) => (
                          <div key={c.rate} className="grid grid-cols-4 font-mono">
                            <span className="text-left font-bold text-slate-500">{c.rate}%</span>
                            <span>{currencySymbol}{c.cgstAmount}</span>
                            <span>{currencySymbol}{c.sgstAmount}</span>
                            <span className="font-bold text-slate-800">{currencySymbol}{c.totalTax}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeBill.discountTotal > 0 && (
                    <div className="flex justify-between items-center px-2 font-bold text-red-700">
                      <span>Deducted Discount:</span>
                      <span className="font-mono">-{currencySymbol}{activeBill.discountTotal}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center px-2 text-xs font-black uppercase text-gray-950">
                    <span>Grand Charge:</span>
                    <span className="font-mono">{currencySymbol}{activeBill.grandTotal}</span>
                  </div>
                </div>

                <p className="border-t border-dashed border-gray-300 pt-3 text-[9px]">
                  Payment Method: <span className="uppercase font-bold text-gray-950">{activeBill.paymentMethod}</span><br />
                  {activeBill.paymentMethod === 'upi' && activeBill.referenceNo && (
                    <>
                      UPI Ref No: <span className="font-mono font-bold text-gray-950">{activeBill.referenceNo}</span><br />
                    </>
                  )}
                  {activeBill.cashReceived !== undefined && (
                    <>
                      Cash Tendered: {currencySymbol}{activeBill.cashReceived}<br />
                      Balance Change: {currencySymbol}{activeBill.changeReturned}
                    </>
                  )}
                </p>

                <div className="border-t border-dashed border-gray-300 pt-4 text-center space-y-2">
                  <p className="text-[9px] uppercase font-bold text-gray-950 italic">
                    {storeConfig?.invoiceFooter || 'Thank You! Visit Again.'}
                  </p>
                  
                  {/* barcode mock */}
                  <div className="font-mono text-gray-400 text-[9px] tracking-tight leading-none overflow-hidden select-none select-text py-1 border-t border-b border-gray-50">
                    |||||||||||||||||||||||||||||||||||||||<br />
                    FLX-{activeBill.id.substring(2,10)}
                  </div>
                </div>

                {/* Jagged borders mockup at bottom */}
                <div className="absolute -bottom-1.5 inset-x-0 h-1.5 bg-repeat-x flex opacity-25" style={{ backgroundImage: 'linear-gradient(45deg, transparent 75%, #bbb 75%), linear-gradient(135deg, transparent 75%, #bbb 75%)', backgroundSize: '6px 6px' }} />

              </div>

            </div>

             {/* Print trigger CTA row */}
            <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={downloadReceiptPDF}
                className="w-[30%] py-2.5 border border-indigo-100 hover:bg-indigo-50 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-wide transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer size={12} />
                PDF
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (window.confirm("Are you absolutely sure you want to VOID and delete this transaction immediately? This will return the items to stock and delete this bill.")) {
                    const success = await voidLastTransaction();
                    if (success) {
                      addNotification('Transaction Voided', `Invoice #${activeBill.billNo} was successfully voided.`, 'error');
                      setCheckoutStep('cart');
                      setActiveBill(null);
                    }
                  }
                }}
                className="w-[30%] py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-150 dark:border-rose-900/60 rounded-xl text-[10px] font-black uppercase tracking-wide transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <X size={12} />
                Void
              </button>

              <button
                type="button"
                onClick={() => {
                  setCheckoutStep('cart');
                  setActiveBill(null);
                }}
                className="w-[40%] py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wide transition flex items-center justify-center gap-1 cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: New Customer Creator Modal Dialog */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 border border-gray-100 space-y-4">
            
            <div className="flex items-center justify-between border-b pb-3.5">
              <span className="text-xs font-bold text-gray-900">Add Customer Account</span>
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Customer Full Name*</label>
                <input
                  type="text"
                  required
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Mobile Contact No*</label>
                <input
                  type="text"
                  required
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  placeholder="e.g. 9876543201"
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Email ID</label>
                <input
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                  placeholder="e.g. client@yahoo.com"
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Notes</label>
                <input
                  type="text"
                  value={newCustomerForm.notes}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, notes: e.target.value })}
                  placeholder="Regular client, outstanding balances etc."
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-4">
              <button
                type="button"
                onClick={() => setShowCustomerModal(false)}
                className="w-1/2 py-2 border rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Discard
              </button>

              <button
                type="button"
                onClick={handleCreateCustomer}
                className="w-1/2 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer"
              >
                Save Member
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: Weigh Scale Calculator Modal (Dynamic sector: Grocery) */}
      {weightModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 border border-gray-100 space-y-5">
            
            <div className="flex items-center justify-between border-b pb-3.5">
              <div className="flex items-center gap-1.5">
                <Smartphone size={16} className="text-emerald-600" />
                <h3 className="text-xs font-bold text-gray-800">Dynamic Weigh-Scale Emulator</h3>
              </div>
              <button
                type="button"
                onClick={() => setWeightModalProduct(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-center space-y-3.5">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Scale item</span>
                <h4 className="text-sm font-black text-gray-900 leading-none">{weightModalProduct.name}</h4>
                <p className="text-[10px] text-gray-500 mt-1">Rate: {currencySymbol}{weightModalProduct.price} / kg</p>
              </div>

              {/* Mock dynamic weight readouts */}
              <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl shadow-inner font-mono relative overflow-hidden">
                <span className="absolute left-3 top-3.5 text-[8px] text-indigo-400 font-bold uppercase tracking-widest">Scale active</span>
                
                <p className="text-4xl font-extrabold text-indigo-400 leading-none mb-1 text-center">
                  {customWeight.toFixed(3)} <span className="text-sm font-medium text-white">kg</span>
                </p>
                <p className="text-[11px] text-slate-300 font-bold">Total price: {currencySymbol}{(weightModalProduct.price * customWeight).toFixed(2)}</p>
              </div>

              {/* Sliders mock */}
              <div className="space-y-1.5 font-bold">
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.05"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(Number(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>100g</span>
                  <span>2.5kg</span>
                  <span>5.0kg</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setWeightModalProduct(null)}
                className="w-1/2 py-2 border rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmWeightAdd}
                className="w-1/2 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer"
              >
                Add To Cart
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. VISUAL SCAN CONFIRMATION OVERLAY */}
      <AnimatePresence>
        {showScanFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 border-[10px] border-emerald-500 bg-emerald-500/5 pointer-events-none z-50"
          />
        )}
      </AnimatePresence>

      {/* 6. KEYBOARD SHORTCUTS INSTRUCTIONS MODAL HELP PANEL */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-slate-100 shadow-2xl flex flex-col p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-150 mb-4">
              <div className="flex items-center gap-2">
                <Keyboard className="text-indigo-600 stroke-[2px]" size={18} />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">Checkout Shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4 leading-normal">
              Accelerate your workflow with physical keyboard controls. Tap keys directly at any step.
            </p>

            <div className="space-y-3.5 mb-5 select-none font-bold">
              <div className="flex items-center justify-between text-xs text-slate-700">
                <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-405">Shortcut Action</span>
                <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-405">Key Bind</span>
              </div>
              <div className="h-px bg-slate-100" />

              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px] font-bold">Focus Product Lookup search</span>
                <kbd className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-extrabold text-slate-800 shadow-xs">F2</kbd>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px] font-bold">Fast Create / Search Customer</span>
                <kbd className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-extrabold text-slate-800 shadow-xs">F4</kbd>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px] font-bold">Initiate Checkout (Open Payment Modal)</span>
                <kbd className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-extrabold text-slate-800 shadow-xs">F8</kbd>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px] font-bold">Finalize Payment & Print Receipt</span>
                <kbd className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-extrabold text-slate-800 shadow-xs">F9</kbd>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px] font-bold">Empty Cart items state</span>
                <kbd className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-extrabold text-slate-800 shadow-xs">F10</kbd>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px] font-bold">Download Thermal PDF Receipt</span>
                <kbd className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-extrabold text-slate-800 shadow-xs">Ctrl + P</kbd>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px] font-bold">Dismiss popup drawer / Cancel step</span>
                <kbd className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-extrabold text-slate-800 shadow-xs">ESC</kbd>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px] font-bold">Trigger Keyboard reference guide</span>
                <kbd className="font-mono bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded text-[10px] font-extrabold text-slate-800 shadow-xs">?</kbd>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider text-center cursor-pointer hover:bg-slate-800 transition-all self-center shadow-md shadow-slate-900/10"
            >
              Continue Terminal Billing
            </button>
          </div>
        </div>
      )}

      {/* FLOAT ACTION BUTTON (Floating '?' guide trigger) */}
      <button
        type="button"
        title="Keyboard Shortcuts Reference Guide (?)"
        onClick={() => setShowShortcutsModal(true)}
        className="absolute bottom-6 right-6 z-40 bg-slate-900 hover:bg-indigo-600 text-white border border-slate-800 h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 shadow-xl hover:shadow-indigo-600/20"
      >
        <HelpCircle size={20} className="stroke-[2.5px]" />
      </button>

    </div>
  );
}
