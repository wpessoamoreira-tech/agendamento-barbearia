import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BookingFlow } from './components/BookingFlow';
import { ServicesView } from './components/ServicesView';
import { ClientAppointments } from './components/ClientAppointments';
import { BarberDashboard } from './components/BarberDashboard';
import { AuthModal } from './components/AuthModal';
import { DataService } from './services/dataService';
import { Service, BarberProfile } from './types';
import { Scissors, MapPin, Phone, Instagram, Calendar, Shield } from 'lucide-react';

function MainApp() {
  const { user, role } = useAuth();

  const [activeView, setActiveView] = useState<'booking' | 'services' | 'client-appointments' | 'barber-dashboard'>('booking');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'client' | 'barber'>('client');
  const [profile, setProfile] = useState<BarberProfile | null>(null);
  const [clientAppointmentCount, setClientAppointmentCount] = useState(0);

  // Load shop profile and client appointments count
  const loadData = async () => {
    try {
      const prof = await DataService.getBarberProfile();
      setProfile(prof);

      if (user && user.role === 'client') {
        const myApts = await DataService.getClientAppointments(user.email);
        const activeCount = myApts.filter((a) => a.status !== 'cancelado' && a.status !== 'concluido').length;
        setClientAppointmentCount(activeCount);
      } else {
        setClientAppointmentCount(0);
      }
    } catch (err) {
      console.error('Error loading main app data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('barber_data_updated', handleUpdate);
    return () => window.removeEventListener('barber_data_updated', handleUpdate);
  }, [user]);

  const handleOpenAuth = (defaultTab: 'client' | 'barber' = 'client') => {
    setAuthModalTab(defaultTab);
    setAuthModalOpen(true);
  };

  const handleSelectServiceToBook = (service: Service) => {
    setActiveView('booking');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      
      {/* Main Navigation */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAuth={handleOpenAuth}
        shopName={profile?.shopName}
        clientAppointmentCount={clientAppointmentCount}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'booking' && (
          <BookingFlow
            onGoToMyAppointments={() => setActiveView('client-appointments')}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {activeView === 'services' && (
          <ServicesView
            onSelectServiceToBook={handleSelectServiceToBook}
          />
        )}

        {activeView === 'client-appointments' && (
          <ClientAppointments
            onGoToBooking={() => setActiveView('booking')}
            onOpenAuth={() => handleOpenAuth('client')}
          />
        )}

        {activeView === 'barber-dashboard' && (
          <BarberDashboard
            onOpenAuth={() => handleOpenAuth('barber')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900/60 border-t border-neutral-800 mt-16 py-12 text-neutral-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            
            {/* Col 1: Shop details */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-neutral-950 flex items-center justify-center font-bold">
                  <Scissors className="w-4 h-4" />
                </div>
                <span className="font-bold text-base font-cinzel tracking-tight">
                  {profile?.shopName || 'Navalha & Estilo Barbearia'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-md">
                {profile?.description || 'Cortes masculinos impecáveis, barboterapia relaxante com toalha quente e atmosfera tradicional com atendimento de excelência.'}
              </p>
              <div className="flex items-center gap-4 pt-1">
                <button
                  onClick={() => handleOpenAuth('barber')}
                  className="text-neutral-400 hover:text-amber-400 flex items-center gap-1.5 transition text-xs font-semibold"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Acesso Restrito do Barbeiro
                </button>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-2">
              <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Navegação Rápida</h4>
              <ul className="space-y-1.5">
                <li>
                  <button onClick={() => setActiveView('booking')} className="hover:text-white transition cursor-pointer">
                    Agendar Horário Online
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveView('services')} className="hover:text-white transition cursor-pointer">
                    Tabela de Serviços e Preços
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveView('client-appointments')} className="hover:text-white transition cursor-pointer">
                    Minhas Reservas
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Contact & Location */}
            <div className="space-y-2">
              <h4 className="text-white font-bold uppercase tracking-wider text-[11px]">Localização & Contato</h4>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{profile?.address || 'Av. Paulista, 1000 - São Paulo, SP'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{profile?.phone || '(11) 98765-4321'}</span>
              </p>
              {profile?.instagram && (
                <p className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{profile.instagram}</span>
                </p>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
            <p>© {new Date().getFullYear()} {profile?.shopName || 'Navalha & Estilo'}. Todos os direitos reservados.</p>
            <p>Sistema de Agendamento integrado ao Supabase.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
        onSuccess={() => {
          if (authModalTab === 'barber') {
            setActiveView('barber-dashboard');
          }
        }}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
