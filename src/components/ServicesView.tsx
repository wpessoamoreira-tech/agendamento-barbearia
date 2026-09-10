import React, { useState, useEffect } from 'react';
import { Scissors, Clock, ArrowRight, Sparkles, Check, Phone, MapPin } from 'lucide-react';
import { Service, BarberProfile } from '../types';
import { DataService } from '../services/dataService';

interface ServicesViewProps {
  onSelectServiceToBook: (service: Service) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ onSelectServiceToBook }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [profile, setProfile] = useState<BarberProfile | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [sList, prof] = await Promise.all([
          DataService.getServices(),
          DataService.getBarberProfile(),
        ]);
        setServices(sList.filter((s) => s.active));
        setProfile(prof);
      } catch (err) {
        console.error('Error loading services:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = selectedCategory === 'todos'
    ? services
    : services.filter((s) => s.category === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          Tabela Oficial de Serviços
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-cinzel">
          Tradição, Estilo e Alta Precisão
        </h1>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Confira abaixo todos os procedimentos disponíveis na nossa barbearia. Escolha o seu e garanta seu horário com praticidade online.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[
          { id: 'todos', label: 'Todos os Procedimentos' },
          { id: 'corte', label: 'Cortes de Cabelo' },
          { id: 'barba', label: 'Barba & Toalha Quente' },
          { id: 'combo', label: 'Combos Especiais' },
          { id: 'tratamento', label: 'Tratamentos & Cor' },
          { id: 'outro', label: 'Outros' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md'
                : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center text-neutral-400">
          <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs">Carregando serviços...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((service) => (
            <div
              key={service.id}
              className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-6 transition flex flex-col justify-between group hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-800 text-amber-400 px-2.5 py-1 rounded-md border border-neutral-700/50">
                    {service.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-neutral-400">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{service.durationMinutes} min</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-400 transition">
                  {service.name}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                  {service.description}
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase block font-semibold">Valor</span>
                  <span className="text-xl font-extrabold text-amber-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
                  </span>
                </div>

                <button
                  onClick={() => onSelectServiceToBook(service)}
                  className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  Agendar
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Banner at bottom */}
      {profile && (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">{profile.shopName}</p>
              <p>{profile.address}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`https://api.whatsapp.com/send?phone=${profile.whatsapp}&text=${encodeURIComponent('Olá! Gostaria de tirar uma dúvida sobre os serviços da barbearia.')}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <Phone className="w-3.5 h-3.5" />
              WhatsApp: {profile.phone}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
