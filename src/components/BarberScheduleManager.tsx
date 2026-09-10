import React, { useState } from 'react';
import { Clock, Calendar, Check, Save, AlertCircle } from 'lucide-react';
import { DaySchedule, BarberProfile } from '../types';
import { DataService } from '../services/dataService';

interface BarberScheduleManagerProps {
  schedule: DaySchedule[];
  profile: BarberProfile | null;
  onRefresh: () => void;
}

export const BarberScheduleManager: React.FC<BarberScheduleManagerProps> = ({
  schedule: initialSchedule,
  profile: initialProfile,
  onRefresh,
}) => {
  const [schedule, setSchedule] = useState<DaySchedule[]>(initialSchedule);
  const [slotInterval, setSlotInterval] = useState<number>(initialProfile?.slotIntervalMinutes || 30);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggleDay = (dayOfWeek: number) => {
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, isOpen: !d.isOpen } : d))
    );
  };

  const handleChangeTime = (
    dayOfWeek: number,
    field: 'openTime' | 'closeTime' | 'breakStart' | 'breakEnd',
    val: string
  ) => {
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: val } : d))
    );
  };

  const handleToggleBreak = (dayOfWeek: number) => {
    setSchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, hasBreak: !d.hasBreak } : d))
    );
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await DataService.updateSchedule(schedule);

      if (initialProfile) {
        await DataService.updateBarberProfile({
          ...initialProfile,
          slotIntervalMinutes: slotInterval,
        });
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      onRefresh();
    } catch {
      alert('Erro ao salvar horários de atendimento.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-cinzel">Horários de Atendimento</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure quais dias a barbearia abre, horários de expediente e pausas de almoço.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer shadow-md disabled:opacity-50"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-950" />
              Horários Salvos!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </>
          )}
        </button>
      </div>

      {/* Global Slot Interval Setting */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Intervalo Padrão entre Agendamentos
          </h3>
          <p className="text-xs text-neutral-400">
            Define o espaçamento entre cada horário disponível exibido para os clientes.
          </p>
        </div>

        <select
          value={slotInterval}
          onChange={(e) => setSlotInterval(Number(e.target.value))}
          className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value={20}>A cada 20 minutos</option>
          <option value={30}>A cada 30 minutos (Recomendado)</option>
          <option value={40}>A cada 40 minutos</option>
          <option value={45}>A cada 45 minutos</option>
          <option value={60}>A cada 60 minutos (1 hora)</option>
        </select>
      </div>

      {/* Days Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="divide-y divide-neutral-800">
          {schedule.map((day) => (
            <div
              key={day.dayOfWeek}
              className={`p-4 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                day.isOpen ? 'bg-neutral-900' : 'bg-neutral-950/40 opacity-60'
              }`}
            >
              {/* Day Name & Toggle */}
              <div className="flex items-center gap-3 min-w-[180px]">
                <button
                  type="button"
                  onClick={() => handleToggleDay(day.dayOfWeek)}
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                    day.isOpen ? 'bg-amber-500' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-neutral-950 absolute top-1 transition-transform ${
                      day.isOpen ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
                <div>
                  <span className="text-sm font-bold text-white block">{day.dayName}</span>
                  <span className={`text-[10px] font-medium ${day.isOpen ? 'text-emerald-400' : 'text-neutral-500'}`}>
                    {day.isOpen ? 'Barbearia Aberta' : 'Fechado (Folga)'}
                  </span>
                </div>
              </div>

              {/* Working Hours */}
              {day.isOpen ? (
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  {/* Opening / Closing */}
                  <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
                    <span className="text-neutral-400 font-medium">Expediente:</span>
                    <input
                      type="time"
                      value={day.openTime}
                      onChange={(e) => handleChangeTime(day.dayOfWeek, 'openTime', e.target.value)}
                      className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-white font-semibold focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-neutral-500">até</span>
                    <input
                      type="time"
                      value={day.closeTime}
                      onChange={(e) => handleChangeTime(day.dayOfWeek, 'closeTime', e.target.value)}
                      className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-white font-semibold focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Lunch Break */}
                  <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800">
                    <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300">
                      <input
                        type="checkbox"
                        checked={day.hasBreak}
                        onChange={() => handleToggleBreak(day.dayOfWeek)}
                        className="rounded bg-neutral-900 border-neutral-700 text-amber-500 focus:ring-amber-500 w-3.5 h-3.5"
                      />
                      <span>Almoço:</span>
                    </label>

                    {day.hasBreak && (
                      <div className="flex items-center gap-1">
                        <input
                          type="time"
                          value={day.breakStart}
                          onChange={(e) => handleChangeTime(day.dayOfWeek, 'breakStart', e.target.value)}
                          className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-white font-semibold focus:border-amber-500 focus:outline-none"
                        />
                        <span className="text-neutral-500">às</span>
                        <input
                          type="time"
                          value={day.breakEnd}
                          onChange={(e) => handleChangeTime(day.dayOfWeek, 'breakEnd', e.target.value)}
                          className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-white font-semibold focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-neutral-500 italic">
                  Nenhum horário liberado para agendamentos neste dia.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
