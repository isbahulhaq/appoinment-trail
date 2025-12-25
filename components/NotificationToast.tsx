
import React, { useState, useEffect } from 'react';

const NotificationToast: React.FC = () => {
  const [toasts, setToasts] = useState<{id: number, type: string, message: string}[]>([]);

  useEffect(() => {
    const handleNotification = (e: any) => {
      const { type, message } = e.detail;
      const id = Date.now();
      setToasts(prev => [...prev, { id, type, message }]);
      
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };

    window.addEventListener('medqueue_notification', handleNotification);
    return () => window.removeEventListener('medqueue_notification', handleNotification);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-[100] space-y-3 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="bg-white border-2 border-indigo-100 shadow-2xl rounded-2xl p-4 w-72 flex items-start gap-3 animate-in slide-in-from-right duration-300 pointer-events-auto">
          <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'SMS' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {toast.type === 'SMS' ? <SmsIcon /> : <EmailIcon />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{toast.type} Dispatched</p>
            <p className="text-xs font-bold text-slate-700 leading-snug">{toast.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const SmsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const EmailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>;

export default NotificationToast;
