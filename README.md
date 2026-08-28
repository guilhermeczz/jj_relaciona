# JJ Relaciona

CRM comercial B2B para o relacionamento entre a **ConstruJota/JJ** e suas lojas clientes. Centraliza informações de lojas, contatos/vendedores clientes, aniversários, brindes, campanhas, treinamentos e histórico de relacionamento.

## Objetivo

Melhorar o relacionamento comercial com as lojas atendidas, permitindo:

- login de administradores e vendedores;
- cadastro de lojas e contatos (vendedores dos clientes);
- controle de aniversários de lojas e contatos;
- envio de mensagem via WhatsApp por link `wa.me`;
- controle de brindes pendentes/enviados;
- campanhas comerciais e treinamentos externos;
- histórico de interações;
- painel administrativo e visão mobile simples para vendedores.

## Stack

- React 18 + Vite + TypeScript
- TailwindCSS + Shadcn/UI (Radix)
- React Router DOM v6
- Supabase (Auth + Database + RLS)
- Deploy preparado para Vercel

## Como rodar localmente

Pré-requisitos: Node.js 18+ e npm.

```bash
npm install
npm run dev
```

Para build de produção:

```bash
npm run build
npm run preview
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (veja `.env.example`):

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA-ANON-KEY
```

Nunca utilize a `service_role key` no frontend.

## Tabelas do Supabase

As migrations estão em `supabase/migrations/`:

1. `001_schema.sql` — criação das tabelas, triggers e helper `is_admin()`.
2. `002_rls.sql` — Row Level Security.
3. `003_seed.sql` — dados iniciais de desenvolvimento.

Tabelas: `profiles`, `lojas`, `contatos_loja`, `interacoes`, `brindes`, `campanhas`, `campanha_participantes`, `treinamentos`, `treinamento_participantes`.

## Como aplicar migrations

Opção A — Supabase SQL Editor:
Abra o projeto no painel do Supabase → SQL Editor → cole e execute cada arquivo na ordem (001, 002, 003).

Opção B — Supabase CLI (local):
```bash
supabase init
supabase db push
```

## Como criar usuários

1. No painel do Supabase, vá em **Authentication → Users → Add user** e crie o e-mail/senha do admin e dos vendedores.
2. O sistema vincula automaticamente a tabela `profiles` ao usuário logado via `auth.users.id`.
3. Para o primeiro admin, após criar o usuário no Auth, insira na tabela `profiles` (SQL Editor):

```sql
insert into public.profiles (id, nome, email, perfil, ativo)
values (auth.uid(), 'Administrador', 'admin@jjrelaciona.com.br', 'admin', true);
```

Substitua `auth.uid()` pelo id do usuário criado no Auth (copie o UUID do usuário no painel).

## Controle de acesso (RLS)

- **Admin** (`perfil = 'admin'`) vê e altera tudo.
- **Vendedor** vê apenas lojas onde `vendedor_responsavel_id = auth.uid()` e os contatos/interações/brindes dessas lojas.
- **Campanhas e treinamentos** são gerenciados apenas por admin (vendedor pode ver os ativos).
- Helpers SQL: `public.is_admin()` e `public.current_profile()`.

## Como publicar na Vercel

1. Importe o repositório na Vercel.
2. Framework preset: **Vite**.
3. Defina as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
4. O `vercel.json` já configura build e rewrites SPA.

## Utilidades

- `src/lib/whatsapp.ts` — `buildWhatsAppLink(phone, message)` gera link `wa.me` com código do Brasil e mensagem codificada.
- `src/lib/aniversario.ts` — filtros de aniversários (hoje, 7 dias, 30 dias, mês) ignorando o ano.
- `src/lib/csv.ts` — `exportCSV(rows, filename)` exporta listas em CSV (com BOM para Excel).

## LGPD

O cadastro de contatos inclui campos de autorização (recebe mensagens, recebe campanhas, recebe treinamentos) e um aviso sobre uso dos dados apenas para relacionamento comercial autorizado.

## Limitações do MVP

- WhatsApp apenas por link clicável (`wa.me`), sem API paga.
- Controle de vendas das campanhas é manual (sem integração com ERP).
- Criação de usuários do Auth é feita no painel do Supabase (não pela tela).

## Próximas melhorias

- Envio de mensagens em massa por campanha.
- Importação de dados (CSV/Excel).
- Relatórios gráficos.
- Integração com ERP para metas de venda.
- Notificações de aniversários (e-mail/WhatsApp).
