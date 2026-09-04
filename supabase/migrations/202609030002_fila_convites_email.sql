-- Fila de convites desacoplada do provedor de e-mail.
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

drop trigger if exists set_convites_email_updated_at on public.convites_email;
create trigger set_convites_email_updated_at
before update on public.convites_email
for each row execute function public.set_updated_at();

create index if not exists idx_convites_email_processamento
  on public.convites_email(status, agendado_para, created_at);
create index if not exists idx_convites_email_treinamento
  on public.convites_email(treinamento_id);

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

-- Prepara também os participantes já cadastrados.
insert into public.convites_email (
  treinamento_participante_id, treinamento_id, loja_id, contato_id,
  tipo_destinatario, destinatario_nome, destinatario_email, assunto, dados, status
)
select
  p.id,
  p.treinamento_id,
  p.loja_id,
  p.contato_id,
  case when p.contato_id is null then 'loja' else 'contato' end,
  case when p.contato_id is null then l.nome_fantasia else c.nome end,
  nullif(btrim(case when p.contato_id is null then l.email else c.email end), ''),
  'Convite: ' || t.nome,
  jsonb_build_object(
    'treinamento', t.nome,
    'tema', t.tema,
    'data', t.data,
    'horario', t.horario,
    'local', t.local,
    'nome', case when p.contato_id is null then l.nome_fantasia else c.nome end
  ),
  case when nullif(btrim(case when p.contato_id is null then l.email else c.email end), '') is null then 'sem_email' else 'pendente' end
from public.treinamento_participantes p
join public.treinamentos t on t.id = p.treinamento_id
join public.lojas l on l.id = p.loja_id
left join public.contatos_loja c on c.id = p.contato_id
on conflict (treinamento_participante_id) do nothing;

alter table public.convites_email enable row level security;

drop policy if exists convites_email_admin_all on public.convites_email;
create policy convites_email_admin_all on public.convites_email for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.convites_email to authenticated;

-- Brindes são uma operação exclusivamente administrativa. Estas instruções
-- também corrigem projetos que já tenham aplicado uma política anterior.
drop policy if exists brindes_select on public.brindes;
drop policy if exists brindes_insert on public.brindes;
drop policy if exists brindes_update on public.brindes;
drop policy if exists brindes_delete on public.brindes;
drop policy if exists brindes_admin_all on public.brindes;
create policy brindes_admin_all on public.brindes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

notify pgrst, 'reload schema';
