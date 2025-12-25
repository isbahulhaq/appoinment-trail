
import React, { useState, useRef, useEffect } from 'react';
import { askChatbot } from '../services/geminiService';
import { AppointmentStatus } from '../types';

interface ChatBotProps {
  queueContext: any;
}

const ChatBot: React.FC<ChatBotProps> = ({ queueContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'bot', text: string}[]>([
    { role: 'bot', text: 'Hello! I am your MedQueue Assistant. I have live access to our clinic roster. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasError, setHasError] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  // Handle external chat triggers (e.g., from PatientView chips)
  useEffect(() => {
    const handleTrigger = (e: any) => {
      const { query } = e.detail;
      setIsOpen(true);
      if (query) {
        processMessage(query);
      }
    };

    window.addEventListener('medqueue_chat_trigger', handleTrigger);
    return () => window.removeEventListener('medqueue_chat_trigger', handleTrigger);
  }, [isTyping]);

  const processMessage = async (text: string) => {
    if (isTyping) return;
    
    setHasError(false);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsTyping(true);

    const waiting = queueContext.appointments.filter((a: any) => a.status === AppointmentStatus.WAITING);
    const inProgress = queueContext.appointments.find((a: any) => a.status === AppointmentStatus.IN_PROGRESS);
    
    const context = {
      currentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      isClinicPaused: queueContext.isPaused,
      waitingCount: waiting.length,
      currentlyServing: inProgress ? inProgress.patientName : 'No one (Consultation room is currently empty)',
      estimatedNextSlot: waiting.length > 0 ? waiting[0].eta : 'Now (Immediate availability)',
      lastSlotInQueue: queueContext.appointments.length > 0 ? queueContext.appointments[queueContext.appointments.length - 1].eta : 'Now',
      estimatedWaitTimeMinutes: waiting.length * 15,
      upcomingSlots: waiting.slice(0, 3).map((a: any) => ({ name: a.patientName, eta: a.eta })),
      syncStatus: queueContext.syncStatus
    };

    try {
      const aiResponse = await askChatbot(text, context);
      setMessages(prev => [...prev, { role: 'bot', text: aiResponse }]);
    } catch (err) {
      setHasError(true);
      setMessages(prev => [...prev, { role: 'bot', text: "I'm having trouble syncing with the clinic right now. Please try again or speak with the receptionist." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const userText = input;
    setInput('');
    processMessage(userText);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 border-4 border-white group"
      >
        {isOpen ? <CloseIcon /> : <BotIcon />}
        {queueContext.syncStatus === 'ERROR' && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold">!</span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-12 duration-300">
          <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <BotIcon size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Clinic Assistant</p>
                <div className="flex items-center gap-1">
                   <span className={`w-1.5 h-1.5 rounded-full ${hasError ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                   <p className="text-[10px] opacity-80 uppercase tracking-widest font-black">{hasError ? 'Link Offline' : 'Live Sync Active'}</p>
                </div>
              </div>
            </div>
            {queueContext.syncStatus === 'SYNCING' && <div className="animate-spin text-white/50"><SyncIcon size={14} /></div>}
          </div>

          <div ref={scrollRef} className="flex-grow p-4 space-y-4 h-[350px] md:h-[400px] overflow-y-auto bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex gap-2">
            <input 
              type="text"
              value={input}
              disabled={isTyping}
              onChange={e => setInput(e.target.value)}
              placeholder={isTyping ? "Consulting roster..." : "Ask about wait times or status..."}
              className="flex-grow bg-slate-100 border-0 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition disabled:opacity-50 font-medium"
            />
            <button 
              disabled={isTyping || !input.trim()}
              className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 shadow-md active:scale-95"
            >
              <SendIcon />
            </button>
          </form>
          <div className="px-4 py-2 bg-slate-50 text-[8px] text-slate-400 text-center uppercase font-bold tracking-tighter">
            Clinical Data Integrity: Verified
          </div>
        </div>
      )}
    </>
  );
};

const BotIcon = ({ size = 28 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"></path><rect x="4" y="8" width="16" height="12" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;
const SyncIcon = ({ size = 20 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 12c0-4.4 3.6-8 8-8 3.3 0 6.2 2 7.4 5M22 12c0 4.4-3.6 8-8 8-3.3 0-6.2-2-7.4-5"/></svg>;

export default ChatBot;
