# ConstruJota Relaciona

CRM responsivo para a equipe comercial da ConstruJota. O administrador acompanha toda a operação; cada vendedor acessa somente as lojas que cadastrou e os respectivos dados de relacionamento.

## Rodar o projeto

Requisitos: Node.js 18 ou superior e npm.

```bash
npm install
npm run dev
```

Para validar a versão de produção:

```bash
npm run build
```

## Publicar na Vercel

O projeto já contém o arquivo `vercel.json`, incluindo o build do Vite e o redirecionamento das rotas internas para a aplicação React.

1. Envie o projeto para um repositório GitHub, GitLab ou Bitbucket.
2. Na Vercel, selecione **Add New > Project** e importe o repositório.
3. Confirme as configurações detectadas:
   - Framework Preset: `Vite`;
   - Install Command: `npm ci`;
   - Build Command: `npm run build`;
   - Output Directory: `dist`.
4. Em **Environment Variables**, cadastre para Production, Preview e Development:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA-CHAVE-ANON
```

5. Clique em **Deploy**.

Não cadastre na Vercel `service_role`, tokens administrativos ou os segredos do servidor de e-mails. Esses valores pertencem exclusivamente ao ambiente protegido das Edge Functions do Supabase.

Depois do primeiro deploy, abra diretamente uma rota interna, como `/lojas`, e atualize a página. O redirecionamento configurado deve manter a aplicação funcionando sem retornar erro 404.

## Preparar o Supabase

1. Crie um projeto no Supabase.
2. Abra **SQL Editor**, cole todo o conteúdo de `supabase/banco_supabase.sql` e execute.
3. Em **Authentication > Providers > Email**, desative a confirmação de e-mail.
4. Publique a função administrativa:

```bash
supabase functions deploy criar-usuario
```

5. Copie `.env.example` para `.env` e preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA-CHAVE-ANON
```

Nunca coloque a chave `service_role` no frontend. Ela é disponibilizada automaticamente no ambiente seguro da Edge Function.

## Criar o primeiro administrador

No painel do Supabase, abra **Authentication > Users > Add user** e crie:

- e-mail interno: `admin@jj.com`;
- senha: exatamente 6 números;
- conta confirmada.

Depois execute uma única vez no SQL Editor. Este comando também funciona caso o usuário tenha sido criado antes do banco:

```sql
insert into public.profiles (id, nome, username, email, perfil, ativo)
select id, 'Administrador', 'admin', email, 'admin', true
from auth.users
where email = 'admin@jj.com'
on conflict (id) do update set
  nome = excluded.nome,
  username = excluded.username,
  perfil = 'admin',
  ativo = true;
```

A partir daí, entre no sistema com o username `admin` e crie todos os demais vendedores na página **Usuários**. As novas contas já são criadas confirmadas e não recebem e-mail.

## Segurança e isolamento

As regras RLS ficam no banco, portanto não dependem apenas da interface:

- administrador: acesso geral, gestão de usuários e visão consolidada dos relacionamentos;
- vendedor: somente lojas atribuídas a ele e dados relacionados;
- histórico: cada vendedor vê apenas suas próprias interações e os clientes de sua carteira;
- criação de login: apenas administrador autenticado, por Edge Function;
- senha inicial: validação obrigatória de 6 dígitos numéricos.

## Estrutura principal

- `src/`: aplicação React/Vite;
- `supabase/banco_supabase.sql`: banco completo para colar no SQL Editor;
- `supabase/functions/criar-usuario/`: criação segura de usuários pelo administrador.
