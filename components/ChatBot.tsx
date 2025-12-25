
import React, { useState, useRef, useEffect } from 'react';
import { askChatbot } from '../services/geminiService';

interface ChatBotProps {
  queueContext: any;
}

const ChatBot: React.FC<ChatBotProps> = ({ queueContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'bot', text: string}[]>([
    { role: 'bot', text: 'Hello! I am your MedQueue Assistant. How can I help you today? (Booking, Clinic Hours, Queue Status)' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsTyping(true);

    const context = {
      queueSize: queueContext.appointments.filter((a:any) => a.status === 'WAITING').length,
      nextAvailable: queueContext.appointments.length > 0 ? queueContext.appointments[queueContext.appointments.length-1].eta : 'Now',
      inProgress: queueContext.appointments.find((a:any) => a.status === 'IN_PROGRESS')?.patientName
    };

    const aiResponse = await askChatbot(userText, context);
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'bot', text: aiResponse }]);
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
        <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-12 duration-300">
          <div className="bg-indigo-600 p-4 text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <BotIcon size={20} />
            </div>
            <div>
              <p className="font-bold text-sm">Clinic Assistant</p>
              <p className="text-[10px] opacity-80 uppercase tracking-widest font-black">AI Support • Online</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-grow p-4 space-y-4 max-h-[400px] overflow-y-auto bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                  m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
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
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about timings, status..."
              className="flex-grow bg-slate-100 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
            <button className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition">
              <SendIcon />
            </button>
          </form>
          <div className="px-4 py-2 bg-slate-50 text-[8px] text-slate-400 text-center uppercase font-bold tracking-tighter">
            AI Assistant cannot provide medical diagnosis. In emergency, call 911.
          </div>
        </div>
      )}
    </>
  );
};

const BotIcon = ({ size = 28 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"></path><rect x="4" y="8" width="16" height="12" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;

export default ChatBot;
