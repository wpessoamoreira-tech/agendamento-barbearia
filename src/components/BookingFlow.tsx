import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scissors, Calendar as CalendarIcon, Clock, CheckCircle2, User, Phone, 
  Mail, MapPin, AlertCircle, Sparkles, MessageCircle, ChevronRight, 
  ChevronLeft, ArrowRight, ShieldCheck, Check
} from 'lucide-react';
import { Service, Appointment, DaySchedule, BarberProfile } from '../types';
import { DataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';

interface BookingFlowProps {
  onGoToMyAppointments: () => void;
  onOpenAuth: (defaultTab?: 'client' | 'barber') => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ onGoToMyAppointments, onOpenAuth }) => {
  const { user, loginClientEmail, logout } = useAuth();

  // Data states
  const [services, setServices] = useState<Service[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [profile, setProfile] = useState<BarberProfile | null>(null);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking steps: 1 = Service, 2 = Date & Time, 3 = Identification & Confirmation, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Selected choices
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientNotes, setClientNotes] = useState<string>('');

  // Inline auth inputs if client is not logged in
  const [inlineName, setInlineName] = useState('');
  const [inlineEmail, setInlineEmail] = useState('');
  const [inlinePhone, setInlinePhone] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmed appointment result
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // Load initial services, schedule, profile
  const loadData = async () => {
    setLoading(true);
    try {
      const [sList, schList, prof, apts] = await Promise.all([
        DataService.getServices(),
        DataService.getSchedule(),
        DataService.getBarberProfile(),
        DataService.getAppointments(),
      ]);
      setServices(sList.filter((s) => s.active));
      setSchedule(schList);
      setProfile(prof);
      setExistingAppointments(apts);
    } catch (err) {
      console.error('Error loading booking data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('barber_data_updated', handleUpdate);
    return () => window.removeEventListener('barber_data_updated', handleUpdate);
  }, []);

  // Set default date to today or next open day
  useEffect(() => {
    if (schedule.length > 0 && !selectedDate) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      setSelectedDate(dateStr);
    }
  }, [schedule, selectedDate]);

  // Autofill user credentials if logged in
  useEffect(() => {
    if (user) {
      setInlineName(user.name);
      setInlineEmail(user.email);
      if (user.phone) setInlinePhone(user.phone);
    }
  }, [user]);

  // Generate next 14 days list
  const nextDays = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const dateString = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
      const daySchedule = schedule.find((s) => s.dayOfWeek === dayOfWeek);

      const dayNameShort = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const dayFormatted = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');

      days.push({
        date: dateString,
        dayOfWeek,
        dayNameShort: dayNameShort.charAt(0).toUpperCase() + dayNameShort.slice(1),
        dayFormatted,
        isOpen: daySchedule ? daySchedule.isOpen : false,
        isToday: i === 0,
      });
    }
    return days;
  }, [schedule]);

  // Calculate available time slots for selectedDate
  const availableSlots = useMemo(() => {
    if (!selectedDate || schedule.length === 0) return [];

    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    const dayConfig = schedule.find((s) => s.dayOfWeek === dayOfWeek);

    if (!dayConfig || !dayConfig.isOpen) {
      return [];
    }

    // Interval minutes
    const intervalMinutes = profile?.slotIntervalMinutes || 30;

    const [openH, openM] = dayConfig.openTime.split(':').map(Number);
    const [closeH, closeM] = dayConfig.closeTime.split(':').map(Number);

    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    let breakStartMinutes = -1;
    let breakEndMinutes = -1;
    if (dayConfig.hasBreak && dayConfig.breakStart && dayConfig.breakEnd) {
      const [bsh, bsm] = dayConfig.breakStart.split(':').map(Number);
      const [beh, bem] = dayConfig.breakEnd.split(':').map(Number);
      breakStartMinutes = bsh * 60 + bsm;
      breakEndMinutes = beh * 60 + bem;
    }

    // Existing booked slots for this date
    const bookedForDate = existingAppointments.filter(
      (a) => a.date === selectedDate && a.status !== 'cancelado'
    );

    const slots = [];
    const now = new Date();
    const isToday = selectedDate === now.toISOString().split('T')[0];
    const currentMinutesNow = now.getHours() * 60 + now.getMinutes();

    for (let m = openMinutes; m + (selectedService?.durationMinutes || intervalMinutes) <= closeMinutes; m += intervalMinutes) {
      // Check break
      if (dayConfig.hasBreak && m >= breakStartMinutes && m < breakEndMinutes) {
        continue;
      }

      const hours = Math.floor(m / 60);
      const minutes = m % 60;
      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

      // If today, check if time has already passed
      const isPast = isToday && m <= currentMinutesNow + 15; // 15 min tolerance

      // Check if already booked
      const isBooked = bookedForDate.some((apt) => apt.time === timeStr);

      slots.push({
        time: timeStr,
        available: !isPast && !isBooked,
        reason: isPast ? 'Passou' : isBooked ? 'Ocupado' : 'Livre',
      });
    }

    return slots;
  }, [selectedDate, schedule, existingAppointments, selectedService, profile]);

  // Handle service category filter
  const filteredServices = useMemo(() => {
    if (selectedCategory === 'todos') return services;
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  // Handle finalize booking
  const handleConfirmBooking = async () => {
    setAuthError(null);

    if (!selectedService || !selectedDate || !selectedTime) {
      setAuthError('Por favor, selecione o serviço, a data e o horário.');
      return;
    }

    // If not logged in, authenticate inline
    let clientToUse = user;
    if (!clientToUse) {
      if (!inlineName.trim() || !inlineEmail.trim() || !inlinePhone.trim()) {
        setAuthError('Por favor, informe seu Nome, E-mail e WhatsApp para confirmar a reserva.');
        return;
      }

      setIsSubmitting(true);
      const loginRes = await loginClientEmail(inlineEmail, inlineName, inlinePhone);
      if (!loginRes.success) {
        setAuthError(loginRes.error || 'Erro ao registrar seus dados.');
        setIsSubmitting(false);
        return;
      }
      clientToUse = {
        id: 'client-' + Date.now(),
        email: inlineEmail.trim().toLowerCase(),
        name: inlineName.trim(),
        phone: inlinePhone.trim(),
        role: 'client',
      };
    }

    setIsSubmitting(true);
    try {
      const created = await DataService.createAppointment({
        clientId: clientToUse.id,
        clientName: clientToUse.name,
        clientEmail: clientToUse.email,
        clientPhone: clientToUse.phone || inlinePhone || '(11) 99999-9999',
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        serviceDuration: selectedService.durationMinutes,
        date: selectedDate,
        time: selectedTime,
        status: 'pendente', // Will be confirmed by the barber
        notes: clientNotes,
      });

      setConfirmedAppointment(created);
      setStep(4); // Success step
    } catch (err: any) {
      setAuthError('Falha ao salvar agendamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date helper in pt-BR
  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4 text-neutral-400">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
        <p className="text-sm">Carregando catálogo de serviços e horários disponíveis...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Visual Stepper */}
      {step < 4 && (
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-xl mx-auto relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-neutral-800 -translate-y-1/2 z-0"></div>
            
            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => setStep(1)}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition ${
                step >= 1 ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {step > 1 ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <span className={`text-xs font-medium ${step === 1 ? 'text-amber-400' : 'text-neutral-400'}`}>
                Serviço
              </span>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => selectedService && setStep(2)}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition ${
                step >= 2 ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {step > 2 ? <Check className="w-5 h-5" /> : '2'}
              </div>
              <span className={`text-xs font-medium ${step === 2 ? 'text-amber-400' : 'text-neutral-400'}`}>
                Data & Horário
              </span>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition ${
                step >= 3 ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20' : 'bg-neutral-800 text-neutral-400'
              }`}>
                3
              </div>
              <span className={`text-xs font-medium ${step === 3 ? 'text-amber-400' : 'text-neutral-400'}`}>
                Confirmação
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 1: SERVICE SELECTION ================= */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-cinzel tracking-tight">
              Escolha seu Serviço
            </h1>
            <p className="text-sm text-neutral-400 mt-2">
              Selecione o serviço desejado para o seu atendimento na barbearia. Todos os serviços incluem produtos de alta qualidade e finalização profissional.
            </p>
          </div>

          {/* Category filter tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {[
              { id: 'todos', label: 'Todos os Serviços' },
              { id: 'corte', label: 'Cabelo' },
              { id: 'barba', label: 'Barba & Toalha Quente' },
              { id: 'combo', label: 'Combos' },
              { id: 'tratamento', label: 'Tratamentos' },
              { id: 'outro', label: 'Outros' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Service grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filteredServices.map((srv) => {
              const isSelected = selectedService?.id === srv.id;
              return (
                <div
                  key={srv.id}
                  onClick={() => setSelectedService(srv)}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500'
                      : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                  }`}
                >
                  {/* Category Pill and check */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider bg-neutral-800 text-amber-400 px-2.5 py-1 rounded-md border border-neutral-700/50">
                      {srv.category}
                    </span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition ${
                      isSelected ? 'bg-amber-500 text-neutral-950' : 'border border-neutral-700 text-transparent'
                    }`}>
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-amber-400 transition">
                      {srv.name}
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3 mb-4">
                      {srv.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{srv.durationMinutes} min</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-amber-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(srv.price)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Next Button Footer */}
          <div className="sticky bottom-4 z-20 bg-neutral-950/90 backdrop-blur-md border border-neutral-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-neutral-400 block">Serviço Selecionado:</span>
                <span className="text-sm font-bold text-white">
                  {selectedService ? selectedService.name : 'Nenhum serviço selecionado'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (selectedService) setStep(2);
              }}
              disabled={!selectedService}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-md text-sm"
            >
              Escolher Data e Horário
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: DATE & TIME SELECTION ================= */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-neutral-900 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar aos Serviços
            </button>
            <div className="text-right">
              <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider block">
                {selectedService?.name}
              </span>
              <span className="text-xs text-neutral-400">
                {selectedService?.durationMinutes} min • R$ {selectedService?.price.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-cinzel tracking-tight">
              Escolha o Dia e Horário
            </h1>
            <p className="text-sm text-neutral-400 mt-2">
              Selecione o melhor dia e horário disponível na agenda do barbeiro para o seu atendimento.
            </p>
          </div>

          {/* Date Picker Horizontal Carousel */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-amber-400" />
              Selecione o Dia
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-800">
              {nextDays.map((day) => {
                const isSelected = selectedDate === day.date;
                return (
                  <button
                    key={day.date}
                    onClick={() => {
                      if (day.isOpen) {
                        setSelectedDate(day.date);
                        setSelectedTime(''); // Reset time when date changes
                      }
                    }}
                    disabled={!day.isOpen}
                    className={`flex-shrink-0 w-24 py-3 px-2 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                      !day.isOpen
                        ? 'opacity-40 bg-neutral-900/40 border-neutral-800 cursor-not-allowed'
                        : isSelected
                        ? 'bg-amber-500 text-neutral-950 border-amber-500 font-bold shadow-lg shadow-amber-500/20'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-850 cursor-pointer'
                    }`}
                  >
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isSelected ? 'text-neutral-900' : 'text-neutral-400'
                    }`}>
                      {day.dayNameShort}
                    </span>
                    <span className="text-base font-extrabold">
                      {day.dayFormatted}
                    </span>
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                      !day.isOpen
                        ? 'bg-neutral-800 text-neutral-500'
                        : isSelected
                        ? 'bg-neutral-950/20 text-neutral-950 font-bold'
                        : 'text-amber-400'
                    }`}>
                      {day.isOpen ? (day.isToday ? 'Hoje' : 'Aberto') : 'Fechado'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots Grid */}
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Horários Disponíveis em {formatFriendlyDate(selectedDate)}
              </label>
              <span className="text-xs text-neutral-500">
                {availableSlots.filter((s) => s.available).length} horários livres
              </span>
            </div>

            {availableSlots.length === 0 ? (
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-400 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-amber-400/80" />
                <p className="text-sm font-semibold text-white">Barbearia Fechada nesta Data</p>
                <p className="text-xs">Por favor, escolha outro dia para agendar seu horário.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {availableSlots.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className={`py-3 px-3 rounded-xl text-xs font-semibold transition text-center flex flex-col items-center justify-center gap-0.5 ${
                        !slot.available
                          ? 'bg-neutral-900/30 border border-neutral-800/40 text-neutral-600 line-through cursor-not-allowed'
                          : isSelected
                          ? 'bg-amber-500 text-neutral-950 font-bold border border-amber-500 shadow-md shadow-amber-500/20'
                          : 'bg-neutral-900 border border-neutral-800 text-white hover:border-amber-500/50 hover:bg-neutral-850 cursor-pointer'
                      }`}
                    >
                      <span className="text-sm font-bold tracking-tight">{slot.time}</span>
                      <span className={`text-[9px] ${isSelected ? 'text-neutral-900 font-bold' : slot.available ? 'text-emerald-400' : 'text-neutral-600'}`}>
                        {slot.available ? 'Disponível' : slot.reason}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sticky Next Button */}
          <div className="sticky bottom-4 z-20 bg-neutral-950/90 backdrop-blur-md border border-neutral-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-neutral-400 block">Horário Selecionado:</span>
                <span className="text-sm font-bold text-white">
                  {selectedDate && selectedTime 
                    ? `${formatFriendlyDate(selectedDate)} às ${selectedTime}`
                    : 'Nenhum horário escolhido'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (selectedTime) setStep(3);
              }}
              disabled={!selectedTime}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-md text-sm"
            >
              Avançar para Identificação
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: IDENTIFICATION & CONFIRMATION ================= */}
      {step === 3 && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-neutral-900 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Alterar Data ou Horário
            </button>
          </div>

          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-cinzel tracking-tight">
              Confirme seu Agendamento
            </h1>
            <p className="text-sm text-neutral-400 mt-2">
              Para garantir a segurança da sua reserva e permitir o gerenciamento futuro, informe seus dados ou entre com sua conta Google/E-mail.
            </p>
          </div>

          {/* Booking Summary Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Resumo da Reserva
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                {profile?.shopName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-neutral-400 block">Serviço:</span>
                <span className="font-bold text-white block">{selectedService?.name}</span>
                <span className="text-xs text-neutral-400">Duração estimada: {selectedService?.durationMinutes} min</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-400 block">Valor Total:</span>
                <span className="text-lg font-extrabold text-amber-400 block">
                  {selectedService && new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedService.price)}
                </span>
                <span className="text-xs text-neutral-400">Pagamento no local</span>
              </div>
            </div>

            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800/80 flex items-center gap-3 text-xs text-neutral-300">
              <CalendarIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>{formatFriendlyDate(selectedDate)}</strong> às <strong className="text-white">{selectedTime}</strong>
              </span>
            </div>

            {profile?.address && (
              <div className="flex items-center gap-2 text-xs text-neutral-400 pt-1">
                <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span>{profile.address}</span>
              </div>
            )}
          </div>

          {/* User Identification Section */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Identificação do Cliente
            </h3>

            {user ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-neutral-950 font-bold flex items-center justify-center">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-semibold text-emerald-400 block">Identificado como</span>
                    <span className="text-sm font-bold text-white block">{user.name}</span>
                    <span className="text-xs text-neutral-400">{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setInlineName('');
                      setInlineEmail('');
                      setInlinePhone('');
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 transition cursor-pointer"
                  >
                    Trocar de Cliente
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-neutral-400">
                  Preencha seus dados de contato para confirmar sua reserva na barbearia:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Seu Nome Completo *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: João Silva"
                        value={inlineName}
                        onChange={(e) => setInlineName(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Seu E-mail *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="joao@gmail.com"
                        value={inlineEmail}
                        onChange={(e) => setInlineEmail(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    WhatsApp / Celular * (para receber confirmação e lembrete)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="(11) 99999-8888"
                      value={inlinePhone}
                      onChange={(e) => setInlinePhone(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Optional Notes */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Observações para o Barbeiro (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Quero manter o degradê disfarçado, tenho a pele sensível na navalha..."
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handleConfirmBooking}
            disabled={isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-4 px-6 rounded-xl transition text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin"></div>
                Confirmando Reserva...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Confirmar Meu Agendamento
              </>
            )}
          </button>
        </div>
      )}

      {/* ================= STEP 4: CELEBRATION & SUCCESS ================= */}
      {step === 4 && confirmedAppointment && (
        <div className="max-w-xl mx-auto py-6 space-y-6 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Reserva Realizada com Sucesso!
            </span>
            <h2 className="text-2xl font-bold text-white font-cinzel mt-1">
              Te esperamos na cadeira!
            </h2>
            <p className="text-xs text-neutral-400 mt-2">
              Seu horário foi reservado no sistema da barbearia. Abaixo estão os detalhes do seu agendamento:
            </p>
          </div>

          {/* Detail card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-left space-y-3">
            <div className="flex justify-between items-start pb-3 border-b border-neutral-800">
              <div>
                <span className="text-xs text-neutral-400">Serviço:</span>
                <p className="font-bold text-white text-base">{confirmedAppointment.serviceName}</p>
                <span className="text-xs text-neutral-400">{confirmedAppointment.serviceDuration} minutos de atendimento</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-neutral-400">Valor:</span>
                <p className="text-lg font-bold text-amber-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(confirmedAppointment.servicePrice)}
                </p>
              </div>
            </div>

            <div className="py-2 flex items-center gap-3 text-sm">
              <CalendarIcon className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="font-semibold text-white">{formatFriendlyDate(confirmedAppointment.date)}</p>
                <p className="text-xs text-neutral-400">às {confirmedAppointment.time} horas</p>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-800 text-xs text-neutral-400 space-y-1">
              <p><strong>Cliente:</strong> {confirmedAppointment.clientName} ({confirmedAppointment.clientEmail})</p>
              <p><strong>Telefone:</strong> {confirmedAppointment.clientPhone}</p>
              {confirmedAppointment.notes && (
                <p><strong>Observações:</strong> {confirmedAppointment.notes}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* WhatsApp notification button */}
            <a
              href={`https://api.whatsapp.com/send?phone=${profile?.whatsapp || '5511987654321'}&text=${encodeURIComponent(
                `Olá! Acabei de agendar um horário na ${profile?.shopName || 'barbearia'}!\n` +
                `*Serviço:* ${confirmedAppointment.serviceName}\n` +
                `*Data:* ${confirmedAppointment.date} às ${confirmedAppointment.time}\n` +
                `*Cliente:* ${confirmedAppointment.clientName}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              Avisar Barbeiro via WhatsApp
            </a>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={onGoToMyAppointments}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-semibold py-3 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 border border-neutral-700"
              >
                <CalendarIcon className="w-4 h-4 text-amber-400" />
                Ver Minhas Reservas
              </button>

              <button
                onClick={() => {
                  setStep(1);
                  setSelectedService(null);
                  setSelectedTime('');
                  setConfirmedAppointment(null);
                }}
                className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-3 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2"
              >
                <Scissors className="w-4 h-4" />
                Agendar Outro Serviço
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
