import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MessageCircle, AlertCircle, XCircle, CheckCircle2, Scissors, ArrowRight, User } from 'lucide-react';
import { Appointment, BarberProfile } from '../types';
import { DataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';

interface ClientAppointmentsProps {
  onGoToBooking: () => void;
  onOpenAuth: () => void;
}

export const ClientAppointments: React.FC<ClientAppointmentsProps> = ({ onGoToBooking, onOpenAuth }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<BarberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadAppointments = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [list, prof] = await Promise.all([
        DataService.getClientAppointments(user.email),
        DataService.getBarberProfile(),
      ]);
      setAppointments(list);
      setProfile(prof);
    } catch (err) {
      console.error('Error fetching client appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    const handleUpdate = () => loadAppointments();
    window.addEventListener('barber_data_updated', handleUpdate);
    return () => window.removeEventListener('barber_data_updated', handleUpdate);
  }, [user]);

  const handleCancel = async (aptId: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return;
    }
    setCancellingId(aptId);
    try {
      await DataService.updateAppointmentStatus(aptId, 'cancelado');
      await loadAppointments();
    } catch (err) {
      console.error('Error cancelling appointment:', err);
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white font-cinzel">Identifique-se para ver seus agendamentos</h2>
        <p className="text-xs text-neutral-400">
          Informe seu nome e e-mail cadastrado para visualizar, acompanhar ou cancelar suas reservas na barbearia.
        </p>
        <button
          onClick={onOpenAuth}
          className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-6 py-3 rounded-xl text-sm transition shadow-lg cursor-pointer"
        >
          Identificar Cliente
        </button>
      </div>
    );
  }

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

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmado':
        return (
          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Confirmado
          </span>
        );
      case 'pendente':
        return (
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pendente
          </span>
        );
      case 'concluido':
        return (
          <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
            Concluído
          </span>
        );
      case 'cancelado':
        return (
          <span className="bg-neutral-800 border border-neutral-700 text-neutral-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
            Cancelado
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-white font-cinzel tracking-tight">
            Minhas Reservas
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Acompanhe seus horários agendados e entre em contato diretamente com a barbearia.
          </p>
        </div>

        <button
          onClick={onGoToBooking}
          className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-md"
        >
          <Scissors className="w-3.5 h-3.5" />
          Novo Agendamento
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-neutral-400">
          <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs">Carregando suas reservas...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center space-y-4">
          <Calendar className="w-12 h-12 text-neutral-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">Nenhum agendamento encontrado</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Você ainda não possui horários agendados com o e-mail <strong>{user.email}</strong>.
            </p>
          </div>
          <button
            onClick={onGoToBooking}
            className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-6 py-2.5 rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer transition shadow-md"
          >
            Escolher um Horário Agora
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => {
            const isPast = new Date(apt.date + 'T' + apt.time) < new Date();
            const canCancel = apt.status !== 'cancelado' && apt.status !== 'concluido' && !isPast;

            return (
              <div
                key={apt.id}
                className={`bg-neutral-900 border rounded-2xl p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  apt.status === 'cancelado'
                    ? 'border-neutral-800/60 opacity-60'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Left info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{apt.serviceName}</span>
                    {getStatusBadge(apt.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {formatFriendlyDate(apt.date)} às {apt.time}
                    </span>
                    <span>•</span>
                    <span>{apt.serviceDuration} min</span>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apt.servicePrice)}
                    </span>
                  </div>

                  {apt.notes && (
                    <p className="text-[11px] text-neutral-400 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 inline-block">
                      <strong>Obs:</strong> {apt.notes}
                    </p>
                  )}
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-800">
                  {/* WhatsApp contact */}
                  <a
                    href={`https://api.whatsapp.com/send?phone=${profile?.whatsapp || '5511987654321'}&text=${encodeURIComponent(
                      `Olá! Tenho uma dúvida sobre meu agendamento de ${apt.serviceName} no dia ${apt.date} às ${apt.time}.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    WhatsApp
                  </a>

                  {canCancel && (
                    <button
                      onClick={() => handleCancel(apt.id)}
                      disabled={cancellingId === apt.id}
                      className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1.5 border border-red-500/20 transition cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {cancellingId === apt.id ? 'Cancelando...' : 'Cancelar Horário'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
