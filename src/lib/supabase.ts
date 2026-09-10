import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read env variables safely
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

// Instantiate client if keys are present, or a fallback dummy client
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Complete SQL Schema script that user can run in Supabase SQL Editor
export const SUPABASE_SCHEMA_SQL = `-- SCHEMA DO BANCO DE DADOS SUPABASE PARA BARBEARIA
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Tabela de Perfis de Usuários
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  phone text,
  role text default 'client' check (role in ('client', 'barber')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de Serviços oferecidos pelo Barbeiro
create table if not exists public.services (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  duration_minutes integer not null default 30,
  category text not null default 'corte',
  active boolean not null default true,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Agendamentos
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  client_id text not null,
  client_name text not null,
  client_email text not null,
  client_phone text not null,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  service_price numeric(10,2) not null,
  service_duration integer not null,
  date date not null,
  time text not null,
  status text not null default 'pendente' check (status in ('pendente', 'confirmado', 'concluido', 'cancelado')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela de Horários e Disponibilidade da Barbearia
create table if not exists public.barber_schedules (
  id serial primary key,
  day_of_week integer not null unique,
  day_name text not null,
  is_open boolean not null default true,
  open_time text not null default '09:00',
  close_time text not null default '19:00',
  has_break boolean not null default true,
  break_start text not null default '12:00',
  break_end text not null default '13:00'
);

-- 5. Tabela de Perfil da Barbearia
create table if not exists public.barber_profile (
  id integer primary key default 1,
  name text not null default 'Barbeiro Mestre',
  shop_name text not null default 'Navalha & Estilo Barbearia',
  address text not null default 'Rua das Flores, 123 - Centro',
  phone text not null default '(11) 98765-4321',
  whatsapp text not null default '11987654321',
  instagram text not null default '@navalhaestilo',
  description text default 'Cortes clássicos, barboterapia e visual moderno com alto padrão de atendimento.',
  slot_interval_minutes integer not null default 30
);

-- Inserir dados padrão caso estejam vazios
insert into public.services (name, description, price, duration_minutes, category, active)
values 
  ('Corte Tradicional / Degradê', 'Corte com máquina e tesoura, acabamento na navalha e finalização com pomada modeladora.', 45.00, 40, 'corte', true),
  ('Barba Completa com Toalha Quente', 'Alinhamento com navalhete, esfoliação facial, hidratação e toalha aquecida aromatizada.', 35.00, 30, 'barba', true),
  ('Combo Cabelo + Barba', 'Experiência completa com corte personalizado e ritual de barboterapia relaxante.', 70.00, 60, 'combo', true),
  ('Pigmentação de Barba ou Cabelo', 'Disfarce de fios brancos e realce dos traços faciais com acabamento natural.', 30.00, 25, 'tratamento', true),
  ('Acabamento / Pezinho', 'Alinhamento das linhas do cabelo e contorno da nuca com navalha afiada.', 20.00, 15, 'corte', true),
  ('Sobrancelha na Navalha ou Pinça', 'Design limpo e discreto para harmonização do olhar masculino.', 15.00, 15, 'outro', true)
on conflict do nothing;

insert into public.barber_profile (id, name, shop_name, address, phone, whatsapp, instagram, description, slot_interval_minutes)
values (1, 'Carlos Mestre da Navalha', 'Navalha & Estilo Barbearia', 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP', '(11) 98765-4321', '5511987654321', '@navalhaestilo', 'Especialista em visagismo masculino, cortes clássicos e modernos há mais de 10 anos.', 30)
on conflict (id) do nothing;

-- Horários padrão: Terça a Sábado
insert into public.barber_schedules (day_of_week, day_name, is_open, open_time, close_time, has_break, break_start, break_end)
values 
  (0, 'Domingo', false, '09:00', '13:00', false, '12:00', '13:00'),
  (1, 'Segunda-feira', false, '09:00', '19:00', true, '12:00', '13:00'),
  (2, 'Terça-feira', true, '09:00', '19:00', true, '12:00', '13:00'),
  (3, 'Quarta-feira', true, '09:00', '19:00', true, '12:00', '13:00'),
  (4, 'Quinta-feira', true, '09:00', '19:00', true, '12:00', '13:00'),
  (5, 'Sexta-feira', true, '09:00', '20:00', true, '12:00', '13:00'),
  (6, 'Sábado', true, '08:30', '18:00', false, '12:00', '13:00')
on conflict (day_of_week) do nothing;

-- Habilitar RLS (Row Level Security) permissiva para desenvolvimento
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.barber_schedules enable row level security;
alter table public.barber_profile enable row level security;

create policy "Permitir leitura publica de servicos" on public.services for select using (true);
create policy "Permitir leitura publica de horarios" on public.barber_schedules for select using (true);
create policy "Permitir leitura publica do perfil" on public.barber_profile for select using (true);
create policy "Permitir insercao de agendamentos" on public.appointments for insert with check (true);
create policy "Permitir leitura de agendamentos" on public.appointments for select using (true);
create policy "Permitir atualizacao de agendamentos" on public.appointments for update using (true);
create policy "Permitir gerenciamento total de servicos" on public.services for all using (true);
create policy "Permitir gerenciamento de horarios" on public.barber_schedules for all using (true);
create policy "Permitir atualizacao de perfil" on public.barber_profile for all using (true);
`;
