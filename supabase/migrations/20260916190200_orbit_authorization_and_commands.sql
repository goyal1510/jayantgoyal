begin;

alter table orbit.cards add constraint cards_workspace_board_id_unique unique (workspace_id, board_id, id);
alter table orbit.labels add constraint labels_workspace_id_unique unique (workspace_id, id);

create or replace function orbit_private.current_user_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select auth.uid();
$$;

revoke all on function orbit_private.current_user_id() from public, anon;
grant execute on function orbit_private.current_user_id() to authenticated, service_role;

create or replace function orbit_private.require_orbit_access()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if orbit_private.current_user_id() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not iam_private.user_has_product_access(orbit_private.current_user_id(), 'orbit') then
    raise exception 'orbit access required' using errcode = '42501';
  end if;
end;
$$;

revoke all on function orbit_private.require_orbit_access() from public, anon;
grant execute on function orbit_private.require_orbit_access() to authenticated, service_role;

create or replace function orbit_private.is_active_workspace_member(
  p_workspace_id uuid,
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
    from orbit.workspace_members member
    where member.workspace_id = p_workspace_id
      and member.user_id = p_user_id
      and member.status = 'active'
  );
$$;

revoke all on function orbit_private.is_active_workspace_member(uuid, uuid)
  from public, anon;
grant execute on function orbit_private.is_active_workspace_member(uuid, uuid)
  to authenticated, service_role;

create or replace function orbit_private.is_workspace_admin(
  p_workspace_id uuid,
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
    from orbit.workspaces workspace
    join orbit.workspace_members member
      on member.workspace_id = workspace.id
     and member.user_id = p_user_id
     and member.status = 'active'
    where workspace.id = p_workspace_id
      and (
        workspace.owner_user_id = p_user_id
        or member.role = 'admin'
      )
  );
$$;

revoke all on function orbit_private.is_workspace_admin(uuid, uuid)
  from public, anon;
grant execute on function orbit_private.is_workspace_admin(uuid, uuid)
  to authenticated, service_role;

create or replace function orbit_private.can_read_board(
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
    join orbit.workspace_members member
      on member.workspace_id = board.workspace_id
     and member.user_id = p_user_id
     and member.status = 'active'
    where board.id = p_board_id
      and board.lifecycle in ('active', 'archived')
      and (
        orbit_private.is_workspace_admin(board.workspace_id, p_user_id)
        or (
          board.visibility = 'workspace'
          and member.role in ('admin', 'member', 'viewer')
        )
        or exists (
          select 1
          from orbit.board_members board_member
          where board_member.board_id = board.id
            and board_member.user_id = p_user_id
        )
      )
  );
$$;

revoke all on function orbit_private.can_read_board(uuid, uuid)
  from public, anon;
grant execute on function orbit_private.can_read_board(uuid, uuid)
  to authenticated, service_role;

create or replace function orbit_private.can_edit_board(
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
    join orbit.workspace_members member
      on member.workspace_id = board.workspace_id
     and member.user_id = p_user_id
     and member.status = 'active'
    where board.id = p_board_id
      and board.lifecycle = 'active'
      and (
        orbit_private.is_workspace_admin(board.workspace_id, p_user_id)
        or (
          board.visibility = 'workspace'
          and member.role in ('admin', 'member')
          and not exists (
            select 1
            from orbit.board_members board_member
            where board_member.board_id = board.id
              and board_member.user_id = p_user_id
              and board_member.role in ('viewer', 'commenter')
          )
        )
        or exists (
          select 1
          from orbit.board_members board_member
          where board_member.board_id = board.id
            and board_member.user_id = p_user_id
            and board_member.role in ('manager', 'editor')
        )
      )
  );
$$;

revoke all on function orbit_private.can_edit_board(uuid, uuid)
  from public, anon;
grant execute on function orbit_private.can_edit_board(uuid, uuid)
  to authenticated, service_role;

create or replace function orbit.create_workspace(
  p_name text,
  p_description text default null,
  p_idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
begin
  perform orbit_private.require_orbit_access();

  if not iam_private.user_has_capability(v_user_id, 'orbit.workspace.create') then
    raise exception 'workspace creation not permitted' using errcode = '42501';
  end if;

  insert into orbit.workspaces (name, description, owner_user_id)
  values (trim(p_name), nullif(trim(coalesce(p_description, '')), ''), v_user_id)
  returning id into v_workspace_id;

  insert into orbit.workspace_members (workspace_id, user_id, role, status)
  values (v_workspace_id, v_user_id, 'admin', 'active');

  insert into orbit.activity_events (workspace_id, actor_id, event_type, safe_metadata)
  values (
    v_workspace_id,
    v_user_id,
    'workspace.created',
    jsonb_build_object('name', trim(p_name))
  );

  return v_workspace_id;
end;
$$;

revoke all on function orbit.create_workspace(text, text, text) from public, anon;
grant execute on function orbit.create_workspace(text, text, text) to authenticated;

create or replace function orbit.create_board(
  p_workspace_id uuid,
  p_name text,
  p_key text,
  p_visibility orbit.board_visibility default 'workspace'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_board_id uuid;
  v_todo_id uuid;
  v_progress_id uuid;
  v_review_id uuid;
  v_done_id uuid;
begin
  perform orbit_private.require_orbit_access();

  if not orbit_private.is_active_workspace_member(p_workspace_id, v_user_id) then
    raise exception 'workspace membership required' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from orbit.workspace_members
    where workspace_id = p_workspace_id
      and user_id = v_user_id
      and status = 'active'
      and role in ('admin', 'member')
  ) and not orbit_private.is_workspace_admin(p_workspace_id, v_user_id) then
    raise exception 'insufficient workspace role' using errcode = '42501';
  end if;

  insert into orbit.boards (
    workspace_id,
    key,
    name,
    visibility,
    created_by
  )
  values (
    p_workspace_id,
    upper(trim(p_key)),
    trim(p_name),
    p_visibility,
    v_user_id
  )
  returning id into v_board_id;

  insert into orbit_private.board_sequences (board_id) values (v_board_id);

  insert into orbit.columns (workspace_id, board_id, name, category, rank)
  values
    (p_workspace_id, v_board_id, 'To do', 'backlog', 'a0')
  returning id into v_todo_id;

  insert into orbit.columns (workspace_id, board_id, name, category, rank)
  values
    (p_workspace_id, v_board_id, 'In progress', 'active', 'a1')
  returning id into v_progress_id;

  insert into orbit.columns (workspace_id, board_id, name, category, rank)
  values
    (p_workspace_id, v_board_id, 'Review', 'active', 'a2')
  returning id into v_review_id;

  insert into orbit.columns (workspace_id, board_id, name, category, rank)
  values
    (p_workspace_id, v_board_id, 'Done', 'done', 'a3')
  returning id into v_done_id;

  update orbit.boards
  set default_done_column_id = v_done_id
  where id = v_board_id;

  insert into orbit.board_members (workspace_id, board_id, user_id, role)
  values (p_workspace_id, v_board_id, v_user_id, 'manager');

  insert into orbit.activity_events (
    workspace_id,
    board_id,
    actor_id,
    event_type,
    safe_metadata
  )
  values (
    p_workspace_id,
    v_board_id,
    v_user_id,
    'board.created',
    jsonb_build_object('name', trim(p_name), 'key', upper(trim(p_key)))
  );

  return v_board_id;
end;
$$;

revoke all on function orbit.create_board(uuid, text, text, orbit.board_visibility)
  from public, anon;
grant execute on function orbit.create_board(uuid, text, text, orbit.board_visibility)
  to authenticated;

create or replace function orbit.create_card(
  p_board_id uuid,
  p_column_id uuid,
  p_title text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_card_id uuid;
  v_workspace_id uuid;
  v_number integer;
begin
  perform orbit_private.require_orbit_access();

  if not orbit_private.can_edit_board(p_board_id, v_user_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;

  select workspace_id into v_workspace_id
  from orbit.boards
  where id = p_board_id;

  update orbit_private.board_sequences
  set next_number = next_number + 1
  where board_id = p_board_id
  returning next_number - 1 into v_number;

  insert into orbit.cards (
    workspace_id,
    board_id,
    column_id,
    number,
    title,
    created_by
  )
  values (
    v_workspace_id,
    p_board_id,
    p_column_id,
    v_number,
    trim(p_title),
    v_user_id
  )
  returning id into v_card_id;

  insert into orbit.activity_events (
    workspace_id,
    board_id,
    card_id,
    actor_id,
    event_type,
    safe_metadata
  )
  values (
    v_workspace_id,
    p_board_id,
    v_card_id,
    v_user_id,
    'card.created',
    jsonb_build_object('title', trim(p_title))
  );

  return v_card_id;
end;
$$;

revoke all on function orbit.create_card(uuid, uuid, text) from public, anon;
grant execute on function orbit.create_card(uuid, uuid, text) to authenticated;

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
begin
  perform orbit_private.require_orbit_access();

  select board_id into v_board_id
  from orbit.cards
  where id = p_card_id
    and deleted_at is null;

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
        select 1
        from orbit.columns column_row
        where column_row.id = p_target_column_id
          and column_row.category = 'done'
      ) then coalesce(completed_at, now())
      else null
    end
  where id = p_card_id
    and version = p_expected_version;

  if not found then
    raise exception 'stale card version' using errcode = '40001';
  end if;
end;
$$;

revoke all on function orbit.move_card(uuid, uuid, text, integer)
  from public, anon;
grant execute on function orbit.move_card(uuid, uuid, text, integer)
  to authenticated;

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
begin
  perform orbit_private.require_orbit_access();

  select workspace_id, board_id
  into v_workspace_id, v_board_id
  from orbit.cards
  where id = p_card_id
    and deleted_at is null;

  if v_board_id is null then
    raise exception 'card not found' using errcode = 'P0002';
  end if;

  if not orbit_private.can_read_board(v_board_id, v_user_id) then
    raise exception 'board read access required' using errcode = '42501';
  end if;

  insert into orbit.comments (
    workspace_id,
    board_id,
    card_id,
    author_id,
    body
  )
  values (
    v_workspace_id,
    v_board_id,
    p_card_id,
    v_user_id,
    trim(p_body)
  )
  returning id into v_comment_id;

  insert into orbit.activity_events (
    workspace_id,
    board_id,
    card_id,
    actor_id,
    event_type,
    safe_metadata
  )
  values (
    v_workspace_id,
    v_board_id,
    p_card_id,
    v_user_id,
    'comment.created',
    jsonb_build_object('comment_id', v_comment_id)
  );

  return v_comment_id;
end;
$$;

revoke all on function orbit.add_comment(uuid, text) from public, anon;
grant execute on function orbit.add_comment(uuid, text) to authenticated;

alter table orbit.workspaces enable row level security;
alter table orbit.workspace_members enable row level security;
alter table orbit.boards enable row level security;
alter table orbit.board_members enable row level security;
alter table orbit.columns enable row level security;
alter table orbit.cards enable row level security;
alter table orbit.card_assignees enable row level security;
alter table orbit.labels enable row level security;
alter table orbit.card_labels enable row level security;
alter table orbit.comments enable row level security;
alter table orbit.activity_events enable row level security;
alter table orbit.notifications enable row level security;
alter table orbit.user_preferences enable row level security;
alter table orbit.board_favorites enable row level security;
alter table orbit.attachments enable row level security;

create policy workspaces_select_member
  on orbit.workspaces for select to authenticated
  using (orbit_private.is_active_workspace_member(id));

create policy workspace_members_select_member
  on orbit.workspace_members for select to authenticated
  using (orbit_private.is_active_workspace_member(workspace_id));

create policy boards_select_reader
  on orbit.boards for select to authenticated
  using (orbit_private.can_read_board(id));

create policy columns_select_reader
  on orbit.columns for select to authenticated
  using (orbit_private.can_read_board(board_id));

create policy cards_select_reader
  on orbit.cards for select to authenticated
  using (orbit_private.can_read_board(board_id) and deleted_at is null);

create policy comments_select_reader
  on orbit.comments for select to authenticated
  using (
    orbit_private.can_read_board(board_id)
    and deleted_at is null
  );

create policy activity_select_reader
  on orbit.activity_events for select to authenticated
  using (orbit_private.is_active_workspace_member(workspace_id));

create policy notifications_select_self
  on orbit.notifications for select to authenticated
  using (recipient_id = (select auth.uid()));

create policy labels_select_member
  on orbit.labels for select to authenticated
  using (orbit_private.is_active_workspace_member(workspace_id));

create policy user_preferences_self
  on orbit.user_preferences for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

revoke all on all tables in schema orbit from public, anon;
grant select on all tables in schema orbit to authenticated;

commit;
