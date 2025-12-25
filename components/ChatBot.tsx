
import React, { useState, useRef, useEffect } from 'react';
import { askChatbot } from '../services/geminiService';
import { AppointmentStatus } from '../types';

interface ChatBotProps {
  queueContext: any;
}

const ChatBot: React.FC<ChatBotProps> = ({ queueContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'bot', text: string}[]>([
    { role: 'bot', text: 'Namaste! I am your Clinic Assistant. Main aapki queue aur clinic timing mein madad kar sakta hoon. How can I help?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const processMessage = async (text: string) => {
    if (isTyping || !text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsTyping(true);

    const waiting = (queueContext.appointments || []).filter((a: any) => a.status === AppointmentStatus.WAITING);
    const inProgress = (queueContext.appointments || []).find((a: any) => a.status === AppointmentStatus.IN_PROGRESS);
    
    const context = {
      currentTime: new Date().toLocaleTimeString(),
      isClinicPaused: queueContext.isPaused,
      waitingCount: waiting.length,
      currentlyServing: inProgress ? inProgress.patientName : 'None',
      estimatedWaitTime: waiting.length * 15 + " minutes",
      syncStatus: queueContext.syncStatus
    };

    try {
      const aiResponse = await askChatbot(text, context);
      setMessages(prev => [...prev, { role: 'bot', text: aiResponse }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Server connection error. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const userText = input;
    setInput('');
    processMessage(userText);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 border-4 border-white"
      >
        {isOpen ? <CloseIcon /> : <BotIcon />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[90vw] md:w-96 bg-white rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-8">
          <div className="bg-indigo-600 p-5 text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"><BotIcon size={20} /></div>
            <div>
              <p className="font-black text-sm uppercase tracking-wider">Health Assistant</p>
              <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Bilingual Support (Hindi/English)</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-grow p-5 space-y-4 h-[400px] overflow-y-auto bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100 animate-pulse text-[10px] font-black uppercase text-indigo-400">
                  AI is thinking...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex gap-2">
            <input 
              type="text" value={input} onChange={e => setInput(e.target.value)}
              placeholder="Type in Hindi or English..."
              className="flex-grow bg-slate-100 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
            />
            <button className="bg-indigo-600 text-white p-3 rounded-xl shadow-md"><SendIcon /></button>
          </form>
        </div>
      )}
    </>
  );
};

const BotIcon = ({ size = 28 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;

export default ChatBot;
