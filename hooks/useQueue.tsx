
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Appointment, AppointmentStatus, Priority } from '../types';
import { INITIAL_APPOINTMENTS } from '../constants';
import { sendNotification } from '../services/notificationService';

const STORAGE_KEY = 'medqueue_appointments_v1';

const validateAppointment = (data: any): data is Appointment => {
  return (
    typeof data.id === 'string' &&
    typeof data.patientName === 'string' &&
    Object.values(AppointmentStatus).includes(data.status) &&
    Object.values(Priority).includes(data.priority)
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
      console.error("Corrupted clinical data detected. Resetting to defaults.", e);
    }
    // Transform initial appointments to match new schema
    return INITIAL_APPOINTMENTS.map(a => ({ ...a, phone: '555-0100', email: 'patient@example.com' })) as Appointment[];
  });

  const [isPaused, setIsPaused] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'ERROR'>('IDLE');
  
  // Track previous statuses to trigger notifications on change
  const prevAppointmentsRef = useRef<Appointment[]>([]);

  useEffect(() => {
    try {
      setSyncStatus('SYNCING');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
      setSyncStatus('IDLE');
    } catch (e) {
      console.error("Local storage write failure:", e);
      setSyncStatus('ERROR');
    }
  }, [appointments]);

  // Derived ETAs Calculation
  const appointmentsWithETA = useMemo(() => {
    try {
      const now = new Date();
      let currentTime = now;

      const currentInProgress = appointments.find(a => a.status === AppointmentStatus.IN_PROGRESS);
      
      if (currentInProgress && currentInProgress.actualStartTime) {
        const startTime = new Date(currentInProgress.actualStartTime);
        currentTime = new Date(startTime.getTime() + currentInProgress.estimatedDuration * 60000);
        if (currentTime < now) currentTime = now;
      }

      return appointments.map(app => {
        if (app.status !== AppointmentStatus.WAITING) return app;

        const [schedH, schedM] = (app.scheduledTime || "00:00").split(':').map(Number);
        const schedDate = new Date();
        schedDate.setHours(schedH, schedM, 0, 0);
        
        let etaTime = currentTime > schedDate ? currentTime : schedDate;
        const etaStr = etaTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        
        currentTime = new Date(etaTime.getTime() + app.estimatedDuration * 60000);
        return { ...app, eta: etaStr };
      });
    } catch (e) {
      console.error("ETA Calculation Error:", e);
      return appointments;
    }
  }, [appointments]);

  // Notification Monitoring Effect
  useEffect(() => {
    appointmentsWithETA.forEach(app => {
      const prev = prevAppointmentsRef.current.find(p => p.id === app.id);
      if (!prev) return;

      // Status Change Notifications
      if (prev.status !== app.status) {
        if (app.status === AppointmentStatus.IN_PROGRESS) {
          sendNotification({ 
            to: app.phone, 
            patientName: app.patientName, 
            type: 'SMS', 
            event: 'IN_PROGRESS' 
          });
        } else if (app.status === AppointmentStatus.COMPLETED) {
          sendNotification({ 
            to: app.email || app.phone, 
            patientName: app.patientName, 
            type: 'EMAIL', 
            event: 'COMPLETED' 
          });
        }
      }

      // Significant ETA Change Notifications (>= 10 mins)
      if (app.status === AppointmentStatus.WAITING && prev.eta && app.eta && prev.eta !== app.eta) {
        // Simple string comparison for demo, but in production we'd use date math
        // For now, if the string changes, we consider it an update
        const [ph, pm] = prev.eta.split(':').map(Number);
        const [ch, cm] = app.eta.split(':').map(Number);
        const diff = Math.abs((ch * 60 + cm) - (ph * 60 + pm));
        
        if (diff >= 10) {
          sendNotification({
            to: app.phone,
            patientName: app.patientName,
            type: 'SMS',
            event: 'ETA_UPDATE',
            data: { eta: app.eta }
          });
        }
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
    if (!data.patientName) return;

    const newApp: Appointment = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      patientId: 'p-' + Date.now(),
      patientName: data.patientName,
      phone: data.phone || '555-0000',
      email: data.email || 'patient@example.com',
      date: data.date || new Date().toISOString().split('T')[0],
      scheduledTime: data.scheduledTime || new Date().toTimeString().slice(0, 5),
      estimatedDuration: data.estimatedDuration || 15,
      status: AppointmentStatus.WAITING,
      priority: data.priority || Priority.NORMAL,
      reason: data.reason || 'General Consultation',
    };

    setAppointments(prev => {
      const updated = [...prev, newApp];
      return updated.sort((a, b) => {
        if (a.status === AppointmentStatus.IN_PROGRESS) return -1;
        if (b.status === AppointmentStatus.IN_PROGRESS) return 1;
        return a.scheduledTime.localeCompare(b.scheduledTime);
      });
    });

    // Immediate confirmation notification
    sendNotification({
      to: newApp.phone,
      patientName: newApp.patientName,
      type: 'SMS',
      event: 'BOOKED',
      data: { time: newApp.scheduledTime, date: newApp.date }
    });
  }, []);

  return {
    appointments: appointmentsWithETA,
    startConsultation,
    completeConsultation,
    addAppointment,
    isPaused,
    setIsPaused,
    syncStatus
  };
};
