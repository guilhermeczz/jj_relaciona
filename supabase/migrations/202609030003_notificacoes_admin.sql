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

create index if not exists idx_notificacoes_destinatario
  on public.notificacoes(destinatario_id, lida, created_at desc);

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

alter table public.notificacoes enable row level security;

drop policy if exists notificacoes_admin_select on public.notificacoes;
drop policy if exists notificacoes_admin_update on public.notificacoes;
drop policy if exists notificacoes_admin_delete on public.notificacoes;

create policy notificacoes_admin_select on public.notificacoes for select to authenticated
  using (public.is_admin() and destinatario_id = auth.uid());
create policy notificacoes_admin_update on public.notificacoes for update to authenticated
  using (public.is_admin() and destinatario_id = auth.uid())
  with check (public.is_admin() and destinatario_id = auth.uid());
create policy notificacoes_admin_delete on public.notificacoes for delete to authenticated
  using (public.is_admin() and destinatario_id = auth.uid());

grant select, update, delete on public.notificacoes to authenticated;

notify pgrst, 'reload schema';
