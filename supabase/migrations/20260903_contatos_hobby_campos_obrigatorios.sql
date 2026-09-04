-- Substitui o telefone do contato por hobby e torna obrigatorios os dados
-- exigidos nos novos cadastros. Registros antigos continuam acessiveis e
-- deverao ser completados quando forem editados pelo formulario.
alter table public.contatos_loja
  add column if not exists hobby text;

alter table public.contatos_loja
  drop column if exists telefone;

create or replace function public.validar_contato_obrigatorio()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if nullif(btrim(new.nome), '') is null then
    raise exception 'O nome do contato e obrigatorio';
  end if;
  if nullif(btrim(new.cargo), '') is null then
    raise exception 'O cargo do contato e obrigatorio';
  end if;
  if nullif(btrim(new.whatsapp), '') is null then
    raise exception 'O WhatsApp do contato e obrigatorio';
  end if;
  if new.data_nascimento is null then
    raise exception 'A data de nascimento do contato e obrigatoria';
  end if;
  if nullif(btrim(new.hobby), '') is null then
    raise exception 'O hobby do contato e obrigatorio';
  end if;
  if new.recebe_mensagens is not true or new.recebe_treinamentos is not true then
    raise exception 'As autorizacoes de LGPD sao obrigatorias';
  end if;
  return new;
end;
$$;

drop trigger if exists validar_novo_contato_obrigatorio on public.contatos_loja;
create trigger validar_novo_contato_obrigatorio
before insert on public.contatos_loja
for each row execute function public.validar_contato_obrigatorio();
