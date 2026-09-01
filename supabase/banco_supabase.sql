-- ============================================================
-- CONSTRUJOTA RELACIONA · BANCO COMPLETO PARA SUPABASE
-- Execute este arquivo uma única vez no SQL Editor do Supabase.
-- Depois publique a Edge Function supabase/functions/criar-usuario.
-- Login público: username + senha numérica de 6 dígitos.
-- ============================================================

create extension if not exists pgcrypto;

-- PERFIS (espelha auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  username text not null unique check (username ~ '^[a-z0-9._-]{3,30}$'),
  email text not null unique,
  perfil text not null default 'vendedor' check (perfil in ('admin', 'vendedor')),
  telefone text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lojas (
  id uuid primary key default gen_random_uuid(),
  razao_social text,
  nome_fantasia text not null,
  cnpj text unique,
  data_fundacao date,
  whatsapp text,
  telefone text,
  email text,
  endereco text,
  numero text,
  bairro text,
  cidade text,
  estado char(2),
  cep text,
  segmento text,
  vendedor_responsavel_id uuid references public.profiles(id) on delete set null,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contatos_loja (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  nome text not null,
  cargo text,
  whatsapp text,
  telefone text,
  email text,
  data_nascimento date,
  recebe_mensagens boolean not null default true,
  recebe_treinamentos boolean not null default true,
  observacoes text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interacoes (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  contato_id uuid references public.contatos_loja(id) on delete set null,
  usuario_id uuid not null references public.profiles(id) on delete restrict,
  tipo text not null,
  descricao text not null,
  data_interacao timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brindes (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  contato_id uuid references public.contatos_loja(id) on delete set null,
  motivo text,
  descricao text not null,
  status text not null default 'pendente' check (status in ('pendente', 'separado', 'enviado', 'cancelado')),
  data_prevista date,
  data_envio date,
  vendedor_responsavel_id uuid references public.profiles(id) on delete set null,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.treinamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tema text,
  parceiro text,
  data date,
  horario time,
  local text,
  vagas integer check (vagas is null or vagas >= 0),
  descricao text,
  status text not null default 'programado' check (status in ('programado', 'realizado', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.treinamento_participantes (
  id uuid primary key default gen_random_uuid(),
  treinamento_id uuid not null references public.treinamentos(id) on delete cascade,
  loja_id uuid not null references public.lojas(id) on delete cascade,
  contato_id uuid references public.contatos_loja(id) on delete set null,
  confirmado boolean not null default false,
  compareceu boolean not null default false,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (treinamento_id, loja_id, contato_id)
);

-- FUNÇÕES E TRIGGERS
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'lojas', 'contatos_loja', 'interacoes', 'brindes',
    'treinamentos',
    'treinamento_participantes'
  ] loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

-- Cria o profile automaticamente quando uma conta nasce no Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_username text;
begin
  new_username := lower(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));
  insert into public.profiles (id, nome, username, email, perfil, telefone, ativo)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nome', ''), initcap(new_username)),
    new_username,
    new.email,
    case when new.raw_user_meta_data ->> 'perfil' = 'admin' then 'admin' else 'vendedor' end,
    nullif(new.raw_user_meta_data ->> 'telefone', ''),
    true
  )
  on conflict (id) do update set
    nome = excluded.nome,
    username = excluded.username,
    email = excluded.email,
    perfil = excluded.perfil,
    telefone = excluded.telefone;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and perfil = 'admin' and ativo = true
  );
$$;

create or replace function public.current_profile()
returns setof public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from public.profiles where id = auth.uid() and ativo = true;
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and ativo = true);
$$;

-- Impede que um vendedor transforme a própria conta em administrador.
create or replace function public.protect_profile_access_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_admin() then
    if new.perfil is distinct from old.perfil
      or new.ativo is distinct from old.ativo
      or new.username is distinct from old.username
      or new.email is distinct from old.email then
      raise exception 'Somente administradores podem alterar dados de acesso.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_access_fields on public.profiles;
create trigger protect_profile_access_fields
  before update on public.profiles
  for each row execute function public.protect_profile_access_fields();

-- ÍNDICES
create index if not exists idx_lojas_vendedor on public.lojas(vendedor_responsavel_id);
create index if not exists idx_contatos_loja on public.contatos_loja(loja_id);
create index if not exists idx_interacoes_usuario_data on public.interacoes(usuario_id, data_interacao desc);
create index if not exists idx_interacoes_loja on public.interacoes(loja_id);
create index if not exists idx_brindes_vendedor on public.brindes(vendedor_responsavel_id);
create index if not exists idx_brindes_loja on public.brindes(loja_id);
create index if not exists idx_trein_part_loja on public.treinamento_participantes(loja_id);

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.lojas enable row level security;
alter table public.contatos_loja enable row level security;
alter table public.interacoes enable row level security;
alter table public.brindes enable row level security;
alter table public.treinamentos enable row level security;
alter table public.treinamento_participantes enable row level security;

-- Remove políticas de uma execução anterior para manter o arquivo reexecutável.
do $$
declare policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','lojas','contatos_loja','interacoes','brindes','treinamentos','treinamento_participantes')
  loop
    execute format('drop policy if exists %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end $$;

create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy lojas_select on public.lojas for select to authenticated
  using (public.is_admin() or (public.is_active_user() and vendedor_responsavel_id = auth.uid()));
create policy lojas_insert on public.lojas for insert to authenticated
  with check (public.is_admin() or (public.is_active_user() and vendedor_responsavel_id = auth.uid()));
create policy lojas_update on public.lojas for update to authenticated
  using (public.is_admin() or (public.is_active_user() and vendedor_responsavel_id = auth.uid()))
  with check (public.is_admin() or (public.is_active_user() and vendedor_responsavel_id = auth.uid()));
create policy lojas_delete on public.lojas for delete to authenticated
  using (public.is_admin());

create policy contatos_select on public.contatos_loja for select to authenticated
  using (public.is_admin() or (public.is_active_user() and exists (
    select 1 from public.lojas where lojas.id = contatos_loja.loja_id and lojas.vendedor_responsavel_id = auth.uid()
  )));
create policy contatos_insert on public.contatos_loja for insert to authenticated
  with check (public.is_admin() or (public.is_active_user() and exists (
    select 1 from public.lojas where lojas.id = contatos_loja.loja_id and lojas.vendedor_responsavel_id = auth.uid()
  )));
create policy contatos_update on public.contatos_loja for update to authenticated
  using (public.is_admin() or (public.is_active_user() and exists (
    select 1 from public.lojas where lojas.id = contatos_loja.loja_id and lojas.vendedor_responsavel_id = auth.uid()
  ))) with check (public.is_admin() or (public.is_active_user() and exists (
    select 1 from public.lojas where lojas.id = contatos_loja.loja_id and lojas.vendedor_responsavel_id = auth.uid()
  )));
create policy contatos_delete on public.contatos_loja for delete to authenticated using (public.is_admin());

-- O vendedor vê e contabiliza somente as próprias interações.
create policy interacoes_select on public.interacoes for select to authenticated
  using (public.is_admin() or (public.is_active_user() and usuario_id = auth.uid()));
create policy interacoes_insert on public.interacoes for insert to authenticated
  with check (public.is_admin() or (public.is_active_user() and usuario_id = auth.uid() and exists (
    select 1 from public.lojas where lojas.id = interacoes.loja_id and lojas.vendedor_responsavel_id = auth.uid()
  )));
create policy interacoes_update on public.interacoes for update to authenticated
  using (public.is_admin() or (public.is_active_user() and usuario_id = auth.uid()))
  with check (public.is_admin() or (public.is_active_user() and usuario_id = auth.uid()));
create policy interacoes_delete on public.interacoes for delete to authenticated
  using (public.is_admin() or (public.is_active_user() and usuario_id = auth.uid()));

create policy brindes_select on public.brindes for select to authenticated
  using (public.is_admin() or (public.is_active_user() and (vendedor_responsavel_id = auth.uid() or exists (
    select 1 from public.lojas where lojas.id = brindes.loja_id and lojas.vendedor_responsavel_id = auth.uid()
  ))));
create policy brindes_insert on public.brindes for insert to authenticated
  with check (public.is_admin() or (public.is_active_user() and vendedor_responsavel_id = auth.uid() and exists (
    select 1 from public.lojas where lojas.id = brindes.loja_id and lojas.vendedor_responsavel_id = auth.uid()
  )));
create policy brindes_update on public.brindes for update to authenticated
  using (public.is_admin() or (public.is_active_user() and vendedor_responsavel_id = auth.uid()))
  with check (public.is_admin() or (public.is_active_user() and vendedor_responsavel_id = auth.uid()));
create policy brindes_delete on public.brindes for delete to authenticated using (public.is_admin());

create policy treinamentos_select on public.treinamentos for select to authenticated
  using (public.is_admin() or (public.is_active_user() and status = 'programado'));
create policy treinamentos_admin_all on public.treinamentos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy trein_part_select on public.treinamento_participantes for select to authenticated
  using (public.is_admin() or (public.is_active_user() and exists (
    select 1 from public.lojas where lojas.id = treinamento_participantes.loja_id and lojas.vendedor_responsavel_id = auth.uid()
  )));
create policy trein_part_admin_write on public.treinamento_participantes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_profile() to authenticated;
grant execute on function public.is_active_user() to authenticated;

-- ============================================================
-- PRIMEIRO ADMINISTRADOR
-- 1. Em Authentication > Users, crie o e-mail:
--      admin@usuarios.construjota.com.br
--    com uma senha numérica de 6 dígitos e marque como confirmado.
-- 2. O trigger acima criará o profile automaticamente como vendedor.
-- 3. Promova a conta uma única vez com:
--      update public.profiles set perfil = 'admin' where username = 'admin';
-- 4. Os demais acessos passam a ser criados na tela Usuários do sistema.
-- ============================================================
