begin;

create table portfolio.contact_rate_limits (
  key_hash text primary key,
  attempts integer not null default 1,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint contact_rate_limits_key_hash_check check (
    key_hash ~ '^[a-f0-9]{64}$'
  ),
  constraint contact_rate_limits_attempts_check check (
    attempts between 1 and 6
  )
);

create index contact_rate_limits_reset_at_idx
  on portfolio.contact_rate_limits (reset_at);

alter table portfolio.contact_rate_limits enable row level security;

revoke all
  on table portfolio.contact_rate_limits
  from public, anon, authenticated;
grant all
  on table portfolio.contact_rate_limits
  to service_role;

create or replace function portfolio.consume_contact_rate_limit(
  p_key_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  now_at timestamptz := pg_catalog.clock_timestamp();
  current_attempts integer;
begin
  if p_key_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid contact rate-limit key';
  end if;

  insert into portfolio.contact_rate_limits (
    key_hash,
    attempts,
    reset_at,
    updated_at
  )
  values (
    p_key_hash,
    1,
    now_at + interval '15 minutes',
    now_at
  )
  on conflict (key_hash) do update
  set
    attempts = case
      when portfolio.contact_rate_limits.reset_at <= now_at then 1
      when portfolio.contact_rate_limits.attempts >= 5 then 6
      else portfolio.contact_rate_limits.attempts + 1
    end,
    reset_at = case
      when portfolio.contact_rate_limits.reset_at <= now_at
        then now_at + interval '15 minutes'
      else portfolio.contact_rate_limits.reset_at
    end,
    updated_at = now_at
  returning attempts into current_attempts;

  return current_attempts <= 5;
end;
$$;

revoke all
  on function portfolio.consume_contact_rate_limit(text)
  from public;
grant execute
  on function portfolio.consume_contact_rate_limit(text)
  to anon, authenticated, service_role;

commit;
