
import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginProps {
  onSelectRole: (role: UserRole, isAuthenticated: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onSelectRole }) => {
  const [mode, setMode] = useState<'CHOICE' | 'STAFF_LOGIN'>('CHOICE');
  const [pin, setPin] = useState('');
  const [selectedStaffRole, setSelectedStaffRole] = useState<UserRole | null>(null);
  const [error, setError] = useState(false);

  const CLINIC_PIN = "1234"; // In real SaaS, this would be an API call

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CLINIC_PIN && selectedStaffRole) {
      onSelectRole(selectedStaffRole, true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (mode === 'STAFF_LOGIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 border-2 border-slate-100 animate-in zoom-in-95 duration-300">
          <button onClick={() => setMode('CHOICE')} className="text-slate-400 text-xs font-bold mb-6 hover:text-indigo-600 flex items-center gap-1">
             ← Back to selection
          </button>
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-6 mx-auto">
            <LockIcon />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter text-center uppercase mb-2">Staff Verification</h2>
          <p className="text-center text-slate-500 text-sm font-medium mb-8">Accessing {selectedStaffRole} console requires a secure PIN.</p>
          
          <form onSubmit={handleStaffLogin} className="space-y-4">
            <div className="relative">
              <input 
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                className={`w-full px-6 py-4 bg-slate-50 border-2 rounded-2xl text-center text-2xl tracking-[1em] font-black focus:border-indigo-600 outline-none transition ${error ? 'border-red-500 animate-shake' : 'border-slate-100'}`}
                autoFocus
              />
              {error && <p className="text-red-500 text-[10px] font-black text-center mt-2 uppercase tracking-widest">Invalid Security Code</p>}
            </div>
            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-xl hover:-translate-y-1 transition active:scale-95 uppercase tracking-widest"
            >
              Authorize Session
            </button>
          </form>
          <p className="text-center mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Demo Pin: 1234</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Patient Path */}
        <div 
          onClick={() => onSelectRole(UserRole.PATIENT, false)}
          className="bg-white p-10 rounded-[3.5rem] shadow-xl border-2 border-white hover:border-indigo-600 cursor-pointer transition-all group hover:-translate-y-2"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition">
            <UserIcon size={40} />
          </div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-3">Patient Portal</h3>
          <p className="text-slate-500 font-medium leading-relaxed mb-8">Check live queue status, talk to our health AI, and book appointments instantly.</p>
          <div className="inline-flex items-center gap-2 text-indigo-600 font-black uppercase text-xs tracking-widest">
            Enter Dashboard <ArrowIcon />
          </div>
        </div>

        {/* Staff Path */}
        <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl border-2 border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center mb-8">
              <StethoscopeIcon size={40} />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tighter uppercase mb-3">Staff Console</h3>
            <p className="text-slate-400 font-medium leading-relaxed mb-8">Secure management tools for clinical personnel and front-desk administrators.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => { setSelectedStaffRole(UserRole.DOCTOR); setMode('STAFF_LOGIN'); }}
              className="bg-white/10 hover:bg-white text-white hover:text-slate-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition shadow-lg"
            >
              Doctor
            </button>
            <button 
              onClick={() => { setSelectedStaffRole(UserRole.RECEPTIONIST); setMode('STAFF_LOGIN'); }}
              className="bg-white/10 hover:bg-white text-white hover:text-slate-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition shadow-lg"
            >
              Front Desk
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">MedQueue Pro v1.0.4 • Clinical Integrity System</p>
      </div>
    </div>
  );
};

const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const UserIcon = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const StethoscopeIcon = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2h-.2ZM3 2h12a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"></path><path d="M10 7v5a2 2 0 0 0 2 2h1"></path><path d="M17 14h.01"></path><path d="M20 9v4a2 2 0 0 1-2 2h-1"></path><circle cx="19" cy="18" r="3"></circle></svg>;
const ArrowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;

export default Login;
