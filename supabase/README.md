# Banco de dados Supabase

## Migrações

As migrações devem ser aplicadas pela ordem do nome do arquivo:

1. `migrations/202606110001_initial_schema.sql`
2. `migrations/202606110002_relational_crm_schema.sql`
3. `migrations/202606110003_dashboard_summary.sql`
4. `migrations/202606110004_sales_pipeline_stages.sql`
5. `migrations/202606110005_public_lead_capture_fields.sql`

A segunda migração preserva os dados criados pelo schema inicial. Ela converte os campos textuais antigos de status e origem em chaves estrangeiras, renomeia `follow_up_tasks` para `lead_tasks` e mantém o campo `company` usado pela aplicação. A terceira adiciona a função agregada `get_crm_dashboard_summary`, usada para calcular os indicadores do dashboard diretamente no Postgres. A quarta alinha as etapas ao Kanban comercial, migrando `Em negociação` para `Contato feito` e `Ganho` para `Fechado` sem alterar os IDs associados aos leads. A quinta adiciona o melhor horário para contato, padroniza a origem `Formulário` e amplia a função pública de captação com cidade, objetivo e orçamento.

## Opção 1: SQL Editor

1. Abra o projeto no painel do Supabase.
2. Acesse **SQL Editor**.
3. Abra o primeiro arquivo de migração, cole todo o conteúdo e execute.
4. Repita o processo com os demais arquivos, na ordem indicada acima.
5. Confirme no **Table Editor** que as tabelas foram criadas.

Use essa opção para um projeto novo ou quando a Supabase CLI ainda não estiver vinculada ao repositório.

## Opção 2: Supabase CLI

Instale a CLI, autentique e vincule o projeto:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

Para recriar um banco local a partir das migrações:

```bash
npx supabase start
npx supabase db reset
```

## Tipos TypeScript

O contrato atual está em `src/lib/database.types.ts`. Depois de qualquer alteração no schema, regenere os tipos oficiais:

```bash
npx supabase gen types typescript --project-id SEU_PROJECT_REF --schema public > src/lib/database.types.ts
```

Revise o diff gerado e execute `npm run lint` e `npm run build` antes de concluir a mudança.

## Row Level Security

- `profiles`: cada usuário lê e atualiza apenas o próprio perfil.
- `leads`: acesso permitido apenas quando `owner_id = auth.uid()`.
- `lead_notes`: acesso permitido apenas ao proprietário da nota e do CRM.
- `lead_tasks`: acesso permitido apenas ao proprietário da tarefa.
- `lead_statuses`: cada usuário gerencia somente as próprias etapas.
- `lead_sources`: cada usuário gerencia somente as próprias origens.
- `activity_logs`: cada usuário lê os próprios registros; logs não podem ser atualizados ou apagados pela API.
- `public_forms`: formulários ativos podem ser lidos publicamente para renderização da página de captação.

Usuários anônimos não recebem permissão direta de escrita em `leads`. A captação pública usa a função `capture_public_lead`, que valida o formulário e define internamente proprietário, status e origem.

## Dados padrão

Ao criar uma conta, o trigger `handle_new_user` cria automaticamente:

- O registro em `profiles`.
- O formulário em `public_forms`.
- As etapas padrão do pipeline em `lead_statuses`.
- As origens padrão em `lead_sources`.

Alterações de criação, edição e mudança de status dos leads alimentam `activity_logs` automaticamente.
