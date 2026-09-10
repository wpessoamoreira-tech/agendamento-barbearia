import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, Scissors, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth, DEFAULT_BARBER_CREDENTIALS } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'client' | 'barber';
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'client',
  onSuccess,
  title,
  subtitle,
}) => {
  const { user, loginBarber, loginClientEmail, logout } = useAuth();
  const [tab, setTab] = useState<'client' | 'barber'>(defaultTab);

  // Client form state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Barber form state
  const [barberEmail, setBarberEmail] = useState(DEFAULT_BARBER_CREDENTIALS.email);
  const [barberPassword, setBarberPassword] = useState('');

  // UI status
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleFillBarberDefaults = () => {
    setBarberEmail(DEFAULT_BARBER_CREDENTIALS.email);
    setBarberPassword(DEFAULT_BARBER_CREDENTIALS.password);
    setError(null);
  };

  const handleBarberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await loginBarber(barberPassword, barberEmail);
      if (res.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(res.error || 'Erro ao autenticar barbeiro.');
      }
    } catch {
      setError('Ocorreu um erro ao tentar realizar o login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientName.trim() || !clientEmail.trim()) {
      setError('Por favor, informe seu nome e e-mail.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginClientEmail(clientEmail, clientName, clientPhone);
      if (res.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(res.error || 'Erro ao realizar login.');
      }
    } catch {
      setError('Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-6 text-neutral-100 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab switch */}
        <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 mb-6">
          <button
            type="button"
            onClick={() => { setTab('client'); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              tab === 'client'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Cliente
          </button>
          <button
            type="button"
            onClick={() => { setTab('barber'); setError(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
              tab === 'barber'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Scissors className="w-4 h-4" />
            Barbeiro / Painel
          </button>
        </div>

        {/* Header Message */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {title || (tab === 'client' ? 'Identificação do Cliente' : 'Acesso do Barbeiro')}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {subtitle || (tab === 'client' 
              ? 'Conecte sua conta para confirmar seu horário e gerenciar suas reservas com segurança.'
              : 'Entre com seu login e senha para gerenciar horários, serviços e agendamentos.')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {/* CLIENT TAB */}
        {tab === 'client' && (
          <div className="space-y-4">
            {user && user.role === 'client' && (
              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">Conectado atualmente:</span>
                  <span className="text-xs font-bold text-white block">{user.name}</span>
                  <span className="text-[11px] text-neutral-400">{user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setClientName('');
                    setClientEmail('');
                    setClientPhone('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition cursor-pointer"
                >
                  Trocar Cliente
                </button>
              </div>
            )}

            <p className="text-xs text-neutral-400">
              Preencha seus dados para salvar sua identificação e acompanhar seus agendamentos:
            </p>

            <form onSubmit={handleClientEmailSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Seu Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: João Silva"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Seu E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="joao@exemplo.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  WhatsApp / Celular (para lembrete)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    placeholder="(11) 99999-8888"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-3 px-4 rounded-xl transition text-sm flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Acessando...' : 'Acessar e Continuar'}
              </button>
            </form>
          </div>
        )}

        {/* BARBER TAB */}
        {tab === 'barber' && (
          <form onSubmit={handleBarberSubmit} className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-amber-200">Credenciais Padrão do Barbeiro:</p>
                <p className="mt-0.5 text-neutral-300">
                  E-mail: <strong className="text-white">barbeiro@navalha.com</strong>
                </p>
                <p className="text-neutral-300">
                  Senha: <strong className="text-white">admin123</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={handleFillBarberDefaults}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2.5 py-1.5 rounded-lg font-medium text-[11px] transition shrink-0 cursor-pointer"
              >
                Preencher
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                E-mail do Barbeiro
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={barberEmail}
                  onChange={(e) => setBarberEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={barberPassword}
                  onChange={(e) => setBarberPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold py-3 px-4 rounded-xl transition text-sm flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
            >
              <Scissors className="w-4 h-4" />
              {isLoading ? 'Entrando...' : 'Entrar no Painel do Barbeiro'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
