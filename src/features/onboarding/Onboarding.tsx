/**
 * FlexBill Store Type & Configuration Onboarding Wizard
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Pill, 
  Utensils, 
  Shirt, 
  Laptop, 
  Store, 
  ArrowRight, 
  CheckCircle, 
  Building2,
  Phone,
  User,
  MapPin,
  Percent,
  Coins
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { StoreType, StoreConfig } from '../../types';

export default function Onboarding() {
  const { setOnboardedConfig, auth } = useAppStore();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<StoreType>('grocery');
  
  // Configuration Form State
  const [formData, setFormData] = useState({
    name: 'Bharat Retail Mart',
    ownerName: auth.name || 'H. Subramanyan',
    phone: '9876543200',
    address: 'Sector 4, MG Road, Metro Plaza, Bangalore',
    gstin: '29AAAAA0000A1Z5',
    currency: 'INR',
    currencySymbol: '₹',
    defaultTaxRate: 18,
    invoiceFooter: 'Thank you for shopping with us! Visit again.',
    enableThermalMock: true
  });

  const storeTypes = [
    { id: 'grocery' as StoreType, label: 'Grocery & Supermarket', desc: 'Sells by weighing scales, staples, daily packaging and multi-buy packs.', icon: ShoppingCart, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { id: 'pharmacy' as StoreType, label: 'Pharmacy / Drugstore', desc: 'Requires medicine batch numbers, expiry dates, and health taxation schedules.', icon: Pill, color: 'text-rose-600 bg-rose-50 border-rose-100' },
    { id: 'restaurant' as StoreType, label: 'Restaurant & Dining', desc: 'Focuses on table codes, live kitchen logs, and customizable recipe modifiers.', icon: Utensils, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { id: 'clothing' as StoreType, label: 'Clothing & Apparel', desc: 'Separated by size tags (S, M, L) and color codes. Perfect for fashion setups.', icon: Shirt, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    { id: 'electronics' as StoreType, label: 'Electronics & Mobile', desc: 'Tracks technical serial tags, warranties, custom pricing models, and high-value SKUs.', icon: Laptop, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { id: 'custom' as StoreType, label: 'General Retail Store', desc: 'Simple barcode grid list suitable for bakeries, stationery, hardware, etc.', icon: Store, color: 'text-slate-600 bg-slate-50 border-slate-100' }
  ];

  const handleNext = () => {
    // Dynamic pre-fill suggestions to save user time during test
    let nameSug = 'My General Store';
    let gstinSug = formData.gstin;
    let rateSug = 18;

    if (selectedType === 'restaurant') {
      nameSug = 'Spicy Bistro';
      rateSug = 5; // standard restaurant GST is 5%
    } else if (selectedType === 'grocery') {
      nameSug = 'Krishna Supermarket';
      rateSug = 5;
    } else if (selectedType === 'pharmacy') {
      nameSug = 'Care Plus Pharma';
      rateSug = 12; // typical medicine tax
    } else if (selectedType === 'clothing') {
      nameSug = 'Trends Apparel House';
      rateSug = 12;
    } else if (selectedType === 'electronics') {
      nameSug = 'Alpha Mobiles & Laptops';
      rateSug = 18;
    }

    setFormData(prev => ({
      ...prev,
      name: nameSug,
      defaultTaxRate: rateSug
    }));
    setStep(2);
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    const config: StoreConfig = {
      ...formData,
      type: selectedType
    };
    await setOnboardedConfig(config);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-3xl w-full space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        
        {/* Step Stepper Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className={`w-2.5 h-2.5 rounded-full ${step === 1 ? 'bg-indigo-600' : 'bg-indigo-200'}`} />
            <span className={`w-2.5 h-2.5 rounded-full ${step === 2 ? 'bg-indigo-600' : 'bg-indigo-200'}`} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            {step === 1 ? 'Choose Your Business Segment' : 'Configure Store Parameters'}
          </h2>
          <p className="mt-2 text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            {step === 1 
              ? 'FlexBill will dynamically morph its layout, input forms, and invoice calculations to suit your store type.' 
              : 'Supply your billing header and GST settings below. Demo catalogs will self-fill.'}
          </p>
        </div>

        {/* Step 1: Sector Picker */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {storeTypes.map((typeObj) => {
                const Icon = typeObj.icon;
                const isSelected = selectedType === typeObj.id;
                return (
                  <button
                    key={typeObj.id}
                    type="button"
                    onClick={() => setSelectedType(typeObj.id)}
                    className={`flex flex-col text-left p-5 rounded-2xl border-2 transition-all group cursor-pointer ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/20 shadow-xs' 
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-2xs'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl border mb-4 shrink-0 w-fit ${typeObj.color} ${isSelected ? 'scale-110' : ''} transition-transform`}>
                      <Icon size={20} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {typeObj.label}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                      {typeObj.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition-all cursor-pointer"
              >
                Forward
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Form Configurations */}
        {step === 2 && (
          <form onSubmit={handleLaunch} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Name */}
              <div className="space-y-1.5ClassName">
                <label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5 leading-none mb-1">
                  <Building2 size={12} className="text-indigo-600" />
                  Business Store Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Reliance Fresh Store"
                  className="w-full text-xs px-3 py-2.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Owner */}
              <div>
                <label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5 leading-none mb-1">
                  <User size={12} className="text-indigo-600" />
                  Owner Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full text-xs px-3 py-2.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5 leading-none mb-1">
                  <Phone size={12} className="text-indigo-600" />
                  Contact Telephone Model
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                  className="w-full text-xs px-3 py-2.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* GSTIN */}
              <div>
                <label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5 leading-none mb-1">
                  <Building2 size={12} className="text-indigo-600" />
                  GSTIN Register ID *(Optional)
                </label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  placeholder="GST tax registration number"
                  className="w-full text-xs px-3 py-2.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none font-mono"
                />
              </div>

              {/* Currency Symbol */}
              <div>
                <label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5 leading-none mb-1">
                  <Coins size={12} className="text-indigo-600" />
                  Valuta Currency Symbol
                </label>
                <select
                  value={formData.currencySymbol}
                  onChange={(e) => {
                    const symb = e.target.value;
                    let valutaCode = 'INR';
                    if (symb === '$') valutaCode = 'USD';
                    if (symb === '€') valutaCode = 'EUR';
                    if (symb === '£') valutaCode = 'GBP';
                    setFormData({ ...formData, currencySymbol: symb, currency: valutaCode });
                  }}
                  className="w-full text-xs px-3 py-2.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                >
                  <option value="₹">₹ INR (Indian Rupee)</option>
                  <option value="$">$ USD (United States Dollar)</option>
                  <option value="€">€ EUR (Euro)</option>
                  <option value="£">£ GBP (British Pound)</option>
                </select>
              </div>

              {/* Default Tax Rates */}
              <div>
                <label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5 leading-none mb-1">
                  <Percent size={12} className="text-indigo-600" />
                  Global Sales Tax/GST (%)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={40}
                  value={formData.defaultTaxRate}
                  onChange={(e) => setFormData({ ...formData, defaultTaxRate: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5 leading-none mb-1">
                  <MapPin size={12} className="text-indigo-600" />
                  Store Postal Address
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none shrink-0"
                />
              </div>

              {/* Invoice footer message */}
              <div className="md:col-span-2">
                <label className="text-[11px] font-semibold text-gray-600 leading-none mb-1 block">
                  Thermal Receipt Custom Footer Notice
                </label>
                <input
                  type="text"
                  value={formData.invoiceFooter}
                  onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 border border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-xs text-gray-500 hover:text-gray-700 font-semibold cursor-pointer"
              >
                Back To Type
              </button>
              
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10 hover:bg-indigo-700 transition-all cursor-pointer animate-pulse"
              >
                <CheckCircle size={15} />
                Launch FlexBill Workspace
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
