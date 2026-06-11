begin;

alter table public.leads
  add column preferred_contact_time text;

alter table public.leads
  add constraint leads_preferred_contact_time_length
  check (
    preferred_contact_time is null
    or char_length(preferred_contact_time) between 2 and 80
  );

do $$
declare
  account record;
  old_source_id uuid;
  target_source_id uuid;
begin
  for account in select id from public.profiles loop
    select id into old_source_id
    from public.lead_sources
    where owner_id = account.id and slug = 'formulario-publico';

    select id into target_source_id
    from public.lead_sources
    where owner_id = account.id and slug = 'formulario';

    if target_source_id is not null and old_source_id is not null and target_source_id <> old_source_id then
      update public.leads set source_id = target_source_id where source_id = old_source_id;
      delete from public.lead_sources where id = old_source_id;
    elsif old_source_id is not null then
      update public.lead_sources
      set slug = 'formulario', name = 'Formulário'
      where id = old_source_id;
    end if;
  end loop;
end;
$$;

insert into public.lead_sources (owner_id, name, slug)
select profiles.id, 'Formulário', 'formulario'
from public.profiles
on conflict (owner_id, slug) do update
set name = excluded.name, active = true;

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
    (new.id, 'Novo lead', 'novo', '#0ea5e9', 10, false, false),
    (new.id, 'Contato feito', 'contato-feito', '#6366f1', 20, false, false),
    (new.id, 'Qualificado', 'qualificado', '#0891b2', 30, false, false),
    (new.id, 'Proposta enviada', 'proposta', '#f59e0b', 40, false, false),
    (new.id, 'Fechado', 'fechado', '#059669', 50, true, false),
    (new.id, 'Perdido', 'perdido', '#e11d48', 60, false, true);

  insert into public.lead_sources (owner_id, name, slug)
  values
    (new.id, 'Cadastro manual', 'cadastro-manual'),
    (new.id, 'Landing page', 'landing-page'),
    (new.id, 'Formulário do site', 'formulario-do-site'),
    (new.id, 'Formulário', 'formulario'),
    (new.id, 'Google Ads', 'google-ads'),
    (new.id, 'Instagram', 'instagram'),
    (new.id, 'Indicação', 'indicacao'),
    (new.id, 'LinkedIn', 'linkedin');

  return new;
end;
$$;

drop function if exists public.capture_public_lead(text, text, text, text, text, text);

create function public.capture_public_lead(
  form_slug text,
  lead_name text,
  lead_phone text,
  lead_email text,
  lead_city text,
  lead_objective text,
  lead_budget numeric,
  lead_preferred_contact_time text,
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
  form_source_id uuid;
  new_lead_id uuid;
begin
  select owner_id into target_owner
  from public.public_forms
  where slug = form_slug and active = true;

  if target_owner is null then
    raise exception 'Formulario nao encontrado';
  end if;

  if char_length(trim(lead_name)) < 2 or char_length(trim(lead_name)) > 120 then
    raise exception 'Nome invalido';
  end if;

  if char_length(regexp_replace(lead_phone, '[^0-9]', '', 'g')) < 10
    or char_length(trim(lead_phone)) > 30 then
    raise exception 'WhatsApp invalido';
  end if;

  if lead_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or char_length(trim(lead_email)) > 254 then
    raise exception 'Email invalido';
  end if;

  if char_length(trim(lead_city)) < 2 or char_length(trim(lead_city)) > 120 then
    raise exception 'Cidade invalida';
  end if;

  if char_length(trim(lead_objective)) < 3 or char_length(trim(lead_objective)) > 500 then
    raise exception 'Objetivo invalido';
  end if;

  if lead_budget is null or lead_budget < 0 then
    raise exception 'Orcamento invalido';
  end if;

  if char_length(trim(lead_preferred_contact_time)) < 2
    or char_length(trim(lead_preferred_contact_time)) > 80 then
    raise exception 'Horario invalido';
  end if;

  if lead_message is not null and char_length(trim(lead_message)) > 5000 then
    raise exception 'Mensagem muito longa';
  end if;

  select id into default_status_id
  from public.lead_statuses
  where owner_id = target_owner and slug = 'novo';

  select id into form_source_id
  from public.lead_sources
  where owner_id = target_owner and slug = 'formulario';

  if default_status_id is null or form_source_id is null then
    raise exception 'Configuracao do formulario incompleta';
  end if;

  insert into public.leads (
    owner_id,
    assigned_user_id,
    name,
    email,
    phone,
    city,
    interest,
    budget,
    preferred_contact_time,
    notes,
    source_id,
    status_id
  )
  values (
    target_owner,
    target_owner,
    trim(lead_name),
    lower(trim(lead_email)),
    trim(lead_phone),
    trim(lead_city),
    trim(lead_objective),
    lead_budget,
    trim(lead_preferred_contact_time),
    nullif(trim(lead_message), ''),
    form_source_id,
    default_status_id
  )
  returning id into new_lead_id;

  return new_lead_id;
end;
$$;

revoke all on function public.capture_public_lead(text, text, text, text, text, text, numeric, text, text) from public;
grant execute on function public.capture_public_lead(text, text, text, text, text, text, numeric, text, text) to anon, authenticated;

commit;
