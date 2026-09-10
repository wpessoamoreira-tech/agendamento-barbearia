import React, { useState } from 'react';
import { Database, Check, Copy, ExternalLink, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { isSupabaseConfigured, SUPABASE_SCHEMA_SQL } from '../lib/supabase';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 text-neutral-100 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isSupabaseConfigured ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                Conexão com Banco de Dados Supabase
                {isSupabaseConfigured ? (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-medium">
                    Conectado
                  </span>
                ) : (
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-medium">
                    Modo Local / Demonstração
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-400">
                {isSupabaseConfigured 
                  ? 'O sistema está conectado ao seu banco Supabase em produção.'
                  : 'O sistema está operando localmente no navegador com dados salvos no localStorage.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 overflow-y-auto text-sm">
          {!isSupabaseConfigured && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-300">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-amber-200">Como conectar seu projeto Supabase:</p>
                <p>
                  1. Crie um projeto no site oficial <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a>.
                </p>
                <p>
                  2. No menu <strong>Project Settings &gt; API</strong>, copie a <strong>Project URL</strong> e a <strong>anon public key</strong>.
                </p>
                <p>
                  3. Defina as variáveis <code className="bg-black/40 px-1 py-0.5 rounded text-amber-100">VITE_SUPABASE_URL</code> e <code className="bg-black/40 px-1 py-0.5 rounded text-amber-100">VITE_SUPABASE_ANON_KEY</code> no painel de Secrets ou no arquivo <code>.env</code>.
                </p>
              </div>
            </div>
          )}

          {isSupabaseConfigured && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex gap-3 text-emerald-300">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-emerald-200">Supabase Ativo & Operacional</p>
                <p>Todas as consultas, cadastros de serviços e agendamentos estão sincronizados em tempo real com seu banco de dados na nuvem.</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Script SQL de Criação das Tabelas (SQL Editor)
              </label>
              <button
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-neutral-950 font-semibold px-3 py-1.5 rounded-lg transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Script SQL
                  </>
                )}
              </button>
            </div>
            <pre className="bg-black/60 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-300 font-mono overflow-x-auto max-h-56 leading-relaxed">
              {SUPABASE_SCHEMA_SQL}
            </pre>
            <p className="text-[11px] text-neutral-500">
              Basta colar este script no menu <strong>SQL Editor</strong> do Supabase e clicar em <strong>Run</strong>. As tabelas de serviços, agendamentos, horários e perfis serão criadas com os dados iniciais.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-sm font-medium transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
