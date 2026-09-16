begin;

alter table orbit_private.webhook_subscriptions
  add column if not exists signing_secret text;

alter table orbit_private.webhook_deliveries
  add column if not exists last_error text,
  add column if not exists http_status integer,
  add column if not exists next_attempt_at timestamptz not null default now();

alter table orbit_private.webhook_deliveries
  drop constraint if exists webhook_deliveries_status_check;

alter table orbit_private.webhook_deliveries
  add constraint webhook_deliveries_status_check
  check (status in ('pending', 'processing', 'completed', 'failed'));

create index if not exists webhook_deliveries_pending_idx
  on orbit_private.webhook_deliveries (status, next_attempt_at, created_at)
  where status in ('pending', 'processing');

alter table orbit.attachments
  alter constraint attachments_workspace_id_board_id_card_id_fkey deferrable initially deferred;

alter table orbit.card_assignees
  alter constraint card_assignees_workspace_id_board_id_card_id_fkey deferrable initially deferred;

alter table orbit.card_dependencies
  alter constraint card_dependencies_workspace_id_board_id_card_id_fkey deferrable initially deferred;

alter table orbit.card_recurrence
  alter constraint card_recurrence_workspace_id_board_id_card_id_fkey deferrable initially deferred;

alter table orbit.card_watches
  alter constraint card_watches_workspace_id_board_id_card_id_fkey deferrable initially deferred;

alter table orbit.checklists
  alter constraint checklists_workspace_id_board_id_card_id_fkey deferrable initially deferred;

alter table orbit.comments
  alter constraint comments_workspace_id_board_id_card_id_fkey deferrable initially deferred;

alter table orbit.card_github_links
  alter constraint card_github_links_workspace_id_board_id_card_id_fkey deferrable initially deferred;

drop function if exists orbit.create_webhook_subscription(uuid, text, text, text[]);

create or replace function orbit.create_webhook_subscription(
  p_workspace_id uuid,
  p_url text,
  p_secret_hash text,
  p_signing_secret text default null,
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
  insert into orbit_private.webhook_subscriptions (
    workspace_id, url, secret_hash, signing_secret, events, created_by
  )
  values (
    p_workspace_id,
    trim(p_url),
    p_secret_hash,
    nullif(trim(p_signing_secret), ''),
    coalesce(p_events, array['card.moved']),
    v_user_id
  )
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function orbit.claim_webhook_deliveries(p_limit integer default 25)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delivery orbit_private.webhook_deliveries%rowtype;
  v_rows jsonb := '[]'::jsonb;
  v_limit integer := greatest(coalesce(p_limit, 25), 1);
begin
  for v_delivery in
    select d.*
    from orbit_private.webhook_deliveries d
    join orbit_private.webhook_subscriptions s on s.id = d.subscription_id
    where d.status = 'pending'
      and d.next_attempt_at <= now()
      and s.enabled
    order by d.created_at
    limit v_limit
    for update of d skip locked
  loop
    update orbit_private.webhook_deliveries
    set status = 'processing', attempts = attempts + 1
    where id = v_delivery.id;

    v_rows := v_rows || jsonb_build_array(jsonb_build_object(
      'id', v_delivery.id,
      'event_type', v_delivery.event_type,
      'payload', v_delivery.payload,
      'attempts', v_delivery.attempts + 1,
      'url', (
        select s.url
        from orbit_private.webhook_subscriptions s
        where s.id = v_delivery.subscription_id
      ),
      'signing_secret', (
        select s.signing_secret
        from orbit_private.webhook_subscriptions s
        where s.id = v_delivery.subscription_id
      )
    ));
  end loop;

  return v_rows;
end;
$$;

create or replace function orbit.finalize_webhook_delivery(
  p_delivery_id uuid,
  p_success boolean,
  p_http_status integer default null,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempts integer;
begin
  select attempts into v_attempts
  from orbit_private.webhook_deliveries
  where id = p_delivery_id;

  if not found then
    raise exception 'delivery not found' using errcode = 'P0002';
  end if;

  if p_success then
    update orbit_private.webhook_deliveries
    set
      status = 'completed',
      processed_at = now(),
      http_status = p_http_status,
      last_error = null
    where id = p_delivery_id;
    return;
  end if;

  update orbit_private.webhook_deliveries
  set
    status = case when v_attempts >= 5 then 'failed' else 'pending' end,
    http_status = p_http_status,
    last_error = left(coalesce(p_error, 'delivery failed'), 500),
    next_attempt_at = now() + make_interval(mins => least(60, 5 * v_attempts))
  where id = p_delivery_id;
end;
$$;

create or replace function orbit.list_webhook_deliveries(
  p_workspace_id uuid,
  p_limit integer default 25
)
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
      'id', d.id,
      'event_type', d.event_type,
      'status', d.status,
      'attempts', d.attempts,
      'http_status', d.http_status,
      'last_error', d.last_error,
      'created_at', d.created_at,
      'processed_at', d.processed_at,
      'url', s.url
    ) order by d.created_at desc)
    from orbit_private.webhook_deliveries d
    join orbit_private.webhook_subscriptions s on s.id = d.subscription_id
    where s.workspace_id = p_workspace_id
    limit greatest(coalesce(p_limit, 25), 1)
  ), '[]'::jsonb);
end;
$$;

create or replace function orbit.list_workspace_export_jobs(p_workspace_id uuid)
returns jsonb
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

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', j.id,
      'status', j.status,
      'created_at', j.created_at,
      'processed_at', j.processed_at,
      'expires_at', j.expires_at,
      'requester_id', j.requester_id
    ) order by j.created_at desc)
    from orbit_private.export_jobs j
    where j.workspace_id = p_workspace_id
      and (j.requester_id = v_user_id or orbit_private.is_workspace_admin(p_workspace_id, v_user_id))
  ), '[]'::jsonb);
end;
$$;

create or replace function orbit.get_workspace_export_manifest(p_job_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_job orbit_private.export_jobs%rowtype;
begin
  perform orbit_private.require_orbit_access();

  select * into v_job
  from orbit_private.export_jobs
  where id = p_job_id;

  if not found then
    raise exception 'export job not found' using errcode = 'P0002';
  end if;

  if not orbit_private.is_active_workspace_member(v_job.workspace_id, v_user_id) then
    raise exception 'workspace membership required' using errcode = '42501';
  end if;

  if v_job.requester_id <> v_user_id
     and not orbit_private.is_workspace_admin(v_job.workspace_id, v_user_id) then
    raise exception 'export access denied' using errcode = '42501';
  end if;

  if v_job.status <> 'ready' then
    raise exception 'export not ready' using errcode = '22023';
  end if;

  if v_job.expires_at is not null and v_job.expires_at <= now() then
    raise exception 'export expired' using errcode = '22023';
  end if;

  return jsonb_build_object(
    'id', v_job.id,
    'workspace_id', v_job.workspace_id,
    'manifest', v_job.manifest,
    'processed_at', v_job.processed_at,
    'expires_at', v_job.expires_at
  );
end;
$$;

create or replace function orbit.move_card_to_board(
  p_card_id uuid,
  p_target_board_id uuid,
  p_target_column_id uuid,
  p_rank text,
  p_expected_version integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
  v_source_board_id uuid;
  v_number integer;
begin
  perform orbit_private.require_orbit_access();

  select workspace_id, board_id into v_workspace_id, v_source_board_id
  from orbit.cards
  where id = p_card_id and deleted_at is null;

  if v_source_board_id is null then
    raise exception 'card not found' using errcode = 'P0002';
  end if;

  if v_source_board_id = p_target_board_id then
    perform orbit.move_card(p_card_id, p_target_column_id, p_rank, p_expected_version);
    return;
  end if;

  if not orbit_private.can_edit_board(v_source_board_id, v_user_id)
     or not orbit_private.can_edit_board(p_target_board_id, v_user_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from orbit.boards b
    where b.id = p_target_board_id and b.workspace_id = v_workspace_id
  ) then
    raise exception 'target board must be in the same workspace' using errcode = '22023';
  end if;

  if not exists (
    select 1 from orbit.columns c
    where c.id = p_target_column_id and c.board_id = p_target_board_id
  ) then
    raise exception 'target column not found' using errcode = 'P0002';
  end if;

  delete from orbit.card_dependencies d
  where d.card_id = p_card_id
     or d.depends_on_card_id = p_card_id;

  set constraints all deferred;

  update orbit_private.board_sequences
  set next_number = next_number + 1
  where board_id = p_target_board_id
  returning next_number - 1 into v_number;

  update orbit.card_labels
  set board_id = p_target_board_id
  where card_id = p_card_id;

  update orbit.card_assignees
  set board_id = p_target_board_id
  where card_id = p_card_id;

  update orbit.comments
  set board_id = p_target_board_id
  where card_id = p_card_id;

  update orbit.checklists
  set board_id = p_target_board_id
  where card_id = p_card_id;

  update orbit.attachments
  set board_id = p_target_board_id
  where card_id = p_card_id;

  update orbit.card_watches
  set board_id = p_target_board_id
  where card_id = p_card_id;

  update orbit.card_recurrence
  set board_id = p_target_board_id
  where card_id = p_card_id;

  update orbit.card_github_links
  set board_id = p_target_board_id
  where card_id = p_card_id;

  update orbit.cards
  set
    board_id = p_target_board_id,
    column_id = p_target_column_id,
    number = v_number,
    rank = p_rank,
    version = version + 1,
    completed_at = case
      when exists (
        select 1 from orbit.columns column_row
        where column_row.id = p_target_column_id and column_row.category = 'done'
      ) then coalesce(completed_at, now())
      else null
    end
  where id = p_card_id and version = p_expected_version;

  if not found then
    raise exception 'stale card version' using errcode = '40001';
  end if;

  insert into orbit.activity_events (
    workspace_id, board_id, card_id, actor_id, event_type, safe_metadata
  )
  values (
    v_workspace_id, p_target_board_id, p_card_id, v_user_id, 'card.moved',
    jsonb_build_object(
      'source_board_id', v_source_board_id,
      'target_board_id', p_target_board_id,
      'target_column_id', p_target_column_id
    )
  );

  perform orbit_private.queue_webhook_event(v_workspace_id, 'card.moved', jsonb_build_object(
    'board_id', p_target_board_id,
    'card_id', p_card_id,
    'source_board_id', v_source_board_id,
    'target_column_id', p_target_column_id
  ));
end;
$$;

create or replace function orbit.update_github_link_metadata(
  p_link_id uuid,
  p_issue_title text,
  p_issue_state text
)
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
  update orbit.card_github_links
  set issue_title = coalesce(p_issue_title, issue_title),
      issue_state = coalesce(p_issue_state, issue_state)
  where id = p_link_id;
end;
$$;

create or replace function orbit.process_pending_workspace_purges(p_limit integer default 5)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_workspace orbit.workspaces%rowtype;
  v_count integer := 0;
  v_limit integer := greatest(coalesce(p_limit, 5), 1);
begin
  for v_workspace in
    select *
    from orbit.workspaces
    where lifecycle = 'pending_deletion'
      and deletion_requested_at is not null
      and deletion_requested_at <= now() - interval '30 days'
    order by deletion_requested_at
    limit v_limit
    for update skip locked
  loop
    delete from orbit.workspaces where id = v_workspace.id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function orbit.process_expired_trashed_cards(p_limit integer default 100)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_card_id uuid;
  v_count integer := 0;
  v_limit integer := greatest(coalesce(p_limit, 100), 1);
begin
  for v_card_id in
    select id
    from orbit.cards
    where deleted_at is not null
      and deleted_at <= now() - interval '30 days'
    order by deleted_at
    limit v_limit
    for update skip locked
  loop
    delete from orbit.cards where id = v_card_id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function orbit.claim_webhook_deliveries(integer) from public, anon, authenticated;
grant execute on function orbit.claim_webhook_deliveries(integer) to service_role;

revoke all on function orbit.finalize_webhook_delivery(uuid, boolean, integer, text) from public, anon, authenticated;
grant execute on function orbit.finalize_webhook_delivery(uuid, boolean, integer, text) to service_role;

revoke all on function orbit.process_pending_workspace_purges(integer) from public, anon, authenticated;
grant execute on function orbit.process_pending_workspace_purges(integer) to service_role;

revoke all on function orbit.process_expired_trashed_cards(integer) from public, anon, authenticated;
grant execute on function orbit.process_expired_trashed_cards(integer) to service_role;

grant execute on function orbit.list_webhook_deliveries(uuid, integer) to authenticated;
grant execute on function orbit.list_workspace_export_jobs(uuid) to authenticated;
grant execute on function orbit.get_workspace_export_manifest(uuid) to authenticated;
grant execute on function orbit.move_card_to_board(uuid, uuid, uuid, text, integer) to authenticated;
grant execute on function orbit.update_github_link_metadata(uuid, text, text) to authenticated;

commit;
