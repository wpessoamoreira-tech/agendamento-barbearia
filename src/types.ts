export type Role = 'client' | 'barber';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar_url?: string;
  phone?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: 'corte' | 'barba' | 'combo' | 'tratamento' | 'outro';
  active: boolean;
  image_url?: string;
}

export type AppointmentStatus = 'pendente' | 'confirmado' | 'concluido' | 'cancelado';

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, ... 6 = Sábado
  dayName: string;
  isOpen: boolean;
  openTime: string; // HH:mm e.g. "09:00"
  closeTime: string; // HH:mm e.g. "19:00"
  hasBreak: boolean;
  breakStart: string; // HH:mm e.g. "12:00"
  breakEnd: string; // HH:mm e.g. "13:00"
}

export interface BarberProfile {
  name: string;
  shopName: string;
  address: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  description: string;
  slotIntervalMinutes: number; // e.g. 30 or 45
}
