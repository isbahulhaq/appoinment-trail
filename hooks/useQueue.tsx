
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Appointment, AppointmentStatus, Priority } from '../types';
import { INITIAL_APPOINTMENTS } from '../constants';

export const useQueue = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem('medqueue_appointments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to load appointments from storage", e);
    }
    return INITIAL_APPOINTMENTS;
  });

  const [isPaused, setIsPaused] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('medqueue_appointments', JSON.stringify(appointments));
  }, [appointments]);

  // Use a derived state for ETAs instead of updating the main state in a loop
  // This prevents infinite render cycles while keeping data fresh
  const appointmentsWithETA = useMemo(() => {
    const now = new Date();
    let currentTime = now;

    const currentInProgress = appointments.find(a => a.status === AppointmentStatus.IN_PROGRESS);
    
    if (currentInProgress && currentInProgress.actualStartTime) {
      const startTime = new Date(currentInProgress.actualStartTime);
      currentTime = new Date(startTime.getTime() + currentInProgress.estimatedDuration * 60000);
      if (currentTime < now) currentTime = now;
    }

    return appointments.map(app => {
      if (app.status !== AppointmentStatus.WAITING) {
        return app;
      }

      const etaStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const nextTime = new Date(currentTime.getTime() + app.estimatedDuration * 60000);
      currentTime = nextTime;
      
      return { ...app, eta: etaStr };
    });
  }, [appointments]);

  const startConsultation = useCallback((id: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        return { 
          ...a, 
          status: AppointmentStatus.IN_PROGRESS, 
          actualStartTime: new Date().toISOString() 
        };
      }
      if (a.status === AppointmentStatus.IN_PROGRESS) {
        return { 
          ...a, 
          status: AppointmentStatus.COMPLETED, 
          actualEndTime: new Date().toISOString() 
        };
      }
      return a;
    }));
  }, []);

  const completeConsultation = useCallback((id: string) => {
    setAppointments(prev => prev.map(a => 
      a.id === id ? { 
        ...a, 
        status: AppointmentStatus.COMPLETED, 
        actualEndTime: new Date().toISOString() 
      } : a
    ));
  }, []);

  const addAppointment = useCallback((data: Partial<Appointment>) => {
    const newApp: Appointment = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      patientId: 'p-' + Date.now(),
      patientName: data.patientName || 'Walk-in',
      date: new Date().toISOString().split('T')[0],
      scheduledTime: data.scheduledTime || new Date().toTimeString().slice(0, 5),
      estimatedDuration: data.estimatedDuration || 15,
      status: AppointmentStatus.WAITING,
      priority: data.priority || Priority.NORMAL,
      reason: data.reason || 'Consultation',
    };

    setAppointments(prev => {
      if (newApp.priority === Priority.EMERGENCY) {
        const waitingIdx = prev.findIndex(a => a.status === AppointmentStatus.WAITING);
        if (waitingIdx === -1) return [...prev, newApp];
        const next = [...prev];
        next.splice(waitingIdx, 0, newApp);
        return next;
      }
      return [...prev, newApp];
    });
  }, []);

  return {
    appointments: appointmentsWithETA,
    startConsultation,
    completeConsultation,
    addAppointment,
    isPaused,
    setIsPaused
  };
};
