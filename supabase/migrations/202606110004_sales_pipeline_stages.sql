begin;

do $$
declare
  account record;
  old_status_id uuid;
  target_status_id uuid;
begin
  for account in select id from public.profiles loop
    select id into old_status_id
    from public.lead_statuses
    where owner_id = account.id and slug = 'negociacao';

    select id into target_status_id
    from public.lead_statuses
    where owner_id = account.id and slug = 'contato-feito';

    if target_status_id is not null and old_status_id is not null and target_status_id <> old_status_id then
      update public.leads set status_id = target_status_id where status_id = old_status_id;
      delete from public.lead_statuses where id = old_status_id;
    elsif old_status_id is not null then
      update public.lead_statuses
      set slug = 'contato-feito', name = 'Contato feito'
      where id = old_status_id;
    end if;

    select id into old_status_id
    from public.lead_statuses
    where owner_id = account.id and slug = 'ganho';

    select id into target_status_id
    from public.lead_statuses
    where owner_id = account.id and slug = 'fechado';

    if target_status_id is not null and old_status_id is not null and target_status_id <> old_status_id then
      update public.leads set status_id = target_status_id where status_id = old_status_id;
      delete from public.lead_statuses where id = old_status_id;
    elsif old_status_id is not null then
      update public.lead_statuses
      set slug = 'fechado', name = 'Fechado'
      where id = old_status_id;
    end if;
  end loop;
end;
$$;

insert into public.lead_statuses (owner_id, name, slug, color, position, is_won, is_lost)
select profiles.id, stages.name, stages.slug, stages.color, stages.position, stages.is_won, stages.is_lost
from public.profiles
cross join (
  values
    ('Novo lead', 'novo', '#0ea5e9', 10, false, false),
    ('Contato feito', 'contato-feito', '#6366f1', 20, false, false),
    ('Qualificado', 'qualificado', '#0891b2', 30, false, false),
    ('Proposta enviada', 'proposta', '#f59e0b', 40, false, false),
    ('Fechado', 'fechado', '#059669', 50, true, false),
    ('Perdido', 'perdido', '#e11d48', 60, false, true)
) as stages(name, slug, color, position, is_won, is_lost)
on conflict (owner_id, slug) do update
set
  name = excluded.name,
  color = excluded.color,
  position = excluded.position,
  is_won = excluded.is_won,
  is_lost = excluded.is_lost;

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
    (new.id, 'Formulário público', 'formulario-publico'),
    (new.id, 'Google Ads', 'google-ads'),
    (new.id, 'Instagram', 'instagram'),
    (new.id, 'Indicação', 'indicacao'),
    (new.id, 'LinkedIn', 'linkedin');

  return new;
end;
$$;

commit;
