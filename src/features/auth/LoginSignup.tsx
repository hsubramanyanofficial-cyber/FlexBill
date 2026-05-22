/**
 * FlexBill Authenticated Access Portal
 * @license Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, User, Mail, Lock, Store, ArrowRight, CornerDownLeft, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

export default function LoginSignup() {
  const { loginUser, signupUser } = useAppStore();
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Login form state
  const [email, setEmail] = useState('admin@flexbill.com');
  const [pin, setPin] = useState('1234');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    name: 'Harish Subramanyan',
    email: 'h.subramanyanofficial@gmail.com',
    pin: '1234'
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pin) {
      setErrorMsg('Please populate all parameters.');
      return;
    }
    setErrorMsg('');
    await loginUser(email, pin);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    await signupUser(signupForm.email, signupForm.name, signupForm.pin);
  };

  const quickLogins = [
    { title: 'Admin Terminal', email: 'admin@flexbill.com', pin: '1234', role: 'admin', color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
    { title: 'Store Manager', email: 'manager@flexbill.com', pin: '5678', role: 'manager', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
    { title: 'POS Cashier', email: 'cashier@flexbill.com', pin: '0000', role: 'cashier', color: 'bg-amber-50 border-amber-100 text-amber-700' }
  ];

  const fillQuick = (qEmail: string, qPin: string) => {
    setEmail(qEmail);
    setPin(qPin);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center py-10 px-4 sm:px-6 select-none relative overflow-hidden">
      
      {/* Visual background accents */}
      <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />

      <div className="max-w-md w-full space-y-7 bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative z-10 transition-all select-none">
        
        {/* Branding badge */}
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-indigo-600 text-white font-black rounded-2xl shadow-lg mb-4 text-xl">
            FB
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-none mb-1">
            FlexBill Cloud POS
          </h2>
          <p className="text-[11px] text-gray-400">Universal Dynamic Invoice & Checkout Engine</p>
        </div>

        {/* Dynamic Sliding Tabs selector */}
        {tab !== 'forgot' && (
          <div className="flex bg-gray-50 border border-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setTab('login'); setErrorMsg(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                tab === 'login' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('signup'); setErrorMsg(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                tab === 'signup' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Fresh Account
            </button>
          </div>
        )}

        {/* Input Forms */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg">{errorMsg}</div>
            )}

            <div className="space-y-3">
              {/* Mail Box */}
              <div>
                <label className="text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1 block">Account Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={14} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full text-xs pl-9 pr-4 py-2.5 bg-gray-50 focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Security PIN Code */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-semibold uppercase text-gray-500 tracking-wider">Security PIN</label>
                  <button 
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-[10px] font-semibold text-indigo-500 hover:text-indigo-700 transition"
                  >
                    Forgot passcode PIN?
                  </button>
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={14} />
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter security 4-digit PIN"
                    className="w-full text-xs pl-9 pr-10 py-2.5 bg-gray-50 focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono tracking-widest text-center"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
            >
              Sign In Terminal
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {tab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className="text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1 block">Staff / Operator Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={14} />
                  <input
                    type="text"
                    required
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    placeholder="e.g. Harish Subramanyan"
                    className="w-full text-xs pl-9 pr-4 py-2.5 bg-gray-50 focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1 block">Corporate Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={14} />
                  <input
                    type="email"
                    required
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    placeholder="e.g. subramanyan@corp.com"
                    className="w-full text-xs pl-9 pr-4 py-2.5 bg-gray-50 focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Passcode PIN */}
              <div>
                <label className="text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1 block">Security Access PIN</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={14} />
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={signupForm.pin}
                    onChange={(e) => setSignupForm({ ...signupForm, pin: e.target.value })}
                    placeholder="Choose 4 digits (e.g., 1234)"
                    className="w-full text-xs pl-9 pr-4 py-2.5 bg-gray-50 focus:bg-white border border-gray-200 focus:border-indigo-500 rounded-lg focus:outline-none font-mono tracking-wider text-center"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10 transition"
            >
              Configure Store & Onboard
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {tab === 'forgot' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Passcode PIN Recovery</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              In offline-first local mode, your administrative secrets can be bypassed with the global master tester codes listed below.
            </p>
            <button
              type="button"
              onClick={() => setTab('login')}
              className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition"
            >
              <CornerDownLeft size={12} />
              Return to login page
            </button>
          </div>
        )}

        {/* Tester Quick Access Panel (Crucial for speedy verification) */}
        {tab === 'login' && (
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-3">
              Operator PIN Shortcuts (Click to Auto-fill)
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {quickLogins.map((q) => (
                <button
                  key={q.role}
                  type="button"
                  id={`quick-login-${q.role}`}
                  onClick={() => fillQuick(q.email, q.pin)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[10px] font-semibold leading-normal transition-all text-center cursor-pointer hover:shadow-2xs ${q.color}`}
                >
                  <span className="truncate w-full block">{q.title}</span>
                  <span className="font-mono mt-1 opacity-80">PIN: {q.pin}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
