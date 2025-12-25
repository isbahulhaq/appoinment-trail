
import React, { useState } from 'react';
import { UserRole } from './types';
import Dashboard from './components/Dashboard';
import ChatBot from './components/ChatBot';
import { useQueue } from './hooks/useQueue';
import PatientView from './components/PatientView';
import NotificationToast from './components/NotificationToast';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.RECEPTIONIST);
  const queue = useQueue();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Role Switcher (For Demo Only) */}
      <div className="bg-indigo-900 text-white p-2 flex justify-center gap-4 text-xs font-semibold uppercase tracking-wider sticky top-0 z-50 shadow-lg">
        <span>Logged in as:</span>
        <div className="flex bg-indigo-800 rounded-lg p-0.5">
          <button 
            onClick={() => setRole(UserRole.DOCTOR)} 
            className={`px-3 py-1 rounded-md transition ${role === UserRole.DOCTOR ? 'bg-white text-indigo-900' : 'hover:bg-indigo-700/50'}`}
          >
            Doctor
          </button>
          <button 
            onClick={() => setRole(UserRole.RECEPTIONIST)} 
            className={`px-3 py-1 rounded-md transition ${role === UserRole.RECEPTIONIST ? 'bg-white text-indigo-900' : 'hover:bg-indigo-700/50'}`}
          >
            Receptionist
          </button>
          <button 
            onClick={() => setRole(UserRole.PATIENT)} 
            className={`px-3 py-1 rounded-md transition ${role === UserRole.PATIENT ? 'bg-white text-indigo-900' : 'hover:bg-indigo-700/50'}`}
          >
            Patient View
          </button>
        </div>
      </div>

      <main className="flex-grow container mx-auto px-4 py-6">
        {role === UserRole.PATIENT ? (
          <PatientView queue={queue} />
        ) : (
          <Dashboard role={role} queue={queue} />
        )}
      </main>

      {/* Persistent Global Chatbot */}
      <ChatBot queueContext={queue} />
      
      {/* Simulation Feedback */}
      <NotificationToast />
    </div>
  );
};

export default App;
