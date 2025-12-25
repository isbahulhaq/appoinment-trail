
import React, { useState } from 'react';
import { AppointmentStatus, Priority } from '../types';
import { CLINIC_CONFIG } from '../constants';

interface PatientViewProps {
  queue: any;
}

const PatientView: React.FC<PatientViewProps> = ({ queue }) => {
  const { appointments, addAppointment } = queue;
  const inProgress = appointments.find((a: any) => a.status === AppointmentStatus.IN_PROGRESS);
  const waiting = appointments.filter((a: any) => a.status === AppointmentStatus.WAITING);
  
  const [showBooking, setShowBooking] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', reason: '' });

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    addAppointment({ patientName: formData.name, reason: formData.reason, priority: Priority.NORMAL });
    setShowBooking(false);
    alert("Appointment requested! We will call you soon.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero / Clinic Intro */}
      <section className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-100">
        <div className="h-48 md:h-64 relative">
          <img 
            src="https://picsum.photos/seed/clinic/1200/600" 
            alt="Clinic interior" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-8">
            <div className="text-white">
              <h2 className="text-3xl font-bold">{CLINIC_CONFIG.name}</h2>
              <p className="opacity-90">{CLINIC_CONFIG.doctorName} • Family Physician</p>
            </div>
          </div>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2">
              <InfoIcon /> Clinic Information
            </h3>
            <ul className="space-y-3 text-slate-600">
              <li className="flex justify-between"><span>Mon - Sat</span> <span>10:00 - 13:00, 17:00 - 20:00</span></li>
              <li className="flex justify-between"><span>Sunday</span> <span className="text-red-500 font-bold">Closed</span></li>
              <li className="flex justify-between"><span>Address</span> <span className="text-right">452 Medical Parkway, Suite 100</span></li>
              <li className="flex justify-between"><span>Emergency</span> <span>+1 (800) 911-000</span></li>
            </ul>
          </div>
          <div className="flex flex-col justify-center gap-4">
             <button 
              onClick={() => setShowBooking(true)}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition transform active:scale-95"
            >
              Book New Appointment
            </button>
            <p className="text-center text-xs text-slate-400">Standard consultation fee: $50. Walk-ins subject to availability.</p>
          </div>
        </div>
      </section>

      {/* Live Status */}
      <section className="bg-slate-900 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <LiveIcon size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              Live Feed
            </span>
            <h3 className="text-3xl font-black">Virtual Waiting Room</h3>
            <p className="text-slate-400">Current Queue Statistics for Today</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl text-center border border-white/10">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Now Serving</p>
              <p className="text-2xl font-black text-indigo-400">#{inProgress ? inProgress.id.slice(0, 4).toUpperCase() : 'NONE'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl text-center border border-white/10">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Queue Size</p>
              <p className="text-2xl font-black text-white">{waiting.length}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
             <h4 className="font-bold text-indigo-300">Queue Order</h4>
             <div className="space-y-2">
               {waiting.slice(0, 5).map((app: any, idx: number) => (
                 <div key={app.id} className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/5">
                   <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </span>
                      <span className="font-bold opacity-80">{app.patientName.split(' ')[0]}***</span>
                   </div>
                   <span className="font-mono text-indigo-400 font-bold">{app.eta}</span>
                 </div>
               ))}
               {waiting.length > 5 && <p className="text-center text-xs opacity-40 italic">+{waiting.length - 5} more patients in queue</p>}
               {waiting.length === 0 && <p className="opacity-40 italic">The queue is currently empty.</p>}
             </div>
           </div>
           <div className="bg-indigo-600/20 border border-indigo-400/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
             <ClockIcon />
             <h4 className="text-xl font-bold mt-4">Estimated Wait Time</h4>
             <p className="text-4xl font-black text-indigo-400 my-2">{waiting.length * 15} Mins</p>
             <p className="text-sm opacity-60">Average consultation time: 15 mins</p>
           </div>
        </div>
      </section>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
             <div className="p-8">
               <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black text-slate-900">Patient Registration</h3>
                 <button onClick={() => setShowBooking(false)} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition">✕</button>
               </div>
               <form onSubmit={handleBooking} className="space-y-6">
                 <div>
                   <label className="block text-sm font-black text-slate-500 uppercase mb-2">Full Name</label>
                   <input 
                    required type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="John Doe"
                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-4 ring-indigo-500/10 focus:bg-white transition"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-black text-slate-500 uppercase mb-2">Mobile Number</label>
                   <input 
                    required type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-4 ring-indigo-500/10 focus:bg-white transition"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-black text-slate-500 uppercase mb-2">Primary Symptom</label>
                   <textarea 
                    rows={3}
                    value={formData.reason}
                    onChange={e => setFormData({...formData, reason: e.target.value})}
                    placeholder="e.g. Mild fever, follow-up, etc."
                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-4 ring-indigo-500/10 focus:bg-white transition"
                   ></textarea>
                 </div>
                 <button className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-lg shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 transition active:translate-y-0">
                   Confirm Request
                 </button>
                 <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                   By confirming, you agree to our privacy policy and clinical terms.
                 </p>
               </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const LiveIcon = ({ size }: { size: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>;

export default PatientView;
