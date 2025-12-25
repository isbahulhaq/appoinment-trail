
import React, { useState } from 'react';
import { UserRole, AppointmentStatus, Priority } from '../types';
import LiveTimer from './LiveTimer';
import { CLINIC_CONFIG } from '../constants';

interface DashboardProps {
  role: UserRole;
  queue: any;
}

const Dashboard: React.FC<DashboardProps> = ({ role, queue }) => {
  const { appointments, startConsultation, completeConsultation, addAppointment, isPaused, setIsPaused } = queue;
  const inProgress = appointments.find((a: any) => a.status === AppointmentStatus.IN_PROGRESS);
  const waiting = appointments.filter((a: any) => a.status === AppointmentStatus.WAITING);
  const completed = appointments.filter((a: any) => a.status === AppointmentStatus.COMPLETED);

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ patientName: '', priority: Priority.NORMAL, reason: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addAppointment(formData);
    setShowAddModal(false);
    setFormData({ patientName: '', priority: Priority.NORMAL, reason: '' });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {role === UserRole.DOCTOR ? `Welcome, ${CLINIC_CONFIG.doctorName}` : 'Reception Dashboard'}
          </h1>
          <p className="text-slate-500">Managing {CLINIC_CONFIG.name} Queue • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          {role === UserRole.RECEPTIONIST && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
            >
              <PlusIcon /> New Patient
            </button>
          )}
          {role === UserRole.DOCTOR && (
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className={`${isPaused ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'} text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2`}
            >
              {isPaused ? <PlayIcon /> : <PauseIcon />} {isPaused ? 'Resume Clinic' : 'Pause Clinic'}
            </button>
          )}
        </div>
      </header>

      {/* Top Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">In Consultation</p>
          {inProgress ? (
            <div>
              <p className="text-xl font-bold text-indigo-600 mb-2">{inProgress.patientName}</p>
              <LiveTimer startTime={inProgress.actualStartTime} />
            </div>
          ) : (
            <p className="text-xl font-bold text-slate-300">No active session</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Queue Status</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{waiting.length}</span>
            <span className="text-slate-500">Patients waiting</span>
          </div>
          <p className="text-sm text-indigo-600 mt-2 font-medium">Est. Wait: {waiting.length * 15} mins</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wider">Completed Today</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{completed.length}</span>
            <span className="text-slate-500">Sessions</span>
          </div>
          <p className="text-sm text-slate-400 mt-2">Target: 32 per shift</p>
        </div>
      </div>

      {/* Main Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Live Waiting List</h2>
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase">Dynamic Ranking</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-3">ETA</th>
                <th className="px-6 py-3">Patient</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Reason</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {waiting.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">No patients in the queue.</td>
                </tr>
              ) : (
                waiting.map((app: any) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition group">
                    <td className="px-6 py-4 font-mono font-medium text-indigo-600">{app.eta}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{app.patientName}</div>
                      <div className="text-xs text-slate-400">ID: {app.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${app.priority === Priority.EMERGENCY ? 'bg-red-100 text-red-700 ring-1 ring-red-400' : 'bg-slate-100 text-slate-600'}`}>
                        {app.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{app.reason}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-tight">Waiting</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => startConsultation(app.id)}
                        className="opacity-0 group-hover:opacity-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto"
                      >
                        <ArrowRightIcon /> Start Now
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for adding patient */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold">Add New Appointment</h3>
              <button onClick={() => setShowAddModal(false)} className="hover:bg-white/10 p-1 rounded transition">✕</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Patient Name</label>
                <input 
                  type="text" required
                  value={formData.patientName}
                  onChange={e => setFormData({...formData, patientName: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Priority</label>
                  <select 
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value as Priority})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={Priority.NORMAL}>Normal</option>
                    <option value={Priority.EMERGENCY}>Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Duration (Min)</label>
                  <select className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>15</option>
                    <option>30</option>
                    <option>45</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Reason / Symptoms</label>
                <textarea 
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Brief description..."
                ></textarea>
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition transform active:scale-95"
              >
                Insert into Queue
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Icons
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>;
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>;

export default Dashboard;
