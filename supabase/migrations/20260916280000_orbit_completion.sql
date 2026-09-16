begin;

create table orbit_private.export_jobs (
  id uuid primary key default foundation.uuid_v7(),
  workspace_id uuid not null references orbit.workspaces (id) on delete cascade,
  requester_id uuid not null references iam.profiles (user_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'failed')),
  manifest jsonb not null default '{}'::jsonb,
  object_key text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index export_jobs_status_idx on orbit_private.export_jobs (status, created_at);

create or replace function orbit.create_workspace_invitation(
  p_workspace_id uuid,
  p_email text,
  p_role orbit.workspace_member_role default 'member',
  p_token_hash text default null,
  p_board_scope jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_invitation_id uuid;
  v_hash text := coalesce(p_token_hash, encode(extensions.gen_random_bytes(32), 'hex'));
begin
  perform orbit_private.require_orbit_access();

  if not orbit_private.is_workspace_admin(p_workspace_id, v_user_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;

  if p_role = 'admin' and not exists (
    select 1 from orbit.workspaces
    where id = p_workspace_id and owner_user_id = v_user_id
  ) then
    raise exception 'only the owner may invite admins' using errcode = '42501';
  end if;

  if p_role = 'guest' and jsonb_array_length(coalesce(p_board_scope, '[]'::jsonb)) = 0 then
    raise exception 'guest invites require board scope' using errcode = '22023';
  end if;

  insert into orbit_private.invitations (
    workspace_id, email_normalized, workspace_role, token_hash, inviter_id, expires_at, board_scope
  )
  values (
    p_workspace_id, lower(trim(p_email)), p_role, v_hash, v_user_id,
    now() + interval '7 days', coalesce(p_board_scope, '[]'::jsonb)
  )
  returning id into v_invitation_id;

  insert into orbit_private.outbox_events (event_type, payload)
  values ('invitation.created', jsonb_build_object('invitation_id', v_invitation_id));

  return v_invitation_id;
end;
$$;

create or replace function orbit.transfer_workspace_ownership(
  p_workspace_id uuid,
  p_target_user_id uuid
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

  if not exists (
    select 1 from orbit.workspaces
    where id = p_workspace_id and owner_user_id = v_user_id
  ) then
    raise exception 'workspace owner required' using errcode = '42501';
  end if;

  if not orbit_private.is_active_workspace_member(p_workspace_id, p_target_user_id) then
    raise exception 'target must be an active member' using errcode = '22023';
  end if;

  update orbit.workspaces set owner_user_id = p_target_user_id where id = p_workspace_id;

  update orbit.workspace_members set role = 'admin'
  where workspace_id = p_workspace_id and user_id = v_user_id;

  update orbit.workspace_members set role = 'member'
  where workspace_id = p_workspace_id and user_id = p_target_user_id;
end;
$$;

grant execute on function orbit.transfer_workspace_ownership(uuid, uuid) to authenticated;

create or replace function orbit.archive_workspace(p_workspace_id uuid)
returns void
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
  update orbit.workspaces set lifecycle = 'archived' where id = p_workspace_id;
end;
$$;

grant execute on function orbit.archive_workspace(uuid) to authenticated;

create or replace function orbit.restore_workspace(p_workspace_id uuid)
returns void
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
  update orbit.workspaces
  set lifecycle = 'active', deletion_requested_at = null
  where id = p_workspace_id;
end;
$$;

grant execute on function orbit.restore_workspace(uuid) to authenticated;

create or replace function orbit.request_workspace_deletion(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  if not exists (
    select 1 from orbit.workspaces where id = p_workspace_id and owner_user_id = v_user_id
  ) then
    raise exception 'workspace owner required' using errcode = '42501';
  end if;
  update orbit.workspaces
  set lifecycle = 'pending_deletion', deletion_requested_at = now()
  where id = p_workspace_id;
end;
$$;

grant execute on function orbit.request_workspace_deletion(uuid) to authenticated;

create or replace function orbit.cancel_workspace_deletion(p_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  if not exists (
    select 1 from orbit.workspaces where id = p_workspace_id and owner_user_id = v_user_id
  ) then
    raise exception 'workspace owner required' using errcode = '42501';
  end if;
  update orbit.workspaces
  set lifecycle = 'active', deletion_requested_at = null
  where id = p_workspace_id and lifecycle = 'pending_deletion';
end;
$$;

grant execute on function orbit.cancel_workspace_deletion(uuid) to authenticated;

create or replace function orbit.create_board_from_template(
  p_workspace_id uuid,
  p_template_id uuid,
  p_name text,
  p_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_template orbit.board_templates%rowtype;
  v_board_id uuid;
  v_column jsonb;
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.is_active_workspace_member(p_workspace_id, v_user_id) then
    raise exception 'workspace membership required' using errcode = '42501';
  end if;

  select * into v_template from orbit.board_templates where id = p_template_id;
  if not found then
    raise exception 'template not found' using errcode = 'P0002';
  end if;

  v_board_id := orbit.create_board(
    p_workspace_id,
    trim(p_name),
    upper(trim(p_key)),
    'workspace'::orbit.board_visibility
  );

  delete from orbit.columns where board_id = v_board_id;

  for v_column in
    select * from jsonb_array_elements(coalesce(v_template.template_data->'columns', '[]'::jsonb))
  loop
    perform orbit.create_column(
      v_board_id,
      v_column->>'name',
      coalesce((v_column->>'category')::orbit.column_category, 'active'::orbit.column_category)
    );
  end loop;

  if not exists (select 1 from orbit.columns where board_id = v_board_id) then
    perform orbit.create_column(v_board_id, 'To do', 'backlog'::orbit.column_category);
  end if;

  return v_board_id;
end;
$$;

revoke all on function orbit.create_board_from_template(uuid, uuid, text, text) from public, anon;
grant execute on function orbit.create_board_from_template(uuid, uuid, text, text) to authenticated;

create or replace function orbit.bulk_archive_cards(
  p_board_id uuid,
  p_card_ids uuid[]
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
  set archived_at = coalesce(archived_at, now()), version = version + 1
  where board_id = p_board_id and id = any (p_card_ids) and deleted_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function orbit.bulk_archive_cards(uuid, uuid[]) to authenticated;

create or replace function orbit.bulk_trash_cards(
  p_board_id uuid,
  p_card_ids uuid[]
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
  set deleted_at = coalesce(deleted_at, now()), version = version + 1
  where board_id = p_board_id and id = any (p_card_ids) and deleted_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function orbit.bulk_trash_cards(uuid, uuid[]) to authenticated;

create or replace function orbit.request_workspace_export(p_workspace_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_job_id uuid;
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.is_workspace_admin(p_workspace_id, v_user_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;

  insert into orbit_private.export_jobs (workspace_id, requester_id, status)
  values (p_workspace_id, v_user_id, 'pending')
  returning id into v_job_id;

  insert into orbit_private.outbox_events (event_type, payload)
  values ('export.requested', jsonb_build_object('export_job_id', v_job_id));

  return v_job_id;
end;
$$;

grant execute on function orbit.request_workspace_export(uuid) to authenticated;

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
begin
  for v_row in
    select * from orbit.card_recurrence
    where active and next_run_at <= now()
    for update skip locked
  loop
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
      v_title || ' (recurring)',
      v_row.created_by
    )
    returning id into v_new_card_id;

    insert into orbit.activity_events (
      workspace_id, board_id, card_id, actor_id, event_type, safe_metadata
    )
    values (
      v_row.workspace_id,
      v_row.board_id,
      v_new_card_id,
      v_row.created_by,
      'card.created',
      jsonb_build_object('recurrence', true, 'source_card_id', v_row.card_id)
    );

    update orbit.card_recurrence
    set next_run_at = next_run_at + (
      case v_row.cadence
        when 'daily' then make_interval(days => v_row.interval_count)
        when 'weekly' then make_interval(days => 7 * v_row.interval_count)
        else make_interval(days => 30 * v_row.interval_count)
      end
    )
    where id = v_row.id;

    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function orbit_private.process_due_recurrences() from public, anon, authenticated;
grant execute on function orbit_private.process_due_recurrences() to service_role;

drop function if exists orbit.create_workspace_invitation(uuid, text, orbit.workspace_member_role, text);
revoke all on function orbit.create_workspace_invitation(
  uuid, text, orbit.workspace_member_role, text, jsonb
) from public, anon;
grant execute on function orbit.create_workspace_invitation(
  uuid, text, orbit.workspace_member_role, text, jsonb
) to authenticated;

revoke all on table orbit_private.export_jobs from public, anon, authenticated;
grant select, insert, update on table orbit_private.export_jobs to service_role;

commit;
