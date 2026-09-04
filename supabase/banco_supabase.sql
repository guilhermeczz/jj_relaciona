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
  criado_por uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contatos_loja (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  nome text not null check (btrim(nome) <> ''),
  cargo text not null check (btrim(cargo) <> ''),
  whatsapp text not null check (btrim(whatsapp) <> ''),
  hobby text not null check (btrim(hobby) <> ''),
  email text,
  data_nascimento date not null,
  recebe_mensagens boolean not null default false check (recebe_mensagens),
  recebe_treinamentos boolean not null default false check (recebe_treinamentos),
  observacoes text,
  ativo boolean not null default true constraint contatos_loja_ativo_sempre_true check (ativo = true),
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

-- Fila transacional para o futuro servidor de e-mails. O cadastro do convite
-- e separado do envio, permitindo tentativas, auditoria e validacao posterior.
create table if not exists public.convites_email (
  id uuid primary key default gen_random_uuid(),
  treinamento_participante_id uuid not null unique references public.treinamento_participantes(id) on delete cascade,
  treinamento_id uuid not null references public.treinamentos(id) on delete cascade,
  loja_id uuid not null references public.lojas(id) on delete cascade,
  contato_id uuid references public.contatos_loja(id) on delete set null,
  tipo_destinatario text not null check (tipo_destinatario in ('loja', 'contato')),
  destinatario_nome text not null,
  destinatario_email text,
  email_validado boolean not null default false,
  assunto text not null,
  dados jsonb not null default '{}'::jsonb,
  status text not null default 'pendente' check (status in ('pendente', 'sem_email', 'processando', 'enviado', 'erro', 'cancelado')),
  tentativas integer not null default 0,
  ultimo_erro text,
  provider_id text,
  agendado_para timestamptz not null default now(),
  enviado_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  destinatario_id uuid not null references public.profiles(id) on delete cascade,
  autor_id uuid references public.profiles(id) on delete set null,
  loja_id uuid references public.lojas(id) on delete cascade,
  tipo text not null default 'loja_cadastrada',
  titulo text not null,
  mensagem text not null,
  lida boolean not null default false,
  lida_em timestamptz,
  created_at timestamptz not null default now()
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
    'treinamento_participantes',
    'convites_email'
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

-- Registra de forma permanente quem cadastrou cada loja.
create or replace function public.protect_loja_criador()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.criado_por = coalesce(auth.uid(), new.criado_por);
  else
    new.criado_por = old.criado_por;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_loja_criador on public.lojas;
create trigger protect_loja_criador
  before insert or update on public.lojas
  for each row execute function public.protect_loja_criador();

create or replace function public.notificar_admin_nova_loja()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  autor public.profiles%rowtype;
  administrador record;
begin
  select * into autor from public.profiles where id = new.criado_por;
  if autor.id is null or autor.perfil <> 'vendedor' then
    return new;
  end if;

  for administrador in
    select id from public.profiles where perfil = 'admin' and ativo = true
  loop
    insert into public.notificacoes (
      destinatario_id, autor_id, loja_id, tipo, titulo, mensagem
    ) values (
      administrador.id,
      autor.id,
      new.id,
      'loja_cadastrada',
      'Nova loja cadastrada',
      'Vendedor ' || autor.nome || ' cadastrou a loja ' || new.nome_fantasia
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists notificar_admin_nova_loja on public.lojas;
create trigger notificar_admin_nova_loja
  after insert on public.lojas
  for each row execute function public.notificar_admin_nova_loja();

create or replace function public.enfileirar_convite_treinamento()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  convite record;
begin
  select
    t.nome as treinamento_nome,
    t.tema,
    t.data,
    t.horario,
    t.local,
    case when new.contato_id is null then 'loja' else 'contato' end as tipo_destinatario,
    case when new.contato_id is null then l.nome_fantasia else c.nome end as destinatario_nome,
    case when new.contato_id is null then l.email else c.email end as destinatario_email
  into convite
  from public.treinamentos t
  join public.lojas l on l.id = new.loja_id
  left join public.contatos_loja c on c.id = new.contato_id
  where t.id = new.treinamento_id;

  insert into public.convites_email (
    treinamento_participante_id, treinamento_id, loja_id, contato_id,
    tipo_destinatario, destinatario_nome, destinatario_email, assunto, dados, status
  ) values (
    new.id, new.treinamento_id, new.loja_id, new.contato_id,
    convite.tipo_destinatario, convite.destinatario_nome, nullif(btrim(convite.destinatario_email), ''),
    'Convite: ' || convite.treinamento_nome,
    jsonb_build_object(
      'treinamento', convite.treinamento_nome,
      'tema', convite.tema,
      'data', convite.data,
      'horario', convite.horario,
      'local', convite.local,
      'nome', convite.destinatario_nome
    ),
    case when nullif(btrim(convite.destinatario_email), '') is null then 'sem_email' else 'pendente' end
  )
  on conflict (treinamento_participante_id) do nothing;

  return new;
end;
$$;

drop trigger if exists enfileirar_convite_treinamento on public.treinamento_participantes;
create trigger enfileirar_convite_treinamento
  after insert on public.treinamento_participantes
  for each row execute function public.enfileirar_convite_treinamento();

-- ÍNDICES
create index if not exists idx_lojas_vendedor on public.lojas(vendedor_responsavel_id);
create index if not exists idx_lojas_criador on public.lojas(criado_por);
create index if not exists idx_contatos_loja on public.contatos_loja(loja_id);
create index if not exists idx_interacoes_usuario_data on public.interacoes(usuario_id, data_interacao desc);
create index if not exists idx_interacoes_loja on public.interacoes(loja_id);
create index if not exists idx_brindes_vendedor on public.brindes(vendedor_responsavel_id);
create index if not exists idx_brindes_loja on public.brindes(loja_id);
create index if not exists idx_trein_part_loja on public.treinamento_participantes(loja_id);
create index if not exists idx_convites_email_processamento on public.convites_email(status, agendado_para, created_at);
create index if not exists idx_convites_email_treinamento on public.convites_email(treinamento_id);
create index if not exists idx_notificacoes_destinatario on public.notificacoes(destinatario_id, lida, created_at desc);

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.lojas enable row level security;
alter table public.contatos_loja enable row level security;
alter table public.interacoes enable row level security;
alter table public.brindes enable row level security;
alter table public.treinamentos enable row level security;
alter table public.treinamento_participantes enable row level security;
alter table public.convites_email enable row level security;
alter table public.notificacoes enable row level security;

-- Remove políticas de uma execução anterior para manter o arquivo reexecutável.
do $$
declare policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','lojas','contatos_loja','interacoes','brindes','treinamentos','treinamento_participantes','convites_email','notificacoes')
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
  using (public.is_admin() or (public.is_active_user() and criado_por = auth.uid()));
create policy lojas_insert on public.lojas for insert to authenticated
  with check (public.is_admin() or (public.is_active_user() and criado_por = auth.uid()));
create policy lojas_update on public.lojas for update to authenticated
  using (public.is_admin() or (public.is_active_user() and criado_por = auth.uid()))
  with check (public.is_admin() or (public.is_active_user() and criado_por = auth.uid()));
create policy lojas_delete on public.lojas for delete to authenticated
  using (public.is_admin());

create policy contatos_select on public.contatos_loja for select to authenticated
  using (public.is_admin() or (public.is_active_user() and exists (
    select 1 from public.lojas where lojas.id = contatos_loja.loja_id and lojas.criado_por = auth.uid()
  )));
create policy contatos_insert on public.contatos_loja for insert to authenticated
  with check (public.is_admin() or (public.is_active_user() and exists (
    select 1 from public.lojas where lojas.id = contatos_loja.loja_id and lojas.criado_por = auth.uid()
  )));
create policy contatos_update on public.contatos_loja for update to authenticated
  using (public.is_admin() or (public.is_active_user() and exists (
    select 1 from public.lojas where lojas.id = contatos_loja.loja_id and lojas.criado_por = auth.uid()
  ))) with check (public.is_admin() or (public.is_active_user() and exists (
    select 1 from public.lojas where lojas.id = contatos_loja.loja_id and lojas.criado_por = auth.uid()
  )));
create policy contatos_delete on public.contatos_loja for delete to authenticated
  using (public.is_admin() or (public.is_active_user() and exists (
    select 1 from public.lojas where lojas.id = contatos_loja.loja_id and lojas.criado_por = auth.uid()
  )));

-- O vendedor vê e contabiliza somente as próprias interações.
create policy interacoes_select on public.interacoes for select to authenticated
  using (public.is_admin() or (public.is_active_user() and exists (
    select 1 from public.lojas where lojas.id = interacoes.loja_id and lojas.criado_por = auth.uid()
  )));
create policy interacoes_insert on public.interacoes for insert to authenticated
  with check (public.is_admin() or (public.is_active_user() and usuario_id = auth.uid() and exists (
    select 1 from public.lojas where lojas.id = interacoes.loja_id and lojas.criado_por = auth.uid()
  )));
create policy interacoes_update on public.interacoes for update to authenticated
  using (public.is_admin() or (public.is_active_user() and usuario_id = auth.uid() and exists (
    select 1 from public.lojas where lojas.id = interacoes.loja_id and lojas.criado_por = auth.uid()
  )))
  with check (public.is_admin() or (public.is_active_user() and usuario_id = auth.uid() and exists (
    select 1 from public.lojas where lojas.id = interacoes.loja_id and lojas.criado_por = auth.uid()
  )));
create policy interacoes_delete on public.interacoes for delete to authenticated
  using (public.is_admin() or (public.is_active_user() and usuario_id = auth.uid() and exists (
    select 1 from public.lojas where lojas.id = interacoes.loja_id and lojas.criado_por = auth.uid()
  )));

create policy brindes_admin_all on public.brindes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy treinamentos_admin_all on public.treinamentos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy trein_part_admin_write on public.treinamento_participantes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy convites_email_admin_all on public.convites_email for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy notificacoes_admin_select on public.notificacoes for select to authenticated
  using (public.is_admin() and destinatario_id = auth.uid());
create policy notificacoes_admin_update on public.notificacoes for update to authenticated
  using (public.is_admin() and destinatario_id = auth.uid())
  with check (public.is_admin() and destinatario_id = auth.uid());
create policy notificacoes_admin_delete on public.notificacoes for delete to authenticated
  using (public.is_admin() and destinatario_id = auth.uid());

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.current_profile() to authenticated;
grant execute on function public.is_active_user() to authenticated;

-- ============================================================---
-- PRIMEIRO ADMINISTRADOR
-- 1. Em Authentication > Users, crie o e-mail:
--      admin@jj.com
--    com uma senha numérica de 6 dígitos e marque como confirmado.
-- 2. O trigger acima criará o profile automaticamente como vendedor.
-- 3. Promova a conta conforme o comando de bootstrap documentado no README.
-- 4. Os demais acessos passam a ser criados na tela Usuários do sistema.
-- ============================================================
