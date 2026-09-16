begin;

create or replace function orbit_private.can_manage_board(
  p_board_id uuid,
  p_user_id uuid default orbit_private.current_user_id()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from orbit.boards board
    where board.id = p_board_id
      and board.lifecycle = 'active'
      and (
        orbit_private.is_workspace_admin(board.workspace_id, p_user_id)
        or exists (
          select 1
          from orbit.board_members board_member
          where board_member.board_id = board.id
            and board_member.user_id = p_user_id
            and board_member.role = 'manager'
        )
        or (
          board.visibility = 'workspace'
          and exists (
            select 1
            from orbit.workspace_members member
            where member.workspace_id = board.workspace_id
              and member.user_id = p_user_id
              and member.status = 'active'
              and member.role in ('admin', 'member')
          )
          and not exists (
            select 1
            from orbit.board_members board_member
            where board_member.board_id = board.id
              and board_member.user_id = p_user_id
          )
        )
      )
  );
$$;

revoke all on function orbit_private.can_manage_board(uuid, uuid) from public, anon;
grant execute on function orbit_private.can_manage_board(uuid, uuid)
  to authenticated, service_role;

create or replace function orbit_private.notify_card_event(
  p_recipient_id uuid,
  p_workspace_id uuid,
  p_board_id uuid,
  p_card_id uuid,
  p_event_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_recipient_id is null or p_recipient_id = orbit_private.current_user_id() then
    return;
  end if;

  insert into orbit.notifications (
    recipient_id,
    workspace_id,
    board_id,
    subject_type,
    subject_id,
    event_id,
    reason
  )
  values (
    p_recipient_id,
    p_workspace_id,
    p_board_id,
    'card',
    p_card_id,
    p_event_id,
    p_reason
  )
  on conflict (recipient_id, event_id, reason) do nothing;
end;
$$;

revoke all on function orbit_private.notify_card_event(uuid, uuid, uuid, uuid, uuid, text)
  from public, anon;
grant execute on function orbit_private.notify_card_event(uuid, uuid, uuid, uuid, uuid, text)
  to authenticated, service_role;

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
  v_event_id uuid;
  v_card_title text;
begin
  perform orbit_private.require_orbit_access();

  select workspace_id, board_id, title
  into v_workspace_id, v_board_id, v_card_title
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

    insert into orbit.activity_events (
      workspace_id, board_id, card_id, actor_id, event_type, safe_metadata
    )
    values (
      v_workspace_id,
      v_board_id,
      p_card_id,
      v_actor_id,
      'card.assigned',
      jsonb_build_object('assignee_id', p_user_id)
    )
    returning id into v_event_id;

    perform orbit_private.notify_card_event(
      p_user_id,
      v_workspace_id,
      v_board_id,
      p_card_id,
      v_event_id,
      'Assigned to ' || coalesce(v_card_title, 'a card')
    );
  else
    delete from orbit.card_assignees
    where card_id = p_card_id and user_id = p_user_id;
  end if;
end;
$$;

create or replace function orbit.add_comment(
  p_card_id uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_comment_id uuid;
  v_workspace_id uuid;
  v_board_id uuid;
  v_event_id uuid;
  v_card_title text;
  v_assignee record;
begin
  perform orbit_private.require_orbit_access();

  select workspace_id, board_id, title
  into v_workspace_id, v_board_id, v_card_title
  from orbit.cards
  where id = p_card_id and deleted_at is null;

  if v_board_id is null then
    raise exception 'card not found' using errcode = 'P0002';
  end if;

  if not orbit_private.can_read_board(v_board_id, v_user_id) then
    raise exception 'board read access required' using errcode = '42501';
  end if;

  insert into orbit.comments (
    workspace_id, board_id, card_id, author_id, body
  )
  values (v_workspace_id, v_board_id, p_card_id, v_user_id, trim(p_body))
  returning id into v_comment_id;

  insert into orbit.activity_events (
    workspace_id, board_id, card_id, actor_id, event_type, safe_metadata
  )
  values (
    v_workspace_id,
    v_board_id,
    p_card_id,
    v_user_id,
    'comment.created',
    jsonb_build_object('comment_id', v_comment_id)
  )
  returning id into v_event_id;

  for v_assignee in
    select user_id
    from orbit.card_assignees
    where card_id = p_card_id
  loop
    perform orbit_private.notify_card_event(
      v_assignee.user_id,
      v_workspace_id,
      v_board_id,
      p_card_id,
      v_event_id,
      'New comment on ' || coalesce(v_card_title, 'a card')
    );
  end loop;

  return v_comment_id;
end;
$$;

create or replace function orbit.update_board(
  p_board_id uuid,
  p_name text default null,
  p_description text default null,
  p_visibility orbit.board_visibility default null,
  p_expected_revision integer default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform orbit_private.require_orbit_access();

  if not orbit_private.can_manage_board(p_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;

  update orbit.boards
  set
    name = coalesce(nullif(trim(p_name), ''), name),
    description = case
      when p_description is null then description
      else nullif(trim(p_description), '')
    end,
    visibility = coalesce(p_visibility, visibility),
    revision = revision + 1
  where id = p_board_id
    and lifecycle = 'active'
    and (p_expected_revision is null or revision = p_expected_revision);

  if not found then
    raise exception 'stale board revision' using errcode = '40001';
  end if;
end;
$$;

revoke all on function orbit.update_board(uuid, text, text, orbit.board_visibility, integer)
  from public, anon;
grant execute on function orbit.update_board(uuid, text, text, orbit.board_visibility, integer)
  to authenticated;

create or replace function orbit.archive_board(p_board_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.can_manage_board(p_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;

  update orbit.boards
  set lifecycle = 'archived', revision = revision + 1
  where id = p_board_id and lifecycle = 'active';
end;
$$;

revoke all on function orbit.archive_board(uuid) from public, anon;
grant execute on function orbit.archive_board(uuid) to authenticated;

create or replace function orbit.trash_board(p_board_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.can_manage_board(p_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;

  update orbit.boards
  set lifecycle = 'trashed', revision = revision + 1
  where id = p_board_id and lifecycle in ('active', 'archived');
end;
$$;

revoke all on function orbit.trash_board(uuid) from public, anon;
grant execute on function orbit.trash_board(uuid) to authenticated;

create or replace function orbit.restore_board(p_board_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.can_manage_board(p_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;

  update orbit.boards
  set lifecycle = 'active', revision = revision + 1
  where id = p_board_id and lifecycle in ('archived', 'trashed');
end;
$$;

revoke all on function orbit.restore_board(uuid) from public, anon;
grant execute on function orbit.restore_board(uuid) to authenticated;

create or replace function orbit.toggle_board_favorite(
  p_board_id uuid,
  p_favorite boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
begin
  perform orbit_private.require_orbit_access();

  select workspace_id into v_workspace_id
  from orbit.boards
  where id = p_board_id;

  if v_workspace_id is null then
    raise exception 'board not found' using errcode = 'P0002';
  end if;

  if not orbit_private.can_read_board(p_board_id, v_user_id) then
    raise exception 'board read access required' using errcode = '42501';
  end if;

  if p_favorite then
    insert into orbit.board_favorites (workspace_id, board_id, user_id)
    values (v_workspace_id, p_board_id, v_user_id)
    on conflict (board_id, user_id) do nothing;
  else
    delete from orbit.board_favorites
    where board_id = p_board_id and user_id = v_user_id;
  end if;
end;
$$;

revoke all on function orbit.toggle_board_favorite(uuid, boolean) from public, anon;
grant execute on function orbit.toggle_board_favorite(uuid, boolean) to authenticated;

create or replace function orbit.create_column(
  p_board_id uuid,
  p_name text,
  p_category orbit.column_category default 'active'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_column_id uuid;
  v_workspace_id uuid;
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.can_manage_board(p_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;

  select workspace_id into v_workspace_id from orbit.boards where id = p_board_id;

  insert into orbit.columns (workspace_id, board_id, name, category, rank)
  values (v_workspace_id, p_board_id, trim(p_name), p_category, 'z' || foundation.uuid_v7()::text)
  returning id into v_column_id;

  return v_column_id;
end;
$$;

revoke all on function orbit.create_column(uuid, text, orbit.column_category) from public, anon;
grant execute on function orbit.create_column(uuid, text, orbit.column_category) to authenticated;

create or replace function orbit.update_column(
  p_column_id uuid,
  p_name text default null,
  p_category orbit.column_category default null
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

  select board_id into v_board_id from orbit.columns where id = p_column_id;
  if v_board_id is null then
    raise exception 'column not found' using errcode = 'P0002';
  end if;

  if not orbit_private.can_manage_board(v_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;

  update orbit.columns
  set
    name = coalesce(nullif(trim(p_name), ''), name),
    category = coalesce(p_category, category)
  where id = p_column_id;
end;
$$;

revoke all on function orbit.update_column(uuid, text, orbit.column_category) from public, anon;
grant execute on function orbit.update_column(uuid, text, orbit.column_category) to authenticated;

create or replace function orbit.delete_column(
  p_column_id uuid,
  p_destination_column_id uuid
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

  select board_id into v_board_id from orbit.columns where id = p_column_id;
  if v_board_id is null then
    raise exception 'column not found' using errcode = 'P0002';
  end if;

  if not orbit_private.can_manage_board(v_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;

  if p_destination_column_id = p_column_id then
    raise exception 'destination must differ' using errcode = '22023';
  end if;

  update orbit.cards
  set column_id = p_destination_column_id, version = version + 1
  where column_id = p_column_id;

  delete from orbit.columns where id = p_column_id;
end;
$$;

revoke all on function orbit.delete_column(uuid, uuid) from public, anon;
grant execute on function orbit.delete_column(uuid, uuid) to authenticated;

create or replace function orbit.restore_card(
  p_card_id uuid
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

  select board_id into v_board_id from orbit.cards where id = p_card_id;
  if v_board_id is null then
    raise exception 'card not found' using errcode = 'P0002';
  end if;

  if not orbit_private.can_edit_board(v_board_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;

  update orbit.cards
  set deleted_at = null, archived_at = null, version = version + 1
  where id = p_card_id;
end;
$$;

revoke all on function orbit.restore_card(uuid) from public, anon;
grant execute on function orbit.restore_card(uuid) to authenticated;

create or replace function orbit.unarchive_card(
  p_card_id uuid,
  p_expected_version integer
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

  select board_id into v_board_id
  from orbit.cards
  where id = p_card_id and deleted_at is null;

  if v_board_id is null then
    raise exception 'card not found' using errcode = 'P0002';
  end if;

  if not orbit_private.can_edit_board(v_board_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;

  update orbit.cards
  set archived_at = null, version = version + 1
  where id = p_card_id
    and version = p_expected_version;
end;
$$;

revoke all on function orbit.unarchive_card(uuid, integer) from public, anon;
grant execute on function orbit.unarchive_card(uuid, integer) to authenticated;

create or replace function orbit.update_workspace_member(
  p_workspace_id uuid,
  p_user_id uuid,
  p_role orbit.workspace_member_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();

  if not orbit_private.is_workspace_admin(p_workspace_id, v_actor_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;

  if exists (
    select 1 from orbit.workspaces
    where id = p_workspace_id and owner_user_id = p_user_id
  ) then
    raise exception 'owner role cannot be changed here' using errcode = '42501';
  end if;

  update orbit.workspace_members
  set role = p_role
  where workspace_id = p_workspace_id
    and user_id = p_user_id
    and status = 'active';
end;
$$;

revoke all on function orbit.update_workspace_member(uuid, uuid, orbit.workspace_member_role)
  from public, anon;
grant execute on function orbit.update_workspace_member(uuid, uuid, orbit.workspace_member_role)
  to authenticated;

create or replace function orbit.remove_workspace_member(
  p_workspace_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();

  if not orbit_private.is_workspace_admin(p_workspace_id, v_actor_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;

  if exists (
    select 1 from orbit.workspaces
    where id = p_workspace_id and owner_user_id = p_user_id
  ) then
    raise exception 'owner cannot be removed' using errcode = '42501';
  end if;

  update orbit.workspace_members
  set status = 'removed', removed_at = now()
  where workspace_id = p_workspace_id
    and user_id = p_user_id;

  delete from orbit.card_assignees where user_id = p_user_id and workspace_id = p_workspace_id;
end;
$$;

revoke all on function orbit.remove_workspace_member(uuid, uuid) from public, anon;
grant execute on function orbit.remove_workspace_member(uuid, uuid) to authenticated;

create policy cards_select_trashed
  on orbit.cards for select to authenticated
  using (
    orbit_private.can_edit_board(board_id)
    and deleted_at is not null
  );

create policy board_favorites_select_self
  on orbit.board_favorites for select to authenticated
  using (user_id = (select auth.uid()));

commit;
