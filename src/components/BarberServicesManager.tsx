import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, Clock, Scissors, DollarSign, AlertCircle } from 'lucide-react';
import { Service } from '../types';
import { DataService } from '../services/dataService';

interface BarberServicesManagerProps {
  services: Service[];
  onRefresh: () => void;
}

export const BarberServicesManager: React.FC<BarberServicesManagerProps> = ({ services, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(40);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [category, setCategory] = useState<Service['category']>('corte');
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openNewModal = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setPrice(40);
    setDurationMinutes(30);
    setCategory('corte');
    setActive(true);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description);
    setPrice(service.price);
    setDurationMinutes(service.durationMinutes);
    setCategory(service.category);
    setActive(service.active);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome do serviço.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await DataService.saveService({
        id: editingService?.id,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        durationMinutes: Number(durationMinutes),
        category,
        active,
      });
      setIsModalOpen(false);
      onRefresh();
    } catch {
      setError('Erro ao salvar serviço. Verifique a conexão.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, serviceName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o serviço "${serviceName}"?`)) {
      return;
    }
    try {
      await DataService.deleteService(id);
      onRefresh();
    } catch {
      alert('Erro ao excluir serviço.');
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await DataService.saveService({
        ...service,
        active: !service.active,
      });
      onRefresh();
    } catch {
      console.error('Error toggling service');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-cinzel">Catálogo de Serviços</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Cadastre novos procedimentos, defina preços e tempo de atendimento na cadeira.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Novo Serviço
        </button>
      </div>

      {/* Services Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className={`bg-neutral-900 border rounded-2xl p-5 transition flex flex-col justify-between ${
              service.active ? 'border-neutral-800 hover:border-neutral-700' : 'border-neutral-800/40 opacity-50 bg-neutral-900/40'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-amber-400">
                    {service.category}
                  </span>
                  <button
                    onClick={() => handleToggleActive(service)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded transition cursor-pointer ${
                      service.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {service.active ? 'Ativo no Catálogo' : 'Inativo / Pausado'}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(service)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                    title="Editar Serviço"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id, service.name)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition"
                    title="Excluir Serviço"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-white mb-1">{service.name}</h3>
              <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-4">
                {service.description || 'Sem descrição cadastrada.'}
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-neutral-400">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{service.durationMinutes} minutos</span>
              </div>
              <span className="text-base font-extrabold text-amber-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.price)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 text-neutral-100 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Scissors className="w-5 h-5 text-amber-400" />
                {editingService ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corte Degradê Navalhado"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Descrição dos detalhes
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Inclui lavagem especial, finalização com pomada e toalha aromatizada."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Duração em Minutos *
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={20}>20 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={40}>40 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>60 minutos (1h)</option>
                    <option value={90}>90 minutos (1h30)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Service['category'])}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="corte">Corte de Cabelo</option>
                    <option value="barba">Barba / Barboterapia</option>
                    <option value="combo">Combo (Cabelo + Barba)</option>
                    <option value="tratamento">Tratamento / Pigmentação</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-300">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-neutral-950 border-neutral-800"
                    />
                    Disponível para clientes agendarem
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  {saving ? 'Salvando...' : editingService ? 'Atualizar Serviço' : 'Cadastrar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
