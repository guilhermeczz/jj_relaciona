-- JJ Relaciona · Row Level Security (RLS)
-- Executar APÓS o schema (001_schema.sql)

alter table public.profiles enable row level security;
alter table public.lojas enable row level security;
alter table public.contatos_loja enable row level security;
alter table public.interacoes enable row level security;
alter table public.brindes enable row level security;
alter table public.campanhas enable row level security;
alter table public.campanha_participantes enable row level security;
alter table public.treinamentos enable row level security;
alter table public.treinamento_participantes enable row level security;

-- ============================================================
-- profiles
-- Admin pode tudo; user pode ver/editar o próprio perfil.
-- ============================================================
create policy "profiles own select" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles own update" on public.profiles
  for update using (auth.uid() = id or public.is_admin());
create policy "profiles admin insert" on public.profiles
  for insert with check (public.is_admin());
create policy "profiles admin delete" on public.profiles
  for delete using (public.is_admin());

-- ============================================================
-- lojas
-- Admin vê tudo; vendedor vê apenas lojas de sua carteira.
-- ============================================================
create policy "lojas select" on public.lojas
  for select using (
    public.is_admin()
    or vendedor_responsavel_id = auth.uid()
  );
create policy "lojas insert" on public.lojas
  for insert with check (public.is_admin() or vendedor_responsavel_id = auth.uid());
create policy "lojas update" on public.lojas
  for update using (public.is_admin() or vendedor_responsavel_id = auth.uid());
create policy "lojas delete" on public.lojas
  for delete using (public.is_admin());

-- ============================================================
-- contatos_loja
-- Vendedor vê contatos de lojas da própria carteira.
-- ============================================================
create policy "contatos select" on public.contatos_loja
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.lojas l
      where l.id = contatos_loja.loja_id and l.vendedor_responsavel_id = auth.uid()
    )
  );
create policy "contatos insert" on public.contatos_loja
  for insert with check (
    public.is_admin()
    or exists (
      select 1 from public.lojas l
      where l.id = loja_id and l.vendedor_responsavel_id = auth.uid()
    )
  );
create policy "contatos update" on public.contatos_loja
  for update using (
    public.is_admin()
    or exists (
      select 1 from public.lojas l
      where l.id = contatos_loja.loja_id and l.vendedor_responsavel_id = auth.uid()
    )
  );
create policy "contatos delete" on public.contatos_loja
  for delete using (public.is_admin());

-- ============================================================
-- interacoes
-- ============================================================
create policy "interacoes select" on public.interacoes
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.lojas l
      where l.id = interacoes.loja_id and l.vendedor_responsavel_id = auth.uid()
    )
  );
create policy "interacoes insert" on public.interacoes
  for insert with check (
    public.is_admin()
    or exists (
      select 1 from public.lojas l
      where l.id = loja_id and l.vendedor_responsavel_id = auth.uid()
    )
  );
create policy "interacoes update" on public.interacoes
  for update using (public.is_admin());
create policy "interacoes delete" on public.interacoes
  for delete using (public.is_admin());

-- ============================================================
-- brindes
-- ============================================================
create policy "brindes select" on public.brindes
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.lojas l
      where l.id = brindes.loja_id and l.vendedor_responsavel_id = auth.uid()
    )
  );
create policy "brindes insert" on public.brindes
  for insert with check (
    public.is_admin()
    or exists (
      select 1 from public.lojas l
      where l.id = loja_id and l.vendedor_responsavel_id = auth.uid()
    )
  );
create policy "brindes update" on public.brindes
  for update using (
    public.is_admin()
    or exists (
      select 1 from public.lojas l
      where l.id = brindes.loja_id and l.vendedor_responsavel_id = auth.uid()
    )
  );
create policy "brindes delete" on public.brindes
  for delete using (public.is_admin());

-- ============================================================
-- campanhas e participantes (somente admin gerencia)
-- ============================================================
create policy "campanhas select" on public.campanhas
  for select using (true);
create policy "campanhas insert" on public.campanhas
  for insert with check (public.is_admin());
create policy "campanhas update" on public.campanhas
  for update using (public.is_admin());
create policy "campanhas delete" on public.campanhas
  for delete using (public.is_admin());

create policy "campanha_part select" on public.campanha_participantes
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.lojas l
      where l.id = campanha_participantes.loja_id and l.vendedor_responsavel_id = auth.uid()
    )
  );
create policy "campanha_part insert" on public.campanha_participantes
  for insert with check (public.is_admin());
create policy "campanha_part update" on public.campanha_participantes
  for update using (
    public.is_admin()
    or exists (
      select 1 from public.lojas l
      where l.id = campanha_participantes.loja_id and l.vendedor_responsavel_id = auth.uid()
    )
  );
create policy "campanha_part delete" on public.campanha_participantes
  for delete using (public.is_admin());

-- ============================================================
-- treinamentos e participantes (somente admin gerencia)
-- ============================================================
create policy "treinamentos select" on public.treinamentos
  for select using (true);
create policy "treinamentos insert" on public.treinamentos
  for insert with check (public.is_admin());
create policy "treinamentos update" on public.treinamentos
  for update using (public.is_admin());
create policy "treinamentos delete" on public.treinamentos
  for delete using (public.is_admin());

create policy "trein_part select" on public.treinamento_participantes
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.lojas l
      where l.id = treinamento_participantes.loja_id and l.vendedor_responsavel_id = auth.uid()
    )
  );
create policy "trein_part insert" on public.treinamento_participantes
  for insert with check (public.is_admin());
create policy "trein_part update" on public.treinamento_participantes
  for update using (
    public.is_admin()
    or exists (
      select 1 from public.lojas l
      where l.id = treinamento_participantes.loja_id and l.vendedor_responsavel_id = auth.uid()
    )
  );
create policy "trein_part delete" on public.treinamento_participantes
  for delete using (public.is_admin());
