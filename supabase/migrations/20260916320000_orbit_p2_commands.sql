begin;

create table if not exists orbit_private.recurrence_occurrences (
  recurrence_id uuid not null references orbit.card_recurrence (id) on delete cascade,
  occurrence_at timestamptz not null,
  card_id uuid not null references orbit.cards (id) on delete cascade,
  primary key (recurrence_id, occurrence_at)
);

revoke all on table orbit_private.recurrence_occurrences from public, anon, authenticated;
grant select, insert on table orbit_private.recurrence_occurrences to service_role;

create or replace function orbit.add_card_dependency(
  p_card_id uuid,
  p_depends_on_card_id uuid,
  p_dependency_type text default 'blocks'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
  v_board_id uuid;
  v_target_board_id uuid;
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  if p_card_id = p_depends_on_card_id then
    raise exception 'card cannot depend on itself' using errcode = '22023';
  end if;

  select workspace_id, board_id into v_workspace_id, v_board_id
  from orbit.cards where id = p_card_id and deleted_at is null;
  if v_board_id is null then
    raise exception 'card not found' using errcode = 'P0002';
  end if;

  select board_id into v_target_board_id
  from orbit.cards where id = p_depends_on_card_id and deleted_at is null;
  if v_target_board_id is null or v_target_board_id <> v_board_id then
    raise exception 'dependencies must stay within one board' using errcode = '22023';
  end if;

  if not orbit_private.can_edit_board(v_board_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;

  if exists (
    with recursive chain as (
      select p_depends_on_card_id as card_id
      union
      select d.depends_on_card_id
      from orbit.card_dependencies d
      join chain c on d.card_id = c.card_id
    )
    select 1 from chain where card_id = p_card_id
  ) then
    raise exception 'dependency cycle detected' using errcode = '22023';
  end if;

  insert into orbit.card_dependencies (
    workspace_id, board_id, card_id, depends_on_card_id, dependency_type, created_by
  )
  values (v_workspace_id, v_board_id, p_card_id, p_depends_on_card_id, p_dependency_type, v_user_id)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function orbit.remove_card_dependency(p_dependency_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_board_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select board_id into v_board_id from orbit.card_dependencies where id = p_dependency_id;
  if not orbit_private.can_edit_board(v_board_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;
  delete from orbit.card_dependencies where id = p_dependency_id;
end;
$$;

grant execute on function orbit.remove_card_dependency(uuid) to authenticated;

create or replace function orbit.set_card_recurrence(
  p_card_id uuid,
  p_cadence text,
  p_interval_count integer default 1,
  p_timezone text default 'UTC',
  p_title_template text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
  v_board_id uuid;
  v_id uuid;
  v_next timestamptz := now() + interval '1 day';
begin
  perform orbit_private.require_orbit_access();
  select workspace_id, board_id into v_workspace_id, v_board_id
  from orbit.cards where id = p_card_id and deleted_at is null;
  if not orbit_private.can_manage_board(v_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;
  if p_cadence = 'weekly' then v_next := now() + make_interval(days => 7 * p_interval_count);
  elsif p_cadence = 'monthly' then v_next := now() + make_interval(days => 30 * p_interval_count);
  else v_next := now() + make_interval(days => p_interval_count);
  end if;
  insert into orbit.card_recurrence (
    workspace_id, board_id, card_id, cadence, interval_count, next_run_at, created_by, timezone, title_template, active
  )
  values (
    v_workspace_id, v_board_id, p_card_id, p_cadence, p_interval_count, v_next, v_user_id,
    coalesce(nullif(trim(p_timezone), ''), 'UTC'), p_title_template, true
  )
  on conflict (card_id) do update
  set cadence = excluded.cadence,
      interval_count = excluded.interval_count,
      next_run_at = excluded.next_run_at,
      timezone = excluded.timezone,
      title_template = excluded.title_template,
      active = true
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function orbit.pause_card_recurrence(p_card_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_board_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select board_id into v_board_id from orbit.cards where id = p_card_id;
  if not orbit_private.can_manage_board(v_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;
  update orbit.card_recurrence set active = false where card_id = p_card_id;
end;
$$;

create or replace function orbit.resume_card_recurrence(p_card_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_board_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select board_id into v_board_id from orbit.cards where id = p_card_id;
  if not orbit_private.can_manage_board(v_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;
  update orbit.card_recurrence set active = true where card_id = p_card_id;
end;
$$;

grant execute on function orbit.pause_card_recurrence(uuid), orbit.resume_card_recurrence(uuid) to authenticated;

create or replace function orbit.create_automation_rule(
  p_board_id uuid,
  p_name text,
  p_trigger_type text,
  p_trigger_config jsonb,
  p_action_type text,
  p_action_config jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.can_manage_board(p_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;
  select workspace_id into v_workspace_id from orbit.boards where id = p_board_id;
  insert into orbit.automation_rules (
    workspace_id, board_id, name, trigger_type, trigger_config, action_type, action_config, created_by
  )
  values (
    v_workspace_id, p_board_id, trim(p_name), p_trigger_type, p_trigger_config,
    p_action_type, p_action_config, v_user_id
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function orbit.delete_automation_rule(p_rule_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_board_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select board_id into v_board_id from orbit.automation_rules where id = p_rule_id;
  if not orbit_private.can_manage_board(v_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;
  delete from orbit.automation_rules where id = p_rule_id;
end;
$$;

grant execute on function orbit.create_automation_rule(uuid, text, text, jsonb, text, jsonb),
  orbit.delete_automation_rule(uuid) to authenticated;

create or replace function orbit.link_card_github_issue(
  p_card_id uuid,
  p_issue_url text,
  p_issue_title text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
  v_board_id uuid;
  v_repo text;
  v_number integer;
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select workspace_id, board_id into v_workspace_id, v_board_id
  from orbit.cards where id = p_card_id and deleted_at is null;
  if not orbit_private.can_edit_board(v_board_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;

  v_repo := (regexp_match(lower(trim(p_issue_url)), 'github\.com/([^/]+/[^/]+)/issues/([0-9]+)'))[1];
  v_number := (regexp_match(lower(trim(p_issue_url)), 'github\.com/([^/]+/[^/]+)/issues/([0-9]+)'))[2]::integer;
  if v_repo is null or v_number is null then
    raise exception 'unsupported GitHub issue URL' using errcode = '22023';
  end if;

  insert into orbit.card_github_links (
    workspace_id, board_id, card_id, repo_full_name, issue_number, issue_url, issue_title, created_by
  )
  values (v_workspace_id, v_board_id, p_card_id, v_repo, v_number, trim(p_issue_url), p_issue_title, v_user_id)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function orbit.unlink_card_github_link(p_link_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_board_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select board_id into v_board_id from orbit.card_github_links where id = p_link_id;
  if not orbit_private.can_edit_board(v_board_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;
  delete from orbit.card_github_links where id = p_link_id;
end;
$$;

grant execute on function orbit.link_card_github_issue(uuid, text, text),
  orbit.unlink_card_github_link(uuid) to authenticated;

create or replace function orbit.create_webhook_subscription(
  p_workspace_id uuid,
  p_url text,
  p_secret_hash text,
  p_events text[] default array['card.created', 'card.moved']
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.is_workspace_admin(p_workspace_id, v_user_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;
  insert into orbit_private.webhook_subscriptions (workspace_id, url, secret_hash, events, created_by)
  values (p_workspace_id, trim(p_url), p_secret_hash, coalesce(p_events, array['card.moved']), v_user_id)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function orbit.revoke_webhook_subscription(p_subscription_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_workspace_id uuid;
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  select workspace_id into v_workspace_id
  from orbit_private.webhook_subscriptions where id = p_subscription_id;
  if not orbit_private.is_workspace_admin(v_workspace_id, v_user_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;
  delete from orbit_private.webhook_subscriptions where id = p_subscription_id;
end;
$$;

grant execute on function orbit.create_webhook_subscription(uuid, text, text, text[]),
  orbit.revoke_webhook_subscription(uuid) to authenticated;

create or replace function orbit.create_api_token(
  p_workspace_id uuid,
  p_name text,
  p_token_hash text,
  p_token_prefix text,
  p_scopes text[] default array['boards:read', 'cards:read'],
  p_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.is_workspace_admin(p_workspace_id, v_user_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;
  insert into orbit_private.api_tokens (
    workspace_id, user_id, name, token_hash, token_prefix, scopes, expires_at
  )
  values (
    p_workspace_id, v_user_id, trim(p_name), p_token_hash, p_token_prefix,
    coalesce(p_scopes, array['boards:read', 'cards:read']), p_expires_at
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function orbit.revoke_api_token(p_token_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_workspace_id uuid;
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  select workspace_id into v_workspace_id from orbit_private.api_tokens where id = p_token_id;
  if not orbit_private.is_workspace_admin(v_workspace_id, v_user_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;
  update orbit_private.api_tokens set revoked_at = now() where id = p_token_id;
end;
$$;

grant execute on function orbit.create_api_token(uuid, text, text, text, text[], timestamptz),
  orbit.revoke_api_token(uuid) to authenticated;

create or replace function orbit.publish_board(p_board_id uuid, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
  v_projection jsonb;
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select workspace_id into v_workspace_id from orbit.boards where id = p_board_id;
  if not exists (
    select 1 from orbit.workspaces where id = v_workspace_id and owner_user_id = v_user_id
  ) then
    raise exception 'workspace owner required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'board', jsonb_build_object('name', b.name, 'key', b.key),
    'columns', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'category', c.category) order by c.rank)
      from orbit.columns c where c.board_id = p_board_id
    ), '[]'::jsonb),
    'cards', coalesce((
      select jsonb_agg(jsonb_build_object(
        'number', card.number, 'title', card.title, 'column_id', card.column_id, 'priority', card.priority
      ) order by card.rank)
      from orbit.cards card
      where card.board_id = p_board_id and card.deleted_at is null and card.archived_at is null
    ), '[]'::jsonb)
  )
  into v_projection
  from orbit.boards b where b.id = p_board_id;

  insert into orbit.published_boards (workspace_id, board_id, slug, projection, published_by, revoked_at)
  values (v_workspace_id, p_board_id, lower(trim(p_slug)), v_projection, v_user_id, null)
  on conflict (board_id) do update
  set slug = excluded.slug,
      projection = excluded.projection,
      published_by = excluded.published_by,
      published_at = now(),
      revoked_at = null
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function orbit.revoke_published_board(p_board_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_workspace_id uuid;
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  select workspace_id into v_workspace_id from orbit.boards where id = p_board_id;
  if not exists (
    select 1 from orbit.workspaces where id = v_workspace_id and owner_user_id = v_user_id
  ) then
    raise exception 'workspace owner required' using errcode = '42501';
  end if;
  update orbit.published_boards set revoked_at = now() where board_id = p_board_id and revoked_at is null;
end;
$$;

create or replace function orbit.get_published_board(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row orbit.published_boards%rowtype;
begin
  select * into v_row
  from orbit.published_boards
  where slug = lower(trim(p_slug)) and revoked_at is null;
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'slug', v_row.slug,
    'published_at', v_row.published_at,
    'projection', v_row.projection
  );
end;
$$;

revoke all on function orbit.get_published_board(text) from public;
grant execute on function orbit.get_published_board(text) to anon, authenticated;

grant execute on function orbit.publish_board(uuid, text), orbit.revoke_published_board(uuid) to authenticated;

create or replace function orbit.request_board_import(
  p_board_id uuid,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select workspace_id into v_workspace_id from orbit.boards where id = p_board_id;
  if not orbit_private.is_workspace_admin(v_workspace_id, v_user_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;
  insert into orbit_private.import_jobs (workspace_id, board_id, requester_id, payload)
  values (v_workspace_id, p_board_id, v_user_id, coalesce(p_payload, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function orbit.request_board_import(uuid, jsonb) to authenticated;

create or replace function orbit.board_completion_report(p_board_id uuid, p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.can_read_board(p_board_id, v_user_id) then
    raise exception 'board read access required' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'metric', 'Cards completed in period',
    'definition', 'Counts cards with completed_at within the last N days on visible columns.',
    'days', p_days,
    'completed_count', (
      select count(*) from orbit.cards
      where board_id = p_board_id
        and completed_at >= now() - make_interval(days => greatest(p_days, 1))
        and deleted_at is null
    )
  );
end;
$$;

create or replace function orbit.board_backlog_report(p_board_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.can_read_board(p_board_id, v_user_id) then
    raise exception 'board read access required' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'metric', 'Backlog age',
    'definition', 'Average days since creation for cards not in done/cancelled columns.',
    'average_age_days', coalesce((
      select round(avg(extract(epoch from (now() - c.created_at)) / 86400.0)::numeric, 1)
      from orbit.cards c
      join orbit.columns col on col.id = c.column_id
      where c.board_id = p_board_id
        and c.deleted_at is null
        and col.category not in ('done', 'cancelled')
    ), 0)
  );
end;
$$;

create or replace function orbit.list_stale_cards(p_board_id uuid, p_days integer default 14)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.can_read_board(p_board_id, v_user_id) then
    raise exception 'board read access required' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'number', c.number, 'title', c.title, 'updated_at', c.updated_at
    ) order by c.updated_at)
    from orbit.cards c
    join orbit.columns col on col.id = c.column_id
    where c.board_id = p_board_id
      and c.deleted_at is null
      and c.archived_at is null
      and col.category not in ('done', 'cancelled')
      and c.updated_at < now() - make_interval(days => greatest(p_days, 1))
  ), '[]'::jsonb);
end;
$$;

grant execute on function orbit.board_completion_report(uuid, integer),
  orbit.board_backlog_report(uuid), orbit.list_stale_cards(uuid, integer) to authenticated;

create or replace function orbit.set_ai_preference(p_workspace_id uuid, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.is_active_workspace_member(p_workspace_id, v_user_id) then
    raise exception 'workspace membership required' using errcode = '42501';
  end if;
  insert into orbit.ai_preferences (user_id, workspace_id, enabled, updated_at)
  values (v_user_id, p_workspace_id, p_enabled, now())
  on conflict (user_id, workspace_id) do update
  set enabled = excluded.enabled, updated_at = now();
end;
$$;

create or replace function orbit.summarize_card(p_card_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_board_id uuid;
  v_workspace_id uuid;
  v_title text;
  v_description text;
  v_enabled boolean := false;
begin
  perform orbit_private.require_orbit_access();
  select workspace_id, board_id, title, description
  into v_workspace_id, v_board_id, v_title, v_description
  from orbit.cards where id = p_card_id and deleted_at is null;
  if not orbit_private.can_read_board(v_board_id, v_user_id) then
    raise exception 'board read access required' using errcode = '42501';
  end if;
  select enabled into v_enabled from orbit.ai_preferences
  where user_id = v_user_id and workspace_id = v_workspace_id;
  if coalesce(v_enabled, false) is not true then
    raise exception 'AI assistance is not enabled for this workspace' using errcode = '42501';
  end if;
  return trim(format(
    'Summary for "%s": %s',
    v_title,
    coalesce(nullif(left(regexp_replace(coalesce(v_description, ''), '\s+', ' ', 'g'), 240), ''), 'No description provided.')
  ));
end;
$$;

grant execute on function orbit.set_ai_preference(uuid, boolean), orbit.summarize_card(uuid) to authenticated;

create or replace function orbit.list_workspace_webhooks(p_workspace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.is_workspace_admin(p_workspace_id, v_user_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', s.id, 'url', s.url, 'events', s.events, 'enabled', s.enabled, 'created_at', s.created_at
    ) order by s.created_at desc)
    from orbit_private.webhook_subscriptions s
    where s.workspace_id = p_workspace_id
  ), '[]'::jsonb);
end;
$$;

create or replace function orbit.list_workspace_api_tokens(p_workspace_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.is_workspace_admin(p_workspace_id, v_user_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', t.id, 'name', t.name, 'token_prefix', t.token_prefix,
      'scopes', t.scopes, 'expires_at', t.expires_at, 'revoked_at', t.revoked_at, 'created_at', t.created_at
    ) order by t.created_at desc)
    from orbit_private.api_tokens t
    where t.workspace_id = p_workspace_id
  ), '[]'::jsonb);
end;
$$;

create or replace function orbit.list_board_automation_rules(p_board_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.can_read_board(p_board_id, v_user_id) then
    raise exception 'board read access required' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', r.id, 'name', r.name, 'enabled', r.enabled,
      'trigger_type', r.trigger_type, 'trigger_config', r.trigger_config,
      'action_type', r.action_type, 'action_config', r.action_config
    ) order by r.created_at)
    from orbit.automation_rules r where r.board_id = p_board_id
  ), '[]'::jsonb);
end;
$$;

grant execute on function orbit.list_workspace_webhooks(uuid),
  orbit.list_workspace_api_tokens(uuid), orbit.list_board_automation_rules(uuid) to authenticated;

commit;

