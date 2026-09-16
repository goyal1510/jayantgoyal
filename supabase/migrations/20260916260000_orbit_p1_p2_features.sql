begin;

create table orbit.checklists (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null,
  board_id uuid not null,
  card_id uuid not null references orbit.cards (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  rank text not null default 'a0',
  created_at timestamptz not null default now(),
  foreign key (workspace_id, board_id, card_id)
    references orbit.cards (workspace_id, board_id, id) on delete cascade
);

create table orbit.checklist_items (
  id uuid primary key default foundation.uuid_v7(),
  checklist_id uuid not null references orbit.checklists (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  completed boolean not null default false,
  rank text not null default 'a0',
  completed_at timestamptz,
  completed_by uuid references iam.profiles (user_id) on delete set null,
  created_at timestamptz not null default now()
);

create table orbit.saved_views (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null references orbit.workspaces (id) on delete cascade,
  board_id uuid references orbit.boards (id) on delete cascade,
  owner_user_id uuid not null references iam.profiles (user_id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  filters jsonb not null default '{}'::jsonb,
  sort jsonb not null default '{}'::jsonb,
  is_shared boolean not null default false,
  created_at timestamptz not null default now()
);

create table orbit.card_watches (
  workspace_id uuid not null,
  board_id uuid not null,
  card_id uuid not null references orbit.cards (id) on delete cascade,
  user_id uuid not null references iam.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (card_id, user_id),
  foreign key (workspace_id, board_id, card_id)
    references orbit.cards (workspace_id, board_id, id) on delete cascade
);

create table orbit.card_snoozes (
  id uuid primary key default foundation.uuid_v7(),
  user_id uuid not null references iam.profiles (user_id) on delete cascade,
  card_id uuid not null references orbit.cards (id) on delete cascade,
  snooze_until timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, card_id)
);

create table orbit.card_dependencies (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null,
  board_id uuid not null,
  card_id uuid not null references orbit.cards (id) on delete cascade,
  depends_on_card_id uuid not null references orbit.cards (id) on delete cascade,
  dependency_type text not null default 'blocks' check (dependency_type in ('blocks', 'relates')),
  created_by uuid not null references iam.profiles (user_id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (card_id, depends_on_card_id),
  check (card_id <> depends_on_card_id),
  foreign key (workspace_id, board_id, card_id)
    references orbit.cards (workspace_id, board_id, id) on delete cascade
);

create table orbit.card_recurrence (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null,
  board_id uuid not null,
  card_id uuid not null references orbit.cards (id) on delete cascade unique,
  cadence text not null check (cadence in ('daily', 'weekly', 'monthly')),
  interval_count integer not null default 1 check (interval_count > 0),
  next_run_at timestamptz not null,
  active boolean not null default true,
  created_by uuid not null references iam.profiles (user_id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (workspace_id, board_id, card_id)
    references orbit.cards (workspace_id, board_id, id) on delete cascade
);

create table orbit.board_templates (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null references orbit.workspaces (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 100),
  description text,
  template_data jsonb not null default '{}'::jsonb,
  created_by uuid not null references iam.profiles (user_id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table orbit.checklists enable row level security;
alter table orbit.checklist_items enable row level security;
alter table orbit.saved_views enable row level security;
alter table orbit.card_watches enable row level security;
alter table orbit.card_snoozes enable row level security;
alter table orbit.card_dependencies enable row level security;
alter table orbit.card_recurrence enable row level security;
alter table orbit.board_templates enable row level security;

create policy checklists_select_reader on orbit.checklists for select to authenticated
  using (orbit_private.can_read_board(board_id));
create policy checklist_items_select_reader on orbit.checklist_items for select to authenticated
  using (exists (
    select 1 from orbit.checklists checklist
    where checklist.id = checklist_id
      and orbit_private.can_read_board(checklist.board_id)
  ));
create policy saved_views_select on orbit.saved_views for select to authenticated
  using (
    owner_user_id = (select auth.uid())
    or (is_shared and orbit_private.is_active_workspace_member(workspace_id))
  );
create policy card_watches_select on orbit.card_watches for select to authenticated
  using (orbit_private.can_read_board(board_id));
create policy card_snoozes_self on orbit.card_snoozes for select to authenticated
  using (user_id = (select auth.uid()));
create policy card_dependencies_select on orbit.card_dependencies for select to authenticated
  using (orbit_private.can_read_board(board_id));
create policy card_recurrence_select on orbit.card_recurrence for select to authenticated
  using (orbit_private.can_read_board(board_id));
create policy board_templates_select on orbit.board_templates for select to authenticated
  using (orbit_private.is_active_workspace_member(workspace_id));

revoke all on all tables in schema orbit from public, anon;
grant select on orbit.checklists, orbit.checklist_items, orbit.saved_views,
  orbit.card_watches, orbit.card_snoozes, orbit.card_dependencies,
  orbit.card_recurrence, orbit.board_templates to authenticated;

create or replace function orbit.create_checklist(
  p_card_id uuid,
  p_title text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_board_id uuid;
  v_workspace_id uuid;
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select workspace_id, board_id into v_workspace_id, v_board_id
  from orbit.cards where id = p_card_id and deleted_at is null;
  if not orbit_private.can_edit_board(v_board_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;
  insert into orbit.checklists (workspace_id, board_id, card_id, title)
  values (v_workspace_id, v_board_id, p_card_id, trim(p_title))
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function orbit.create_checklist(uuid, text) to authenticated;

create or replace function orbit.add_checklist_item(
  p_checklist_id uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_board_id uuid;
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select board_id into v_board_id from orbit.checklists where id = p_checklist_id;
  if not orbit_private.can_edit_board(v_board_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;
  insert into orbit.checklist_items (checklist_id, body)
  values (p_checklist_id, trim(p_body))
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function orbit.add_checklist_item(uuid, text) to authenticated;

create or replace function orbit.toggle_checklist_item(
  p_item_id uuid,
  p_completed boolean
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
  select checklist.board_id into v_board_id
  from orbit.checklist_items item
  join orbit.checklists checklist on checklist.id = item.checklist_id
  where item.id = p_item_id;
  if not orbit_private.can_edit_board(v_board_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;
  update orbit.checklist_items
  set
    completed = p_completed,
    completed_at = case when p_completed then now() else null end,
    completed_by = case when p_completed then v_user_id else null end
  where id = p_item_id;
end;
$$;
grant execute on function orbit.toggle_checklist_item(uuid, boolean) to authenticated;

create or replace function orbit.toggle_card_watch(
  p_card_id uuid,
  p_watch boolean default true
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
  from orbit.cards where id = p_card_id and deleted_at is null;
  if not orbit_private.can_read_board(v_board_id, v_user_id) then
    raise exception 'board read access required' using errcode = '42501';
  end if;
  if p_watch then
    insert into orbit.card_watches (workspace_id, board_id, card_id, user_id)
    values (v_workspace_id, v_board_id, p_card_id, v_user_id)
    on conflict (card_id, user_id) do nothing;
  else
    delete from orbit.card_watches where card_id = p_card_id and user_id = v_user_id;
  end if;
end;
$$;
grant execute on function orbit.toggle_card_watch(uuid, boolean) to authenticated;

create or replace function orbit.snooze_card(
  p_card_id uuid,
  p_snooze_until timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  insert into orbit.card_snoozes (user_id, card_id, snooze_until)
  values (v_user_id, p_card_id, p_snooze_until)
  on conflict (user_id, card_id) do update set snooze_until = excluded.snooze_until;
end;
$$;
grant execute on function orbit.snooze_card(uuid, timestamptz) to authenticated;

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
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select workspace_id, board_id into v_workspace_id, v_board_id
  from orbit.cards where id = p_card_id and deleted_at is null;
  if not orbit_private.can_edit_board(v_board_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;
  insert into orbit.card_dependencies (
    workspace_id, board_id, card_id, depends_on_card_id, dependency_type, created_by
  )
  values (v_workspace_id, v_board_id, p_card_id, p_depends_on_card_id, p_dependency_type, v_user_id)
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function orbit.add_card_dependency(uuid, uuid, text) to authenticated;

create or replace function orbit.set_card_recurrence(
  p_card_id uuid,
  p_cadence text,
  p_interval_count integer default 1
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
  if not orbit_private.can_edit_board(v_board_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;
  if p_cadence = 'weekly' then v_next := now() + interval '7 days';
  elsif p_cadence = 'monthly' then v_next := now() + interval '30 days';
  end if;
  insert into orbit.card_recurrence (
    workspace_id, board_id, card_id, cadence, interval_count, next_run_at, created_by
  )
  values (v_workspace_id, v_board_id, p_card_id, p_cadence, p_interval_count, v_next, v_user_id)
  on conflict (card_id) do update
  set cadence = excluded.cadence,
      interval_count = excluded.interval_count,
      next_run_at = excluded.next_run_at,
      active = true
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function orbit.set_card_recurrence(uuid, text, integer) to authenticated;

create or replace function orbit.bulk_move_cards(
  p_board_id uuid,
  p_card_ids uuid[],
  p_target_column_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.can_edit_board(p_board_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;
  update orbit.cards
  set column_id = p_target_column_id, version = version + 1
  where board_id = p_board_id
    and id = any (p_card_ids)
    and deleted_at is null
    and archived_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
grant execute on function orbit.bulk_move_cards(uuid, uuid[], uuid) to authenticated;

create or replace function orbit.create_saved_view(
  p_workspace_id uuid,
  p_board_id uuid,
  p_name text,
  p_filters jsonb default '{}'::jsonb,
  p_is_shared boolean default false
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
  if not orbit_private.is_active_workspace_member(p_workspace_id, v_user_id) then
    raise exception 'workspace membership required' using errcode = '42501';
  end if;
  insert into orbit.saved_views (
    workspace_id, board_id, owner_user_id, name, filters, is_shared
  )
  values (p_workspace_id, p_board_id, v_user_id, trim(p_name), coalesce(p_filters, '{}'::jsonb), p_is_shared)
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function orbit.create_saved_view(uuid, uuid, text, jsonb, boolean) to authenticated;

create or replace function orbit.save_board_template(
  p_board_id uuid,
  p_name text,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
  v_data jsonb;
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.can_manage_board(p_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;
  select workspace_id into v_workspace_id from orbit.boards where id = p_board_id;
  select jsonb_build_object(
    'columns', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'category', category))
      from orbit.columns where board_id = p_board_id
    ), '[]'::jsonb)
  ) into v_data;
  insert into orbit.board_templates (workspace_id, name, description, template_data, created_by)
  values (v_workspace_id, trim(p_name), p_description, v_data, v_user_id)
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function orbit.save_board_template(uuid, text, text) to authenticated;

commit;
