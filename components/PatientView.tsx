
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppointmentStatus, Priority } from '../types.ts';
import { CLINIC_CONFIG } from '../constants.ts';
import { askChatbot } from '../services/geminiService.ts';

interface PatientViewProps {
  queue: any;
}

const PatientView: React.FC<PatientViewProps> = ({ queue }) => {
  const { appointments = [], addAppointment, syncStatus, isPaused } = queue;
  
  const inProgress = appointments.find((a: any) => a.status === AppointmentStatus.IN_PROGRESS);
  const waiting = appointments.filter((a: any) => a.status === AppointmentStatus.WAITING);
  
  const [showBooking, setShowBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'bot', text: string}[]>([
    { role: 'bot', text: "Welcome to the Wellness Clinic. I'm your digital concierge. How can I help you navigate your visit today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({ 
    name: '', phone: '', email: '', reason: '', 
    date: new Date().toISOString().split('T')[0], time: '' 
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
      currentlyServing: inProgress ? inProgress.patientName : 'No active session',
      estimatedWaitTimeMinutes: waiting.length * CLINIC_CONFIG.slotDuration,
      syncStatus: syncStatus
    };

    try {
      const response = await askChatbot(text, context);
      setChatMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'bot', text: "Service temporary unavailable. Please see our reception." }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const now = new Date();
    const isToday = formData.date === now.toISOString().split('T')[0];
    
    const generate = (startStr: string, endStr: string) => {
      const [sh, sm] = startStr.split(':').map(Number);
      const [eh, em] = endStr.split(':').map(Number);
      let curr = new Date(formData.date); curr.setHours(sh, sm, 0, 0);
      const end = new Date(formData.date); end.setHours(eh, em, 0, 0);
      
      while (curr < end) {
        const str = curr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        if (!isToday || curr > now) slots.push(str);
        curr = new Date(curr.getTime() + CLINIC_CONFIG.slotDuration * 60000);
      }
    };

    generate(CLINIC_CONFIG.morningShift.start, CLINIC_CONFIG.morningShift.end);
    generate(CLINIC_CONFIG.eveningShift.start, CLINIC_CONFIG.eveningShift.end);
    return slots;
  }, [formData.date]);

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time) return;
    addAppointment(formData);
    setBookingSuccess(true);
    setTimeout(() => {
      setShowBooking(false);
      setBookingSuccess(false);
      setFormData({ name: '', phone: '', email: '', reason: '', date: new Date().toISOString().split('T')[0], time: '' });
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Dynamic Header */}
      <section className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
            <ClinicIcon size={36} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{CLINIC_CONFIG.name}</h1>
            <p className="text-slate-500 font-bold mt-1">{CLINIC_CONFIG.doctorName} • Family Health Specialist</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowBooking(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:-translate-y-1 transition active:scale-95">Book Now</button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Live Queue Status */}
        <div className="lg:col-span-7 bg-slate-900 text-white rounded-[3rem] p-10 flex flex-col min-h-[550px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex justify-between items-start mb-12">
            <div>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Live Clinical Roster</p>
              <h2 className="text-4xl font-black tracking-tighter">Queue Dashboard</h2>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl text-center min-w-[120px]">
              <p className="text-[10px] font-black uppercase text-indigo-400">Current Wait</p>
              <p className="text-3xl font-black tabular-nums">{waiting.length * CLINIC_CONFIG.slotDuration}m</p>
            </div>
          </div>

          <div className="space-y-6 flex-grow relative z-10">
            {/* In Progress */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <UserIcon size={24} color="white" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">In Consultation</p>
                  <p className="text-2xl font-black">{inProgress ? inProgress.patientName.split(' ')[0] + '***' : 'Ready for Intake'}</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]"></span>
                <p className="text-[8px] font-black text-slate-500 mt-2 uppercase">Live</p>
              </div>
            </div>

            {/* Waiting List */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 mb-4">Upcoming check-ins</p>
              {waiting.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-3xl">
                  <p className="text-slate-500 font-bold">No patients currently in queue</p>
                </div>
              ) : (
                waiting.slice(0, 4).map((app: any, idx: number) => (
                  <div key={app.id} className="flex items-center justify-between bg-white/5 p-5 rounded-2xl hover:bg-white/10 transition">
                    <div className="flex items-center gap-5">
                      <div className="text-xs font-black text-slate-600">#{idx + 1}</div>
                      <p className="font-bold text-lg tracking-tight">{app.patientName.split(' ')[0]}***</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-indigo-400 tabular-nums">{app.eta}</p>
                      <p className="text-[8px] font-black text-slate-600 uppercase">Estimated</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* AI Concierge */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-[3rem] shadow-xl overflow-hidden flex flex-col h-[550px]">
          <div className="bg-indigo-600 p-6 text-white flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><BotIcon size={24} /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-indigo-200">Wellness AI</p>
              <h3 className="font-black text-xl tracking-tight leading-none">Smart Assistant</h3>
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
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm flex gap-1 animate-pulse">
                  <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-6 border-t border-slate-100 space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {["Check Wait Time", "Clinic Hours", "Parking Info"].map(chip => (
                <button key={chip} onClick={() => handleChat(chip)} className="whitespace-nowrap px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition">
                  {chip}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleChat(); }} className="relative">
              <input 
                type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about status..."
                className="w-full bg-slate-100 border-0 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none pr-12 font-medium"
              />
              <button type="submit" className="absolute right-3 top-3 bg-indigo-600 text-white p-2 rounded-xl shadow-md"><SendIcon size={16} /></button>
            </form>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      {showBooking && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95">
            {bookingSuccess ? (
              <div className="p-20 text-center space-y-6">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"><CheckIcon size={40} /></div>
                <h3 className="text-3xl font-black tracking-tighter">Registration Confirmed</h3>
                <p className="text-slate-500 font-bold">You will receive an SMS reminder shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="p-10 space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-black tracking-tighter uppercase">Clinical Intake</h3>
                  <button type="button" onClick={() => setShowBooking(false)} className="text-slate-400 hover:text-slate-900">✕</button>
                </div>
                <div className="space-y-4">
                  <input required placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-100 p-4 rounded-xl border-0 font-bold" />
                  <input required type="tel" placeholder="Mobile (for SMS update)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-100 p-4 rounded-xl border-0 font-bold" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-slate-100 p-4 rounded-xl border-0 font-bold" />
                    <select required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="bg-slate-100 p-4 rounded-xl border-0 font-bold">
                      <option value="">Time Slot</option>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <textarea placeholder="Primary Symptom/Reason" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="w-full bg-slate-100 p-4 rounded-xl border-0 font-bold h-24" />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black text-xl shadow-lg hover:bg-indigo-700 transition">Confirm Booking</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ClinicIcon = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49 0 2.87-.47 4-1.26V17a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v2.46c-1.13-.79-2.51-1.26-4-1.26-3.87 0-7 3.13-7 7s3.13 7 7 7Z"/><circle cx="19" cy="14" r="4"/><path d="M19 12v4"/><path d="M17 14h4"/></svg>;
const UserIcon = ({ size = 24, color = "currentColor" }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const BotIcon = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>;
const SendIcon = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const CheckIcon = ({ size = 24 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

export default PatientView;
