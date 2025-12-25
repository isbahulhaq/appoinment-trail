
import { ClinicSettings, AppointmentStatus, Priority } from './types.ts';

export const CLINIC_CONFIG: ClinicSettings = {
  name: "Wellness Family Clinic",
  doctorName: "Dr. Sarah Mitchell",
  morningShift: { start: "10:00", end: "13:00" },
  eveningShift: { start: "17:00", end: "20:00" },
  slotDuration: 15,
  isPaused: false
};

export const INITIAL_APPOINTMENTS = [
  {
    id: '1',
    patientId: 'p1',
    patientName: 'John Doe',
    phone: '555-0101',
    email: 'john.doe@example.com',
    date: new Date().toISOString().split('T')[0],
    scheduledTime: '10:00',
    estimatedDuration: 15,
    status: AppointmentStatus.WAITING,
    priority: Priority.NORMAL,
    reason: 'Routine checkup'
  },
  {
    id: '2',
    patientId: 'p2',
    patientName: 'Jane Smith',
    phone: '555-0102',
    email: 'jane.smith@example.com',
    date: new Date().toISOString().split('T')[0],
    scheduledTime: '10:15',
    estimatedDuration: 15,
    status: AppointmentStatus.WAITING,
    priority: Priority.NORMAL,
    reason: 'Follow-up'
  }
];
