-- JJ Relaciona · Schema inicial
-- Executar no Supabase SQL Editor (ou via CLI supabase db push)

-- ============================================================
-- HANDLER de timestamps + helper de perfil
-- ============================================================
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Helper: verifica se o usuário autenticado é admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.perfil = 'admin'
      and p.ativo = true
  );
$$;

-- Helper: retorna o perfil do usuário autenticado
create or replace function public.current_profile()
returns public.profiles
language sql
security definer
set search_path = public
as $$
  select * from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- profiles (espelha auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  perfil text not null check (perfil in ('admin', 'vendedor')),
  telefone text,
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- lojas
-- ============================================================
create table if not exists public.lojas (
  id uuid primary key default gen_random_uuid(),
  razao_social text,
  nome_fantasia text not null,
  cnpj text,
  data_fundacao date,
  whatsapp text,
  telefone text,
  email text,
  endereco text,
  numero text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  segmento text,
  vendedor_responsavel_id uuid references public.profiles(id),
  status text default 'ativo' check (status in ('ativo', 'inativo')),
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_lojas_updated_at before update on public.lojas
  for each row execute function public.set_updated_at();

-- ============================================================
-- contatos_loja
-- ============================================================
create table if not exists public.contatos_loja (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade not null,
  nome text not null,
  cargo text,
  whatsapp text,
  telefone text,
  email text,
  data_nascimento date,
  recebe_mensagens boolean default true,
  recebe_campanhas boolean default true,
  recebe_treinamentos boolean default true,
  observacoes text,
  ativo boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_contatos_updated_at before update on public.contatos_loja
  for each row execute function public.set_updated_at();

-- ============================================================
-- interacoes
-- ============================================================
create table if not exists public.interacoes (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade not null,
  contato_id uuid references public.contatos_loja(id) on delete set null,
  usuario_id uuid references public.profiles(id) not null,
  tipo text not null,
  descricao text not null,
  data_interacao timestamptz default now(),
  created_at timestamptz default now()
);

-- ============================================================
-- brindes
-- ============================================================
create table if not exists public.brindes (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid references public.lojas(id) on delete cascade not null,
  contato_id uuid references public.contatos_loja(id) on delete set null,
  motivo text,
  descricao text,
  status text default 'pendente' check (status in ('pendente', 'separado', 'enviado', 'cancelado')),
  data_prevista date,
  data_envio date,
  vendedor_responsavel_id uuid references public.profiles(id),
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_brindes_updated_at before update on public.brindes
  for each row execute function public.set_updated_at();

-- ============================================================
-- campanhas
-- ============================================================
create table if not exists public.campanhas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  produto_marca text,
  regra text,
  premio text,
  data_inicio date,
  data_fim date,
  status text default 'rascunho' check (status in ('rascunho', 'ativa', 'encerrada', 'cancelada')),
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_campanhas_updated_at before update on public.campanhas
  for each row execute function public.set_updated_at();

-- ============================================================
-- campanha_participantes
-- ============================================================
create table if not exists public.campanha_participantes (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid references public.campanhas(id) on delete cascade not null,
  loja_id uuid references public.lojas(id) on delete cascade not null,
  contato_id uuid references public.contatos_loja(id) on delete set null,
  status text default 'convidado' check (status in ('convidado', 'participando', 'concluido', 'cancelado')),
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_campanha_participantes_updated_at before update on public.campanha_participantes
  for each row execute function public.set_updated_at();

-- ============================================================
-- treinamentos
-- ============================================================
create table if not exists public.treinamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tema text,
  parceiro text,
  data date,
  horario time,
  local text,
  vagas integer,
  descricao text,
  status text default 'programado' check (status in ('programado', 'realizado', 'cancelado')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_treinamentos_updated_at before update on public.treinamentos
  for each row execute function public.set_updated_at();

-- ============================================================
-- treinamento_participantes
-- ============================================================
create table if not exists public.treinamento_participantes (
  id uuid primary key default gen_random_uuid(),
  treinamento_id uuid references public.treinamentos(id) on delete cascade not null,
  loja_id uuid references public.lojas(id) on delete cascade not null,
  contato_id uuid references public.contatos_loja(id) on delete set null,
  confirmado boolean default false,
  compareceu boolean default false,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_treinamento_participantes_updated_at before update on public.treinamento_participantes
  for each row execute function public.set_updated_at();

-- ============================================================
-- Índices úteis
-- ============================================================
create index if not exists idx_lojas_vendedor on public.lojas(vendedor_responsavel_id);
create index if not exists idx_contatos_loja on public.contatos_loja(loja_id);
create index if not exists idx_interacoes_loja on public.interacoes(loja_id);
create index if not exists idx_brindes_loja on public.brindes(loja_id);
create index if not exists idx_campanha_part_campanha on public.campanha_participantes(campanha_id);
create index if not exists idx_trein_part_treinamento on public.treinamento_participantes(treinamento_id);
