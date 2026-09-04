-- O acesso do vendedor passa a ser determinado por quem cadastrou a loja,
-- independentemente de alteracoes posteriores no vendedor responsavel.
alter table public.lojas
  add column if not exists criado_por uuid references public.profiles(id) on delete restrict;

-- Para preservar o acesso atual, o responsavel existente e considerado o
-- criador inicial. Lojas sem responsavel permanecem visiveis apenas ao admin.
update public.lojas
set criado_por = vendedor_responsavel_id
where criado_por is null
  and vendedor_responsavel_id is not null;

alter table public.lojas
  alter column criado_por set default auth.uid();

create index if not exists idx_lojas_criador on public.lojas(criado_por);

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

drop policy if exists lojas_select on public.lojas;
drop policy if exists lojas_insert on public.lojas;
drop policy if exists lojas_update on public.lojas;
drop policy if exists lojas_delete on public.lojas;

create policy lojas_select on public.lojas for select to authenticated
  using (public.is_admin() or (public.is_active_user() and criado_por = auth.uid()));
create policy lojas_insert on public.lojas for insert to authenticated
  with check (public.is_admin() or (public.is_active_user() and criado_por = auth.uid()));
create policy lojas_update on public.lojas for update to authenticated
  using (public.is_admin() or (public.is_active_user() and criado_por = auth.uid()))
  with check (public.is_admin() or (public.is_active_user() and criado_por = auth.uid()));
create policy lojas_delete on public.lojas for delete to authenticated
  using (public.is_admin());

drop policy if exists contatos_select on public.contatos_loja;
drop policy if exists contatos_insert on public.contatos_loja;
drop policy if exists contatos_update on public.contatos_loja;
drop policy if exists contatos_delete on public.contatos_loja;

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
  )))
  with check (public.is_admin() or (public.is_active_user() and exists (
    select 1 from public.lojas where lojas.id = contatos_loja.loja_id and lojas.criado_por = auth.uid()
  )));
create policy contatos_delete on public.contatos_loja for delete to authenticated
  using (public.is_admin());

drop policy if exists interacoes_select on public.interacoes;
drop policy if exists interacoes_insert on public.interacoes;
drop policy if exists interacoes_update on public.interacoes;
drop policy if exists interacoes_delete on public.interacoes;

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

drop policy if exists brindes_select on public.brindes;
drop policy if exists brindes_insert on public.brindes;
drop policy if exists brindes_update on public.brindes;
drop policy if exists brindes_delete on public.brindes;

create policy brindes_admin_all on public.brindes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

notify pgrst, 'reload schema';
