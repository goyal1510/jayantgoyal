begin;

create or replace function orbit.move_card(
  p_card_id uuid,
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
  v_board_id uuid;
  v_workspace_id uuid;
begin
  perform orbit_private.require_orbit_access();

  select board_id, workspace_id into v_board_id, v_workspace_id
  from orbit.cards
  where id = p_card_id and deleted_at is null;

  if v_board_id is null then
    raise exception 'card not found' using errcode = 'P0002';
  end if;

  if not orbit_private.can_edit_board(v_board_id, v_user_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;

  update orbit.cards
  set
    column_id = p_target_column_id,
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
    v_workspace_id, v_board_id, p_card_id, v_user_id, 'card.moved',
    jsonb_build_object('target_column_id', p_target_column_id)
  );

  perform orbit_private.queue_webhook_event(v_workspace_id, 'card.moved', jsonb_build_object(
    'board_id', v_board_id, 'card_id', p_card_id, 'target_column_id', p_target_column_id
  ));
end;
$$;

create or replace function orbit_private.queue_webhook_event(
  p_workspace_id uuid,
  p_event_type text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into orbit_private.webhook_deliveries (subscription_id, event_type, payload)
  select s.id, p_event_type, p_payload
  from orbit_private.webhook_subscriptions s
  where s.workspace_id = p_workspace_id
    and s.enabled
    and p_event_type = any (s.events);
end;
$$;

revoke all on function orbit_private.queue_webhook_event(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function orbit_private.queue_webhook_event(uuid, text, jsonb) to service_role;

create or replace function orbit_private.process_due_recurrences()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row orbit.card_recurrence%rowtype;
  v_count integer := 0;
  v_column_id uuid;
  v_title text;
  v_number integer;
  v_new_card_id uuid;
  v_occurrence timestamptz;
begin
  for v_row in
    select cr.*
    from orbit.card_recurrence cr
    join orbit.boards b on b.id = cr.board_id and b.lifecycle = 'active'
    where cr.active and cr.next_run_at <= now()
    for update of cr skip locked
  loop
    v_occurrence := v_row.next_run_at;
    if exists (
      select 1 from orbit_private.recurrence_occurrences
      where recurrence_id = v_row.id and occurrence_at = v_occurrence
    ) then
      update orbit.card_recurrence
      set next_run_at = next_run_at + (
        case v_row.cadence
          when 'weekly' then make_interval(days => 7 * v_row.interval_count)
          when 'monthly' then make_interval(days => 30 * v_row.interval_count)
          else make_interval(days => v_row.interval_count)
        end
      )
      where id = v_row.id;
      continue;
    end if;

    select column_id, title into v_column_id, v_title
    from orbit.cards where id = v_row.card_id;

    update orbit_private.board_sequences
    set next_number = next_number + 1
    where board_id = v_row.board_id
    returning next_number - 1 into v_number;

    insert into orbit.cards (
      workspace_id, board_id, column_id, number, title, created_by
    )
    values (
      v_row.workspace_id,
      v_row.board_id,
      v_column_id,
      v_number,
      coalesce(v_row.title_template, v_title || ' (recurring)'),
      v_row.created_by
    )
    returning id into v_new_card_id;

    insert into orbit_private.recurrence_occurrences (recurrence_id, occurrence_at, card_id)
    values (v_row.id, v_occurrence, v_new_card_id);

    update orbit.card_recurrence
    set next_run_at = next_run_at + (
      case v_row.cadence
        when 'weekly' then make_interval(days => 7 * v_row.interval_count)
        when 'monthly' then make_interval(days => 30 * v_row.interval_count)
        else make_interval(days => v_row.interval_count)
      end
    )
    where id = v_row.id;

    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function orbit.process_pending_automation_events(p_limit integer default 50)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event orbit.activity_events%rowtype;
  v_rule orbit.automation_rules%rowtype;
  v_count integer := 0;
  v_label_id uuid;
begin
  for v_event in
    select *
    from orbit.activity_events
    where event_type = 'card.moved'
      and created_at >= now() - interval '1 day'
    order by created_at desc
    limit greatest(p_limit, 1)
  loop
    for v_rule in
      select * from orbit.automation_rules
      where board_id = v_event.board_id and enabled and trigger_type = 'card_moved'
    loop
      if exists (
        select 1 from orbit_private.automation_runs
        where rule_id = v_rule.id and detail->>'event_id' = v_event.id::text
      ) then
        continue;
      end if;

      if (v_rule.trigger_config->>'column_id') is not null
        and (v_rule.trigger_config->>'column_id') <> (v_event.safe_metadata->>'target_column_id') then
        continue;
      end if;

      if v_rule.action_type = 'set_label' then
        v_label_id := (v_rule.action_config->>'label_id')::uuid;
        if v_label_id is not null then
          insert into orbit.card_labels (workspace_id, board_id, card_id, label_id)
          select c.workspace_id, c.board_id, c.id, v_label_id
          from orbit.cards c where c.id = v_event.card_id
          on conflict do nothing;
        end if;
      elsif v_rule.action_type = 'add_comment' then
        insert into orbit.comments (workspace_id, board_id, card_id, author_id, body)
        select c.workspace_id, c.board_id, c.id, v_rule.created_by, coalesce(v_rule.action_config->>'body', 'Automation note')
        from orbit.cards c where c.id = v_event.card_id;
      end if;

      insert into orbit_private.automation_runs (rule_id, card_id, status, detail)
      values (v_rule.id, v_event.card_id, 'completed', jsonb_build_object('event_id', v_event.id));
      v_count := v_count + 1;
    end loop;
  end loop;
  return v_count;
end;
$$;

revoke all on function orbit.process_pending_automation_events(integer) from public, anon, authenticated;
grant execute on function orbit.process_pending_automation_events(integer) to service_role;

create or replace function orbit.process_pending_webhook_deliveries(p_limit integer default 25)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delivery orbit_private.webhook_deliveries%rowtype;
  v_count integer := 0;
begin
  for v_delivery in
    select * from orbit_private.webhook_deliveries
    where status = 'pending'
    order by created_at
    limit greatest(p_limit, 1)
    for update skip locked
  loop
    update orbit_private.webhook_deliveries
    set status = 'completed', attempts = attempts + 1, processed_at = now()
    where id = v_delivery.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function orbit.process_pending_webhook_deliveries(integer) from public, anon, authenticated;
grant execute on function orbit.process_pending_webhook_deliveries(integer) to service_role;

create or replace function orbit.process_pending_import_jobs(p_limit integer default 5)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job orbit_private.import_jobs%rowtype;
  v_count integer := 0;
  v_card jsonb;
  v_column_id uuid;
  v_created integer := 0;
  v_number integer;
begin
  for v_job in
    select * from orbit_private.import_jobs
    where status = 'pending'
    order by created_at
    limit greatest(p_limit, 1)
    for update skip locked
  loop
    update orbit_private.import_jobs set status = 'processing' where id = v_job.id;
    v_created := 0;

    select id into v_column_id
    from orbit.columns where board_id = v_job.board_id order by rank limit 1;

    for v_card in
      select * from jsonb_array_elements(coalesce(v_job.payload->'cards', '[]'::jsonb))
    loop
      if v_column_id is null then
        continue;
      end if;

      update orbit_private.board_sequences
      set next_number = next_number + 1
      where board_id = v_job.board_id
      returning next_number - 1 into v_number;

      insert into orbit.cards (
        workspace_id, board_id, column_id, number, title, created_by
      )
      values (
        v_job.workspace_id,
        v_job.board_id,
        v_column_id,
        v_number,
        coalesce(v_card->>'title', 'Imported card'),
        v_job.requester_id
      );
      v_created := v_created + 1;
    end loop;

    update orbit_private.import_jobs
    set status = 'ready',
        result = jsonb_build_object('imported_count', v_created),
        processed_at = now()
    where id = v_job.id;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function orbit.process_pending_import_jobs(integer) from public, anon, authenticated;
grant execute on function orbit.process_pending_import_jobs(integer) to service_role;

create or replace function orbit.verify_api_token(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row orbit_private.api_tokens%rowtype;
begin
  select * into v_row
  from orbit_private.api_tokens
  where token_hash = p_token_hash
    and revoked_at is null
    and (expires_at is null or expires_at > now());
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'token_id', v_row.id,
    'workspace_id', v_row.workspace_id,
    'user_id', v_row.user_id,
    'scopes', v_row.scopes
  );
end;
$$;

revoke all on function orbit.verify_api_token(text) from public, anon, authenticated;
grant execute on function orbit.verify_api_token(text) to service_role;

commit;
