
import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import Dashboard from './components/Dashboard';
import ChatBot from './components/ChatBot';
import { useQueue } from './hooks/useQueue';
import PatientView from './components/PatientView';
import NotificationToast from './components/NotificationToast';
import Login from './components/Login';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queue = useQueue();

  // Check for existing session
  useEffect(() => {
    const savedRole = sessionStorage.getItem('medqueue_role') as UserRole;
    const authStatus = sessionStorage.getItem('medqueue_auth') === 'true';
    if (savedRole && (savedRole === UserRole.PATIENT || authStatus)) {
      setRole(savedRole);
      setIsAuthenticated(authStatus);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('medqueue_role');
    sessionStorage.removeItem('medqueue_auth');
    setRole(null);
    setIsAuthenticated(false);
  };

  if (!role) {
    return <Login onSelectRole={(selectedRole, isAuth) => {
      setRole(selectedRole);
      setIsAuthenticated(isAuth);
      sessionStorage.setItem('medqueue_role', selectedRole);
      sessionStorage.setItem('medqueue_auth', isAuth.toString());
    }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Professional Header */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">M</div>
          <span className="font-black text-slate-900 tracking-tighter uppercase text-sm">MedQueue <span className="text-indigo-600">Pro</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
            <div className={`w-2 h-2 rounded-full ${role === UserRole.DOCTOR ? 'bg-red-500' : role === UserRole.RECEPTIONIST ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{role} Portal</span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-[10px] font-black text-slate-400 hover:text-red-600 uppercase tracking-widest transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="flex-grow container mx-auto px-4 py-6">
        {role === UserRole.PATIENT ? (
          <PatientView queue={queue} />
        ) : isAuthenticated ? (
          <Dashboard role={role} queue={queue} />
        ) : (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-red-500 font-bold">Unauthorized Access Attempted.</p>
          </div>
        )}
      </main>

      {/* Persistent Global Chatbot (Accessible to all for support) */}
      <ChatBot queueContext={queue} />
      
      <NotificationToast />
    </div>
  );
};

export default App;
