begin;

create table public.lead_statuses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  color text not null default '#64748b',
  position integer not null default 0,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug),
  check (not (is_won and is_lost))
);

create table public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug)
);

insert into public.lead_statuses (owner_id, name, slug, color, position, is_won, is_lost)
select profiles.id, defaults.name, defaults.slug, defaults.color, defaults.position, defaults.is_won, defaults.is_lost
from public.profiles
cross join (
  values
    ('Novo', 'novo', '#0ea5e9', 10, false, false),
    ('Qualificado', 'qualificado', '#0891b2', 20, false, false),
    ('Proposta enviada', 'proposta', '#f59e0b', 30, false, false),
    ('Em negociação', 'negociacao', '#8b5cf6', 40, false, false),
    ('Ganho', 'ganho', '#059669', 50, true, false),
    ('Perdido', 'perdido', '#e11d48', 60, false, true)
) as defaults(name, slug, color, position, is_won, is_lost)
on conflict (owner_id, slug) do nothing;

insert into public.lead_sources (owner_id, name, slug)
select profiles.id, defaults.name, defaults.slug
from public.profiles
cross join (
  values
    ('Cadastro manual', 'cadastro-manual'),
    ('Landing page', 'landing-page'),
    ('Formulário do site', 'formulario-do-site'),
    ('Formulário público', 'formulario-publico'),
    ('Google Ads', 'google-ads'),
    ('Instagram', 'instagram'),
    ('Indicação', 'indicacao'),
    ('LinkedIn', 'linkedin')
) as defaults(name, slug)
on conflict (owner_id, slug) do nothing;

insert into public.lead_sources (owner_id, name, slug)
select distinct
  leads.owner_id,
  leads.source,
  trim(both '-' from regexp_replace(lower(unaccent(leads.source)), '[^a-z0-9]+', '-', 'g'))
from public.leads
where trim(leads.source) <> ''
on conflict (owner_id, slug) do nothing;

alter table public.leads
  add column city text,
  add column interest text,
  add column budget numeric(12, 2),
  add column notes text,
  add column assigned_user_id uuid references public.profiles(id) on delete restrict,
  add column status_id uuid references public.lead_statuses(id) on delete restrict,
  add column source_id uuid references public.lead_sources(id) on delete restrict;

update public.leads
set
  interest = service,
  budget = value,
  assigned_user_id = owner_id;

update public.leads as leads
set status_id = statuses.id
from public.lead_statuses as statuses
where statuses.owner_id = leads.owner_id
  and statuses.slug = leads.status::text;

update public.leads as leads
set source_id = sources.id
from public.lead_sources as sources
where sources.owner_id = leads.owner_id
  and sources.slug = trim(both '-' from regexp_replace(lower(unaccent(leads.source)), '[^a-z0-9]+', '-', 'g'));

alter table public.leads
  alter column interest set not null,
  alter column budget set default 0,
  alter column budget set not null,
  alter column assigned_user_id set not null,
  alter column status_id set not null,
  alter column source_id set not null,
  add constraint leads_budget_non_negative check (budget >= 0);

drop index if exists public.leads_owner_status_idx;

alter table public.leads
  drop column service,
  drop column source,
  drop column status,
  drop column value;

drop type public.lead_status;

alter table public.follow_up_tasks rename to lead_tasks;
alter index if exists public.tasks_owner_due_idx rename to lead_tasks_owner_due_idx;
alter trigger tasks_set_updated_at on public.lead_tasks rename to lead_tasks_set_updated_at;
alter policy "tasks_select_own" on public.lead_tasks rename to "lead_tasks_select_own";
alter policy "tasks_insert_own" on public.lead_tasks rename to "lead_tasks_insert_own";
alter policy "tasks_update_own" on public.lead_tasks rename to "lead_tasks_update_own";
alter policy "tasks_delete_own" on public.lead_tasks rename to "lead_tasks_delete_own";

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (char_length(action) between 1 and 120),
  entity_type text not null default 'lead',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index leads_owner_status_idx on public.leads(owner_id, status_id);
create index leads_owner_source_idx on public.leads(owner_id, source_id);
create index leads_assigned_user_idx on public.leads(assigned_user_id, updated_at desc);
create index lead_statuses_owner_position_idx on public.lead_statuses(owner_id, position);
create index lead_sources_owner_active_idx on public.lead_sources(owner_id, active);
create index activity_logs_owner_created_idx on public.activity_logs(owner_id, created_at desc);
create index activity_logs_lead_created_idx on public.activity_logs(lead_id, created_at desc);

create trigger lead_statuses_set_updated_at before update on public.lead_statuses
for each row execute function public.set_updated_at();
create trigger lead_sources_set_updated_at before update on public.lead_sources
for each row execute function public.set_updated_at();

alter table public.lead_statuses enable row level security;
alter table public.lead_sources enable row level security;
alter table public.activity_logs enable row level security;

create policy "lead_statuses_select_own" on public.lead_statuses
for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "lead_statuses_insert_own" on public.lead_statuses
for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy "lead_statuses_update_own" on public.lead_statuses
for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
create policy "lead_statuses_delete_own" on public.lead_statuses
for delete to authenticated
using ((select auth.uid()) = owner_id);

create policy "lead_sources_select_own" on public.lead_sources
for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "lead_sources_insert_own" on public.lead_sources
for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy "lead_sources_update_own" on public.lead_sources
for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
create policy "lead_sources_delete_own" on public.lead_sources
for delete to authenticated
using ((select auth.uid()) = owner_id);

create policy "activity_logs_select_own" on public.activity_logs
for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "activity_logs_insert_own" on public.activity_logs
for insert to authenticated
with check (
  (select auth.uid()) = owner_id
  and (actor_id is null or (select auth.uid()) = actor_id)
  and (
    lead_id is null
    or exists (
      select 1 from public.leads
      where leads.id = lead_id
        and leads.owner_id = (select auth.uid())
    )
  )
);

drop policy "leads_insert_own" on public.leads;
drop policy "leads_update_own" on public.leads;

create policy "leads_insert_own" on public.leads
for insert to authenticated
with check (
  (select auth.uid()) = owner_id
  and (select auth.uid()) = assigned_user_id
  and exists (
    select 1 from public.lead_statuses
    where lead_statuses.id = status_id
      and lead_statuses.owner_id = (select auth.uid())
  )
  and exists (
    select 1 from public.lead_sources
    where lead_sources.id = source_id
      and lead_sources.owner_id = (select auth.uid())
  )
);

create policy "leads_update_own" on public.leads
for update to authenticated
using ((select auth.uid()) = owner_id)
with check (
  (select auth.uid()) = owner_id
  and (select auth.uid()) = assigned_user_id
  and exists (
    select 1 from public.lead_statuses
    where lead_statuses.id = status_id
      and lead_statuses.owner_id = (select auth.uid())
  )
  and exists (
    select 1 from public.lead_sources
    where lead_sources.id = source_id
      and lead_sources.owner_id = (select auth.uid())
  )
);

drop policy "notes_insert_own" on public.lead_notes;
drop policy "notes_update_own" on public.lead_notes;

create policy "notes_insert_own" on public.lead_notes
for insert to authenticated
with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1 from public.leads
    where leads.id = lead_id
      and leads.owner_id = (select auth.uid())
  )
);

create policy "notes_update_own" on public.lead_notes
for update to authenticated
using ((select auth.uid()) = owner_id)
with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1 from public.leads
    where leads.id = lead_id
      and leads.owner_id = (select auth.uid())
  )
);

drop policy "lead_tasks_insert_own" on public.lead_tasks;
drop policy "lead_tasks_update_own" on public.lead_tasks;

create policy "lead_tasks_insert_own" on public.lead_tasks
for insert to authenticated
with check (
  (select auth.uid()) = owner_id
  and (
    lead_id is null
    or exists (
      select 1 from public.leads
      where leads.id = lead_id
        and leads.owner_id = (select auth.uid())
    )
  )
);

create policy "lead_tasks_update_own" on public.lead_tasks
for update to authenticated
using ((select auth.uid()) = owner_id)
with check (
  (select auth.uid()) = owner_id
  and (
    lead_id is null
    or exists (
      select 1 from public.leads
      where leads.id = lead_id
        and leads.owner_id = (select auth.uid())
    )
  )
);

grant select, insert, update, delete on public.lead_statuses, public.lead_sources to authenticated;
grant select, insert on public.activity_logs to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_slug text;
  account_name text;
  company text;
begin
  account_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));
  company := coalesce(new.raw_user_meta_data ->> 'company_name', 'Minha empresa');
  generated_slug := trim(both '-' from regexp_replace(lower(unaccent(company)), '[^a-z0-9]+', '-', 'g')) || '-' || left(new.id::text, 6);

  insert into public.profiles (id, full_name, company_name, public_form_slug)
  values (new.id, account_name, company, generated_slug);

  insert into public.public_forms (owner_id, slug, company_name)
  values (new.id, generated_slug, company);

  insert into public.lead_statuses (owner_id, name, slug, color, position, is_won, is_lost)
  values
    (new.id, 'Novo', 'novo', '#0ea5e9', 10, false, false),
    (new.id, 'Qualificado', 'qualificado', '#0891b2', 20, false, false),
    (new.id, 'Proposta enviada', 'proposta', '#f59e0b', 30, false, false),
    (new.id, 'Em negociação', 'negociacao', '#8b5cf6', 40, false, false),
    (new.id, 'Ganho', 'ganho', '#059669', 50, true, false),
    (new.id, 'Perdido', 'perdido', '#e11d48', 60, false, true);

  insert into public.lead_sources (owner_id, name, slug)
  values
    (new.id, 'Cadastro manual', 'cadastro-manual'),
    (new.id, 'Landing page', 'landing-page'),
    (new.id, 'Formulário do site', 'formulario-do-site'),
    (new.id, 'Formulário público', 'formulario-publico'),
    (new.id, 'Google Ads', 'google-ads'),
    (new.id, 'Instagram', 'instagram'),
    (new.id, 'Indicação', 'indicacao'),
    (new.id, 'LinkedIn', 'linkedin');

  return new;
end;
$$;

create or replace function public.log_lead_activity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_logs (owner_id, lead_id, actor_id, action, metadata)
    values (
      new.owner_id,
      new.id,
      auth.uid(),
      'lead_created',
      jsonb_build_object('status_id', new.status_id, 'source_id', new.source_id)
    );
  elsif tg_op = 'UPDATE' then
    insert into public.activity_logs (owner_id, lead_id, actor_id, action, metadata)
    values (
      new.owner_id,
      new.id,
      auth.uid(),
      case when old.status_id is distinct from new.status_id then 'lead_status_changed' else 'lead_updated' end,
      jsonb_build_object(
        'previous_status_id', old.status_id,
        'status_id', new.status_id,
        'previous_assigned_user_id', old.assigned_user_id,
        'assigned_user_id', new.assigned_user_id
      )
    );
  end if;

  return new;
end;
$$;

create trigger leads_activity_log
after insert or update on public.leads
for each row execute function public.log_lead_activity();

create or replace function public.capture_public_lead(
  form_slug text,
  lead_name text,
  lead_email text default null,
  lead_phone text default null,
  lead_service text default 'Outro servico',
  lead_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_owner uuid;
  default_status_id uuid;
  public_source_id uuid;
  new_lead_id uuid;
begin
  select owner_id into target_owner
  from public.public_forms
  where slug = form_slug and active = true;

  if target_owner is null then
    raise exception 'Formulario nao encontrado';
  end if;

  if char_length(trim(lead_name)) < 2 then
    raise exception 'Nome invalido';
  end if;

  select id into default_status_id
  from public.lead_statuses
  where owner_id = target_owner and slug = 'novo';

  select id into public_source_id
  from public.lead_sources
  where owner_id = target_owner and slug = 'formulario-publico';

  insert into public.leads (
    owner_id,
    assigned_user_id,
    name,
    email,
    phone,
    interest,
    budget,
    notes,
    source_id,
    status_id
  )
  values (
    target_owner,
    target_owner,
    trim(lead_name),
    nullif(trim(lead_email), ''),
    nullif(trim(lead_phone), ''),
    trim(lead_service),
    0,
    nullif(trim(lead_message), ''),
    public_source_id,
    default_status_id
  )
  returning id into new_lead_id;

  if lead_message is not null and char_length(trim(lead_message)) > 0 then
    insert into public.lead_notes (owner_id, lead_id, content)
    values (target_owner, new_lead_id, 'Mensagem do formulario: ' || trim(lead_message));
  end if;

  return new_lead_id;
end;
$$;

commit;
