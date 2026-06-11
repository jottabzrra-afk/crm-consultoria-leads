# Nexo CRM

CRM enxuto para empresas de serviço que recebem leads de landing pages, anúncios e formulários.

## Stack

- Next.js 16 + React 19
- TypeScript estrito
- Tailwind CSS 4
- Supabase Auth + Postgres + Row Level Security

## Rodando localmente

```bash
npm install
copy .env.example .env.local
npm run dev
```

Sem as variáveis do Supabase, o app abre em modo demonstração com dados locais e todas as telas navegáveis.

## Configurando o Supabase

1. Crie um projeto no Supabase.
2. Aplique as migrações em ordem:
   - `supabase/migrations/202606110001_initial_schema.sql`
   - `supabase/migrations/202606110002_relational_crm_schema.sql`
   - `supabase/migrations/202606110003_dashboard_summary.sql`
3. Copie a URL e a Publishable Key para `.env.local`.
4. Em Authentication > URL Configuration, adicione a URL local e a URL de produção.
5. Reinicie o servidor Next.js.

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

As instruções completas para SQL Editor, Supabase CLI, RLS e regeneração de tipos estão em [`supabase/README.md`](supabase/README.md).

## Estrutura do banco

- `profiles`: perfil associado ao usuário do Supabase Auth.
- `leads`: dados comerciais, responsável, origem e status do lead.
- `lead_notes`: histórico de notas por lead.
- `lead_tasks`: tarefas de follow-up.
- `lead_statuses`: etapas configuráveis do pipeline por usuário.
- `lead_sources`: origens configuráveis por usuário.
- `activity_logs`: registro imutável das principais alterações dos leads.
- `public_forms`: configuração do formulário público de captação.

Todas as tabelas privadas usam RLS por `owner_id` ou pelo próprio `id` do perfil. O formulário público grava leads somente por meio da função controlada `capture_public_lead`.

## Módulos

- Autenticação por e-mail e senha
- Dashboard comercial
- Lista e ficha de leads
- Pipeline Kanban
- Tarefas de follow-up
- Notas por lead
- Formulário público de captação
- Configurações básicas

## Verificação

```bash
npm run lint
npm run build
```
