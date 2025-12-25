
import { CLINIC_CONFIG } from "../constants";

type NotificationType = 'SMS' | 'EMAIL';

interface NotificationPayload {
  to: string;
  patientName: string;
  type: NotificationType;
  event: 'BOOKED' | 'IN_PROGRESS' | 'COMPLETED' | 'ETA_UPDATE';
  data?: any;
}

const TEMPLATES = {
  BOOKED: "Hello {name}, your appointment at {clinic} is confirmed for {time} on {date}. See you soon!",
  IN_PROGRESS: "Hi {name}, the doctor is ready to see you now. Please proceed to the consultation room.",
  COMPLETED: "Thank you for visiting {clinic}, {name}. We've updated your medical records. Take care!",
  ETA_UPDATE: "Wait time update: Your estimated consultation time at {clinic} is now {eta}."
};

export const sendNotification = async (payload: NotificationPayload): Promise<void> => {
  const { to, patientName, type, event, data } = payload;
  
  let message = TEMPLATES[event]
    .replace('{name}', patientName)
    .replace('{clinic}', CLINIC_CONFIG.name)
    .replace('{date}', data?.date || '')
    .replace('{time}', data?.time || '')
    .replace('{eta}', data?.eta || '');

  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 800));

  console.group(`%c [Clinical Notification: ${type}] %c ${event}`, "color: #6366f1; font-weight: bold", "color: #94a3b8");
  console.log(`Recipient: ${to}`);
  console.log(`Payload: ${message}`);
  console.groupEnd();

  // Create a custom event to notify the UI for demo purposes
  const customEvent = new CustomEvent('medqueue_notification', { 
    detail: { type, message, event } 
  });
  window.dispatchEvent(customEvent);
};
