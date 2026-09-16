


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "orbit";


ALTER SCHEMA "orbit" OWNER TO "postgres";


CREATE TYPE "orbit"."board_member_role" AS ENUM (
    'manager',
    'editor',
    'commenter',
    'viewer'
);


ALTER TYPE "orbit"."board_member_role" OWNER TO "postgres";


CREATE TYPE "orbit"."board_visibility" AS ENUM (
    'workspace',
    'private'
);


ALTER TYPE "orbit"."board_visibility" OWNER TO "postgres";


CREATE TYPE "orbit"."card_priority" AS ENUM (
    'none',
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "orbit"."card_priority" OWNER TO "postgres";


CREATE TYPE "orbit"."column_category" AS ENUM (
    'backlog',
    'active',
    'done',
    'cancelled'
);


ALTER TYPE "orbit"."column_category" OWNER TO "postgres";


CREATE TYPE "orbit"."lifecycle_status" AS ENUM (
    'active',
    'archived',
    'trashed',
    'pending_deletion'
);


ALTER TYPE "orbit"."lifecycle_status" OWNER TO "postgres";


CREATE TYPE "orbit"."workspace_member_role" AS ENUM (
    'admin',
    'member',
    'viewer',
    'guest'
);


ALTER TYPE "orbit"."workspace_member_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."accept_workspace_invitation"("p_token_hash" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_email text;
  v_invitation orbit_private.invitations%rowtype;
  v_workspace_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select email into v_email
  from auth.users
  where id = v_user_id;

  select * into v_invitation
  from orbit_private.invitations
  where token_hash = p_token_hash
    and status = 'pending'
    and expires_at > now()
  for update;

  if not found then
    raise exception 'invitation invalid or expired' using errcode = 'P0002';
  end if;

  if lower(v_email) <> v_invitation.email_normalized then
    raise exception 'invitation email mismatch' using errcode = '42501';
  end if;

  insert into iam.product_memberships (product_key, user_id, status)
  values ('orbit', v_user_id, 'active')
  on conflict (product_key, user_id) do update set status = 'active';

  insert into iam.product_role_assignments (product_key, user_id, role_key)
  values ('orbit', v_user_id, 'orbit.participant')
  on conflict (product_key, user_id, role_key) do nothing;

  insert into orbit.workspace_members (workspace_id, user_id, role, status)
  values (v_invitation.workspace_id, v_user_id, v_invitation.workspace_role, 'active')
  on conflict (workspace_id, user_id) do update
  set role = excluded.role, status = 'active', removed_at = null;

  update orbit_private.invitations
  set status = 'accepted'
  where id = v_invitation.id;

  v_workspace_id := v_invitation.workspace_id;
  return v_workspace_id;
end;
$$;


ALTER FUNCTION "orbit"."accept_workspace_invitation"("p_token_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."add_card_dependency"("p_card_id" "uuid", "p_depends_on_card_id" "uuid", "p_dependency_type" "text" DEFAULT 'blocks'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."add_card_dependency"("p_card_id" "uuid", "p_depends_on_card_id" "uuid", "p_dependency_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."add_checklist_item"("p_checklist_id" "uuid", "p_body" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."add_checklist_item"("p_checklist_id" "uuid", "p_body" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."add_comment"("p_card_id" "uuid", "p_body" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."add_comment"("p_card_id" "uuid", "p_body" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."archive_board"("p_board_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."archive_board"("p_board_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."archive_card"("p_card_id" "uuid", "p_expected_version" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."archive_card"("p_card_id" "uuid", "p_expected_version" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."bulk_move_cards"("p_board_id" "uuid", "p_card_ids" "uuid"[], "p_target_column_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."bulk_move_cards"("p_board_id" "uuid", "p_card_ids" "uuid"[], "p_target_column_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."create_board"("p_workspace_id" "uuid", "p_name" "text", "p_key" "text", "p_visibility" "orbit"."board_visibility" DEFAULT 'workspace'::"orbit"."board_visibility") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."create_board"("p_workspace_id" "uuid", "p_name" "text", "p_key" "text", "p_visibility" "orbit"."board_visibility") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."create_card"("p_board_id" "uuid", "p_column_id" "uuid", "p_title" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."create_card"("p_board_id" "uuid", "p_column_id" "uuid", "p_title" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."create_checklist"("p_card_id" "uuid", "p_title" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."create_checklist"("p_card_id" "uuid", "p_title" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."create_column"("p_board_id" "uuid", "p_name" "text", "p_category" "orbit"."column_category" DEFAULT 'active'::"orbit"."column_category") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."create_column"("p_board_id" "uuid", "p_name" "text", "p_category" "orbit"."column_category") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."create_label"("p_workspace_id" "uuid", "p_name" "text", "p_color_token" "text" DEFAULT 'slate'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."create_label"("p_workspace_id" "uuid", "p_name" "text", "p_color_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."create_saved_view"("p_workspace_id" "uuid", "p_board_id" "uuid", "p_name" "text", "p_filters" "jsonb" DEFAULT '{}'::"jsonb", "p_is_shared" boolean DEFAULT false) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."create_saved_view"("p_workspace_id" "uuid", "p_board_id" "uuid", "p_name" "text", "p_filters" "jsonb", "p_is_shared" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."create_workspace"("p_name" "text", "p_description" "text" DEFAULT NULL::"text", "p_idempotency_key" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."create_workspace"("p_name" "text", "p_description" "text", "p_idempotency_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."create_workspace_invitation"("p_workspace_id" "uuid", "p_email" "text", "p_role" "orbit"."workspace_member_role" DEFAULT 'member'::"orbit"."workspace_member_role", "p_token_hash" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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

  insert into orbit_private.invitations (
    workspace_id,
    email_normalized,
    workspace_role,
    token_hash,
    inviter_id,
    expires_at
  )
  values (
    p_workspace_id,
    lower(trim(p_email)),
    p_role,
    v_hash,
    v_user_id,
    now() + interval '7 days'
  )
  returning id into v_invitation_id;

  insert into orbit_private.outbox_events (event_type, payload)
  values (
    'invitation.created',
    jsonb_build_object('invitation_id', v_invitation_id)
  );

  return v_invitation_id;
end;
$$;


ALTER FUNCTION "orbit"."create_workspace_invitation"("p_workspace_id" "uuid", "p_email" "text", "p_role" "orbit"."workspace_member_role", "p_token_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."delete_column"("p_column_id" "uuid", "p_destination_column_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."delete_column"("p_column_id" "uuid", "p_destination_column_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."finalize_attachment_upload"("p_reservation_id" "uuid", "p_checksum" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."finalize_attachment_upload"("p_reservation_id" "uuid", "p_checksum" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."mark_all_notifications_read"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."mark_all_notifications_read"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."mark_notification_read"("p_notification_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."mark_notification_read"("p_notification_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."move_card"("p_card_id" "uuid", "p_target_column_id" "uuid", "p_rank" "text", "p_expected_version" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."move_card"("p_card_id" "uuid", "p_target_column_id" "uuid", "p_rank" "text", "p_expected_version" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."remove_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."remove_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."reserve_attachment_upload"("p_card_id" "uuid", "p_original_name" "text", "p_mime" "text", "p_bytes" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."reserve_attachment_upload"("p_card_id" "uuid", "p_original_name" "text", "p_mime" "text", "p_bytes" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."restore_board"("p_board_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."restore_board"("p_board_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."restore_card"("p_card_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."restore_card"("p_card_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."save_board_template"("p_board_id" "uuid", "p_name" "text", "p_description" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."save_board_template"("p_board_id" "uuid", "p_name" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."set_card_assignee"("p_card_id" "uuid", "p_user_id" "uuid", "p_attach" boolean DEFAULT true) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."set_card_assignee"("p_card_id" "uuid", "p_user_id" "uuid", "p_attach" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."set_card_recurrence"("p_card_id" "uuid", "p_cadence" "text", "p_interval_count" integer DEFAULT 1) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."set_card_recurrence"("p_card_id" "uuid", "p_cadence" "text", "p_interval_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."snooze_card"("p_card_id" "uuid", "p_snooze_until" timestamp with time zone) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  insert into orbit.card_snoozes (user_id, card_id, snooze_until)
  values (v_user_id, p_card_id, p_snooze_until)
  on conflict (user_id, card_id) do update set snooze_until = excluded.snooze_until;
end;
$$;


ALTER FUNCTION "orbit"."snooze_card"("p_card_id" "uuid", "p_snooze_until" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."toggle_board_favorite"("p_board_id" "uuid", "p_favorite" boolean DEFAULT true) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."toggle_board_favorite"("p_board_id" "uuid", "p_favorite" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."toggle_card_label"("p_card_id" "uuid", "p_label_id" "uuid", "p_attach" boolean DEFAULT true) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."toggle_card_label"("p_card_id" "uuid", "p_label_id" "uuid", "p_attach" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."toggle_card_watch"("p_card_id" "uuid", "p_watch" boolean DEFAULT true) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."toggle_card_watch"("p_card_id" "uuid", "p_watch" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."toggle_checklist_item"("p_item_id" "uuid", "p_completed" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."toggle_checklist_item"("p_item_id" "uuid", "p_completed" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."trash_board"("p_board_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."trash_board"("p_board_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."trash_card"("p_card_id" "uuid", "p_expected_version" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."trash_card"("p_card_id" "uuid", "p_expected_version" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."unarchive_card"("p_card_id" "uuid", "p_expected_version" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."unarchive_card"("p_card_id" "uuid", "p_expected_version" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."update_board"("p_board_id" "uuid", "p_name" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_visibility" "orbit"."board_visibility" DEFAULT NULL::"orbit"."board_visibility", "p_expected_revision" integer DEFAULT NULL::integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."update_board"("p_board_id" "uuid", "p_name" "text", "p_description" "text", "p_visibility" "orbit"."board_visibility", "p_expected_revision" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."update_card"("p_card_id" "uuid", "p_title" "text" DEFAULT NULL::"text", "p_description" "text" DEFAULT NULL::"text", "p_priority" "orbit"."card_priority" DEFAULT NULL::"orbit"."card_priority", "p_due_date" "date" DEFAULT NULL::"date", "p_expected_version" integer DEFAULT NULL::integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."update_card"("p_card_id" "uuid", "p_title" "text", "p_description" "text", "p_priority" "orbit"."card_priority", "p_due_date" "date", "p_expected_version" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."update_column"("p_column_id" "uuid", "p_name" "text" DEFAULT NULL::"text", "p_category" "orbit"."column_category" DEFAULT NULL::"orbit"."column_category") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."update_column"("p_column_id" "uuid", "p_name" "text", "p_category" "orbit"."column_category") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."update_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid", "p_role" "orbit"."workspace_member_role") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."update_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid", "p_role" "orbit"."workspace_member_role") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "orbit"."activity_events" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid",
    "card_id" "uuid",
    "actor_id" "uuid",
    "event_type" "text" NOT NULL,
    "safe_metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "command_id" "uuid"
);


ALTER TABLE "orbit"."activity_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."attachments" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "uploader_id" "uuid" NOT NULL,
    "object_key" "text" NOT NULL,
    "original_name" "text" NOT NULL,
    "mime" "text" NOT NULL,
    "bytes" bigint NOT NULL,
    "checksum" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "attachments_bytes_check" CHECK (("bytes" >= 0)),
    CONSTRAINT "attachments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'ready'::"text", 'failed'::"text", 'deleted'::"text"])))
);


ALTER TABLE "orbit"."attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."board_favorites" (
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "orbit"."board_favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."board_members" (
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "orbit"."board_member_role" NOT NULL
);


ALTER TABLE "orbit"."board_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."board_templates" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "template_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "board_templates_name_check" CHECK ((("char_length"(TRIM(BOTH FROM "name")) >= 2) AND ("char_length"(TRIM(BOTH FROM "name")) <= 100)))
);


ALTER TABLE "orbit"."board_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."boards" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "visibility" "orbit"."board_visibility" DEFAULT 'workspace'::"orbit"."board_visibility" NOT NULL,
    "lifecycle" "orbit"."lifecycle_status" DEFAULT 'active'::"orbit"."lifecycle_status" NOT NULL,
    "rank" "text" DEFAULT 'a0'::"text" NOT NULL,
    "revision" integer DEFAULT 1 NOT NULL,
    "channel_epoch" bigint DEFAULT 1 NOT NULL,
    "default_done_column_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "boards_description_check" CHECK ((("description" IS NULL) OR ("char_length"("description") <= 2000))),
    CONSTRAINT "boards_key_check" CHECK (("key" ~ '^[A-Z0-9]{2,8}$'::"text")),
    CONSTRAINT "boards_name_check" CHECK ((("char_length"(TRIM(BOTH FROM "name")) >= 2) AND ("char_length"(TRIM(BOTH FROM "name")) <= 100))),
    CONSTRAINT "boards_revision_check" CHECK (("revision" > 0))
);


ALTER TABLE "orbit"."boards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."card_assignees" (
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "assigned_by" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "orbit"."card_assignees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."card_dependencies" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "depends_on_card_id" "uuid" NOT NULL,
    "dependency_type" "text" DEFAULT 'blocks'::"text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "card_dependencies_check" CHECK (("card_id" <> "depends_on_card_id")),
    CONSTRAINT "card_dependencies_dependency_type_check" CHECK (("dependency_type" = ANY (ARRAY['blocks'::"text", 'relates'::"text"])))
);


ALTER TABLE "orbit"."card_dependencies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."card_labels" (
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "label_id" "uuid" NOT NULL
);


ALTER TABLE "orbit"."card_labels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."card_recurrence" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "cadence" "text" NOT NULL,
    "interval_count" integer DEFAULT 1 NOT NULL,
    "next_run_at" timestamp with time zone NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "card_recurrence_cadence_check" CHECK (("cadence" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text"]))),
    CONSTRAINT "card_recurrence_interval_count_check" CHECK (("interval_count" > 0))
);


ALTER TABLE "orbit"."card_recurrence" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."card_snoozes" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "snooze_until" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "orbit"."card_snoozes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."card_watches" (
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "orbit"."card_watches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."cards" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "column_id" "uuid" NOT NULL,
    "number" integer NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "priority" "orbit"."card_priority" DEFAULT 'none'::"orbit"."card_priority" NOT NULL,
    "rank" "text" DEFAULT 'a0'::"text" NOT NULL,
    "due_date" "date",
    "completed_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "cards_description_check" CHECK ((("description" IS NULL) OR ("char_length"("description") <= 20000))),
    CONSTRAINT "cards_number_check" CHECK (("number" > 0)),
    CONSTRAINT "cards_title_check" CHECK ((("char_length"(TRIM(BOTH FROM "title")) >= 1) AND ("char_length"(TRIM(BOTH FROM "title")) <= 200))),
    CONSTRAINT "cards_version_check" CHECK (("version" > 0))
);


ALTER TABLE "orbit"."cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."checklist_items" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "checklist_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "rank" "text" DEFAULT 'a0'::"text" NOT NULL,
    "completed_at" timestamp with time zone,
    "completed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "checklist_items_body_check" CHECK ((("char_length"(TRIM(BOTH FROM "body")) >= 1) AND ("char_length"(TRIM(BOTH FROM "body")) <= 500)))
);


ALTER TABLE "orbit"."checklist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."checklists" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "rank" "text" DEFAULT 'a0'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "checklists_title_check" CHECK ((("char_length"(TRIM(BOTH FROM "title")) >= 1) AND ("char_length"(TRIM(BOTH FROM "title")) <= 120)))
);


ALTER TABLE "orbit"."checklists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."columns" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "category" "orbit"."column_category" DEFAULT 'active'::"orbit"."column_category" NOT NULL,
    "rank" "text" DEFAULT 'a0'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "columns_name_check" CHECK ((("char_length"(TRIM(BOTH FROM "name")) >= 1) AND ("char_length"(TRIM(BOTH FROM "name")) <= 60)))
);


ALTER TABLE "orbit"."columns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."comments" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "edited_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comments_body_check" CHECK ((("char_length"(TRIM(BOTH FROM "body")) >= 1) AND ("char_length"(TRIM(BOTH FROM "body")) <= 10000))),
    CONSTRAINT "comments_version_check" CHECK (("version" > 0))
);


ALTER TABLE "orbit"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."labels" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "color_token" "text" DEFAULT 'slate'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "labels_name_check" CHECK ((("char_length"(TRIM(BOTH FROM "name")) >= 1) AND ("char_length"(TRIM(BOTH FROM "name")) <= 40)))
);


ALTER TABLE "orbit"."labels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."notifications" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid",
    "subject_type" "text" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "event_id" "uuid",
    "reason" "text" NOT NULL,
    "read_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "orbit"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."saved_views" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid",
    "owner_user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "filters" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "sort" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_shared" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "saved_views_name_check" CHECK ((("char_length"(TRIM(BOTH FROM "name")) >= 1) AND ("char_length"(TRIM(BOTH FROM "name")) <= 80)))
);


ALTER TABLE "orbit"."saved_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."user_preferences" (
    "user_id" "uuid" NOT NULL,
    "default_workspace_id" "uuid",
    "theme" "text" DEFAULT 'system'::"text" NOT NULL,
    "density" "text" DEFAULT 'comfortable'::"text" NOT NULL,
    "notification_preferences" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "orbit"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."workspace_members" (
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "orbit"."workspace_member_role" DEFAULT 'member'::"orbit"."workspace_member_role" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "removed_at" timestamp with time zone,
    CONSTRAINT "workspace_members_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'invited'::"text", 'suspended'::"text", 'removed'::"text"])))
);


ALTER TABLE "orbit"."workspace_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit"."workspaces" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "owner_user_id" "uuid" NOT NULL,
    "timezone" "text" DEFAULT 'Asia/Kolkata'::"text" NOT NULL,
    "lifecycle" "orbit"."lifecycle_status" DEFAULT 'active'::"orbit"."lifecycle_status" NOT NULL,
    "deletion_requested_at" timestamp with time zone,
    "version" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workspaces_description_check" CHECK ((("description" IS NULL) OR ("char_length"("description") <= 500))),
    CONSTRAINT "workspaces_name_check" CHECK ((("char_length"(TRIM(BOTH FROM "name")) >= 2) AND ("char_length"(TRIM(BOTH FROM "name")) <= 80))),
    CONSTRAINT "workspaces_version_check" CHECK (("version" > 0))
);


ALTER TABLE "orbit"."workspaces" OWNER TO "postgres";


ALTER TABLE ONLY "orbit"."activity_events"
    ADD CONSTRAINT "activity_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."attachments"
    ADD CONSTRAINT "attachments_object_key_key" UNIQUE ("object_key");



ALTER TABLE ONLY "orbit"."attachments"
    ADD CONSTRAINT "attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."board_favorites"
    ADD CONSTRAINT "board_favorites_pkey" PRIMARY KEY ("board_id", "user_id");



ALTER TABLE ONLY "orbit"."board_members"
    ADD CONSTRAINT "board_members_pkey" PRIMARY KEY ("board_id", "user_id");



ALTER TABLE ONLY "orbit"."board_templates"
    ADD CONSTRAINT "board_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."boards"
    ADD CONSTRAINT "boards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."boards"
    ADD CONSTRAINT "boards_workspace_id_key_key" UNIQUE ("workspace_id", "key");



ALTER TABLE ONLY "orbit"."boards"
    ADD CONSTRAINT "boards_workspace_id_unique" UNIQUE ("workspace_id", "id");



ALTER TABLE ONLY "orbit"."card_assignees"
    ADD CONSTRAINT "card_assignees_pkey" PRIMARY KEY ("card_id", "user_id");



ALTER TABLE ONLY "orbit"."card_dependencies"
    ADD CONSTRAINT "card_dependencies_card_id_depends_on_card_id_key" UNIQUE ("card_id", "depends_on_card_id");



ALTER TABLE ONLY "orbit"."card_dependencies"
    ADD CONSTRAINT "card_dependencies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."card_labels"
    ADD CONSTRAINT "card_labels_pkey" PRIMARY KEY ("card_id", "label_id");



ALTER TABLE ONLY "orbit"."card_recurrence"
    ADD CONSTRAINT "card_recurrence_card_id_key" UNIQUE ("card_id");



ALTER TABLE ONLY "orbit"."card_recurrence"
    ADD CONSTRAINT "card_recurrence_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."card_snoozes"
    ADD CONSTRAINT "card_snoozes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."card_snoozes"
    ADD CONSTRAINT "card_snoozes_user_id_card_id_key" UNIQUE ("user_id", "card_id");



ALTER TABLE ONLY "orbit"."card_watches"
    ADD CONSTRAINT "card_watches_pkey" PRIMARY KEY ("card_id", "user_id");



ALTER TABLE ONLY "orbit"."cards"
    ADD CONSTRAINT "cards_board_id_number_key" UNIQUE ("board_id", "number");



ALTER TABLE ONLY "orbit"."cards"
    ADD CONSTRAINT "cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."cards"
    ADD CONSTRAINT "cards_workspace_board_id_unique" UNIQUE ("workspace_id", "board_id", "id");



ALTER TABLE ONLY "orbit"."checklist_items"
    ADD CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."checklists"
    ADD CONSTRAINT "checklists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."columns"
    ADD CONSTRAINT "columns_board_id_unique" UNIQUE ("board_id", "id");



ALTER TABLE ONLY "orbit"."columns"
    ADD CONSTRAINT "columns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."labels"
    ADD CONSTRAINT "labels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."labels"
    ADD CONSTRAINT "labels_workspace_id_unique" UNIQUE ("workspace_id", "id");



ALTER TABLE ONLY "orbit"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_event_id_reason_key" UNIQUE ("recipient_id", "event_id", "reason");



ALTER TABLE ONLY "orbit"."saved_views"
    ADD CONSTRAINT "saved_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "orbit"."workspace_members"
    ADD CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("workspace_id", "user_id");



ALTER TABLE ONLY "orbit"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



CREATE INDEX "boards_workspace_visibility_idx" ON "orbit"."boards" USING "btree" ("workspace_id", "visibility", "lifecycle");



CREATE INDEX "cards_board_column_rank_idx" ON "orbit"."cards" USING "btree" ("board_id", "column_id", "rank", "id") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "labels_workspace_name_idx" ON "orbit"."labels" USING "btree" ("workspace_id", "lower"("name"));



CREATE INDEX "notifications_recipient_read_idx" ON "orbit"."notifications" USING "btree" ("recipient_id", "read_at", "created_at" DESC);



CREATE INDEX "workspace_members_user_status_idx" ON "orbit"."workspace_members" USING "btree" ("user_id", "status");



CREATE OR REPLACE TRIGGER "boards_set_updated_at" BEFORE UPDATE ON "orbit"."boards" FOR EACH ROW EXECUTE FUNCTION "foundation"."set_updated_at"();



CREATE OR REPLACE TRIGGER "cards_set_updated_at" BEFORE UPDATE ON "orbit"."cards" FOR EACH ROW EXECUTE FUNCTION "foundation"."set_updated_at"();



CREATE OR REPLACE TRIGGER "columns_set_updated_at" BEFORE UPDATE ON "orbit"."columns" FOR EACH ROW EXECUTE FUNCTION "foundation"."set_updated_at"();



CREATE OR REPLACE TRIGGER "workspaces_set_updated_at" BEFORE UPDATE ON "orbit"."workspaces" FOR EACH ROW EXECUTE FUNCTION "foundation"."set_updated_at"();



ALTER TABLE ONLY "orbit"."activity_events"
    ADD CONSTRAINT "activity_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "iam"."profiles"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "orbit"."activity_events"
    ADD CONSTRAINT "activity_events_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "orbit"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."activity_events"
    ADD CONSTRAINT "activity_events_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "orbit"."activity_events"
    ADD CONSTRAINT "activity_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."attachments"
    ADD CONSTRAINT "attachments_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."attachments"
    ADD CONSTRAINT "attachments_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit"."attachments"
    ADD CONSTRAINT "attachments_workspace_id_board_id_card_id_fkey" FOREIGN KEY ("workspace_id", "board_id", "card_id") REFERENCES "orbit"."cards"("workspace_id", "board_id", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."board_favorites"
    ADD CONSTRAINT "board_favorites_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "orbit"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."board_favorites"
    ADD CONSTRAINT "board_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."board_favorites"
    ADD CONSTRAINT "board_favorites_workspace_id_board_id_fkey" FOREIGN KEY ("workspace_id", "board_id") REFERENCES "orbit"."boards"("workspace_id", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."board_members"
    ADD CONSTRAINT "board_members_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "orbit"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."board_members"
    ADD CONSTRAINT "board_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."board_members"
    ADD CONSTRAINT "board_members_workspace_id_board_id_fkey" FOREIGN KEY ("workspace_id", "board_id") REFERENCES "orbit"."boards"("workspace_id", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."board_members"
    ADD CONSTRAINT "board_members_workspace_id_user_id_fkey" FOREIGN KEY ("workspace_id", "user_id") REFERENCES "orbit"."workspace_members"("workspace_id", "user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."board_templates"
    ADD CONSTRAINT "board_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit"."board_templates"
    ADD CONSTRAINT "board_templates_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."boards"
    ADD CONSTRAINT "boards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit"."boards"
    ADD CONSTRAINT "boards_default_done_column_fkey" FOREIGN KEY ("default_done_column_id") REFERENCES "orbit"."columns"("id") DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "orbit"."boards"
    ADD CONSTRAINT "boards_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_assignees"
    ADD CONSTRAINT "card_assignees_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit"."card_assignees"
    ADD CONSTRAINT "card_assignees_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_assignees"
    ADD CONSTRAINT "card_assignees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_assignees"
    ADD CONSTRAINT "card_assignees_workspace_id_board_id_card_id_fkey" FOREIGN KEY ("workspace_id", "board_id", "card_id") REFERENCES "orbit"."cards"("workspace_id", "board_id", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_dependencies"
    ADD CONSTRAINT "card_dependencies_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_dependencies"
    ADD CONSTRAINT "card_dependencies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit"."card_dependencies"
    ADD CONSTRAINT "card_dependencies_depends_on_card_id_fkey" FOREIGN KEY ("depends_on_card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_dependencies"
    ADD CONSTRAINT "card_dependencies_workspace_id_board_id_card_id_fkey" FOREIGN KEY ("workspace_id", "board_id", "card_id") REFERENCES "orbit"."cards"("workspace_id", "board_id", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_labels"
    ADD CONSTRAINT "card_labels_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_labels"
    ADD CONSTRAINT "card_labels_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "orbit"."labels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_labels"
    ADD CONSTRAINT "card_labels_workspace_id_label_id_fkey" FOREIGN KEY ("workspace_id", "label_id") REFERENCES "orbit"."labels"("workspace_id", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_recurrence"
    ADD CONSTRAINT "card_recurrence_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_recurrence"
    ADD CONSTRAINT "card_recurrence_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit"."card_recurrence"
    ADD CONSTRAINT "card_recurrence_workspace_id_board_id_card_id_fkey" FOREIGN KEY ("workspace_id", "board_id", "card_id") REFERENCES "orbit"."cards"("workspace_id", "board_id", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_snoozes"
    ADD CONSTRAINT "card_snoozes_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_snoozes"
    ADD CONSTRAINT "card_snoozes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_watches"
    ADD CONSTRAINT "card_watches_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_watches"
    ADD CONSTRAINT "card_watches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_watches"
    ADD CONSTRAINT "card_watches_workspace_id_board_id_card_id_fkey" FOREIGN KEY ("workspace_id", "board_id", "card_id") REFERENCES "orbit"."cards"("workspace_id", "board_id", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."cards"
    ADD CONSTRAINT "cards_board_id_column_id_fkey" FOREIGN KEY ("board_id", "column_id") REFERENCES "orbit"."columns"("board_id", "id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit"."cards"
    ADD CONSTRAINT "cards_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "orbit"."columns"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit"."cards"
    ADD CONSTRAINT "cards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit"."cards"
    ADD CONSTRAINT "cards_workspace_id_board_id_fkey" FOREIGN KEY ("workspace_id", "board_id") REFERENCES "orbit"."boards"("workspace_id", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."checklist_items"
    ADD CONSTRAINT "checklist_items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "orbit"."checklists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."checklist_items"
    ADD CONSTRAINT "checklist_items_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "iam"."profiles"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "orbit"."checklists"
    ADD CONSTRAINT "checklists_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."checklists"
    ADD CONSTRAINT "checklists_workspace_id_board_id_card_id_fkey" FOREIGN KEY ("workspace_id", "board_id", "card_id") REFERENCES "orbit"."cards"("workspace_id", "board_id", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."columns"
    ADD CONSTRAINT "columns_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "orbit"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."columns"
    ADD CONSTRAINT "columns_workspace_id_board_id_fkey" FOREIGN KEY ("workspace_id", "board_id") REFERENCES "orbit"."boards"("workspace_id", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."comments"
    ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit"."comments"
    ADD CONSTRAINT "comments_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."comments"
    ADD CONSTRAINT "comments_workspace_id_board_id_card_id_fkey" FOREIGN KEY ("workspace_id", "board_id", "card_id") REFERENCES "orbit"."cards"("workspace_id", "board_id", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."labels"
    ADD CONSTRAINT "labels_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."notifications"
    ADD CONSTRAINT "notifications_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "orbit"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."notifications"
    ADD CONSTRAINT "notifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "orbit"."activity_events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "orbit"."notifications"
    ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."notifications"
    ADD CONSTRAINT "notifications_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."saved_views"
    ADD CONSTRAINT "saved_views_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "orbit"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."saved_views"
    ADD CONSTRAINT "saved_views_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."saved_views"
    ADD CONSTRAINT "saved_views_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."user_preferences"
    ADD CONSTRAINT "user_preferences_default_workspace_id_fkey" FOREIGN KEY ("default_workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "orbit"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."workspace_members"
    ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."workspaces"
    ADD CONSTRAINT "workspaces_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE "orbit"."activity_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activity_select_reader" ON "orbit"."activity_events" FOR SELECT TO "authenticated" USING ("orbit_private"."is_active_workspace_member"("workspace_id"));



ALTER TABLE "orbit"."attachments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "attachments_select_reader" ON "orbit"."attachments" FOR SELECT TO "authenticated" USING (("orbit_private"."can_read_board"("board_id") AND ("status" = 'ready'::"text") AND ("deleted_at" IS NULL)));



ALTER TABLE "orbit"."board_favorites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "board_favorites_select_self" ON "orbit"."board_favorites" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "orbit"."board_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "orbit"."board_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "board_templates_select" ON "orbit"."board_templates" FOR SELECT TO "authenticated" USING ("orbit_private"."is_active_workspace_member"("workspace_id"));



ALTER TABLE "orbit"."boards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "boards_select_reader" ON "orbit"."boards" FOR SELECT TO "authenticated" USING ("orbit_private"."can_read_board"("id"));



ALTER TABLE "orbit"."card_assignees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "card_assignees_select_reader" ON "orbit"."card_assignees" FOR SELECT TO "authenticated" USING ("orbit_private"."can_read_board"("board_id"));



ALTER TABLE "orbit"."card_dependencies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "card_dependencies_select" ON "orbit"."card_dependencies" FOR SELECT TO "authenticated" USING ("orbit_private"."can_read_board"("board_id"));



ALTER TABLE "orbit"."card_labels" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "card_labels_select_reader" ON "orbit"."card_labels" FOR SELECT TO "authenticated" USING ("orbit_private"."can_read_board"("board_id"));



ALTER TABLE "orbit"."card_recurrence" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "card_recurrence_select" ON "orbit"."card_recurrence" FOR SELECT TO "authenticated" USING ("orbit_private"."can_read_board"("board_id"));



ALTER TABLE "orbit"."card_snoozes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "card_snoozes_self" ON "orbit"."card_snoozes" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "orbit"."card_watches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "card_watches_select" ON "orbit"."card_watches" FOR SELECT TO "authenticated" USING ("orbit_private"."can_read_board"("board_id"));



ALTER TABLE "orbit"."cards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cards_select_reader" ON "orbit"."cards" FOR SELECT TO "authenticated" USING (("orbit_private"."can_read_board"("board_id") AND ("deleted_at" IS NULL)));



CREATE POLICY "cards_select_trashed" ON "orbit"."cards" FOR SELECT TO "authenticated" USING (("orbit_private"."can_edit_board"("board_id") AND ("deleted_at" IS NOT NULL)));



ALTER TABLE "orbit"."checklist_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "checklist_items_select_reader" ON "orbit"."checklist_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "orbit"."checklists" "checklist"
  WHERE (("checklist"."id" = "checklist_items"."checklist_id") AND "orbit_private"."can_read_board"("checklist"."board_id")))));



ALTER TABLE "orbit"."checklists" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "checklists_select_reader" ON "orbit"."checklists" FOR SELECT TO "authenticated" USING ("orbit_private"."can_read_board"("board_id"));



ALTER TABLE "orbit"."columns" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "columns_select_reader" ON "orbit"."columns" FOR SELECT TO "authenticated" USING ("orbit_private"."can_read_board"("board_id"));



ALTER TABLE "orbit"."comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comments_select_reader" ON "orbit"."comments" FOR SELECT TO "authenticated" USING (("orbit_private"."can_read_board"("board_id") AND ("deleted_at" IS NULL)));



ALTER TABLE "orbit"."labels" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "labels_select_member" ON "orbit"."labels" FOR SELECT TO "authenticated" USING ("orbit_private"."is_active_workspace_member"("workspace_id"));



ALTER TABLE "orbit"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_select_self" ON "orbit"."notifications" FOR SELECT TO "authenticated" USING (("recipient_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "orbit"."saved_views" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "saved_views_select" ON "orbit"."saved_views" FOR SELECT TO "authenticated" USING ((("owner_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("is_shared" AND "orbit_private"."is_active_workspace_member"("workspace_id"))));



ALTER TABLE "orbit"."user_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_preferences_self" ON "orbit"."user_preferences" TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "orbit"."workspace_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workspace_members_select_member" ON "orbit"."workspace_members" FOR SELECT TO "authenticated" USING ("orbit_private"."is_active_workspace_member"("workspace_id"));



ALTER TABLE "orbit"."workspaces" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workspaces_select_member" ON "orbit"."workspaces" FOR SELECT TO "authenticated" USING ("orbit_private"."is_active_workspace_member"("id"));



GRANT USAGE ON SCHEMA "orbit" TO "authenticated";
GRANT USAGE ON SCHEMA "orbit" TO "service_role";



REVOKE ALL ON FUNCTION "orbit"."accept_workspace_invitation"("p_token_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."accept_workspace_invitation"("p_token_hash" "text") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."add_card_dependency"("p_card_id" "uuid", "p_depends_on_card_id" "uuid", "p_dependency_type" "text") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."add_checklist_item"("p_checklist_id" "uuid", "p_body" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."add_comment"("p_card_id" "uuid", "p_body" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."add_comment"("p_card_id" "uuid", "p_body" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."archive_board"("p_board_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."archive_board"("p_board_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."archive_card"("p_card_id" "uuid", "p_expected_version" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."archive_card"("p_card_id" "uuid", "p_expected_version" integer) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."bulk_move_cards"("p_board_id" "uuid", "p_card_ids" "uuid"[], "p_target_column_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."create_board"("p_workspace_id" "uuid", "p_name" "text", "p_key" "text", "p_visibility" "orbit"."board_visibility") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."create_board"("p_workspace_id" "uuid", "p_name" "text", "p_key" "text", "p_visibility" "orbit"."board_visibility") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."create_card"("p_board_id" "uuid", "p_column_id" "uuid", "p_title" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."create_card"("p_board_id" "uuid", "p_column_id" "uuid", "p_title" "text") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."create_checklist"("p_card_id" "uuid", "p_title" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."create_column"("p_board_id" "uuid", "p_name" "text", "p_category" "orbit"."column_category") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."create_column"("p_board_id" "uuid", "p_name" "text", "p_category" "orbit"."column_category") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."create_label"("p_workspace_id" "uuid", "p_name" "text", "p_color_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."create_label"("p_workspace_id" "uuid", "p_name" "text", "p_color_token" "text") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."create_saved_view"("p_workspace_id" "uuid", "p_board_id" "uuid", "p_name" "text", "p_filters" "jsonb", "p_is_shared" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."create_workspace"("p_name" "text", "p_description" "text", "p_idempotency_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."create_workspace"("p_name" "text", "p_description" "text", "p_idempotency_key" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."create_workspace_invitation"("p_workspace_id" "uuid", "p_email" "text", "p_role" "orbit"."workspace_member_role", "p_token_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."create_workspace_invitation"("p_workspace_id" "uuid", "p_email" "text", "p_role" "orbit"."workspace_member_role", "p_token_hash" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."delete_column"("p_column_id" "uuid", "p_destination_column_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."delete_column"("p_column_id" "uuid", "p_destination_column_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."finalize_attachment_upload"("p_reservation_id" "uuid", "p_checksum" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."finalize_attachment_upload"("p_reservation_id" "uuid", "p_checksum" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."mark_all_notifications_read"() FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."mark_all_notifications_read"() TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."mark_notification_read"("p_notification_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."mark_notification_read"("p_notification_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."move_card"("p_card_id" "uuid", "p_target_column_id" "uuid", "p_rank" "text", "p_expected_version" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."move_card"("p_card_id" "uuid", "p_target_column_id" "uuid", "p_rank" "text", "p_expected_version" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."remove_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."remove_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."reserve_attachment_upload"("p_card_id" "uuid", "p_original_name" "text", "p_mime" "text", "p_bytes" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."reserve_attachment_upload"("p_card_id" "uuid", "p_original_name" "text", "p_mime" "text", "p_bytes" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."restore_board"("p_board_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."restore_board"("p_board_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."restore_card"("p_card_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."restore_card"("p_card_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."save_board_template"("p_board_id" "uuid", "p_name" "text", "p_description" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."set_card_assignee"("p_card_id" "uuid", "p_user_id" "uuid", "p_attach" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."set_card_assignee"("p_card_id" "uuid", "p_user_id" "uuid", "p_attach" boolean) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."set_card_recurrence"("p_card_id" "uuid", "p_cadence" "text", "p_interval_count" integer) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."snooze_card"("p_card_id" "uuid", "p_snooze_until" timestamp with time zone) TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."toggle_board_favorite"("p_board_id" "uuid", "p_favorite" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."toggle_board_favorite"("p_board_id" "uuid", "p_favorite" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."toggle_card_label"("p_card_id" "uuid", "p_label_id" "uuid", "p_attach" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."toggle_card_label"("p_card_id" "uuid", "p_label_id" "uuid", "p_attach" boolean) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."toggle_card_watch"("p_card_id" "uuid", "p_watch" boolean) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."toggle_checklist_item"("p_item_id" "uuid", "p_completed" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."trash_board"("p_board_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."trash_board"("p_board_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."trash_card"("p_card_id" "uuid", "p_expected_version" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."trash_card"("p_card_id" "uuid", "p_expected_version" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."unarchive_card"("p_card_id" "uuid", "p_expected_version" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."unarchive_card"("p_card_id" "uuid", "p_expected_version" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."update_board"("p_board_id" "uuid", "p_name" "text", "p_description" "text", "p_visibility" "orbit"."board_visibility", "p_expected_revision" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."update_board"("p_board_id" "uuid", "p_name" "text", "p_description" "text", "p_visibility" "orbit"."board_visibility", "p_expected_revision" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."update_card"("p_card_id" "uuid", "p_title" "text", "p_description" "text", "p_priority" "orbit"."card_priority", "p_due_date" "date", "p_expected_version" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."update_card"("p_card_id" "uuid", "p_title" "text", "p_description" "text", "p_priority" "orbit"."card_priority", "p_due_date" "date", "p_expected_version" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."update_column"("p_column_id" "uuid", "p_name" "text", "p_category" "orbit"."column_category") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."update_column"("p_column_id" "uuid", "p_name" "text", "p_category" "orbit"."column_category") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."update_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid", "p_role" "orbit"."workspace_member_role") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."update_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid", "p_role" "orbit"."workspace_member_role") TO "authenticated";



GRANT SELECT ON TABLE "orbit"."activity_events" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."attachments" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."board_favorites" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."board_members" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."board_templates" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."boards" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."card_assignees" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."card_dependencies" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."card_labels" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."card_recurrence" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."card_snoozes" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."card_watches" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."cards" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."checklist_items" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."checklists" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."columns" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."comments" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."labels" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."notifications" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."saved_views" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."user_preferences" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."workspace_members" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."workspaces" TO "authenticated";




