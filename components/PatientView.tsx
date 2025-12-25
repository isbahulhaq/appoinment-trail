
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppointmentStatus, Priority } from '../types';
import { CLINIC_CONFIG } from '../constants';
import { askChatbot } from '../services/geminiService';

interface PatientViewProps {
  queue: any;
}

const PatientView: React.FC<PatientViewProps> = ({ queue }) => {
  const { appointments, addAppointment, syncStatus, isPaused } = queue;
  const inProgress = appointments.find((a: any) => a.status === AppointmentStatus.IN_PROGRESS);
  const waiting = appointments.filter((a: any) => a.status === AppointmentStatus.WAITING);
  
  const [showBooking, setShowBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'bot', text: string}[]>([
    { role: 'bot', text: `Welcome! I'm your Wellness Concierge. Looking at our live roster, there are currently ${waiting.length} patients waiting. How can I assist you today?` }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    email: '',
    reason: '', 
    date: new Date().toISOString().split('T')[0],
    time: '' 
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  const handleChat = async (query?: string) => {
    const text = query || chatInput;
    if (!text.trim() || isAiTyping) return;

    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatInput('');
    setIsAiTyping(true);

    const context = {
      currentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      isClinicPaused: isPaused,
      waitingCount: waiting.length,
      currentlyServing: inProgress ? inProgress.patientName : 'No one (Room is free)',
      estimatedNextSlot: waiting.length > 0 ? waiting[0].eta : 'Now',
      estimatedWaitTimeMinutes: waiting.length * CLINIC_CONFIG.slotDuration,
      syncStatus: syncStatus
    };

    try {
      const response = await askChatbot(text, context);
      setChatMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'bot', text: "I'm having trouble connecting to the clinic. Please try again or visit our reception." }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const isSunday = (dateStr: string) => new Date(dateStr).getDay() === 0;

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
        if (!isToday || current > now) slots.push(slotTimeStr);
        current = new Date(current.getTime() + CLINIC_CONFIG.slotDuration * 60000);
      }
    };
    if (!isSunday(formData.date)) {
      generateForShift(CLINIC_CONFIG.morningShift.start, CLINIC_CONFIG.morningShift.end);
      generateForShift(CLINIC_CONFIG.eveningShift.start, CLINIC_CONFIG.eveningShift.end);
    }
    return slots;
  }, [formData.date]);

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time) return;
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
      setFormData({ name: '', phone: '', email: '', reason: '', date: new Date().toISOString().split('T')[0], time: '' });
    }, 2500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Clinic Identity Hero */}
      <section className="bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 flex flex-col md:flex-row min-h-[400px]">
        <div className="md:w-2/5 relative">
          <img 
            src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800" 
            alt="Wellness Center" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-transparent p-10 flex flex-col justify-end">
            <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">{CLINIC_CONFIG.name}</h2>
            <p className="text-indigo-200 font-bold text-lg">{CLINIC_CONFIG.doctorName}</p>
          </div>
        </div>
        <div className="flex-grow p-10 flex flex-col justify-between space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Morning Intake</p>
              <p className="text-xl font-black text-slate-800">{CLINIC_CONFIG.morningShift.start} - {CLINIC_CONFIG.morningShift.end}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evening Intake</p>
              <p className="text-xl font-black text-slate-800">{CLINIC_CONFIG.eveningShift.start} - {CLINIC_CONFIG.eveningShift.end}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
             <button onClick={() => setShowBooking(true)} className="flex-1 bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black shadow-xl hover:-translate-y-1 transition active:scale-95 flex items-center justify-center gap-3">
               Book Appointment <ArrowRightIcon size={18} />
             </button>
             <button className="flex-1 bg-white border-2 border-slate-100 text-slate-700 py-5 rounded-[1.5rem] font-black hover:bg-slate-50 transition flex items-center justify-center gap-3">
               Contact Clinic <PhoneIcon size={18} />
             </button>
          </div>
        </div>
      </section>

      {/* Main Content Split: Live Status & AI Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Live Queue Roster (7 cols) */}
        <section className="lg:col-span-7 bg-slate-900 text-white rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden min-h-[600px]">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-10">
               <div>
                 <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em]">Live Stream v2.0</span>
                 <h3 className="text-4xl font-black tracking-tighter mt-1">Clinical Flow</h3>
               </div>
               <div className="text-right">
                 <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Est. Wait</p>
                 <p className="text-3xl font-black text-indigo-400 tabular-nums">{waiting.length * CLINIC_CONFIG.slotDuration}m</p>
               </div>
            </div>

            <div className="space-y-4 flex-grow">
               <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                       <UserIcon size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">In Consultation</p>
                      <p className="text-2xl font-black">{inProgress ? inProgress.patientName.split(' ')[0] + '***' : 'Available'}</p>
                    </div>
                  </div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
               </div>

               <div className="space-y-3 pt-6">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Wait List History</p>
                  {waiting.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                      <p className="text-slate-500 font-bold italic">No active queue entries</p>
                    </div>
                  ) : (
                    waiting.slice(0, 5).map((app: any, idx: number) => (
                      <div key={app.id} className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-5 rounded-2xl border border-white/5 transition-all">
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-black text-xs">#{idx+1}</div>
                          <p className="font-black text-lg tracking-tight">{app.patientName.split(' ')[0]}***</p>
                        </div>
                        <div className="text-right">
                           <p className="text-xl font-black text-indigo-400 tabular-nums">{app.eta}</p>
                           <p className="text-[10px] font-black text-slate-500 uppercase">Check-in</p>
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
            
            <div className="mt-10 pt-8 border-t border-white/5 text-center">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Secure Clinical Ledger • {syncStatus === 'IDLE' ? 'Synchronized' : 'Connecting'}</p>
            </div>
          </div>
        </section>

        {/* Right Side: Integrated AI Concierge (5 cols) */}
        <section className="lg:col-span-5 flex flex-col bg-white rounded-[3.5rem] shadow-2xl border-2 border-slate-100 overflow-hidden h-[600px]">
          <div className="bg-indigo-600 p-8 text-white shrink-0">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <BotIcon size={24} />
                </div>
                <div>
                  <h4 className="font-black text-xl tracking-tighter leading-none">AI Concierge</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    <p className="text-[10px] font-black uppercase opacity-80 tracking-widest">Active Link</p>
                  </div>
                </div>
             </div>
          </div>

          <div className="flex-grow p-6 space-y-4 overflow-y-auto bg-slate-50">
             {chatMessages.map((m, i) => (
               <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
               </div>
             ))}
             {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
             )}
             <div ref={chatEndRef} />
          </div>

          <div className="p-6 bg-white border-t border-slate-100 space-y-4 shrink-0">
             <div className="flex flex-wrap gap-2">
                <button onClick={() => handleChat("What is the current wait time?")} className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:text-indigo-600 transition">Wait Time?</button>
                <button onClick={() => handleChat("Are there any delays today?")} className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:text-indigo-600 transition">Delays?</button>
                <button onClick={() => handleChat("Where can I park?")} className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 rounded-lg text-[10px] font-black uppercase text-slate-500 hover:text-indigo-600 transition">Parking?</button>
             </div>
             <form onSubmit={(e) => { e.preventDefault(); handleChat(); }} className="relative">
                <input 
                  type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask about status or hours..."
                  className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none pr-14 font-medium"
                />
                <button type="submit" className="absolute right-2 top-2 bg-indigo-600 text-white p-2.5 rounded-xl hover:scale-110 transition active:scale-95 shadow-lg">
                  <SendIcon size={18} />
                </button>
             </form>
          </div>
        </section>
      </div>

      {/* Booking Modal (Simplified for logic) */}
      {showBooking && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-500">
             {bookingSuccess ? (
                <div className="p-20 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xl"><CheckIcon size={40} /></div>
                  <h3 className="text-4xl font-black tracking-tighter">Registration Success</h3>
                  <p className="text-slate-500 font-bold">Expect an SMS confirmation shortly.</p>
                </div>
             ) : (
                <form onSubmit={handleBooking} className="p-10 space-y-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-3xl font-black tracking-tighter uppercase">Intake Form</h3>
                    <button type="button" onClick={() => setShowBooking(false)} className="p-2 bg-slate-100 rounded-xl">✕</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required type="text" placeholder="Patient Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-50 p-4 rounded-xl border-0 font-black"/>
                    <input required type="tel" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="bg-slate-50 p-4 rounded-xl border-0 font-black"/>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Preference</p>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                       {timeSlots.map(t => (
                         <button key={t} type="button" onClick={() => setFormData({...formData, time: t})} className={`px-5 py-3 rounded-xl border-2 shrink-0 font-black text-xs transition ${formData.time === t ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>{t}</button>
                       ))}
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black text-xl shadow-2xl shadow-indigo-600/30">Secure Admission</button>
                </form>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

// Icons
const ArrowRightIcon = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;
const UserIcon = ({ size = 24, className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const BotIcon = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"></path><rect x="4" y="8" width="16" height="12" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>;
const SendIcon = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
const CheckIcon = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const PhoneIcon = ({ size = 18 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;

export default PatientView;
