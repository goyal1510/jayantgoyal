begin;

create schema if not exists studio;
revoke all on schema studio from public, anon;
grant usage on schema studio to authenticated, service_role;

alter type jg_app.game_hub_session_status set schema studio;
alter type studio.game_hub_session_status rename to game_session_status;

alter table jg_app.activity_tracker_activities set schema studio;
alter table jg_app.activity_tracker_entries set schema studio;
alter table jg_app.currency_calculator_calculations set schema studio;
alter table studio.currency_calculator_calculations rename to currency_calculations;
alter table jg_app.currency_calculator_denominations set schema studio;
alter table studio.currency_calculator_denominations
  rename to currency_calculation_denominations;
alter table jg_app.file_manager_files set schema studio;
alter table studio.file_manager_files rename to file_entries;
alter table jg_app.file_manager_type_categories set schema studio;
alter table studio.file_manager_type_categories rename to file_type_categories;
alter table jg_app.game_hub_sessions set schema studio;
alter table studio.game_hub_sessions rename to game_sessions;
alter table jg_app.game_hub_session_participants set schema studio;
alter table studio.game_hub_session_participants rename to game_session_participants;
alter table jg_app.game_hub_session_moves set schema studio;
alter table studio.game_hub_session_moves rename to game_session_moves;
alter table jg_app.game_hub_session_results set schema studio;
alter table studio.game_hub_session_results rename to game_session_results;
alter table jg_app.game_hub_typing_speed_results set schema studio;
alter table studio.game_hub_typing_speed_results rename to typing_test_results;
alter table jg_app.scratchpad_entries set schema studio;
alter table jg_app.tool_favorites set schema studio;
alter table jg_app.tool_history set schema studio;

alter table jg_app.writing_posts set schema portfolio;

do $$
begin
  if exists (
    select 1 from studio.activity_tracker_activities where user_id is null
  ) or exists (
    select 1 from studio.activity_tracker_entries
    where user_id is null or activity_id is null
  ) or exists (
    select 1 from studio.currency_calculations where user_id is null
  ) or exists (
    select 1 from studio.currency_calculation_denominations
    where calculation_id is null
  ) then
    raise exception 'Studio ownership contains null keys; repair before normalization';
  end if;
end;
$$;

alter table studio.activity_tracker_activities
  alter column user_id set not null,
  add constraint activity_tracker_activities_id_user_key unique (id, user_id);
alter table studio.activity_tracker_entries
  alter column activity_id set not null,
  alter column user_id set not null,
  drop constraint activity_tracker_entries_activity_id_fkey,
  add constraint activity_tracker_entries_activity_owner_fkey
    foreign key (activity_id, user_id)
    references studio.activity_tracker_activities(id, user_id)
    on delete cascade;

alter table studio.currency_calculations
  alter column user_id set not null,
  alter column created_at set not null,
  drop column ist_timestamp;

-- Historical calculator imports contain a small number of impossible negative
-- denomination rows. They cannot be corrected without inventing user data, so
-- discard only those invalid detail rows before enforcing the invariant.
delete from studio.currency_calculation_denominations
where denomination <= 0
   or count < 0
   or total < 0
   or bundle_count < 0
   or open_count < 0;

alter table studio.currency_calculation_denominations
  alter column calculation_id set not null,
  add constraint currency_denominations_value_check
    check (
      denomination > 0
      and count >= 0
      and (total is null or total >= 0)
      and (bundle_count is null or bundle_count >= 0)
      and (open_count is null or open_count >= 0)
    );

update studio.file_entries
set is_directory = coalesce(is_directory, false),
    child_count = coalesce(child_count, 0),
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now()),
    is_deleted = coalesce(is_deleted, false),
    deleted_at = case
      when coalesce(is_deleted, false) then coalesce(deleted_at, now())
      else null
    end;
alter table studio.file_entries
  alter column is_directory set not null,
  alter column child_count set not null,
  alter column created_at set not null,
  alter column updated_at set not null,
  alter column is_deleted set not null,
  drop column version,
  drop column is_latest_version,
  drop column file_hash,
  add constraint file_entries_size_check check (size_bytes >= 0),
  add constraint file_entries_child_count_check check (child_count >= 0),
  add constraint file_entries_deletion_state_check
    check (is_deleted = (deleted_at is not null));

alter table studio.typing_test_results
  add constraint typing_test_results_metrics_check
    check (
      wpm >= 0
      and accuracy between 0 and 100
      and duration_seconds > 0
      and total_characters >= 0
      and correct_characters between 0 and total_characters
      and text_length >= 0
    );

create index activity_entries_activity_owner_idx
  on studio.activity_tracker_entries (activity_id, user_id);
create index game_session_moves_participant_idx
  on studio.game_session_moves (participant_id);
create index game_session_results_winner_idx
  on studio.game_session_results (winner_participant_id)
  where winner_participant_id is not null;
create index game_sessions_current_turn_idx
  on studio.game_sessions (current_turn_participant_id)
  where current_turn_participant_id is not null;
create index game_sessions_winner_idx
  on studio.game_sessions (winner_participant_id)
  where winner_participant_id is not null;

-- Replace the UI-surface names that remain attached to schema-moved objects.
alter index studio.currency_calculator_calculations_pkey
  rename to currency_calculations_pkey;
alter index studio.currency_calculator_denominations_pkey
  rename to currency_calculation_denominations_pkey;
alter index studio.file_manager_files_pkey rename to file_entries_pkey;
alter index studio.file_manager_type_categories_pkey
  rename to file_type_categories_pkey;
alter index studio.game_hub_sessions_pkey rename to game_sessions_pkey;
alter index studio.game_hub_session_participants_pkey
  rename to game_session_participants_pkey;
alter index studio.game_hub_session_moves_pkey rename to game_session_moves_pkey;
alter index studio.game_hub_session_results_pkey rename to game_session_results_pkey;
alter index studio.game_hub_typing_speed_results_pkey
  rename to typing_test_results_pkey;

alter function jg_app.generate_storage_path(uuid, text, text) set schema studio;
drop function studio.generate_storage_path(uuid, text, text);
alter function jg_app.create_directory_path(uuid, text) set schema studio;
alter function jg_app.list_directory(uuid, text) set schema studio;
alter function jg_app.get_file_by_path(uuid, text) set schema studio;
alter function jg_app.soft_delete_file(uuid, uuid) set schema studio;
alter function jg_app.handle_soft_delete() set schema studio;
alter function jg_app.update_parent_child_count() set schema studio;
alter function jg_app.validate_file_type() set schema studio;
alter function jg_app.record_game_hub_action(
  uuid,
  uuid,
  integer,
  jsonb,
  jsonb,
  uuid,
  uuid,
  studio.game_session_status,
  timestamptz,
  text,
  uuid,
  jsonb
) set schema studio;
alter function studio.record_game_hub_action(
  uuid,
  uuid,
  integer,
  jsonb,
  jsonb,
  uuid,
  uuid,
  studio.game_session_status,
  timestamptz,
  text,
  uuid,
  jsonb
) rename to record_game_action;
drop function studio.record_game_action(
  uuid,
  uuid,
  integer,
  jsonb,
  jsonb,
  uuid,
  uuid,
  studio.game_session_status,
  timestamptz,
  text,
  uuid,
  jsonb
);

drop function jg_app.copy_file(uuid, text, uuid);
drop function jg_app.get_directory_tree(uuid, text);
drop function jg_app.move_file(uuid, text, uuid);

create or replace function studio.assert_file_actor(p_user_id uuid)
returns void
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is null
    or p_user_id is distinct from (select auth.uid()) then
    raise exception using
      errcode = '42501',
      message = 'The file operation is not owned by the authenticated user';
  end if;

  if not (select iam_private.has_capability('studio.files.read')) then
    raise exception using
      errcode = '42501',
      message = 'Studio file access is not assigned';
  end if;
end;
$$;

create or replace function studio.generate_storage_path(
  p_user_id uuid,
  p_file_name text
)
returns text
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  file_extension text;
begin
  perform studio.assert_file_actor(p_user_id);
  file_extension := substring(p_file_name from '\.([^\.]+)$');

  return p_user_id::text || '/' || extensions.gen_random_uuid()::text
    || case
      when file_extension is not null then '.' || file_extension
      else ''
    end;
end;
$$;

create or replace function studio.create_directory_path(
  p_user_id uuid,
  p_directory_path text
)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  path_parts text[];
  current_path text := '/';
  parent_entry_id uuid;
  directory_entry_id uuid;
  part text;
begin
  perform studio.assert_file_actor(p_user_id);

  if not (select iam_private.has_capability('studio.files.create')) then
    raise exception using errcode = '42501', message = 'Studio file creation is not assigned';
  end if;

  path_parts := string_to_array(trim(both '/' from p_directory_path), '/');

  insert into studio.file_entries (
    user_id,
    bucket_id,
    storage_path,
    original_filename,
    file_path,
    file_name,
    display_name,
    mime_type,
    file_type,
    is_directory,
    parent_id
  )
  values (
    p_user_id,
    'studio-files',
    null,
    null,
    '/',
    '',
    'Root',
    'inode/directory',
    'directory',
    true,
    null
  )
  on conflict (user_id, file_path, is_deleted)
    where not is_deleted do nothing;

  select entry.id
  into parent_entry_id
  from studio.file_entries entry
  where entry.user_id = p_user_id
    and entry.file_path = '/'
    and not entry.is_deleted;

  if p_directory_path in ('', '/')
    or array_length(path_parts, 1) is null then
    return parent_entry_id;
  end if;

  foreach part in array path_parts loop
    if nullif(btrim(part), '') is null then
      raise exception using errcode = '22023', message = 'Directory path contains an empty segment';
    end if;

    current_path := current_path || part || '/';
    insert into studio.file_entries (
      user_id,
      bucket_id,
      storage_path,
      original_filename,
      file_path,
      file_name,
      display_name,
      mime_type,
      file_type,
      is_directory,
      parent_id
    )
    values (
      p_user_id,
      'studio-files',
      null,
      null,
      current_path,
      part,
      part,
      'inode/directory',
      'directory',
      true,
      parent_entry_id
    )
    on conflict (user_id, file_path, is_deleted)
      where not is_deleted
    do update set updated_at = now()
    returning id into directory_entry_id;

    parent_entry_id := directory_entry_id;
  end loop;

  return parent_entry_id;
end;
$$;

create or replace function studio.list_directory(
  p_user_id uuid,
  p_directory_path text default '/'
)
returns table (
  id uuid,
  file_path text,
  file_name text,
  display_name text,
  mime_type text,
  size_bytes bigint,
  file_type text,
  is_directory boolean,
  child_count integer,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  directory_id uuid;
begin
  perform studio.assert_file_actor(p_user_id);

  select entry.id
  into directory_id
  from studio.file_entries entry
  where entry.user_id = p_user_id
    and entry.file_path = p_directory_path
    and entry.is_directory
    and not entry.is_deleted;

  if directory_id is null then
    raise exception using errcode = 'P0002', message = 'Directory not found';
  end if;

  return query
  select
    entry.id,
    entry.file_path,
    entry.file_name,
    entry.display_name,
    entry.mime_type,
    entry.size_bytes,
    entry.file_type,
    entry.is_directory,
    entry.child_count,
    entry.created_at,
    entry.updated_at
  from studio.file_entries entry
  where entry.user_id = p_user_id
    and entry.parent_id = directory_id
    and not entry.is_deleted
  order by entry.is_directory desc, entry.file_name;
end;
$$;

create or replace function studio.get_file_by_path(
  p_user_id uuid,
  p_file_path text
)
returns setof studio.file_entries
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  perform studio.assert_file_actor(p_user_id);

  return query
  select entry.*
  from studio.file_entries entry
  where entry.user_id = p_user_id
    and entry.file_path = p_file_path
    and not entry.is_deleted;
end;
$$;

create or replace function studio.soft_delete_file(
  p_file_id uuid,
  p_user_id uuid
)
returns boolean
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  perform studio.assert_file_actor(p_user_id);

  if not (select iam_private.has_capability('studio.files.delete')) then
    raise exception using errcode = '42501', message = 'Studio file deletion is not assigned';
  end if;

  update studio.file_entries
  set is_deleted = true,
      deleted_at = now(),
      updated_at = now()
  where id = p_file_id
    and user_id = p_user_id
    and not is_deleted;

  return found;
end;
$$;

create or replace function studio.handle_soft_delete()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.is_deleted and not old.is_deleted then
    new.deleted_at := now();
    if new.parent_id is not null then
      update studio.file_entries
      set child_count = greatest(child_count - 1, 0),
          updated_at = now()
      where id = new.parent_id;
    end if;
  end if;
  return new;
end;
$$;

create or replace function studio.update_parent_child_count()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.parent_id is not null then
    update studio.file_entries
    set child_count = child_count + 1,
        updated_at = now()
    where id = new.parent_id;
  elsif tg_op = 'DELETE' and old.parent_id is not null and not old.is_deleted then
    update studio.file_entries
    set child_count = greatest(child_count - 1, 0),
        updated_at = now()
    where id = old.parent_id;
  end if;
  return null;
end;
$$;

create or replace function studio.validate_file_type()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  allowed_types text[];
begin
  select category.allowed_mime_types
  into allowed_types
  from studio.file_type_categories category
  where category.type_name = new.file_type;

  if allowed_types is null then
    raise exception 'Unknown file type %', new.file_type;
  end if;

  if not (
    new.mime_type = any(allowed_types)
    or allowed_types @> array['*']
  ) then
    raise exception 'MIME type % is not allowed for file type %', new.mime_type, new.file_type;
  end if;

  return new;
end;
$$;

create or replace function studio.record_game_action(
  p_actor_user_id uuid,
  p_session_id uuid,
  p_participant_id uuid,
  p_move_number integer,
  p_move_payload jsonb,
  p_resulting_state jsonb,
  p_next_turn_participant_id uuid,
  p_winner_participant_id uuid,
  p_session_status studio.game_session_status,
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
  current_session studio.game_sessions%rowtype;
  next_move_number integer;
begin
  if not iam_private.user_has_capability(
    p_actor_user_id,
    'studio.games.play'
  ) then
    raise exception using errcode = '42501', message = 'Studio game access is not assigned';
  end if;

  select session.*
  into current_session
  from studio.game_sessions session
  where session.id = p_session_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Game session not found';
  end if;

  if current_session.status <> 'active'::studio.game_session_status then
    raise exception using errcode = 'P0001', message = 'Game session is no longer active';
  end if;

  if not exists (
    select 1
    from studio.game_session_participants participant
    where participant.id = p_participant_id
      and participant.session_id = p_session_id
      and participant.user_id = p_actor_user_id
      and participant.left_at is null
  ) then
    raise exception using errcode = '42501', message = 'Actor is not the active participant';
  end if;

  if p_next_turn_participant_id is not null and not exists (
    select 1
    from studio.game_session_participants participant
    where participant.id = p_next_turn_participant_id
      and participant.session_id = p_session_id
      and participant.left_at is null
  ) then
    raise exception using errcode = '23503', message = 'Next participant does not belong to this session';
  end if;

  if p_winner_participant_id is not null and not exists (
    select 1
    from studio.game_session_participants participant
    where participant.id = p_winner_participant_id
      and participant.session_id = p_session_id
  ) then
    raise exception using errcode = '23503', message = 'Winner does not belong to this session';
  end if;

  if p_result_winner_participant_id is not null and not exists (
    select 1
    from studio.game_session_participants participant
    where participant.id = p_result_winner_participant_id
      and participant.session_id = p_session_id
  ) then
    raise exception using errcode = '23503', message = 'Result winner does not belong to this session';
  end if;

  select coalesce(max(move.move_number), 0) + 1
  into next_move_number
  from studio.game_session_moves move
  where move.session_id = p_session_id;

  if p_move_number <> next_move_number then
    raise exception using
      errcode = 'P0001',
      message = 'Game state changed before this action was committed';
  end if;

  insert into studio.game_session_moves (
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
    insert into studio.game_session_results (
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

  update studio.game_sessions
  set state = p_resulting_state,
      current_turn_participant_id = p_next_turn_participant_id,
      winner_participant_id = p_winner_participant_id,
      status = p_session_status,
      completed_at = p_completed_at
  where id = p_session_id;

  return p_move_number;
end;
$$;

-- The old bucket is empty after the approved cleanup. Abort a future apply if
-- that assumption changes, rather than silently orphaning stored bytes.
do $$
begin
  if exists (
    select 1 from storage.objects where bucket_id = 'private-files'
  ) then
    raise exception 'private-files contains objects; migrate them through the Storage API before this migration';
  end if;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit)
values ('studio-files', 'studio-files', false, 26214400)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit;

alter table studio.file_entries
  alter column bucket_id set default 'studio-files';
update studio.file_entries
set bucket_id = 'studio-files'
where bucket_id = 'private-files';

drop policy if exists "Users can read own private files" on storage.objects;
drop policy if exists "Users can upload own private files" on storage.objects;
drop policy if exists "Users can update own private files" on storage.objects;
drop policy if exists "Users can delete own private files" on storage.objects;

create policy "Members can read own Studio files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'studio-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and (select iam_private.has_capability('studio.files.read'))
  );
create policy "Members can upload own Studio files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'studio-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and (select iam_private.has_capability('studio.files.create'))
  );
create policy "Members can update own Studio files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'studio-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and (select iam_private.has_capability('studio.files.update'))
  )
  with check (
    bucket_id = 'studio-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and (select iam_private.has_capability('studio.files.update'))
  );
create policy "Members can delete own Studio files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'studio-files'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and (select iam_private.has_capability('studio.files.delete'))
  );

revoke all on all functions in schema studio from public, anon, authenticated;
grant execute on function studio.assert_file_actor(uuid) to authenticated, service_role;
grant execute on function studio.generate_storage_path(uuid, text)
  to authenticated, service_role;
grant execute on function studio.create_directory_path(uuid, text)
  to authenticated, service_role;
grant execute on function studio.list_directory(uuid, text)
  to authenticated, service_role;
grant execute on function studio.get_file_by_path(uuid, text)
  to authenticated, service_role;
grant execute on function studio.soft_delete_file(uuid, uuid)
  to authenticated, service_role;
grant execute on function studio.record_game_action(
  uuid,
  uuid,
  uuid,
  integer,
  jsonb,
  jsonb,
  uuid,
  uuid,
  studio.game_session_status,
  timestamptz,
  text,
  uuid,
  jsonb
) to service_role;

alter default privileges for role postgres in schema studio
  revoke execute on functions from public;
alter default privileges for role postgres in schema studio
  revoke all on tables from public, anon, authenticated;

drop schema jg_app;

commit;
