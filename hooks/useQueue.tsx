
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Appointment, AppointmentStatus, Priority } from '../types.ts';
import { INITIAL_APPOINTMENTS } from '../constants.ts';
import { sendNotification } from '../services/notificationService.ts';

const STORAGE_KEY = 'medqueue_appointments_v1';

const validateAppointment = (data: any): data is Appointment => {
  return (
    data &&
    typeof data.id === 'string' &&
    typeof data.patientName === 'string' &&
    data.status !== undefined &&
    data.priority !== undefined
  );
};

export const useQueue = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every(validateAppointment)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Clinical data sync error. Reverting to backup.", e);
    }
    return INITIAL_APPOINTMENTS.map(a => ({ 
      ...a, 
      phone: '555-0100', 
      email: 'patient@example.com' 
    })) as Appointment[];
  });

  const [isPaused, setIsPaused] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'ERROR'>('IDLE');
  
  const prevAppointmentsRef = useRef<Appointment[]>([]);

  useEffect(() => {
    try {
      setSyncStatus('SYNCING');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
      setSyncStatus('IDLE');
    } catch (e) {
      console.error("Ledger write failure:", e);
      setSyncStatus('ERROR');
    }
  }, [appointments]);

  const appointmentsWithETA = useMemo(() => {
    try {
      const now = new Date();
      let currentTime = now;
      const currentInProgress = appointments.find(a => a.status === AppointmentStatus.IN_PROGRESS);
      
      if (currentInProgress && currentInProgress.actualStartTime) {
        const startTime = new Date(currentInProgress.actualStartTime);
        currentTime = new Date(startTime.getTime() + (currentInProgress.estimatedDuration || 15) * 60000);
        if (currentTime < now) currentTime = now;
      }

      return appointments.map(app => {
        if (app.status !== AppointmentStatus.WAITING) return app;
        const [schedH, schedM] = (app.scheduledTime || "00:00").split(':').map(Number);
        const schedDate = new Date();
        schedDate.setHours(schedH || 0, schedM || 0, 0, 0);
        let etaTime = currentTime > schedDate ? currentTime : schedDate;
        const etaStr = etaTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        currentTime = new Date(etaTime.getTime() + (app.estimatedDuration || 15) * 60000);
        return { ...app, eta: etaStr };
      });
    } catch (e) {
      console.error("ETA Logic Error:", e);
      return appointments;
    }
  }, [appointments]);

  useEffect(() => {
    appointmentsWithETA.forEach(app => {
      const prev = prevAppointmentsRef.current.find(p => p.id === app.id);
      if (!prev) return;
      if (prev.status !== app.status && app.status === AppointmentStatus.IN_PROGRESS) {
        sendNotification({ to: app.phone, patientName: app.patientName, type: 'SMS', event: 'IN_PROGRESS' });
      }
    });
    prevAppointmentsRef.current = appointmentsWithETA;
  }, [appointmentsWithETA]);

  const startConsultation = useCallback((id: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) return { ...a, status: AppointmentStatus.IN_PROGRESS, actualStartTime: new Date().toISOString() };
      if (a.status === AppointmentStatus.IN_PROGRESS) return { ...a, status: AppointmentStatus.COMPLETED, actualEndTime: new Date().toISOString() };
      return a;
    }));
  }, []);

  const completeConsultation = useCallback((id: string) => {
    setAppointments(prev => prev.map(a => 
      a.id === id ? { ...a, status: AppointmentStatus.COMPLETED, actualEndTime: new Date().toISOString() } : a
    ));
  }, []);

  const addAppointment = useCallback((data: Partial<Appointment>) => {
    const newApp: Appointment = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      patientId: 'p-' + Date.now(),
      patientName: data.patientName || 'Unknown Patient',
      phone: data.phone || '555-0000',
      email: data.email || 'patient@example.com',
      date: data.date || new Date().toISOString().split('T')[0],
      scheduledTime: data.scheduledTime || "10:00",
      estimatedDuration: data.estimatedDuration || 15,
      status: AppointmentStatus.WAITING,
      priority: data.priority || Priority.NORMAL,
      reason: data.reason || 'Consultation',
    };
    setAppointments(prev => [...prev, newApp].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)));
    sendNotification({ to: newApp.phone, patientName: newApp.patientName, type: 'SMS', event: 'BOOKED', data: { time: newApp.scheduledTime, date: newApp.date } });
  }, []);

  return { appointments: appointmentsWithETA, startConsultation, completeConsultation, addAppointment, isPaused, setIsPaused, syncStatus };
};
