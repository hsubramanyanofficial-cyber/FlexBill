/**
 * FlexBill Product Catalog Manager
 * @license Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Tag, 
  Layers, 
  SlidersHorizontal,
  X,
  Check,
  AlertCircle,
  Download
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { Product } from '../../types';

export default function ProductManagement() {
  const { products, storeConfig, addOrUpdateProduct, removeProduct, darkMode, autoOpenAddProductModal, setAutoOpenAddProductModal } = useAppStore();
  const currencySymbol = storeConfig?.currencySymbol || '₹';
  const storeType = storeConfig?.type || 'grocery';

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Field States
  const [formFields, setFormFields] = useState({
    name: '',
    category: 'Staples',
    price: 100,
    costPrice: 80,
    stock: 50,
    minStock: 10,
    unit: 'pcs',
    taxRate: 18,
    // sectors specific
    expiryDate: '',
    batchNumber: '',
    size: 'M',
    color: 'Red',
    isVeg: true,
    isSellByWeight: false
  });

  const categories = useMemo(() => {
    const list = new Set<string>();
    list.add('All');
    products.forEach(p => { if (p.category) list.add(p.category); });
    return Array.from(list);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCat === 'All' || p.category === selectedCat;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchLowStock = !showLowStockOnly || (p.stock <= p.minStock && storeType !== 'restaurant');
      return matchCat && matchSearch && matchLowStock;
    });
  }, [products, selectedCat, search, showLowStockOnly, storeType]);

  const exportToCSV = () => {
    const headers = ['Name', 'SKU', 'Barcode', 'Category', 'Price', 'Cost Price', 'Stock', 'Unit', 'Tax Rate (%)'];
    const rows = products.map(p => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku}"`,
      `"${p.barcode}"`,
      `"${p.category || ''}"`,
      p.price,
      p.costPrice,
      p.stock,
      `"${p.unit}"`,
      p.taxRate
    ]);
    
    // Use proper BOM to ensure Excel opens as UTF-8
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.getAnimations(); // avoid any missing reference warning by standard call
    link.setAttribute("href", url);
    link.setAttribute("download", `product_catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openAddEditor = () => {
    setEditingProduct(null);
    setFormFields({
      name: '',
      category: categories[1] || 'Retail',
      price: 120,
      costPrice: 90,
      stock: 100,
      minStock: 10,
      unit: 'pcs',
      taxRate: storeConfig?.defaultTaxRate || 18,
      expiryDate: '',
      batchNumber: '',
      size: '',
      color: '',
      isVeg: true,
      isSellByWeight: false
    });
    setIsEditorOpen(true);
  };

  useEffect(() => {
    if (autoOpenAddProductModal) {
      openAddEditor();
      setAutoOpenAddProductModal(false);
    }
  }, [autoOpenAddProductModal]);

  const openEditEditor = (product: Product) => {
    setEditingProduct(product);
    setFormFields({
      name: product.name,
      category: product.category,
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      minStock: product.minStock,
      unit: product.unit,
      taxRate: product.taxRate,
      expiryDate: product.expiryDate || '',
      batchNumber: product.batchNumber || '',
      size: product.size || '',
      color: product.color || '',
      isVeg: product.isVeg ?? true,
      isSellByWeight: product.isSellByWeight ?? false
    });
    setIsEditorOpen(true);
  };

  const handleEditorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = editingProduct ? editingProduct.id : `P-${Date.now()}`;
    const cleanSKU = editingProduct ? editingProduct.sku : `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
    const cleanBarcode = editingProduct ? editingProduct.barcode : `${Math.floor(8901050000000 + Math.random() * 99999999)}`;

    const productObj: Product = {
      id: cleanId,
      sku: cleanSKU,
      barcode: cleanBarcode,
      name: formFields.name,
      category: formFields.category,
      price: Number(formFields.price),
      costPrice: Number(formFields.costPrice),
      stock: Number(formFields.stock),
      minStock: Number(formFields.minStock),
      unit: formFields.unit,
      taxRate: Number(formFields.taxRate),
      
      // sector conditional payloads
      expiryDate: storeType === 'pharmacy' ? formFields.expiryDate : undefined,
      batchNumber: storeType === 'pharmacy' ? formFields.batchNumber : undefined,
      size: storeType === 'clothing' ? formFields.size : undefined,
      color: storeType === 'clothing' ? formFields.color : undefined,
      isVeg: storeType === 'restaurant' ? formFields.isVeg : undefined,
      isSellByWeight: storeType === 'grocery' ? formFields.isSellByWeight : undefined
    };

    await addOrUpdateProduct(productObj);
    setIsEditorOpen(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Search and control Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest leading-none mb-1.5 font-sans">Catalog & Inventory List</h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Perform CRUD, tags, custom prices, and barcode listings.</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={exportToCSV}
            className="shrink-0 px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download size={14} className="stroke-[2.5px]" />
            Export CSV
          </button>
          
          <button
            type="button"
            onClick={openAddEditor}
            className="shrink-0 px-5 py-3 bg-indigo-600 hover:bg-slate-900 dark:hover:bg-slate-950 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} className="stroke-[3px]" />
            Append Product
          </button>
        </div>
      </div>

      {/* Dynamic filters box */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCat(c)}
              className={`px-4 py-2 text-[11px] font-black rounded-xl transition-all border cursor-pointer shrink-0 ${
                selectedCat === c 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' 
                  : 'bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200/50 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800/80'
              }`}
            >
              {c.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {storeType !== 'restaurant' && (
            <label className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-755 rounded-xl px-3.5 py-2 cursor-pointer select-none text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors w-full sm:w-auto justify-center">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="accent-indigo-600 rounded focus:ring-0 w-3.5 h-3.5"
              />
              <span>Show only low stock</span>
            </label>
          )}

          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Filter product index..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs pl-9 pr-4 py-2 border border-slate-250 dark:border-slate-700 rounded-xl w-full focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 bg-slate-50/50 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Data listing tabular block */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse leading-normal">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <th className="px-5 py-4 font-bold">Product Name</th>
                <th className="px-5 py-4 font-bold">SKU / Barcode</th>
                <th className="px-5 py-4 text-right font-bold">Selling Price</th>
                <th className="px-5 py-4 text-right font-bold">Cost Price</th>
                <th className="px-5 py-4 font-bold">Quantity</th>
                <th className="px-5 py-4 font-bold">Combined Tax</th>
                {storeType === 'pharmacy' && <th className="px-5 py-4 font-bold">Medicine Expiry</th>}
                <th className="px-5 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-150 text-xs text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-slate-400 font-bold">No catalogue items index matching filters</td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isLow = p.stock <= p.minStock && storeType !== 'restaurant';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-900 leading-snug">
                        {p.name}
                        {p.isVeg !== undefined && (
                          <span className={`ml-2 text-[8px] px-2 py-0.5 rounded font-black uppercase ${p.isVeg ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-2xs' : 'bg-rose-50 text-rose-700 border border-rose-100 shadow-2xs'}`}>
                            {p.isVeg ? 'Veg' : 'NonVeg'}
                          </span>
                        )}
                        {p.isSellByWeight && (
                          <span className="ml-2 text-[8px] bg-slate-100 border border-slate-200 text-slate-600 font-extrabold px-1.5 py-0.5 rounded font-mono">WEIGHT</span>
                        )}
                      </td>
                      
                      <td className="px-5 py-4 font-mono text-slate-500 font-semibold space-y-0.5">
                        <p className="text-[10px] text-slate-800 font-bold">{p.sku}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">{p.barcode}</p>
                      </td>

                      <td className="px-5 py-4 text-right font-black text-slate-950 font-mono">
                        {currencySymbol}{p.price}
                      </td>

                      <td className="px-5 py-4 text-right font-mono text-slate-400 font-bold">
                        {currencySymbol}{p.costPrice}
                      </td>

                      <td className="px-5 py-4">
                        {storeType === 'restaurant' ? (
                          <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider">Infinite Menu</span>
                        ) : (
                          <span className={`font-mono font-black flex items-center gap-1.5 ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                            {p.stock} {p.unit}
                            {isLow && <AlertCircle size={13} className="text-rose-600 animate-pulse" title="Trigger alerts" />}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 font-mono font-black text-slate-650">
                        {p.taxRate}%
                      </td>

                      {storeType === 'pharmacy' && (
                        <td className="px-5 py-4 font-mono text-[10px]">
                          {p.expiryDate ? (
                            <span className="text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded font-black">
                              {p.expiryDate}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      )}

                      <td className="px-5 py-4 text-right space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditEditor(p)}
                          className="p-1.5 bg-indigo-50/50 hover:bg-indigo-100 border border-indigo-100/30 text-indigo-600 rounded-lg transition-all inline-block hover:scale-105"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm(`Remove "${p.name}"?`)) {
                              await removeProduct(p.id);
                            }
                          }}
                          className="p-1.5 bg-rose-50/50 hover:bg-rose-100 border border-rose-100/30 text-rose-600 rounded-lg transition-all inline-block hover:scale-105"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL / DRAWER editor panel */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-gray-100 shadow-2xl flex flex-col justify-between max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-950">
                {editingProduct ? 'Configure Existing Product' : 'Register New Catalog Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditorSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Item Title Description*</label>
                  <input
                    type="text"
                    required
                    value={formFields.name}
                    onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                    placeholder="e.g. Fortune Mustard Oil 1L"
                    className="w-full text-xs px-3 py-2 border border-gray-200 focus:border-indigo-500 focus:outline-none rounded-lg"
                  />
                </div>

                {/* Category Selector */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Product category tag</label>
                  <input
                    type="text"
                    required
                    value={formFields.category}
                    onChange={(e) => setFormFields({ ...formFields, category: e.target.value })}
                    placeholder="e.g. Dairy, Beverages, Electronics"
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Units */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Stocking Unit measure</label>
                  <select
                    value={formFields.unit}
                    onChange={(e) => setFormFields({ ...formFields, unit: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="kg">kg (Kilograms)</option>
                    <option value="g">g (Grams)</option>
                    <option value="pack">pack (Packs)</option>
                    <option value="bottle">bottle (Bottles)</option>
                    <option value="strip">strip (Medicine strip)</option>
                  </select>
                </div>

                {/* Selling Price */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Selling Price ({currencySymbol})*</label>
                  <input
                    type="number"
                    required
                    min={0.1}
                    step="any"
                    value={formFields.price}
                    onChange={(e) => setFormFields({ ...formFields, price: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-gray-200 focus:outline-none rounded-lg"
                  />
                </div>

                {/* Cost Price */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Stock Cost Price ({currencySymbol})*</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    value={formFields.costPrice}
                    onChange={(e) => setFormFields({ ...formFields, costPrice: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>

                {/* Current Stock */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Current Stock Level</label>
                  <input
                    type="number"
                    required
                    disabled={storeType === 'restaurant'}
                    value={formFields.stock}
                    onChange={(e) => setFormFields({ ...formFields, stock: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none disabled:bg-gray-100 disabled:text-gray-300"
                  />
                </div>

                {/* Alert Warning stock limit */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Low Stock Warning Limit</label>
                  <input
                    type="number"
                    required
                    disabled={storeType === 'restaurant'}
                    value={formFields.minStock}
                    onChange={(e) => setFormFields({ ...formFields, minStock: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none disabled:bg-gray-100"
                  />
                </div>

                {/* Tax level rate */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">GST/Sales Tax Schedule Rate (%)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={35}
                    value={formFields.taxRate}
                    onChange={(e) => setFormFields({ ...formFields, taxRate: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                  />
                </div>

                {/* SECTOR CONDITIONAL RENDERING ON FORMS */}
                {storeType === 'grocery' && (
                  <div className="sm:col-span-2 py-2 flex items-center gap-2 border-t border-gray-50 mt-1">
                    <input
                      type="checkbox"
                      id="isSellByWeight"
                      checked={formFields.isSellByWeight}
                      onChange={(e) => setFormFields({ ...formFields, isSellByWeight: e.target.checked })}
                      className="accent-indigo-600 rounded focus:ring-0"
                    />
                    <label htmlFor="isSellByWeight" className="text-xs font-bold text-emerald-800">
                      Weight-scale item (Sold by fractions kg/g, triggers float slider scales)
                    </label>
                  </div>
                )}

                {storeType === 'pharmacy' && (
                  <>
                    <div className="py-2 border-t border-gray-50 mt-2 sm:col-span-2">
                      <span className="text-[9px] font-black uppercase text-rose-700 tracking-wider">Pharmacy regulatory logs</span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Medicine Expiring Date</label>
                      <input
                        type="date"
                        required
                        value={formFields.expiryDate}
                        onChange={(e) => setFormFields({ ...formFields, expiryDate: e.target.value })}
                        className="w-full text-[11px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Regulatory Batch Number</label>
                      <input
                        type="text"
                        required
                        value={formFields.batchNumber}
                        onChange={(e) => setFormFields({ ...formFields, batchNumber: e.target.value })}
                        placeholder="e.g. B-DL903"
                        className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none font-mono"
                      />
                    </div>
                  </>
                )}

                {storeType === 'restaurant' && (
                  <div className="sm:col-span-2 py-3 border-t border-gray-50 mt-1 flex items-center gap-6">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Restaurant Food Type:</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="foodType"
                          checked={formFields.isVeg === true}
                          onChange={() => setFormFields({ ...formFields, isVeg: true })}
                          className="accent-emerald-600"
                        />
                        Vegetarian Item
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="foodType"
                          checked={formFields.isVeg === false}
                          onChange={() => setFormFields({ ...formFields, isVeg: false })}
                          className="accent-rose-600"
                        />
                        Non-Veg Item
                      </label>
                    </div>
                  </div>
                )}

                {storeType === 'clothing' && (
                  <>
                    <div className="py-2 border-t border-gray-50 mt-2 sm:col-span-2">
                      <span className="text-[9px] font-bold uppercase text-indigo-600 tracking-wider">Apparel tagging sizes & colors</span>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Default Size Code</label>
                      <input
                        type="text"
                        value={formFields.size}
                        onChange={(e) => setFormFields({ ...formFields, size: e.target.value })}
                        placeholder="e.g. M, L, XL, 32"
                        className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Color Variant Label</label>
                      <input
                        type="text"
                        value={formFields.color}
                        onChange={(e) => setFormFields({ ...formFields, color: e.target.value })}
                        placeholder="e.g. Cobalt Blue"
                        className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none"
                      />
                    </div>
                  </>
                )}

              </div>

              <div className="flex gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="w-1/2 py-2.5 border rounded-xl font-bold hover:bg-gray-50 text-xs text-gray-500 cursor-pointer"
                >
                  Close Input
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Check size={14} />
                  Assemble Catalog Entry
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
