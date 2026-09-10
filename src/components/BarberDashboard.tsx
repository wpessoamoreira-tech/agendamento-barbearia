import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, CheckCircle2, XCircle, MessageCircle, Scissors, 
  Settings, DollarSign, Users, AlertCircle, Plus, Filter, Phone, Mail, 
  MapPin, RefreshCw, ChevronDown, Check, LogOut, ShieldAlert
} from 'lucide-react';
import { Appointment, Service, DaySchedule, BarberProfile, AppointmentStatus } from '../types';
import { DataService } from '../services/dataService';
import { BarberServicesManager } from './BarberServicesManager';
import { BarberScheduleManager } from './BarberScheduleManager';
import { useAuth } from '../context/AuthContext';

interface BarberDashboardProps {
  onOpenAuth: () => void;
  onOpenSupabase?: () => void;
}

export const BarberDashboard: React.FC<BarberDashboardProps> = ({ onOpenAuth }) => {
  const { user, role, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'schedule' | 'profile'>('appointments');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [profile, setProfile] = useState<BarberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters for Appointments tab
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'week' | 'all'>('today');
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Manual appointment modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualClientName, setManualClientName] = useState('');
  const [manualClientPhone, setManualClientPhone] = useState('');
  const [manualClientEmail, setManualClientEmail] = useState('');
  const [manualServiceId, setManualServiceId] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('10:00');
  const [manualNotes, setManualNotes] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Profile edit state
  const [profileForm, setProfileForm] = useState<BarberProfile | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [apts, srvs, sch, prof] = await Promise.all([
        DataService.getAppointments(),
        DataService.getServices(),
        DataService.getSchedule(),
        DataService.getBarberProfile(),
      ]);
      setAppointments(apts);
      setServices(srvs);
      setSchedule(sch);
      setProfile(prof);
      setProfileForm(prof);
    } catch (err) {
      console.error('Error loading barber dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const handleUpdate = () => loadAllData();
    window.addEventListener('barber_data_updated', handleUpdate);
    return () => window.removeEventListener('barber_data_updated', handleUpdate);
  }, []);

  // Format date helper
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Date filter
      if (dateFilter === 'today' && apt.date !== todayStr) return false;
      if (dateFilter === 'tomorrow' && apt.date !== tomorrowStr) return false;
      if (dateFilter === 'week') {
        const aptDate = new Date(apt.date);
        const today = new Date();
        const diffDays = (aptDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
        if (diffDays < -1 || diffDays > 7) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = apt.clientName.toLowerCase().includes(term);
        const matchPhone = apt.clientPhone.includes(term);
        const matchService = apt.serviceName.toLowerCase().includes(term);
        if (!matchName && !matchPhone && !matchService) return false;
      }

      return true;
    });
  }, [appointments, dateFilter, statusFilter, searchTerm, todayStr, tomorrowStr]);

  // Dashboard Summary Metrics
  const metrics = useMemo(() => {
    const todayApts = appointments.filter((a) => a.date === todayStr && a.status !== 'cancelado');
    const revenueToday = todayApts.reduce((acc, a) => acc + (a.servicePrice || 0), 0);
    const pendingCount = appointments.filter((a) => a.status === 'pendente').length;
    const activeServicesCount = services.filter((s) => s.active).length;

    return {
      todayCount: todayApts.length,
      revenueToday,
      pendingCount,
      activeServicesCount,
    };
  }, [appointments, services, todayStr]);

  // Update status action
  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await DataService.updateAppointmentStatus(id, newStatus);
      await loadAllData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Create manual appointment
  const handleCreateManualAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualClientName.trim()) return;

    const srv = services.find((s) => s.id === manualServiceId) || services[0];
    if (!srv) return;

    setManualSubmitting(true);
    try {
      await DataService.createAppointment({
        clientId: 'walkin-' + Date.now(),
        clientName: manualClientName.trim(),
        clientEmail: manualClientEmail.trim() || 'presencial@barbearia.com',
        clientPhone: manualClientPhone.trim() || '(11) 99999-0000',
        serviceId: srv.id,
        serviceName: srv.name,
        servicePrice: srv.price,
        serviceDuration: srv.durationMinutes,
        date: manualDate,
        time: manualTime,
        status: 'confirmado',
        notes: manualNotes.trim() ? `(Agendado pelo Barbeiro) ${manualNotes}` : '(Agendamento Manual/Presencial)',
      });

      setIsManualModalOpen(false);
      setManualClientName('');
      setManualClientPhone('');
      setManualClientEmail('');
      setManualNotes('');
      await loadAllData();
    } catch {
      alert('Erro ao registrar agendamento manual.');
    } finally {
      setManualSubmitting(false);
    }
  };

  // Save profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm) return;

    try {
      await DataService.updateBarberProfile(profileForm);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
      loadAllData();
    } catch {
      alert('Erro ao atualizar dados da barbearia.');
    }
  };

  // Reset demo sample data helper
  const handleResetData = () => {
    if (window.confirm('Deseja restaurar os dados de demonstração (serviços e agendamentos padrão)?')) {
      DataService.resetDemoData();
      loadAllData();
    }
  };

  if (role !== 'barber') {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white font-cinzel">Área Restrita do Barbeiro</h2>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Esta área é exclusiva para a equipe da barbearia gerenciar os serviços, horários disponíveis e lista de agendamentos.
        </p>
        <button
          onClick={onOpenAuth}
          className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-6 py-3 rounded-xl text-xs transition shadow-lg cursor-pointer inline-flex items-center gap-2"
        >
          <Scissors className="w-4 h-4" />
          Fazer Login como Barbeiro
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white font-cinzel tracking-tight">
              Painel de Gestão do Barbeiro
            </h1>
            <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Admin
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {profile?.shopName || 'Navalha & Estilo'} • Olá, <strong>{user?.name || 'Carlos'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            Novo Agendamento Presencial
          </button>

          <button
            onClick={handleResetData}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition"
            title="Restaurar dados de teste"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Atendimentos Hoje</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {metrics.todayCount}
            </span>
            <span className="text-xs text-neutral-400">clientes</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Faturamento Hoje</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.revenueToday)}
            </span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pendentes de Aceite</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">
              {metrics.pendingCount}
            </span>
            <span className="text-xs text-neutral-400">aguardando</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Serviços no Catálogo</span>
            <Scissors className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {metrics.activeServicesCount}
            </span>
            <span className="text-xs text-neutral-400">ativos</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-neutral-800 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`py-3 px-4 text-xs font-bold transition whitespace-nowrap flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'appointments'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Agenda & Reservas ({appointments.length})
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`py-3 px-4 text-xs font-bold transition whitespace-nowrap flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'services'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Scissors className="w-4 h-4" />
          Gerenciar Serviços ({services.length})
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`py-3 px-4 text-xs font-bold transition whitespace-nowrap flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'schedule'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Horários & Disponibilidade
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-3 px-4 text-xs font-bold transition whitespace-nowrap flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          Dados da Barbearia
        </button>
      </div>

      {/* ================= TAB 1: APPOINTMENTS ================= */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Date filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <button
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  dateFilter === 'today'
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setDateFilter('tomorrow')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  dateFilter === 'tomorrow'
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                Amanhã
              </button>
              <button
                onClick={() => setDateFilter('week')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  dateFilter === 'week'
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                Esta Semana
              </button>
              <button
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  dateFilter === 'all'
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                Todos
              </button>
            </div>

            {/* Status filter & Search */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">Todos os Status</option>
                <option value="pendente">Apenas Pendentes</option>
                <option value="confirmado">Confirmados</option>
                <option value="concluido">Concluídos</option>
                <option value="cancelado">Cancelados</option>
              </select>

              <input
                type="text"
                placeholder="Buscar cliente ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 flex-1 md:w-52"
              />
            </div>
          </div>

          {/* List of appointments */}
          {filteredAppointments.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center space-y-2">
              <Calendar className="w-10 h-10 text-neutral-600 mx-auto" />
              <p className="text-sm font-semibold text-white">Nenhum agendamento encontrado</p>
              <p className="text-xs text-neutral-500">
                Não há reservas para o filtro selecionado no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((apt) => {
                return (
                  <div
                    key={apt.id}
                    className={`bg-neutral-900 border rounded-2xl p-5 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      apt.status === 'cancelado'
                        ? 'border-neutral-800/50 opacity-60'
                        : apt.status === 'pendente'
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-neutral-800'
                    }`}
                  >
                    {/* Client & Time info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">
                          {apt.clientName}
                        </span>

                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          apt.status === 'confirmado'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : apt.status === 'pendente'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : apt.status === 'concluido'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        }`}>
                          {apt.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-400">
                        <span className="font-semibold text-amber-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {apt.date} às {apt.time}
                        </span>
                        <span>•</span>
                        <span className="text-white font-medium">{apt.serviceName}</span>
                        <span>•</span>
                        <span>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apt.servicePrice)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-neutral-500" />
                          {apt.clientPhone}
                        </span>
                        <span>
                          <Mail className="w-3 h-3 text-neutral-500 inline mr-1" />
                          {apt.clientEmail}
                        </span>
                      </div>

                      {apt.notes && (
                        <p className="text-[11px] text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800 inline-block mt-1">
                          <strong>Observação:</strong> {apt.notes}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-800">
                      {/* WhatsApp contact */}
                      <a
                        href={`https://api.whatsapp.com/send?phone=${apt.clientPhone.replace(/\D/g, '')}&text=${encodeURIComponent(
                          `Olá ${apt.clientName}! Aqui é da ${profile?.shopName || 'barbearia'}. Confirmando seu horário de ${apt.serviceName} para o dia ${apt.date} às ${apt.time}. Podemos contar com você?`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition"
                        title="Enviar WhatsApp para o cliente"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>

                      {/* Confirm button */}
                      {apt.status === 'pendente' && (
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'confirmado')}
                          className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Confirmar
                        </button>
                      )}

                      {/* Conclude button */}
                      {apt.status === 'confirmado' && (
                        <button
                          onClick={() => handleUpdateStatus(apt.id, 'concluido')}
                          className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Concluir
                        </button>
                      )}

                      {/* Cancel button */}
                      {apt.status !== 'cancelado' && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Deseja cancelar o horário de ${apt.clientName}?`)) {
                              handleUpdateStatus(apt.id, 'cancelado');
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-red-500/20 hover:text-red-400 text-neutral-400 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: SERVICES ================= */}
      {activeTab === 'services' && (
        <BarberServicesManager services={services} onRefresh={loadAllData} />
      )}

      {/* ================= TAB 3: SCHEDULE ================= */}
      {activeTab === 'schedule' && (
        <BarberScheduleManager
          schedule={schedule}
          profile={profile}
          onRefresh={loadAllData}
        />
      )}

      {/* ================= TAB 4: BARBER PROFILE ================= */}
      {activeTab === 'profile' && profileForm && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white font-cinzel">Informações da Barbearia</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Personalize o nome do estabelecimento, endereço e formas de contato direto.
            </p>
          </div>

          {profileSaved && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Informações atualizadas com sucesso!</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Nome da Barbearia
              </label>
              <input
                type="text"
                required
                value={profileForm.shopName}
                onChange={(e) => setProfileForm({ ...profileForm, shopName: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Nome do Barbeiro Responsável
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  WhatsApp (apenas números com DDD)
                </label>
                <input
                  type="text"
                  required
                  placeholder="5511987654321"
                  value={profileForm.whatsapp}
                  onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Endereço Completo
              </label>
              <input
                type="text"
                required
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Telefone de Contato
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Instagram
                </label>
                <input
                  type="text"
                  value={profileForm.instagram}
                  onChange={(e) => setProfileForm({ ...profileForm, instagram: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Sobre a Barbearia (Bio)
              </label>
              <textarea
                rows={3}
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-4 border-t border-neutral-800 flex justify-end">
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Salvar Dados da Barbearia
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Appointment Walk-In Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 text-neutral-100 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                Agendar Cliente Presencial
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Lucas Mendes"
                  value={manualClientName}
                  onChange={(e) => setManualClientName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 99999-0000"
                    value={manualClientPhone}
                    onChange={(e) => setManualClientPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">
                    E-mail (opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="lucas@email.com"
                    value={manualClientEmail}
                    onChange={(e) => setManualClientEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">
                  Serviço *
                </label>
                <select
                  value={manualServiceId}
                  onChange={(e) => setManualServiceId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Selecione o serviço...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - R$ {s.price.toFixed(2)} ({s.durationMinutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">
                    Horário *
                  </label>
                  <input
                    type="time"
                    required
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">
                  Anotações
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cliente prefere tesoura no topo"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Salvar na Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
