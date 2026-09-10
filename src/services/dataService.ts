import { Service, Appointment, DaySchedule, BarberProfile, AppointmentStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Pre-seeded initial data for local storage or first-time load
export const INITIAL_SERVICES: Service[] = [
  {
    id: 'srv-1',
    name: 'Corte Degradê & Social',
    description: 'Corte moderno ou clássico com tesoura e máquina, acabamento na navalha, lavagem e finalização com pomada matte.',
    price: 45.0,
    durationMinutes: 40,
    category: 'corte',
    active: true,
  },
  {
    id: 'srv-2',
    name: 'Barba Terapia com Toalha Quente',
    description: 'Modelagem completa da barba com navalha descartável, aplicação de óleos essenciais, toalha quente e pós-barba refrescante.',
    price: 35.0,
    durationMinutes: 30,
    category: 'barba',
    active: true,
  },
  {
    id: 'srv-3',
    name: 'Combo Mestre (Cabelo + Barba)',
    description: 'A experiência completa: corte de cabelo estilizado + ritual de barba com toalha quente e massagem facial relaxante.',
    price: 70.0,
    durationMinutes: 60,
    category: 'combo',
    active: true,
  },
  {
    id: 'srv-4',
    name: 'Pigmentação de Barba ou Cabelo',
    description: 'Camuflagem de fios brancos e realce dos contornos para um visual mais denso e jovem com aspecto 100% natural.',
    price: 30.0,
    durationMinutes: 25,
    category: 'tratamento',
    active: true,
  },
  {
    id: 'srv-5',
    name: 'Acabamento / Pezinho & Contorno',
    description: 'Alinhamento do contorno do cabelo e nuca com navalha para manter o corte em dia entre os atendimentos.',
    price: 20.0,
    durationMinutes: 15,
    category: 'corte',
    active: true,
  },
  {
    id: 'srv-6',
    name: 'Design de Sobrancelha Masculina',
    description: 'Alinhamento higiênico e discreto das sobrancelhas na pinça e navalha para harmonia facial.',
    price: 15.0,
    durationMinutes: 15,
    category: 'outro',
    active: true,
  },
];

export const INITIAL_SCHEDULE: DaySchedule[] = [
  { dayOfWeek: 0, dayName: 'Domingo', isOpen: false, openTime: '09:00', closeTime: '13:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 1, dayName: 'Segunda-feira', isOpen: false, openTime: '09:00', closeTime: '19:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 2, dayName: 'Terça-feira', isOpen: true, openTime: '09:00', closeTime: '19:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 3, dayName: 'Quarta-feira', isOpen: true, openTime: '09:00', closeTime: '19:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 4, dayName: 'Quinta-feira', isOpen: true, openTime: '09:00', closeTime: '19:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 5, dayName: 'Sexta-feira', isOpen: true, openTime: '09:00', closeTime: '20:00', hasBreak: true, breakStart: '12:00', breakEnd: '13:00' },
  { dayOfWeek: 6, dayName: 'Sábado', isOpen: true, openTime: '08:30', closeTime: '18:00', hasBreak: false, breakStart: '12:00', breakEnd: '13:00' },
];

export const INITIAL_PROFILE: BarberProfile = {
  name: 'Carlos Navalha',
  shopName: 'Navalha & Estilo Barbearia',
  address: 'Rua Augusta, 1420 - Consolação, São Paulo - SP',
  phone: '(11) 98765-4321',
  whatsapp: '5511987654321',
  instagram: '@navalha_estilo',
  description: 'Barbearia artesanal com foco no bem-estar masculino, cortes clássicos e modernos, produtos premium e café cortesia.',
  slotIntervalMinutes: 30,
};

// Initial appointments for today and tomorrow to make demo immediately rich and testable
function getSampleAppointments(): Appointment[] {
  const today = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  return [
    {
      id: 'apt-1',
      clientId: 'cli-1',
      clientName: 'Rodrigo Silveira',
      clientEmail: 'rodrigo.silveira@email.com',
      clientPhone: '(11) 99881-2233',
      serviceId: 'srv-3',
      serviceName: 'Combo Mestre (Cabelo + Barba)',
      servicePrice: 70.0,
      serviceDuration: 60,
      date: today,
      time: '10:00',
      status: 'confirmado',
      notes: 'Degradê na zero alta nas laterais, barba bem desenhada.',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'apt-2',
      clientId: 'cli-2',
      clientName: 'Marcos Vinicius',
      clientEmail: 'marcos.v@email.com',
      clientPhone: '(11) 97722-4455',
      serviceId: 'srv-1',
      serviceName: 'Corte Degradê & Social',
      servicePrice: 45.0,
      serviceDuration: 40,
      date: today,
      time: '14:30',
      status: 'pendente',
      notes: 'Primeira vez na barbearia.',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: 'apt-3',
      clientId: 'cli-3',
      clientName: 'Guilherme Santos',
      clientEmail: 'gui.santos@email.com',
      clientPhone: '(11) 98112-9900',
      serviceId: 'srv-2',
      serviceName: 'Barba Terapia com Toalha Quente',
      servicePrice: 35.0,
      serviceDuration: 30,
      date: tomorrow,
      time: '11:00',
      status: 'confirmado',
      notes: 'Pele sensível.',
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
  ];
}

const STORAGE_KEYS = {
  SERVICES: 'barber_services_v1',
  SCHEDULE: 'barber_schedule_v1',
  PROFILE: 'barber_profile_v1',
  APPOINTMENTS: 'barber_appointments_v1',
};

// Local storage helper
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultVal;
    return JSON.parse(item);
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    window.dispatchEvent(new Event('barber_data_updated'));
  } catch (err) {
    console.error('Error saving to localStorage', err);
  }
}

export const DataService = {
  // SERVICES
  async getServices(): Promise<Service[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .order('name');
        if (!error && data && data.length > 0) {
          return data.map((d) => ({
            id: d.id,
            name: d.name,
            description: d.description || '',
            price: Number(d.price),
            durationMinutes: d.duration_minutes,
            category: d.category || 'corte',
            active: d.active ?? true,
            image_url: d.image_url,
          }));
        }
      } catch (err) {
        console.warn('Supabase getServices failed, falling back to local storage', err);
      }
    }
    return getStored<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  },

  async saveService(service: Omit<Service, 'id'> & { id?: string }): Promise<Service> {
    const isNew = !service.id;
    const newId = service.id || 'srv-' + Date.now();
    const serviceObj: Service = {
      id: newId,
      name: service.name,
      description: service.description,
      price: Number(service.price),
      durationMinutes: Number(service.durationMinutes),
      category: service.category,
      active: service.active,
      image_url: service.image_url,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        if (isNew) {
          const { data, error } = await supabase
            .from('services')
            .insert({
              name: serviceObj.name,
              description: serviceObj.description,
              price: serviceObj.price,
              duration_minutes: serviceObj.durationMinutes,
              category: serviceObj.category,
              active: serviceObj.active,
            })
            .select()
            .single();
          if (!error && data) {
            serviceObj.id = data.id;
          }
        } else {
          await supabase
            .from('services')
            .update({
              name: serviceObj.name,
              description: serviceObj.description,
              price: serviceObj.price,
              duration_minutes: serviceObj.durationMinutes,
              category: serviceObj.category,
              active: serviceObj.active,
            })
            .eq('id', serviceObj.id);
        }
      } catch (err) {
        console.warn('Supabase saveService error, maintaining local state', err);
      }
    }

    // Always keep local storage updated in sync
    const current = getStored<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    const index = current.findIndex((s) => s.id === serviceObj.id);
    if (index >= 0) {
      current[index] = serviceObj;
    } else {
      current.push(serviceObj);
    }
    setStored(STORAGE_KEYS.SERVICES, current);
    return serviceObj;
  },

  async deleteService(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('services').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteService error', err);
      }
    }
    const current = getStored<Service[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    const updated = current.filter((s) => s.id !== id);
    setStored(STORAGE_KEYS.SERVICES, updated);
    return true;
  },

  // APPOINTMENTS
  async getAppointments(dateFilter?: string): Promise<Appointment[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('appointments').select('*').order('date').order('time');
        if (dateFilter) {
          query = query.eq('date', dateFilter);
        }
        const { data, error } = await query;
        if (!error && data) {
          return data.map((d) => ({
            id: d.id,
            clientId: d.client_id,
            clientName: d.client_name,
            clientEmail: d.client_email,
            clientPhone: d.client_phone,
            serviceId: d.service_id,
            serviceName: d.service_name,
            servicePrice: Number(d.service_price),
            serviceDuration: d.service_duration,
            date: d.date,
            time: d.time,
            status: d.status as AppointmentStatus,
            notes: d.notes,
            createdAt: d.created_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getAppointments error, using local fallback', err);
      }
    }

    const all = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, getSampleAppointments());
    if (dateFilter) {
      return all.filter((a) => a.date === dateFilter);
    }
    return all.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  },

  async getClientAppointments(clientEmail: string): Promise<Appointment[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('client_email', clientEmail)
          .order('date', { ascending: false });
        if (!error && data) {
          return data.map((d) => ({
            id: d.id,
            clientId: d.client_id,
            clientName: d.client_name,
            clientEmail: d.client_email,
            clientPhone: d.client_phone,
            serviceId: d.service_id,
            serviceName: d.service_name,
            servicePrice: Number(d.service_price),
            serviceDuration: d.service_duration,
            date: d.date,
            time: d.time,
            status: d.status as AppointmentStatus,
            notes: d.notes,
            createdAt: d.created_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getClientAppointments error', err);
      }
    }
    const all = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, getSampleAppointments());
    return all.filter((a) => a.clientEmail.toLowerCase() === clientEmail.toLowerCase())
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  },

  async createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> {
    const newApt: Appointment = {
      ...appointment,
      id: 'apt-' + Date.now(),
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .insert({
            client_id: newApt.clientId,
            client_name: newApt.clientName,
            client_email: newApt.clientEmail,
            client_phone: newApt.clientPhone,
            service_id: newApt.serviceId.startsWith('srv-') ? null : newApt.serviceId,
            service_name: newApt.serviceName,
            service_price: newApt.servicePrice,
            service_duration: newApt.serviceDuration,
            date: newApt.date,
            time: newApt.time,
            status: newApt.status,
            notes: newApt.notes || '',
          })
          .select()
          .single();
        if (!error && data) {
          newApt.id = data.id;
        }
      } catch (err) {
        console.warn('Supabase createAppointment error, saved locally', err);
      }
    }

    const current = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, getSampleAppointments());
    current.unshift(newApt);
    setStored(STORAGE_KEYS.APPOINTMENTS, current);
    return newApt;
  },

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('appointments')
          .update({ status })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase updateAppointmentStatus error', err);
      }
    }

    const current = getStored<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, getSampleAppointments());
    const idx = current.findIndex((a) => a.id === id);
    if (idx >= 0) {
      current[idx].status = status;
      setStored(STORAGE_KEYS.APPOINTMENTS, current);
      return true;
    }
    return false;
  },

  // SCHEDULE
  async getSchedule(): Promise<DaySchedule[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('barber_schedules')
          .select('*')
          .order('day_of_week');
        if (!error && data && data.length > 0) {
          return data.map((d) => ({
            dayOfWeek: d.day_of_week,
            dayName: d.day_name,
            isOpen: d.is_open,
            openTime: d.open_time,
            closeTime: d.close_time,
            hasBreak: d.has_break,
            breakStart: d.break_start,
            breakEnd: d.break_end,
          }));
        }
      } catch (err) {
        console.warn('Supabase getSchedule error, using local fallback', err);
      }
    }
    return getStored<DaySchedule[]>(STORAGE_KEYS.SCHEDULE, INITIAL_SCHEDULE);
  },

  async updateSchedule(schedule: DaySchedule[]): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        for (const day of schedule) {
          await supabase.from('barber_schedules').upsert({
            day_of_week: day.dayOfWeek,
            day_name: day.dayName,
            is_open: day.isOpen,
            open_time: day.openTime,
            close_time: day.closeTime,
            has_break: day.hasBreak,
            break_start: day.breakStart,
            break_end: day.breakEnd,
          }, { onConflict: 'day_of_week' });
        }
      } catch (err) {
        console.warn('Supabase updateSchedule error', err);
      }
    }
    setStored(STORAGE_KEYS.SCHEDULE, schedule);
  },

  // PROFILE
  async getBarberProfile(): Promise<BarberProfile> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('barber_profile')
          .select('*')
          .eq('id', 1)
          .single();
        if (!error && data) {
          return {
            name: data.name,
            shopName: data.shop_name,
            address: data.address,
            phone: data.phone,
            whatsapp: data.whatsapp,
            instagram: data.instagram,
            description: data.description,
            slotIntervalMinutes: data.slot_interval_minutes,
          };
        }
      } catch (err) {
        console.warn('Supabase getBarberProfile error', err);
      }
    }
    return getStored<BarberProfile>(STORAGE_KEYS.PROFILE, INITIAL_PROFILE);
  },

  async updateBarberProfile(profile: BarberProfile): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('barber_profile').upsert({
          id: 1,
          name: profile.name,
          shop_name: profile.shopName,
          address: profile.address,
          phone: profile.phone,
          whatsapp: profile.whatsapp,
          instagram: profile.instagram,
          description: profile.description,
          slot_interval_minutes: profile.slotIntervalMinutes,
        });
      } catch (err) {
        console.warn('Supabase updateBarberProfile error', err);
      }
    }
    setStored(STORAGE_KEYS.PROFILE, profile);
  },

  // RESET TO DEFAULTS
  resetDemoData(): void {
    setStored(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    setStored(STORAGE_KEYS.SCHEDULE, INITIAL_SCHEDULE);
    setStored(STORAGE_KEYS.PROFILE, INITIAL_PROFILE);
    setStored(STORAGE_KEYS.APPOINTMENTS, getSampleAppointments());
  }
};
