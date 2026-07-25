begin;

create or replace function jg_app.record_game_hub_action(
  p_session_id uuid,
  p_participant_id uuid,
  p_move_number integer,
  p_move_payload jsonb,
  p_resulting_state jsonb,
  p_next_turn_participant_id uuid,
  p_winner_participant_id uuid,
  p_session_status jg_app.game_hub_session_status,
  p_completed_at timestamptz,
  p_result_outcome text default null,
  p_result_winner_participant_id uuid default null,
  p_result_summary jsonb default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_session jg_app.game_hub_sessions%rowtype;
  next_move_number integer;
begin
  select *
  into current_session
  from jg_app.game_hub_sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Game session not found';
  end if;

  if current_session.status <> 'active'::jg_app.game_hub_session_status then
    raise exception using errcode = '40001', message = 'Game session is no longer active';
  end if;

  if not exists (
    select 1
    from jg_app.game_hub_session_participants
    where id = p_participant_id
      and session_id = p_session_id
      and left_at is null
  ) then
    raise exception using errcode = '42501', message = 'Participant is not active in this session';
  end if;

  if p_next_turn_participant_id is not null and not exists (
    select 1
    from jg_app.game_hub_session_participants
    where id = p_next_turn_participant_id
      and session_id = p_session_id
      and left_at is null
  ) then
    raise exception using errcode = '23503', message = 'Next participant does not belong to this session';
  end if;

  if p_winner_participant_id is not null and not exists (
    select 1
    from jg_app.game_hub_session_participants
    where id = p_winner_participant_id
      and session_id = p_session_id
  ) then
    raise exception using errcode = '23503', message = 'Winner does not belong to this session';
  end if;

  if p_result_winner_participant_id is not null and not exists (
    select 1
    from jg_app.game_hub_session_participants
    where id = p_result_winner_participant_id
      and session_id = p_session_id
  ) then
    raise exception using errcode = '23503', message = 'Result winner does not belong to this session';
  end if;

  select coalesce(max(move_number), 0) + 1
  into next_move_number
  from jg_app.game_hub_session_moves
  where session_id = p_session_id;

  if p_move_number <> next_move_number then
    raise exception using
      errcode = '40001',
      message = 'Game state changed before this action was committed';
  end if;

  insert into jg_app.game_hub_session_moves (
    session_id,
    participant_id,
    move_number,
    move_payload,
    resulting_state
  )
  values (
    p_session_id,
    p_participant_id,
    p_move_number,
    p_move_payload,
    p_resulting_state
  );

  if p_result_outcome is not null then
    insert into jg_app.game_hub_session_results (
      session_id,
      winner_participant_id,
      outcome,
      summary
    )
    values (
      p_session_id,
      p_result_winner_participant_id,
      p_result_outcome,
      coalesce(p_result_summary, '{}'::jsonb)
    )
    on conflict (session_id) do update
      set winner_participant_id = excluded.winner_participant_id,
          outcome = excluded.outcome,
          summary = excluded.summary;
  end if;

  update jg_app.game_hub_sessions
  set state = p_resulting_state,
      current_turn_participant_id = p_next_turn_participant_id,
      winner_participant_id = p_winner_participant_id,
      status = p_session_status,
      completed_at = p_completed_at
  where id = p_session_id;

  return p_move_number;
end;
$$;

revoke all
  on function jg_app.record_game_hub_action(
    uuid,
    uuid,
    integer,
    jsonb,
    jsonb,
    uuid,
    uuid,
    jg_app.game_hub_session_status,
    timestamptz,
    text,
    uuid,
    jsonb
  )
  from public, anon, authenticated;

grant execute
  on function jg_app.record_game_hub_action(
    uuid,
    uuid,
    integer,
    jsonb,
    jsonb,
    uuid,
    uuid,
    jg_app.game_hub_session_status,
    timestamptz,
    text,
    uuid,
    jsonb
  )
  to service_role;

commit;
