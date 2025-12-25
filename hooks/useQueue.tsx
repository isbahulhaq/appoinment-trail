
import { useState, useEffect, useCallback } from 'react';
import { Appointment, AppointmentStatus, Priority } from '../types';
import { INITIAL_APPOINTMENTS } from '../constants';

export const useQueue = () => {
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('medqueue_appointments');
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [isPaused, setIsPaused] = useState(false);

  // Sync to local storage for "production" persistence simulation
  useEffect(() => {
    localStorage.setItem('medqueue_appointments', JSON.stringify(appointments));
  }, [appointments]);

  const calculateETAs = useCallback(() => {
    const now = new Date();
    let currentTime = now;

    const currentInProgress = appointments.find(a => a.status === AppointmentStatus.IN_PROGRESS);
    
    // If someone is in progress, the next person starts when they are expected to finish
    if (currentInProgress && currentInProgress.actualStartTime) {
      const startTime = new Date(currentInProgress.actualStartTime);
      currentTime = new Date(startTime.getTime() + currentInProgress.estimatedDuration * 60000);
      // If estimated end is already in the past, baseline is NOW
      if (currentTime < now) currentTime = now;
    }

    const updated = appointments.map(app => {
      if (app.status === AppointmentStatus.COMPLETED || app.status === AppointmentStatus.CANCELLED) {
        return app;
      }
      if (app.status === AppointmentStatus.IN_PROGRESS) {
        return app;
      }

      const eta = currentTime.toTimeString().slice(0, 5);
      const nextTime = new Date(currentTime.getTime() + app.estimatedDuration * 60000);
      currentTime = nextTime;
      
      return { ...app, eta };
    });

    // Check if state actually changed to avoid infinite loop
    if (JSON.stringify(updated) !== JSON.stringify(appointments)) {
      setAppointments(updated);
    }
  }, [appointments]);

  useEffect(() => {
    const interval = setInterval(calculateETAs, 30000); // Recalculate every 30s
    calculateETAs();
    return () => clearInterval(interval);
  }, [calculateETAs]);

  const startConsultation = (id: string) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        return { 
          ...a, 
          status: AppointmentStatus.IN_PROGRESS, 
          actualStartTime: new Date().toISOString() 
        };
      }
      // Can only have one in progress
      if (a.status === AppointmentStatus.IN_PROGRESS) {
        return { 
          ...a, 
          status: AppointmentStatus.COMPLETED, 
          actualEndTime: new Date().toISOString() 
        };
      }
      return a;
    }));
  };

  const completeConsultation = (id: string) => {
    setAppointments(prev => prev.map(a => 
      a.id === id ? { 
        ...a, 
        status: AppointmentStatus.COMPLETED, 
        actualEndTime: new Date().toISOString() 
      } : a
    ));
  };

  const addAppointment = (data: Partial<Appointment>) => {
    const newApp: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
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
        // Find first waiting person and insert before them
        const waitingIdx = prev.findIndex(a => a.status === AppointmentStatus.WAITING);
        if (waitingIdx === -1) return [...prev, newApp];
        const next = [...prev];
        next.splice(waitingIdx, 0, newApp);
        return next;
      }
      return [...prev, newApp];
    });
  };

  return {
    appointments,
    startConsultation,
    completeConsultation,
    addAppointment,
    isPaused,
    setIsPaused
  };
};
