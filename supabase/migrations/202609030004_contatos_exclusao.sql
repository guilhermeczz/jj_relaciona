-- Contatos deixam de ter inativação: registros existentes são normalizados
-- e vendedores podem excluir contatos das lojas que eles próprios cadastraram.
update public.contatos_loja
set ativo = true
where ativo = false;

alter table public.contatos_loja
  drop constraint if exists contatos_loja_ativo_sempre_true;

alter table public.contatos_loja
  add constraint contatos_loja_ativo_sempre_true check (ativo = true);

drop policy if exists contatos_delete on public.contatos_loja;
create policy contatos_delete on public.contatos_loja for delete to authenticated
  using (public.is_admin() or (public.is_active_user() and exists (
    select 1
    from public.lojas
    where lojas.id = contatos_loja.loja_id
      and lojas.criado_por = auth.uid()
  )));

notify pgrst, 'reload schema';
