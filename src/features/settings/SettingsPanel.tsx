/**
 * FlexBill Terminal System settings
 * @license Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Store, 
  MapPin, 
  Phone, 
  User, 
  Percent, 
  Coins, 
  FileText, 
  Check, 
  RefreshCw, 
  ShieldCheck,
  Smartphone,
  CheckCircle,
  HelpCircle,
  Trash2,
  Camera,
  X
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { StoreConfig, StoreType } from '../../types';

export default function SettingsPanel() {
  const { storeConfig, auth, setOnboardedConfig, logout, darkMode } = useAppStore();
  
  const [formData, setFormData] = useState<StoreConfig>({
    name: storeConfig?.name || 'Bharat Retail Mart',
    type: storeConfig?.type || 'grocery',
    ownerName: storeConfig?.ownerName || 'H. Subramanyan',
    phone: storeConfig?.phone || '9876543200',
    address: storeConfig?.address || 'Sector 4, MG Road, Bangalore',
    gstin: storeConfig?.gstin || '29AAAAA0000A1Z5',
    currency: storeConfig?.currency || 'INR',
    currencySymbol: storeConfig?.currencySymbol || '₹',
    defaultTaxRate: storeConfig?.defaultTaxRate || 18,
    invoiceFooter: storeConfig?.invoiceFooter || 'Thank you for shopping! Visit again.',
    enableThermalMock: storeConfig?.enableThermalMock || true,
    logoUrl: storeConfig?.logoUrl || ''
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Camera settings
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, facingMode: 'user' } 
      });
      setCameraStream(stream);
      setCameraActive(true);
      // Let states refresh and bind video ref
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play().catch(e => console.error("Error playing video:", e));
        }
      }, 300);
    } catch (err) {
      console.error('Camera capture access failed: ', err);
      alert('Camera access failed! Please allow frame/camera permissions in your browser or iframe header context.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Center crop the video feed
        const video = videoRef.current;
        const size = Math.min(video.videoWidth, video.videoHeight);
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 160, 160);
        const dataUrlStr = canvas.toDataURL('image/png');
        setFormData(prev => ({ ...prev, logoUrl: dataUrlStr }));
      }
      stopCamera();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    await setOnboardedConfig(formData);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleHardReset = async () => {
    if (confirm('Are you strictly sure you want to hard delete all transaction files, customers, and inventory levels? Local IndexedDB will be fully cleared and seeded with fresh mock catalogs.')) {
      setResetSuccess(true);
      
      const configObj: StoreConfig = {
        ...formData
      };
      await setOnboardedConfig(configObj);
      
      setTimeout(() => {
        setResetSuccess(false);
        alert('IndexedDB tables fully successfully re-seeded.');
      }, 1500);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto select-none text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Title */}
      <div className="border-b pb-4 border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest leading-none mb-1.5 font-sans">Administrative configurations</h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Tune billing profiles, currency models, thermal printer formats, and hard seeds reset.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Logo capture block */}
          <div className="p-5 border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/40 rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Camera size={14} className="text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">Company Receipt Logo Image</h4>
            </div>
            
            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold leading-relaxed">
              Generate or capture a customized black-and-white high-contrast brand logo with your terminal's camera. This logo scales automatically inside thermal bill layouts.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
              {/* Logo preview bubble */}
              <div className="w-24 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Store Logo Preview" className="w-full h-full object-contain bg-white rounded-xl" />
                ) : (
                  <Store size={24} className="text-slate-400 dark:text-slate-600" />
                )}
              </div>

              {/* Action columns */}
              <div className="space-y-3.5 w-full">
                {cameraActive ? (
                  <div className="space-y-3">
                    <div className="relative max-w-[200px] h-[150px] rounded-xl bg-slate-950/90 border border-slate-800 overflow-hidden flex items-center justify-center mx-auto sm:mx-0">
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                      <button 
                        type="button" 
                        onClick={stopCamera} 
                        className="absolute right-2 top-2 p-1.5 bg-slate-900/80 hover:bg-slate-900 text-slate-300 rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wide rounded-xl cursor-pointer"
                    >
                      Snap Frame
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2.5 flex-wrap justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 bg-indigo-600 hover:bg-slate-900 text-white font-black text-[10px] uppercase tracking-wide rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors border border-indigo-500/10"
                    >
                      <Camera size={13} />
                      Capture from Camera
                    </button>

                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wide rounded-xl border border-rose-150 dark:border-rose-900/40 cursor-pointer"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Store Type Layout */}
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Operational Module Layout</label>
              <input
                type="text"
                disabled
                value={`${formData.type.toUpperCase()} POS Terminal Layout`}
                className="w-full text-xs px-3 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-150 dark:border-slate-700 text-gray-500 dark:text-slate-400 capitalize rounded-lg font-bold"
              />
              <span className="text-[9px] text-gray-450 mt-1 block leading-none">To change category layout, run "Hard Seed Reset" at bottom.</span>
            </div>

            {/* Store Name */}
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 flex items-center gap-1 block mb-1">
                <Store size={12} className="text-indigo-600 dark:text-indigo-400" /> Store Register Name*
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
              />
            </div>

            {/* Owner Name */}
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 block mb-1">
                <User size={12} className="text-indigo-600 dark:text-indigo-400" /> Owner/Merchant Principal Fullname
              </label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
              />
            </div>

            {/* Owner Phone */}
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 block mb-1">
                <Phone size={12} className="text-indigo-600 dark:text-indigo-400" /> Booking Phone Number*
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
              />
            </div>

            {/* Store address */}
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 block mb-1">
                <MapPin size={12} className="text-indigo-600 dark:text-indigo-400" /> Postal Invoice Header Address*
              </label>
              <textarea
                rows={2}
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

            {/* GSTIN registration */}
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Store GSTIN Register ID</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none font-mono tracking-wider focus:border-indigo-600"
              />
            </div>

            {/* Default tax rate */}
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 block mb-1">
                <Percent size={12} className="text-indigo-600 dark:text-indigo-400" /> Default Sales GST Schedule (%)
              </label>
              <input
                type="number"
                required
                min={0}
                max={40}
                value={formData.defaultTaxRate}
                onChange={(e) => setFormData({ ...formData, defaultTaxRate: Number(e.target.value) })}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-600"
              />
            </div>

            {/* Default Valuta Currency */}
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 block mb-1">
                <Coins size={12} className="text-indigo-600 dark:text-indigo-400" /> Default Currency Sign
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
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-955 border border-gray-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none"
              >
                <option value="₹">₹ INR (Indian Rupee)</option>
                <option value="$">$ USD (United States Dollar)</option>
                <option value="€">€ EUR (Euro)</option>
                <option value="£">£ GBP (British Pound)</option>
              </select>
            </div>

            {/* Invoices receipt custom footer */}
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1 block mb-1">
                <FileText size={12} className="text-indigo-600 dark:text-indigo-400" /> Invoices custom footer notice
              </label>
              <input
                type="text"
                value={formData.invoiceFooter}
                onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>

          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-slate-800">
            <button
              type="button"
              onClick={logout}
              className="text-xs font-bold text-rose-600 hover:text-rose-800"
            >
              Lock Operator Terminal
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              {saveSuccess ? <CheckCircle size={15} className="text-white animate-bounce" /> : <ShieldCheck size={15} />}
              {saveSuccess ? 'Configuration Saved!' : 'Save System Settings'}
            </button>
          </div>
        </form>

        {/* Disaster resets block */}
        <div className="p-5 border border-red-100/50 dark:border-rose-950/40 bg-red-50/10 dark:bg-rose-950/10 rounded-2xl space-y-3.5 mt-4">
          <div className="flex items-center gap-2">
            <Trash2 size={16} className="text-rose-600" />
            <h4 className="text-xs font-bold text-rose-950 dark:text-rose-250">Disaster Recovery Actions</h4>
          </div>
          <p className="text-[10px] text-gray-505 dark:text-slate-400 leading-relaxed md:max-w-xl">
            Hard reset clears all local bills, membership directories, and movement logs. It then re-configures the store based on the active options above and feeds brand-new categories matching the business sector instantly.
          </p>
          
          <button
            type="button"
            onClick={handleHardReset}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 w-fit"
          >
            {resetSuccess ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Hard Seed Reset IndexedDB
          </button>
        </div>

      </div>

    </div>
  );
}
