create extension if not exists pgcrypto;
create extension if not exists unaccent;

create type public.lead_status as enum (
  'novo',
  'qualificado',
  'proposta',
  'negociacao',
  'ganho',
  'perdido'
);

create type public.task_priority as enum ('baixa', 'media', 'alta');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  company_name text not null default '',
  phone text,
  public_form_slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.public_forms (
  owner_id uuid primary key references public.profiles(id) on delete cascade,
  slug text not null unique,
  title text not null default 'Vamos conversar sobre o seu projeto?',
  subtitle text not null default 'Conte um pouco sobre o que você precisa. Retornaremos com os próximos passos em até um dia útil.',
  company_name text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  service text not null,
  source text not null default 'Cadastro manual',
  status public.lead_status not null default 'novo',
  value numeric(12, 2) not null default 0 check (value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now()
);

create table public.follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 240),
  due_at timestamptz not null,
  completed boolean not null default false,
  priority public.task_priority not null default 'media',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_owner_updated_idx on public.leads(owner_id, updated_at desc);
create index leads_owner_status_idx on public.leads(owner_id, status);
create index notes_owner_lead_idx on public.lead_notes(owner_id, lead_id, created_at desc);
create index tasks_owner_due_idx on public.follow_up_tasks(owner_id, completed, due_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger public_forms_set_updated_at before update on public.public_forms
for each row execute function public.set_updated_at();
create trigger leads_set_updated_at before update on public.leads
for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.follow_up_tasks
for each row execute function public.set_updated_at();

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

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.sync_public_form()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.public_forms
  set slug = new.public_form_slug,
      company_name = new.company_name
  where owner_id = new.id;
  return new;
end;
$$;

create trigger on_profile_updated
after update of public_form_slug, company_name on public.profiles
for each row execute function public.sync_public_form();

alter table public.profiles enable row level security;
alter table public.public_forms enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.follow_up_tasks enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated
using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "public_forms_read_active" on public.public_forms
for select to anon, authenticated
using (active = true or (select auth.uid()) = owner_id);
create policy "public_forms_update_own" on public.public_forms
for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "leads_select_own" on public.leads
for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "leads_insert_own" on public.leads
for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy "leads_update_own" on public.leads
for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
create policy "leads_delete_own" on public.leads
for delete to authenticated
using ((select auth.uid()) = owner_id);

create policy "notes_select_own" on public.lead_notes
for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "notes_insert_own" on public.lead_notes
for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy "notes_update_own" on public.lead_notes
for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
create policy "notes_delete_own" on public.lead_notes
for delete to authenticated
using ((select auth.uid()) = owner_id);

create policy "tasks_select_own" on public.follow_up_tasks
for select to authenticated
using ((select auth.uid()) = owner_id);
create policy "tasks_insert_own" on public.follow_up_tasks
for insert to authenticated
with check ((select auth.uid()) = owner_id);
create policy "tasks_update_own" on public.follow_up_tasks
for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
create policy "tasks_delete_own" on public.follow_up_tasks
for delete to authenticated
using ((select auth.uid()) = owner_id);

create or replace function public.capture_public_lead(
  form_slug text,
  lead_name text,
  lead_email text default null,
  lead_phone text default null,
  lead_service text default 'Outro serviço',
  lead_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_owner uuid;
  new_lead_id uuid;
begin
  select owner_id into target_owner
  from public.public_forms
  where slug = form_slug and active = true;

  if target_owner is null then
    raise exception 'Formulário não encontrado';
  end if;

  if char_length(trim(lead_name)) < 2 then
    raise exception 'Nome inválido';
  end if;

  insert into public.leads (owner_id, name, email, phone, service, source)
  values (target_owner, trim(lead_name), nullif(trim(lead_email), ''), nullif(trim(lead_phone), ''), trim(lead_service), 'Formulário público')
  returning id into new_lead_id;

  if lead_message is not null and char_length(trim(lead_message)) > 0 then
    insert into public.lead_notes (owner_id, lead_id, content)
    values (target_owner, new_lead_id, 'Mensagem do formulário: ' || trim(lead_message));
  end if;

  return new_lead_id;
end;
$$;

revoke all on function public.capture_public_lead(text, text, text, text, text, text) from public;
grant execute on function public.capture_public_lead(text, text, text, text, text, text) to anon, authenticated;

grant select on public.public_forms to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.leads, public.lead_notes, public.follow_up_tasks to authenticated;
grant update on public.public_forms to authenticated;
