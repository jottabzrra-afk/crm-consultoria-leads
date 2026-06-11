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

O projeto usa exatamente estas variáveis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Sem essas variáveis, as páginas exibem um estado de configuração pendente e não carregam dados fictícios.

## Configuração

Siga [`DEPLOYMENT.md`](DEPLOYMENT.md) para criar o projeto Supabase, aplicar todas as migrações, configurar autenticação e validar RLS. A referência técnica do banco está em [`supabase/README.md`](supabase/README.md).

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
