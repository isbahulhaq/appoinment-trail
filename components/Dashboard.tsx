
import React, { useState } from 'react';
import { UserRole, AppointmentStatus, Priority, Appointment } from '../types';
import LiveTimer from './LiveTimer';
import { CLINIC_CONFIG } from '../constants';

interface DashboardProps {
  role: UserRole;
  queue: {
    appointments: Appointment[];
    startConsultation: (id: string) => void;
    completeConsultation: (id: string) => void;
    addAppointment: (data: Partial<Appointment>) => void;
    isPaused: boolean;
    setIsPaused: (val: boolean) => void;
  };
}

const Dashboard: React.FC<DashboardProps> = ({ role, queue }) => {
  const { appointments, startConsultation, completeConsultation, addAppointment, isPaused, setIsPaused } = queue;
  
  const [viewTab, setViewTab] = useState<'WAITING' | 'COMPLETED'>('WAITING');
  const inProgress = appointments.find((a) => a.status === AppointmentStatus.IN_PROGRESS);
  const waiting = appointments.filter((a) => a.status === AppointmentStatus.WAITING);
  const completed = appointments.filter((a) => a.status === AppointmentStatus.COMPLETED);
  const nextUp = waiting[0];

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ patientName: '', phone: '', email: '', priority: Priority.NORMAL, reason: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addAppointment(formData);
    setShowAddModal(false);
    setFormData({ patientName: '', phone: '', email: '', priority: Priority.NORMAL, reason: '' });
  };

  const displayedAppointments = viewTab === 'WAITING' ? waiting : completed;

  return (
    <div className={`space-y-8 transition-all duration-500 ${isPaused ? 'opacity-70 grayscale-[0.2]' : 'opacity-100'}`}>
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
            <ClinicIcon />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
              {role === UserRole.DOCTOR ? `Dr. Mitchell's Panel` : 'Front Desk Portal'}
            </h1>
            <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
              <CalendarIcon />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase">
                    <PauseIcon size={10} /> Paused
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Active
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {role === UserRole.RECEPTIONIST && (
            <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl hover:-translate-y-1 transition flex items-center gap-2">
              <PlusIcon /> <span>New Admission</span>
            </button>
          )}
          {role === UserRole.DOCTOR && (
            <button onClick={() => setIsPaused(!isPaused)} className={`px-6 py-3 rounded-2xl font-black shadow-xl transition flex items-center gap-2 ${isPaused ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border-2'}`}>
              {isPaused ? <PlayIcon size={18} /> : <PauseIcon size={18} />} {isPaused ? 'Open Clinic' : 'Pause Intake'}
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">In Consultation</p>
          {inProgress ? (
            <div className="space-y-3">
              <p className="text-xl font-black text-slate-900 truncate tracking-tight">{inProgress.patientName}</p>
              <LiveTimer startTime={inProgress.actualStartTime} />
              {role === UserRole.DOCTOR && (
                <button onClick={() => completeConsultation(inProgress.id)} className="w-full mt-3 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase">Complete Visit</button>
              )}
            </div>
          ) : (
            <div className="py-2"><p className="text-slate-400 font-bold italic">Station Available</p></div>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Next in Line</p>
          {nextUp ? (
            <div className="space-y-3">
              <p className="text-xl font-black text-slate-900 tracking-tight">{nextUp.patientName}</p>
              <p className="text-sm font-black text-indigo-600 uppercase">ETA: {nextUp.eta}</p>
              {role === UserRole.DOCTOR && (
                <button onClick={() => startConsultation(nextUp.id)} className="w-full mt-3 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase">Call Patient</button>
              )}
            </div>
          ) : (
            <p className="text-slate-400 font-bold italic py-2">Queue Clear</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Room Volume</p>
            <span className="text-4xl font-black text-slate-900">{waiting.length} Waiting</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Clinic Flow</p>
            <span className="text-4xl font-black text-emerald-600">{completed.length} Healed</span>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-2xl overflow-hidden">
        <div className="px-10 py-8 flex items-center justify-between border-b-2">
            <h2 className="font-black text-slate-900 text-xl tracking-tighter uppercase">Live Roster</h2>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setViewTab('WAITING')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase ${viewTab === 'WAITING' ? 'bg-white text-indigo-600' : 'text-slate-500'}`}>Waiting ({waiting.length})</button>
              <button onClick={() => setViewTab('COMPLETED')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase ${viewTab === 'COMPLETED' ? 'bg-white text-emerald-600' : 'text-slate-500'}`}>Completed ({completed.length})</button>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="px-10 py-5 text-left">ETA/Seq</th>
                <th className="px-10 py-5 text-left">Patient Identity</th>
                <th className="px-10 py-5 text-left">Contact Data</th>
                <th className="px-10 py-5 text-left">Priority</th>
                <th className="px-10 py-5 text-right">Ops</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayedAppointments.map((app, idx) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="px-10 py-6 font-black text-indigo-600">{viewTab === 'WAITING' ? app.eta : idx+1}</td>
                  <td className="px-10 py-6 font-black">{app.patientName}</td>
                  <td className="px-10 py-6 text-xs text-slate-500 font-bold">{app.phone} <br/> {app.email}</td>
                  <td className="px-10 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${app.priority === Priority.EMERGENCY ? 'bg-red-50 text-red-700' : 'bg-slate-100'}`}>
                      {app.priority}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    {viewTab === 'WAITING' && role === UserRole.DOCTOR && (
                       <button onClick={() => startConsultation(app.id)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase">Call</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="bg-indigo-600 p-10 text-white relative">
              <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 p-3 bg-white/10 rounded-2xl transition-all">✕</button>
              <h3 className="text-3xl font-black uppercase">Admission</h3>
            </div>
            
            <form onSubmit={handleAdd} className="p-10 space-y-6">
              <input 
                type="text" required value={formData.patientName} placeholder="Full Name"
                onChange={e => setFormData({...formData, patientName: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 font-black"
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="tel" required value={formData.phone} placeholder="Phone"
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 font-black"
                />
                <input 
                  type="email" required value={formData.email} placeholder="Email"
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 font-black"
                />
              </div>
              <textarea 
                value={formData.reason} placeholder="Reason for Visit"
                onChange={e => setFormData({...formData, reason: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 font-bold"
              ></textarea>
              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-6 rounded-[2rem] shadow-xl uppercase">Inject into Live Queue</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ClinicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49 0 2.87-.47 4-1.26V17a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v2.46c-1.13-.79-2.51-1.26-4-1.26-3.87 0-7 3.13-7 7s3.13 7 7 7Z"/><circle cx="19" cy="14" r="4"/><path d="M19 12v4"/><path d="M17 14h4"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const PauseIcon = ({ size = 18 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>;
const PlayIcon = ({ size = 18 }: { size?: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;

export default Dashboard;
