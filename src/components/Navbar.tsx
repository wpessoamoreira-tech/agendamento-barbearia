import React, { useState } from 'react';
import { Scissors, User as UserIcon, Calendar, LogOut, Menu, X, Sparkles, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeView: 'booking' | 'services' | 'client-appointments' | 'barber-dashboard';
  setActiveView: (view: 'booking' | 'services' | 'client-appointments' | 'barber-dashboard') => void;
  onOpenAuth: (defaultTab?: 'client' | 'barber') => void;
  onOpenSupabase?: () => void;
  shopName?: string;
  clientAppointmentCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  onOpenAuth,
  onOpenSupabase,
  shopName = 'Navalha & Estilo',
  clientAppointmentCount = 0,
}) => {
  const { user, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNavClick = (view: 'booking' | 'services' | 'client-appointments' | 'barber-dashboard') => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand Logo */}
          <div 
            onClick={() => handleNavClick('booking')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-neutral-950 font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block font-cinzel">
                {shopName}
              </span>
              <span className="text-[11px] text-amber-400 font-medium tracking-wider uppercase block -mt-1">
                Barbearia & Barber Shop
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-neutral-900/60 p-1.5 rounded-xl border border-neutral-800/80">
            <button
              onClick={() => handleNavClick('booking')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeView === 'booking'
                  ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Agendar Horário
            </button>

            <button
              onClick={() => handleNavClick('services')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeView === 'services'
                  ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Scissors className="w-4 h-4" />
              Serviços & Preços
            </button>

            {role === 'client' && (
              <button
                onClick={() => handleNavClick('client-appointments')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'client-appointments'
                    ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                Minhas Reservas
                {clientAppointmentCount > 0 && (
                  <span className="bg-amber-400 text-neutral-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {clientAppointmentCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => {
                if (role === 'barber') {
                  handleNavClick('barber-dashboard');
                } else {
                  onOpenAuth('barber');
                }
              }}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeView === 'barber-dashboard'
                  ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              Painel do Barbeiro
              {role === 'barber' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>
          </nav>

          {/* Right Action Tools: Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* User Profile / Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 py-1.5 px-3 rounded-xl transition cursor-pointer"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left text-xs">
                    <span className="font-semibold text-white block max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-amber-400 block font-medium">
                      {user.role === 'barber' ? 'Barbeiro' : 'Cliente'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-52 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl py-1 text-sm z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-neutral-800 text-xs text-neutral-400">
                      <p className="font-medium text-white truncate">{user.name}</p>
                      <p className="truncate text-[11px]">{user.email}</p>
                    </div>

                    {user.role === 'client' && (
                      <button
                        onClick={() => {
                          handleNavClick('client-appointments');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2 text-xs transition"
                      >
                        <Calendar className="w-4 h-4 text-amber-400" />
                        Minhas Reservas
                      </button>
                    )}

                    {user.role === 'barber' && (
                      <button
                        onClick={() => {
                          handleNavClick('barber-dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-white flex items-center gap-2 text-xs transition"
                      >
                        <Scissors className="w-4 h-4 text-amber-400" />
                        Gerenciar Agendamentos
                      </button>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                        handleNavClick('booking');
                      }}
                      className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/10 flex items-center gap-2 text-xs transition border-t border-neutral-800"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair da Conta
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('client')}
                  className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Entrar / Cadastrar
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-900/95 border-b border-neutral-800 px-4 py-4 space-y-2">
          <button
            onClick={() => handleNavClick('booking')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 ${
              activeView === 'booking' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Agendar Horário
          </button>

          <button
            onClick={() => handleNavClick('services')}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 ${
              activeView === 'services' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Scissors className="w-4 h-4" />
            Serviços & Tabela de Preços
          </button>

          {role === 'client' && (
            <button
              onClick={() => handleNavClick('client-appointments')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 ${
                activeView === 'client-appointments' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              Minhas Reservas ({clientAppointmentCount})
            </button>
          )}

          <button
            onClick={() => {
              if (role === 'barber') {
                handleNavClick('barber-dashboard');
              } else {
                onOpenAuth('barber');
              }
            }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 ${
              activeView === 'barber-dashboard' ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            Painel do Barbeiro
          </button>

          <div className="pt-3 border-t border-neutral-800">
            {user ? (
              <div className="space-y-2">
                <div className="px-2 py-1 text-xs text-neutral-400">
                  Conectado como <strong className="text-white">{user.name}</strong> ({user.role === 'barber' ? 'Barbeiro' : 'Cliente'})
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-xl text-xs text-red-400 bg-red-500/10 font-medium flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da Conta
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onOpenAuth('client');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 bg-amber-500 text-neutral-950 font-bold rounded-xl text-xs text-center"
                >
                  Entrar como Cliente
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('barber');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 bg-neutral-800 text-white font-semibold rounded-xl text-xs text-center border border-neutral-700"
                >
                  Login do Barbeiro
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
