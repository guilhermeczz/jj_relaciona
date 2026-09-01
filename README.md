# ConstruJota Relaciona

CRM responsivo para a equipe comercial da ConstruJota. O administrador acompanha toda a operação; cada vendedor acessa somente sua carteira e suas interações com os clientes.

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

- e-mail interno: `admin@usuarios.construjota.com.br`;
- senha: exatamente 6 números;
- conta confirmada.

Depois execute uma única vez no SQL Editor:

```sql
update public.profiles set perfil = 'admin' where username = 'admin';
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
