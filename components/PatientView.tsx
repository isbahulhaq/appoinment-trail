
import React, { useState, useMemo, useEffect } from 'react';
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
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    email: '',
    reason: '', 
    date: new Date().toISOString().split('T')[0],
    time: '' 
  });

  const triggerAssistant = (query?: string) => {
    window.dispatchEvent(new CustomEvent('medqueue_chat_trigger', { detail: { query } }));
  };

  // Helper to check if a date is a Sunday
  const isSunday = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getDay() === 0;
  };

  // Generate available time slots based on clinic configuration and current time
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const now = new Date();
    const isToday = formData.date === now.toISOString().split('T')[0];

    const generateForShift = (startStr: string, endStr: string) => {
      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);
      
      let current = new Date(formData.date);
      current.setHours(startH, startM, 0, 0);
      
      const end = new Date(formData.date);
      end.setHours(endH, endM, 0, 0);
      
      while (current < end) {
        const slotTimeStr = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        // Only add slot if it's in the future (if booking for today)
        if (!isToday || current > now) {
          slots.push(slotTimeStr);
        }
        current = new Date(current.getTime() + CLINIC_CONFIG.slotDuration * 60000);
      }
    };

    if (!isSunday(formData.date)) {
      generateForShift(CLINIC_CONFIG.morningShift.start, CLINIC_CONFIG.morningShift.end);
      generateForShift(CLINIC_CONFIG.eveningShift.start, CLINIC_CONFIG.eveningShift.end);
    }
    
    return slots;
  }, [formData.date]);

  useEffect(() => {
    if (formData.time && !timeSlots.includes(formData.time)) {
      setFormData(prev => ({ ...prev, time: '' }));
    }
  }, [timeSlots, formData.time]);

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSunday(formData.date)) {
      alert("The clinic is closed on Sundays.");
      return;
    }
    if (!formData.time) {
      alert("Please select a preferred time slot.");
      return;
    }

    addAppointment({ 
      patientName: formData.name, 
      phone: formData.phone,
      email: formData.email,
      reason: formData.reason, 
      priority: Priority.NORMAL,
      date: formData.date,
      scheduledTime: formData.time
    });

    setBookingSuccess(true);
    setTimeout(() => {
      setShowBooking(false);
      setBookingSuccess(false);
      setFormData({ 
        name: '', 
        phone: '', 
        email: '',
        reason: '', 
        date: new Date().toISOString().split('T')[0],
        time: '' 
      });
    }, 2500);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Hero / Clinic Intro */}
      <section className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-slate-100 group">
        <div className="h-48 md:h-80 relative overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1200" 
            alt="Modern Clinic" 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent flex items-end p-10">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-3">
                 <span className="px-4 py-1.5 bg-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Active Intake</span>
                 <span className="text-[10px] font-black opacity-70 uppercase tracking-widest ml-1">{waiting.length + (inProgress ? 1 : 0)}+ Records Today</span>
              </div>
              <h2 className="text-5xl font-black tracking-tighter leading-none mb-1">{CLINIC_CONFIG.name}</h2>
              <p className="opacity-80 font-bold text-xl tracking-tight">{CLINIC_CONFIG.doctorName} • Family Specialist</p>
            </div>
          </div>
        </div>
        <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-12 bg-white">
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                <InfoIcon /> Operational Windows
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group/item hover:border-indigo-200 transition-all">
                  <p className="text-[10px] font-black text-indigo-500 uppercase mb-2 tracking-widest">Morning Block</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tighter">{CLINIC_CONFIG.morningShift.start} — {CLINIC_CONFIG.morningShift.end}</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group/item hover:border-indigo-200 transition-all">
                  <p className="text-[10px] font-black text-indigo-500 uppercase mb-2 tracking-widest">Evening Block</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tighter">{CLINIC_CONFIG.eveningShift.start} — {CLINIC_CONFIG.eveningShift.end}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-3">
                  <MapPinIcon /> Physical Location
                </h3>
                <p className="text-slate-700 font-black text-lg leading-tight">452 Medical Parkway, Clinical Suite 100, West District</p>
              </div>
              <div className="h-12 w-px bg-slate-100 hidden sm:block"></div>
              <div className="flex-1">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-3">
                  <EmergencyIcon size={16} /> Urgent Care
                </h3>
                <p className="text-slate-700 font-black text-lg leading-tight">+1 (555) 911-0000</p>
              </div>
            </div>
          </div>
          <div className="bg-indigo-600 p-10 rounded-[2.5rem] flex flex-col justify-between shadow-2xl shadow-indigo-200 relative overflow-hidden group/btn">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
             <div className="relative z-10 text-center mb-8">
                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em] mb-3">Priority Booking</p>
                <h4 className="text-3xl font-black text-white tracking-tighter leading-none">Avoid the Waiting Room</h4>
             </div>
             <button 
              onClick={() => setShowBooking(true)}
              className="relative z-10 w-full bg-white text-indigo-600 py-6 rounded-[1.5rem] font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Secure a Slot <ArrowRightIcon />
            </button>
          </div>
        </div>
      </section>

      {/* NEW: Smart Assistant Section */}
      <section className="bg-white rounded-[2.5rem] p-10 border-2 border-indigo-50 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-10">
          <div className="shrink-0 flex items-center justify-center">
            <div className="w-24 h-24 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200 animate-pulse">
               <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"></path><rect x="4" y="8" width="16" height="12" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>
            </div>
          </div>
          <div className="flex-grow space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">Health Concierge</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md text-[9px] font-black uppercase">Online</span>
              </div>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Need immediate answers?</h3>
              <p className="text-slate-500 font-bold mt-2">Ask our AI assistant about wait times, clinic policies, or directions.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => triggerAssistant("What is the current estimated wait time?")} className="px-4 py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl text-xs font-black text-slate-600 hover:text-indigo-600 transition-all">Current Wait?</button>
              <button onClick={() => triggerAssistant("Where is the clinic located?")} className="px-4 py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl text-xs font-black text-slate-600 hover:text-indigo-600 transition-all">Directions?</button>
              <button onClick={() => triggerAssistant("What are the clinic operating hours?")} className="px-4 py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl text-xs font-black text-slate-600 hover:text-indigo-600 transition-all">Hours?</button>
              <button onClick={() => triggerAssistant("Who is the doctor currently seeing?")} className="px-4 py-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-xl text-xs font-black text-slate-600 hover:text-indigo-600 transition-all">Live Status?</button>
            </div>
          </div>
          <div className="shrink-0">
             <button 
              onClick={() => triggerAssistant()}
              className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black shadow-xl hover:bg-slate-800 transition active:scale-95 flex items-center gap-3"
            >
              Start Chat <ArrowRightIcon size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Live Status */}
      <section className="bg-slate-900 text-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 p-4 opacity-5 rotate-12 pointer-events-none">
          <LiveIcon size={400} />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <span className="flex h-4 w-4 relative">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
                 </span>
                 <span className="text-xs font-black uppercase tracking-[0.4em] text-indigo-400">Virtual Roster v1.0</span>
              </div>
              <h3 className="text-6xl font-black tracking-tighter leading-none">Live Clinical Flow</h3>
              <p className="text-slate-400 font-bold text-xl max-w-lg leading-relaxed">View real-time position, estimated wait times, and current session status from any device.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 sm:gap-6 shrink-0">
              <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 text-center min-w-[180px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3">Now Serving</p>
                <p className="text-5xl font-black text-white tabular-nums">
                  {inProgress ? `#${inProgress.id.slice(0, 4)}` : '--'}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 text-center min-w-[180px]">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Wait List</p>
                <p className="text-5xl font-black text-white tabular-nums">{waiting.length}</p>
              </div>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-16 border-t border-white/5 pt-16">
             <div className="space-y-8">
               <div className="flex items-center justify-between">
                  <h4 className="font-black text-indigo-400 uppercase tracking-[0.2em] text-xs">Live Entry Stream</h4>
                  <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-slate-500 font-black uppercase tracking-tighter">Next 5 Patients</span>
               </div>
               <div className="space-y-4">
                 {waiting.length === 0 ? (
                   <div className="py-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                      <p className="text-slate-500 font-black uppercase tracking-widest text-xs">The queue is currently clear</p>
                   </div>
                 ) : (
                   waiting.slice(0, 5).map((app: any, idx: number) => (
                    <div key={app.id} className="group flex items-center justify-between bg-white/5 hover:bg-white/10 p-6 rounded-[1.5rem] border border-white/5 transition-all duration-300">
                      <div className="flex items-center gap-6">
                         <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center font-black text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition-all text-sm">
                           {idx + 1}
                         </div>
                         <div>
                           <span className="block font-black text-white text-xl tracking-tight">
                             {app.patientName.split(' ')[0]}***
                           </span>
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Clinical Admission</span>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="block font-black text-indigo-400 text-2xl tabular-nums">{app.eta}</span>
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Est. Check-in</span>
                      </div>
                    </div>
                  ))
                 )}
               </div>
             </div>
             
             <div className="bg-indigo-600/10 border-2 border-indigo-500/10 rounded-[3.5rem] p-12 flex flex-col items-center justify-center text-center group/card relative">
               <div className="mb-8 p-6 bg-white/5 rounded-full">
                  <ClockIcon size={48} className="text-indigo-400" />
               </div>
               <h4 className="text-3xl font-black text-white tracking-tighter mb-2">Wait Time Index</h4>
               <div className="my-6">
                  <p className="text-8xl font-black text-indigo-500 tracking-tighter tabular-nums leading-none">
                    {waiting.length * CLINIC_CONFIG.slotDuration}
                  </p>
                  <p className="text-indigo-300/60 font-black uppercase tracking-[0.3em] text-xs mt-4">Minutes Approx Wait</p>
               </div>
               <p className="text-slate-500 text-xs font-bold leading-relaxed max-w-[240px]">Dynamic calculation based on clinical throughput.</p>
             </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
             {bookingSuccess ? (
               <div className="p-24 text-center flex flex-col items-center justify-center space-y-8">
                  <div className="w-28 h-28 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce shadow-2xl shadow-emerald-500/20">
                    <CheckIcon size={56} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-5xl font-black text-slate-900 tracking-tighter">Appointment Secured</h3>
                    <p className="text-slate-500 font-bold text-xl">We've sent a confirmation SMS and Email.</p>
                  </div>
               </div>
             ) : (
               <div className="flex flex-col h-full max-h-[90vh]">
                <div className="bg-indigo-600 p-12 text-white relative shrink-0">
                  <button onClick={() => setShowBooking(false)} className="absolute top-10 right-10 p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                    <CloseIcon />
                  </button>
                  <p className="text-indigo-200 font-black text-[10px] uppercase tracking-[0.4em] mb-3">Clinic Intake v1.0</p>
                  <h3 className="text-5xl font-black tracking-tighter leading-none">Patient Registration</h3>
                </div>

                <form onSubmit={handleBooking} className="p-12 space-y-10 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Full Identity</label>
                      <input 
                        required type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl px-8 py-5 focus:bg-white focus:border-indigo-100 transition-all font-black text-slate-900 text-lg"
                        placeholder="Johnathan Doe"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Contact Number (SMS)</label>
                      <input 
                        required type="tel" 
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl px-8 py-5 focus:bg-white focus:border-indigo-100 transition-all font-black text-slate-900 text-lg"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Email Address</label>
                      <input 
                        required type="email" 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl px-8 py-5 focus:bg-white focus:border-indigo-100 transition-all font-black text-slate-900 text-lg"
                        placeholder="patient@example.com"
                      />
                    </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-end">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Consultation Date</label>
                        <input 
                          type="date" min={todayStr} required
                          value={formData.date}
                          onChange={e => setFormData({...formData, date: e.target.value})}
                          className="bg-slate-50 border-2 border-slate-50 px-6 py-4 rounded-2xl font-black text-slate-800"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Preferred Window</label>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 p-2 bg-slate-50 rounded-[2rem] max-h-48 overflow-y-auto">
                        {timeSlots.map(slot => (
                          <button
                            key={slot} type="button"
                            onClick={() => setFormData({...formData, time: slot})}
                            className={`py-4 rounded-2xl text-xs font-black transition-all border-2 ${
                              formData.time === slot 
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100' 
                              : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Reason</label>
                    <textarea 
                      rows={2} required
                      value={formData.reason}
                      onChange={e => setFormData({...formData, reason: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] px-8 py-5 transition-all font-bold text-slate-700"
                      placeholder="Symptoms..."
                    ></textarea>
                  </div>

                  <button className="w-full bg-indigo-600 text-white py-8 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition flex items-center justify-center gap-4">
                    Secure Clinical Request <ArrowRightIcon size={24} />
                  </button>
                </form>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

// Icons reused from previous versions
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const ClockIcon = ({ size = 64, className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const LiveIcon = ({ size }: { size: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>;
const ArrowRightIcon = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;
const CheckIcon = ({ size = 24 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const EmergencyIcon = ({ size = 20 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;

export default PatientView;
