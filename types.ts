
export enum UserRole {
  DOCTOR = 'DOCTOR',
  RECEPTIONIST = 'RECEPTIONIST',
  PATIENT = 'PATIENT'
}

export enum AppointmentStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum Priority {
  NORMAL = 'NORMAL',
  EMERGENCY = 'EMERGENCY'
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  phone: string; // Added for notifications
  email?: string; // Added for notifications
  date: string;
  scheduledTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  status: AppointmentStatus;
  priority: Priority;
  reason: string;
  eta?: string; // Calculated dynamically
}

export interface ClinicSettings {
  name: string;
  doctorName: string;
  morningShift: { start: string; end: string };
  eveningShift: { start: string; end: string };
  slotDuration: number;
  isPaused: boolean;
}
