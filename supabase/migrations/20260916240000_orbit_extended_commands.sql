begin;

alter table orbit_private.upload_reservations
  add column if not exists original_name text,
  add column if not exists mime text;

create policy card_assignees_select_reader
  on orbit.card_assignees for select to authenticated
  using (orbit_private.can_read_board(board_id));

create policy card_labels_select_reader
  on orbit.card_labels for select to authenticated
  using (orbit_private.can_read_board(board_id));

create policy attachments_select_reader
  on orbit.attachments for select to authenticated
  using (
    orbit_private.can_read_board(board_id)
    and status = 'ready'
    and deleted_at is null
  );

create or replace function orbit.update_card(
  p_card_id uuid,
  p_title text default null,
  p_description text default null,
  p_priority orbit.card_priority default null,
  p_due_date date default null,
  p_expected_version integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_board_id uuid;
begin
  perform orbit_private.require_orbit_access();

  select board_id into v_board_id
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
    title = coalesce(nullif(trim(p_title), ''), title),
    description = case
      when p_description is null then description
      else nullif(trim(p_description), '')
    end,
    priority = coalesce(p_priority, priority),
    due_date = coalesce(p_due_date, due_date),
    version = version + 1
  where id = p_card_id
    and (p_expected_version is null or version = p_expected_version);

  if not found then
    raise exception 'stale card version' using errcode = '40001';
  end if;
end;
$$;

revoke all on function orbit.update_card(uuid, text, text, orbit.card_priority, date, integer)
  from public, anon;
grant execute on function orbit.update_card(uuid, text, text, orbit.card_priority, date, integer)
  to authenticated;

create or replace function orbit.trash_card(
  p_card_id uuid,
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
begin
  perform orbit_private.require_orbit_access();

  select board_id into v_board_id
  from orbit.cards
  where id = p_card_id and deleted_at is null;

  if v_board_id is null then
    raise exception 'card not found' using errcode = 'P0002';
  end if;

  if not orbit_private.can_edit_board(v_board_id, v_user_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;

  update orbit.cards
  set deleted_at = now(), version = version + 1
  where id = p_card_id and version = p_expected_version;

  if not found then
    raise exception 'stale card version' using errcode = '40001';
  end if;
end;
$$;

revoke all on function orbit.trash_card(uuid, integer) from public, anon;
grant execute on function orbit.trash_card(uuid, integer) to authenticated;

create or replace function orbit.archive_card(
  p_card_id uuid,
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
begin
  perform orbit_private.require_orbit_access();

  select board_id into v_board_id
  from orbit.cards
  where id = p_card_id and deleted_at is null;

  if v_board_id is null then
    raise exception 'card not found' using errcode = 'P0002';
  end if;

  if not orbit_private.can_edit_board(v_board_id, v_user_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;

  update orbit.cards
  set archived_at = now(), version = version + 1
  where id = p_card_id and version = p_expected_version;

  if not found then
    raise exception 'stale card version' using errcode = '40001';
  end if;
end;
$$;

revoke all on function orbit.archive_card(uuid, integer) from public, anon;
grant execute on function orbit.archive_card(uuid, integer) to authenticated;

create or replace function orbit.create_label(
  p_workspace_id uuid,
  p_name text,
  p_color_token text default 'slate'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_label_id uuid;
begin
  perform orbit_private.require_orbit_access();

  if not orbit_private.is_active_workspace_member(p_workspace_id, v_user_id) then
    raise exception 'workspace membership required' using errcode = '42501';
  end if;

  insert into orbit.labels (workspace_id, name, color_token)
  values (p_workspace_id, trim(p_name), coalesce(nullif(trim(p_color_token), ''), 'slate'))
  returning id into v_label_id;

  return v_label_id;
end;
$$;

revoke all on function orbit.create_label(uuid, text, text) from public, anon;
grant execute on function orbit.create_label(uuid, text, text) to authenticated;

create or replace function orbit.toggle_card_label(
  p_card_id uuid,
  p_label_id uuid,
  p_attach boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
  v_board_id uuid;
begin
  perform orbit_private.require_orbit_access();

  select workspace_id, board_id into v_workspace_id, v_board_id
  from orbit.cards
  where id = p_card_id and deleted_at is null;

  if v_board_id is null then
    raise exception 'card not found' using errcode = 'P0002';
  end if;

  if not orbit_private.can_edit_board(v_board_id, v_user_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;

  if p_attach then
    insert into orbit.card_labels (workspace_id, board_id, card_id, label_id)
    values (v_workspace_id, v_board_id, p_card_id, p_label_id)
    on conflict (card_id, label_id) do nothing;
  else
    delete from orbit.card_labels
    where card_id = p_card_id and label_id = p_label_id;
  end if;
end;
$$;

revoke all on function orbit.toggle_card_label(uuid, uuid, boolean) from public, anon;
grant execute on function orbit.toggle_card_label(uuid, uuid, boolean) to authenticated;

create or replace function orbit.set_card_assignee(
  p_card_id uuid,
  p_user_id uuid,
  p_attach boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
  v_board_id uuid;
begin
  perform orbit_private.require_orbit_access();

  select workspace_id, board_id into v_workspace_id, v_board_id
  from orbit.cards
  where id = p_card_id and deleted_at is null;

  if v_board_id is null then
    raise exception 'card not found' using errcode = 'P0002';
  end if;

  if not orbit_private.can_edit_board(v_board_id, v_actor_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;

  if p_attach then
    insert into orbit.card_assignees (
      workspace_id, board_id, card_id, user_id, assigned_by
    )
    values (v_workspace_id, v_board_id, p_card_id, p_user_id, v_actor_id)
    on conflict (card_id, user_id) do nothing;
  else
    delete from orbit.card_assignees
    where card_id = p_card_id and user_id = p_user_id;
  end if;
end;
$$;

revoke all on function orbit.set_card_assignee(uuid, uuid, boolean) from public, anon;
grant execute on function orbit.set_card_assignee(uuid, uuid, boolean) to authenticated;

create or replace function orbit.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();

  update orbit.notifications
  set read_at = coalesce(read_at, now())
  where id = p_notification_id
    and recipient_id = v_user_id;

  if not found then
    raise exception 'notification not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function orbit.mark_notification_read(uuid) from public, anon;
grant execute on function orbit.mark_notification_read(uuid) to authenticated;

create or replace function orbit.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_count integer;
begin
  perform orbit_private.require_orbit_access();

  update orbit.notifications
  set read_at = now()
  where recipient_id = v_user_id
    and read_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function orbit.mark_all_notifications_read() from public, anon;
grant execute on function orbit.mark_all_notifications_read() to authenticated;

create or replace function orbit.reserve_attachment_upload(
  p_card_id uuid,
  p_original_name text,
  p_mime text,
  p_bytes bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
  v_board_id uuid;
  v_reservation_id uuid;
  v_object_key text;
begin
  perform orbit_private.require_orbit_access();

  if p_bytes <= 0 or p_bytes > 10485760 then
    raise exception 'invalid upload size' using errcode = '22023';
  end if;

  select workspace_id, board_id into v_workspace_id, v_board_id
  from orbit.cards
  where id = p_card_id and deleted_at is null;

  if v_board_id is null then
    raise exception 'card not found' using errcode = 'P0002';
  end if;

  if not orbit_private.can_edit_board(v_board_id, v_user_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;

  v_object_key := v_user_id::text || '/' || foundation.uuid_v7()::text || '/' ||
    regexp_replace(trim(p_original_name), '[^a-zA-Z0-9._-]', '_', 'g');

  insert into orbit_private.upload_reservations (
    workspace_id,
    board_id,
    card_id,
    uploader_id,
    object_key,
    original_name,
    mime,
    reserved_bytes,
    expires_at
  )
  values (
    v_workspace_id,
    v_board_id,
    p_card_id,
    v_user_id,
    v_object_key,
    trim(p_original_name),
    trim(p_mime),
    p_bytes,
    now() + interval '15 minutes'
  )
  returning id into v_reservation_id;

  return jsonb_build_object(
    'reservation_id', v_reservation_id,
    'object_key', v_object_key,
    'bucket', 'orbit-attachments'
  );
end;
$$;

revoke all on function orbit.reserve_attachment_upload(uuid, text, text, bigint)
  from public, anon;
grant execute on function orbit.reserve_attachment_upload(uuid, text, text, bigint)
  to authenticated;

create or replace function orbit.finalize_attachment_upload(
  p_reservation_id uuid,
  p_checksum text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_reservation orbit_private.upload_reservations%rowtype;
  v_attachment_id uuid;
begin
  perform orbit_private.require_orbit_access();

  select * into v_reservation
  from orbit_private.upload_reservations
  where id = p_reservation_id
    and uploader_id = v_user_id
    and status = 'reserved'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'reservation invalid or expired' using errcode = 'P0002';
  end if;

  insert into orbit.attachments (
    workspace_id,
    board_id,
    card_id,
    uploader_id,
    object_key,
    original_name,
    mime,
    bytes,
    checksum,
    status
  )
  values (
    v_reservation.workspace_id,
    v_reservation.board_id,
    v_reservation.card_id,
    v_user_id,
    v_reservation.object_key,
    coalesce(v_reservation.original_name, 'attachment'),
    coalesce(v_reservation.mime, 'application/octet-stream'),
    v_reservation.reserved_bytes,
    p_checksum,
    'ready'
  )
  returning id into v_attachment_id;

  update orbit_private.upload_reservations
  set status = 'finalized'
  where id = p_reservation_id;

  return v_attachment_id;
end;
$$;

revoke all on function orbit.finalize_attachment_upload(uuid, text) from public, anon;
grant execute on function orbit.finalize_attachment_upload(uuid, text) to authenticated;

commit;
