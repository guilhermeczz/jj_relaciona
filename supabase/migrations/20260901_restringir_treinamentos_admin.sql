-- Vendedores não devem consultar treinamentos nem seus participantes.
-- As policies "admin_all" existentes continuam concedendo acesso total ao administrador.
drop policy if exists treinamentos_select on public.treinamentos;
drop policy if exists trein_part_select on public.treinamento_participantes;
