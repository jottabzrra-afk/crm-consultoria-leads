insert into public.activity_logs (
  owner_id,
  lead_id,
  actor_id,
  action,
  metadata,
  created_at
)
select
  leads.owner_id,
  leads.id,
  null,
  'lead_created',
  jsonb_build_object('backfilled', true),
  leads.created_at
from public.leads
where not exists (
  select 1
  from public.activity_logs
  where activity_logs.lead_id = leads.id
    and activity_logs.action = 'lead_created'
);

create or replace function public.get_crm_dashboard_summary(
  client_timezone text default 'America/Sao_Paulo'
)
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with status_counts as (
    select
      statuses.id,
      statuses.name,
      statuses.slug,
      statuses.color,
      statuses.position,
      statuses.is_won,
      statuses.is_lost,
      count(leads.id)::integer as lead_count
    from public.lead_statuses as statuses
    left join public.leads as leads
      on leads.status_id = statuses.id
      and leads.owner_id = (select auth.uid())
    where statuses.owner_id = (select auth.uid())
    group by statuses.id
  ),
  totals as (
    select
      count(*)::integer as total_leads,
      count(*) filter (
        where created_at >= (
          date_trunc('day', now() at time zone client_timezone)
          at time zone client_timezone
        )
      )::integer as new_leads_today
    from public.leads
    where owner_id = (select auth.uid())
  ),
  outcomes as (
    select
      coalesce(sum(lead_count) filter (where is_won), 0)::integer as won_leads,
      coalesce(sum(lead_count) filter (where is_won or is_lost), 0)::integer as closed_leads
    from status_counts
  )
  select jsonb_build_object(
    'total_leads', totals.total_leads,
    'new_leads_today', totals.new_leads_today,
    'won_leads', outcomes.won_leads,
    'closed_leads', outcomes.closed_leads,
    'conversion_rate', case
      when totals.total_leads = 0 then 0
      else round((outcomes.won_leads::numeric / totals.total_leads::numeric) * 100, 1)
    end,
    'statuses', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', id,
            'name', name,
            'slug', slug,
            'color', color,
            'position', position,
            'is_won', is_won,
            'is_lost', is_lost,
            'count', lead_count
          )
          order by position
        )
        from status_counts
      ),
      '[]'::jsonb
    )
  )
  from totals
  cross join outcomes;
$$;

revoke all on function public.get_crm_dashboard_summary(text) from public;
grant execute on function public.get_crm_dashboard_summary(text) to authenticated;
