# Configuração e deploy do Nexo CRM

## 1. Criar o projeto no Supabase

1. Acesse o painel do Supabase e crie um projeto.
2. Aguarde a inicialização do banco.
3. Em **Project Settings > API**, copie:
   - **Project URL**.
   - **Publishable key**, normalmente iniciada por `sb_publishable_`.
4. Não use a chave `service_role` no Next.js. Ela ignora RLS e não deve ser exposta.

## 2. Configurar as variáveis

Crie `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
```

O código não usa `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` ou outro nome de chave.
Substitua os valores de exemplo pelos dados reais do projeto; placeholders com `SEU_PROJECT_REF` ou `xxxxxxxx` são tratados como Supabase não configurado.

Depois de alterar variáveis, reinicie `npm run dev`.

## 3. Aplicar as migrações

No painel do Supabase, abra **SQL Editor > New query**. Execute os arquivos completos, um por vez, nesta ordem:

1. `supabase/migrations/202606110001_initial_schema.sql`
2. `supabase/migrations/202606110002_relational_crm_schema.sql`
3. `supabase/migrations/202606110003_dashboard_summary.sql`
4. `supabase/migrations/202606110004_sales_pipeline_stages.sql`
5. `supabase/migrations/202606110005_public_lead_capture_fields.sql`

Cada execução deve terminar sem erro antes de continuar. Em um projeto já parcialmente configurado, confirme no histórico do SQL Editor quais arquivos foram aplicados e execute apenas os seguintes, mantendo a ordem.

Alternativa com Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

## 4. Configurar autenticação

Em **Authentication > URL Configuration**:

- **Site URL local:** `http://127.0.0.1:3000`
- Adicione em **Redirect URLs**:
  - `http://127.0.0.1:3000/**`
  - `http://localhost:3000/**`
  - `https://SEU_DOMINIO/**`

Se a confirmação de e-mail estiver habilitada, em **Authentication > Email Templates > Confirm signup**, use um link com o endpoint SSR:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard">
  Confirmar e-mail
</a>
```

O endpoint `/auth/confirm` troca o token por uma sessão e grava os cookies usados pelo Next.js.

## 5. Criar a primeira conta

1. Abra `/cadastro`.
2. Crie uma conta com nome, empresa, e-mail e senha.
3. Confirme o e-mail, se essa opção estiver habilitada.
4. Entre em `/login`.

O trigger `handle_new_user` deve criar automaticamente:

- Um registro em `profiles`.
- Um registro em `public_forms`.
- Seis etapas em `lead_statuses`.
- As origens padrão em `lead_sources`.

Se o usuário já existia antes das migrações, crie uma nova conta de teste ou preencha esses registros manualmente para esse `auth.users.id`.

## 6. Conferir Row Level Security

No **SQL Editor**, execute:

```sql
select relname, relrowsecurity
from pg_class
where relname in (
  'profiles', 'public_forms', 'leads', 'lead_notes',
  'lead_tasks', 'lead_statuses', 'lead_sources', 'activity_logs'
)
order by relname;
```

`relrowsecurity` deve ser `true` em todas as tabelas listadas.

Para listar as políticas:

```sql
select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

As tabelas privadas usam `auth.uid()` para restringir cada conta. O formulário público não recebe permissão direta para inserir em `leads`; ele usa apenas a função `capture_public_lead`.

## 7. Validar os dados reais

Após entrar no CRM:

1. Crie um lead em `/leads/novo`.
2. Confirme que ele aparece em `/leads`.
3. Mova o card em `/pipeline` e recarregue a página.
4. Crie uma tarefa em `/tarefas` e marque-a como concluída.
5. Confira métricas e atividades em `/dashboard`.
6. Abra o link público em **Configurações**, envie o formulário e confirme que o lead entrou como **Novo lead**, origem **Formulário**.

Se o dashboard informar que a função não existe, a migração 003 não foi aplicada. Se o pipeline pedir migração, aplique a 004. Se o formulário público falhar com parâmetros desconhecidos, aplique a 005.

## 8. Deploy

Na plataforma de hospedagem, configure as mesmas duas variáveis de ambiente para produção:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
```

Depois, adicione o domínio de produção às URLs permitidas no Supabase e faça um novo deploy.

## 9. Regenerar tipos após mudanças no banco

```bash
npx supabase gen types typescript --project-id SEU_PROJECT_REF --schema public > src/lib/database.types.ts
npm run lint
npm run build
```
