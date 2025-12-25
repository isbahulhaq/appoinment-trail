
import React, { useState } from 'react';
import { UserRole } from './types';
import Dashboard from './components/Dashboard';
import ChatBot from './components/ChatBot';
import { useQueue } from './hooks/useQueue';
import PatientView from './components/PatientView';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.RECEPTIONIST);
  const queue = useQueue();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Role Switcher (For Demo Only) */}
      <div className="bg-indigo-900 text-white p-2 flex justify-center gap-4 text-xs font-semibold uppercase tracking-wider sticky top-0 z-50">
        <span>Logged in as:</span>
        <button 
          onClick={() => setRole(UserRole.DOCTOR)} 
          className={`px-3 py-1 rounded transition ${role === UserRole.DOCTOR ? 'bg-white text-indigo-900' : 'hover:bg-indigo-800'}`}
        >
          Doctor
        </button>
        <button 
          onClick={() => setRole(UserRole.RECEPTIONIST)} 
          className={`px-3 py-1 rounded transition ${role === UserRole.RECEPTIONIST ? 'bg-white text-indigo-900' : 'hover:bg-indigo-800'}`}
        >
          Receptionist
        </button>
        <button 
          onClick={() => setRole(UserRole.PATIENT)} 
          className={`px-3 py-1 rounded transition ${role === UserRole.PATIENT ? 'bg-white text-indigo-900' : 'hover:bg-indigo-800'}`}
        >
          Patient View
        </button>
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
    </div>
  );
};

export default App;
