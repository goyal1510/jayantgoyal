


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
  v_target_board_id uuid;
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  if p_card_id = p_depends_on_card_id then
    raise exception 'card cannot depend on itself' using errcode = '22023';
  end if;

  select workspace_id, board_id into v_workspace_id, v_board_id
  from orbit.cards where id = p_card_id and deleted_at is null;
  if v_board_id is null then
    raise exception 'card not found' using errcode = 'P0002';
  end if;

  select board_id into v_target_board_id
  from orbit.cards where id = p_depends_on_card_id and deleted_at is null;
  if v_target_board_id is null or v_target_board_id <> v_board_id then
    raise exception 'dependencies must stay within one board' using errcode = '22023';
  end if;

  if not orbit_private.can_edit_board(v_board_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;

  if exists (
    with recursive chain as (
      select p_depends_on_card_id as card_id
      union
      select d.depends_on_card_id
      from orbit.card_dependencies d
      join chain c on d.card_id = c.card_id
    )
    select 1 from chain where card_id = p_card_id
  ) then
    raise exception 'dependency cycle detected' using errcode = '22023';
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


CREATE OR REPLACE FUNCTION "orbit"."archive_workspace"("p_workspace_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."archive_workspace"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."board_backlog_report"("p_board_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.can_read_board(p_board_id, v_user_id) then
    raise exception 'board read access required' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'metric', 'Backlog age',
    'definition', 'Average days since creation for cards not in done/cancelled columns.',
    'average_age_days', coalesce((
      select round(avg(extract(epoch from (now() - c.created_at)) / 86400.0)::numeric, 1)
      from orbit.cards c
      join orbit.columns col on col.id = c.column_id
      where c.board_id = p_board_id
        and c.deleted_at is null
        and col.category not in ('done', 'cancelled')
    ), 0)
  );
end;
$$;


ALTER FUNCTION "orbit"."board_backlog_report"("p_board_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."board_completion_report"("p_board_id" "uuid", "p_days" integer DEFAULT 30) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.can_read_board(p_board_id, v_user_id) then
    raise exception 'board read access required' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'metric', 'Cards completed in period',
    'definition', 'Counts cards with completed_at within the last N days on visible columns.',
    'days', p_days,
    'completed_count', (
      select count(*) from orbit.cards
      where board_id = p_board_id
        and completed_at >= now() - make_interval(days => greatest(p_days, 1))
        and deleted_at is null
    )
  );
end;
$$;


ALTER FUNCTION "orbit"."board_completion_report"("p_board_id" "uuid", "p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."bulk_archive_cards"("p_board_id" "uuid", "p_card_ids" "uuid"[]) RETURNS integer
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
  set archived_at = coalesce(archived_at, now()), version = version + 1
  where board_id = p_board_id and id = any (p_card_ids) and deleted_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


ALTER FUNCTION "orbit"."bulk_archive_cards"("p_board_id" "uuid", "p_card_ids" "uuid"[]) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "orbit"."bulk_trash_cards"("p_board_id" "uuid", "p_card_ids" "uuid"[]) RETURNS integer
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
  set deleted_at = coalesce(deleted_at, now()), version = version + 1
  where board_id = p_board_id and id = any (p_card_ids) and deleted_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


ALTER FUNCTION "orbit"."bulk_trash_cards"("p_board_id" "uuid", "p_card_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."cancel_workspace_deletion"("p_workspace_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."cancel_workspace_deletion"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."claim_webhook_deliveries"("p_limit" integer DEFAULT 25) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."claim_webhook_deliveries"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."create_api_token"("p_workspace_id" "uuid", "p_name" "text", "p_token_hash" "text", "p_token_prefix" "text", "p_scopes" "text"[] DEFAULT ARRAY['boards:read'::"text", 'cards:read'::"text"], "p_expires_at" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.is_workspace_admin(p_workspace_id, v_user_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;
  insert into orbit_private.api_tokens (
    workspace_id, user_id, name, token_hash, token_prefix, scopes, expires_at
  )
  values (
    p_workspace_id, v_user_id, trim(p_name), p_token_hash, p_token_prefix,
    coalesce(p_scopes, array['boards:read', 'cards:read']), p_expires_at
  )
  returning id into v_id;
  return v_id;
end;
$$;


ALTER FUNCTION "orbit"."create_api_token"("p_workspace_id" "uuid", "p_name" "text", "p_token_hash" "text", "p_token_prefix" "text", "p_scopes" "text"[], "p_expires_at" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."create_automation_rule"("p_board_id" "uuid", "p_name" "text", "p_trigger_type" "text", "p_trigger_config" "jsonb", "p_action_type" "text", "p_action_config" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.can_manage_board(p_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;
  select workspace_id into v_workspace_id from orbit.boards where id = p_board_id;
  insert into orbit.automation_rules (
    workspace_id, board_id, name, trigger_type, trigger_config, action_type, action_config, created_by
  )
  values (
    v_workspace_id, p_board_id, trim(p_name), p_trigger_type, p_trigger_config,
    p_action_type, p_action_config, v_user_id
  )
  returning id into v_id;
  return v_id;
end;
$$;


ALTER FUNCTION "orbit"."create_automation_rule"("p_board_id" "uuid", "p_name" "text", "p_trigger_type" "text", "p_trigger_config" "jsonb", "p_action_type" "text", "p_action_config" "jsonb") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "orbit"."create_board_from_template"("p_workspace_id" "uuid", "p_template_id" "uuid", "p_name" "text", "p_key" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_template orbit.board_templates%rowtype;
  v_board_id uuid;
  v_column jsonb;
  v_done_column_id uuid;
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

  update orbit.boards set default_done_column_id = null where id = v_board_id;
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

  select id into v_done_column_id
  from orbit.columns
  where board_id = v_board_id and category = 'done'
  order by rank
  limit 1;

  if v_done_column_id is null then
    select id into v_done_column_id
    from orbit.columns
    where board_id = v_board_id
    order by rank desc
    limit 1;
  end if;

  update orbit.boards
  set default_done_column_id = v_done_column_id
  where id = v_board_id;

  return v_board_id;
end;
$$;


ALTER FUNCTION "orbit"."create_board_from_template"("p_workspace_id" "uuid", "p_template_id" "uuid", "p_name" "text", "p_key" "text") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "orbit"."create_webhook_subscription"("p_workspace_id" "uuid", "p_url" "text", "p_secret_hash" "text", "p_signing_secret" "text" DEFAULT NULL::"text", "p_events" "text"[] DEFAULT ARRAY['card.created'::"text", 'card.moved'::"text"]) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."create_webhook_subscription"("p_workspace_id" "uuid", "p_url" "text", "p_secret_hash" "text", "p_signing_secret" "text", "p_events" "text"[]) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "orbit"."create_workspace_invitation"("p_workspace_id" "uuid", "p_email" "text", "p_role" "orbit"."workspace_member_role" DEFAULT 'member'::"orbit"."workspace_member_role", "p_token_hash" "text" DEFAULT NULL::"text", "p_board_scope" "jsonb" DEFAULT '[]'::"jsonb") RETURNS "uuid"
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


ALTER FUNCTION "orbit"."create_workspace_invitation"("p_workspace_id" "uuid", "p_email" "text", "p_role" "orbit"."workspace_member_role", "p_token_hash" "text", "p_board_scope" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."delete_automation_rule"("p_rule_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_board_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select board_id into v_board_id from orbit.automation_rules where id = p_rule_id;
  if not orbit_private.can_manage_board(v_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;
  delete from orbit.automation_rules where id = p_rule_id;
end;
$$;


ALTER FUNCTION "orbit"."delete_automation_rule"("p_rule_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "orbit"."finalize_webhook_delivery"("p_delivery_id" "uuid", "p_success" boolean, "p_http_status" integer DEFAULT NULL::integer, "p_error" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."finalize_webhook_delivery"("p_delivery_id" "uuid", "p_success" boolean, "p_http_status" integer, "p_error" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."get_published_board"("p_slug" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_row orbit.published_boards%rowtype;
begin
  select * into v_row
  from orbit.published_boards
  where slug = lower(trim(p_slug)) and revoked_at is null;
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'slug', v_row.slug,
    'published_at', v_row.published_at,
    'projection', v_row.projection
  );
end;
$$;


ALTER FUNCTION "orbit"."get_published_board"("p_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."get_workspace_export_manifest"("p_job_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."get_workspace_export_manifest"("p_job_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."link_card_github_issue"("p_card_id" "uuid", "p_issue_url" "text", "p_issue_title" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
  v_board_id uuid;
  v_repo text;
  v_number integer;
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select workspace_id, board_id into v_workspace_id, v_board_id
  from orbit.cards where id = p_card_id and deleted_at is null;
  if not orbit_private.can_edit_board(v_board_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;

  v_repo := (regexp_match(lower(trim(p_issue_url)), 'github\.com/([^/]+/[^/]+)/issues/([0-9]+)'))[1];
  v_number := (regexp_match(lower(trim(p_issue_url)), 'github\.com/([^/]+/[^/]+)/issues/([0-9]+)'))[2]::integer;
  if v_repo is null or v_number is null then
    raise exception 'unsupported GitHub issue URL' using errcode = '22023';
  end if;

  insert into orbit.card_github_links (
    workspace_id, board_id, card_id, repo_full_name, issue_number, issue_url, issue_title, created_by
  )
  values (v_workspace_id, v_board_id, p_card_id, v_repo, v_number, trim(p_issue_url), p_issue_title, v_user_id)
  returning id into v_id;
  return v_id;
end;
$$;


ALTER FUNCTION "orbit"."link_card_github_issue"("p_card_id" "uuid", "p_issue_url" "text", "p_issue_title" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."list_board_automation_rules"("p_board_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.can_read_board(p_board_id, v_user_id) then
    raise exception 'board read access required' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', r.id, 'name', r.name, 'enabled', r.enabled,
      'trigger_type', r.trigger_type, 'trigger_config', r.trigger_config,
      'action_type', r.action_type, 'action_config', r.action_config
    ) order by r.created_at)
    from orbit.automation_rules r where r.board_id = p_board_id
  ), '[]'::jsonb);
end;
$$;


ALTER FUNCTION "orbit"."list_board_automation_rules"("p_board_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."list_stale_cards"("p_board_id" "uuid", "p_days" integer DEFAULT 14) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.can_read_board(p_board_id, v_user_id) then
    raise exception 'board read access required' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'number', c.number, 'title', c.title, 'updated_at', c.updated_at
    ) order by c.updated_at)
    from orbit.cards c
    join orbit.columns col on col.id = c.column_id
    where c.board_id = p_board_id
      and c.deleted_at is null
      and c.archived_at is null
      and col.category not in ('done', 'cancelled')
      and c.updated_at < now() - make_interval(days => greatest(p_days, 1))
  ), '[]'::jsonb);
end;
$$;


ALTER FUNCTION "orbit"."list_stale_cards"("p_board_id" "uuid", "p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."list_webhook_deliveries"("p_workspace_id" "uuid", "p_limit" integer DEFAULT 25) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."list_webhook_deliveries"("p_workspace_id" "uuid", "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."list_workspace_api_tokens"("p_workspace_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.is_workspace_admin(p_workspace_id, v_user_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', t.id, 'name', t.name, 'token_prefix', t.token_prefix,
      'scopes', t.scopes, 'expires_at', t.expires_at, 'revoked_at', t.revoked_at, 'created_at', t.created_at
    ) order by t.created_at desc)
    from orbit_private.api_tokens t
    where t.workspace_id = p_workspace_id
  ), '[]'::jsonb);
end;
$$;


ALTER FUNCTION "orbit"."list_workspace_api_tokens"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."list_workspace_export_jobs"("p_workspace_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."list_workspace_export_jobs"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."list_workspace_webhooks"("p_workspace_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.is_workspace_admin(p_workspace_id, v_user_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', s.id, 'url', s.url, 'events', s.events, 'enabled', s.enabled, 'created_at', s.created_at
    ) order by s.created_at desc)
    from orbit_private.webhook_subscriptions s
    where s.workspace_id = p_workspace_id
  ), '[]'::jsonb);
end;
$$;


ALTER FUNCTION "orbit"."list_workspace_webhooks"("p_workspace_id" "uuid") OWNER TO "postgres";


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


ALTER FUNCTION "orbit"."move_card"("p_card_id" "uuid", "p_target_column_id" "uuid", "p_rank" "text", "p_expected_version" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."move_card_to_board"("p_card_id" "uuid", "p_target_board_id" "uuid", "p_target_column_id" "uuid", "p_rank" "text", "p_expected_version" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."move_card_to_board"("p_card_id" "uuid", "p_target_board_id" "uuid", "p_target_column_id" "uuid", "p_rank" "text", "p_expected_version" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."pause_card_recurrence"("p_card_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_board_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select board_id into v_board_id from orbit.cards where id = p_card_id;
  if not orbit_private.can_manage_board(v_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;
  update orbit.card_recurrence set active = false where card_id = p_card_id;
end;
$$;


ALTER FUNCTION "orbit"."pause_card_recurrence"("p_card_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."process_due_recurrences_worker"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  return orbit_private.process_due_recurrences();
end;
$$;


ALTER FUNCTION "orbit"."process_due_recurrences_worker"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."process_expired_trashed_cards"("p_limit" integer DEFAULT 100) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."process_expired_trashed_cards"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."process_pending_automation_events"("p_limit" integer DEFAULT 50) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."process_pending_automation_events"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."process_pending_export_jobs"("p_limit" integer DEFAULT 10) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_job orbit_private.export_jobs%rowtype;
  v_count integer := 0;
  v_manifest jsonb;
begin
  for v_job in
    select *
    from orbit_private.export_jobs
    where status = 'pending'
    order by created_at
    limit greatest(p_limit, 1)
    for update skip locked
  loop
    update orbit_private.export_jobs set status = 'processing' where id = v_job.id;

    select jsonb_build_object(
      'exportedAt', now(),
      'workspace', (
        select to_jsonb(w)
        from orbit.workspaces w
        where w.id = v_job.workspace_id
      ),
      'boards', coalesce((
        select jsonb_agg(to_jsonb(b))
        from orbit.boards b
        where b.workspace_id = v_job.workspace_id
      ), '[]'::jsonb),
      'cards', coalesce((
        select jsonb_agg(to_jsonb(c))
        from orbit.cards c
        where c.workspace_id = v_job.workspace_id
      ), '[]'::jsonb),
      'members', coalesce((
        select jsonb_agg(to_jsonb(m))
        from orbit.workspace_members m
        where m.workspace_id = v_job.workspace_id
      ), '[]'::jsonb)
    )
    into v_manifest;

    update orbit_private.export_jobs
    set
      status = 'ready',
      manifest = v_manifest,
      processed_at = now(),
      expires_at = now() + interval '7 days'
    where id = v_job.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;


ALTER FUNCTION "orbit"."process_pending_export_jobs"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."process_pending_import_jobs"("p_limit" integer DEFAULT 5) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."process_pending_import_jobs"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."process_pending_webhook_deliveries"("p_limit" integer DEFAULT 25) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."process_pending_webhook_deliveries"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."process_pending_workspace_purges"("p_limit" integer DEFAULT 5) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."process_pending_workspace_purges"("p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."publish_board"("p_board_id" "uuid", "p_slug" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
  v_projection jsonb;
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select workspace_id into v_workspace_id from orbit.boards where id = p_board_id;
  if not exists (
    select 1 from orbit.workspaces where id = v_workspace_id and owner_user_id = v_user_id
  ) then
    raise exception 'workspace owner required' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'board', jsonb_build_object('name', b.name, 'key', b.key),
    'columns', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'category', c.category) order by c.rank)
      from orbit.columns c where c.board_id = p_board_id
    ), '[]'::jsonb),
    'cards', coalesce((
      select jsonb_agg(jsonb_build_object(
        'number', card.number, 'title', card.title, 'column_id', card.column_id, 'priority', card.priority
      ) order by card.rank)
      from orbit.cards card
      where card.board_id = p_board_id and card.deleted_at is null and card.archived_at is null
    ), '[]'::jsonb)
  )
  into v_projection
  from orbit.boards b where b.id = p_board_id;

  insert into orbit.published_boards (workspace_id, board_id, slug, projection, published_by, revoked_at)
  values (v_workspace_id, p_board_id, lower(trim(p_slug)), v_projection, v_user_id, null)
  on conflict (board_id) do update
  set slug = excluded.slug,
      projection = excluded.projection,
      published_by = excluded.published_by,
      published_at = now(),
      revoked_at = null
  returning id into v_id;
  return v_id;
end;
$$;


ALTER FUNCTION "orbit"."publish_board"("p_board_id" "uuid", "p_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."remove_card_dependency"("p_dependency_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_board_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select board_id into v_board_id from orbit.card_dependencies where id = p_dependency_id;
  if not orbit_private.can_edit_board(v_board_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;
  delete from orbit.card_dependencies where id = p_dependency_id;
end;
$$;


ALTER FUNCTION "orbit"."remove_card_dependency"("p_dependency_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "orbit"."request_board_import"("p_board_id" "uuid", "p_payload" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_workspace_id uuid;
  v_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select workspace_id into v_workspace_id from orbit.boards where id = p_board_id;
  if not orbit_private.is_workspace_admin(v_workspace_id, v_user_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;
  insert into orbit_private.import_jobs (workspace_id, board_id, requester_id, payload)
  values (v_workspace_id, p_board_id, v_user_id, coalesce(p_payload, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;


ALTER FUNCTION "orbit"."request_board_import"("p_board_id" "uuid", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."request_workspace_deletion"("p_workspace_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."request_workspace_deletion"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."request_workspace_export"("p_workspace_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."request_workspace_export"("p_workspace_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "orbit"."restore_workspace"("p_workspace_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."restore_workspace"("p_workspace_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."resume_card_recurrence"("p_card_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_board_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select board_id into v_board_id from orbit.cards where id = p_card_id;
  if not orbit_private.can_manage_board(v_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;
  update orbit.card_recurrence set active = true where card_id = p_card_id;
end;
$$;


ALTER FUNCTION "orbit"."resume_card_recurrence"("p_card_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."revoke_api_token"("p_token_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_workspace_id uuid;
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  select workspace_id into v_workspace_id from orbit_private.api_tokens where id = p_token_id;
  if not orbit_private.is_workspace_admin(v_workspace_id, v_user_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;
  update orbit_private.api_tokens set revoked_at = now() where id = p_token_id;
end;
$$;


ALTER FUNCTION "orbit"."revoke_api_token"("p_token_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."revoke_published_board"("p_board_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_workspace_id uuid;
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  select workspace_id into v_workspace_id from orbit.boards where id = p_board_id;
  if not exists (
    select 1 from orbit.workspaces where id = v_workspace_id and owner_user_id = v_user_id
  ) then
    raise exception 'workspace owner required' using errcode = '42501';
  end if;
  update orbit.published_boards set revoked_at = now() where board_id = p_board_id and revoked_at is null;
end;
$$;


ALTER FUNCTION "orbit"."revoke_published_board"("p_board_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."revoke_webhook_subscription"("p_subscription_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_workspace_id uuid;
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  select workspace_id into v_workspace_id
  from orbit_private.webhook_subscriptions where id = p_subscription_id;
  if not orbit_private.is_workspace_admin(v_workspace_id, v_user_id) then
    raise exception 'workspace admin required' using errcode = '42501';
  end if;
  delete from orbit_private.webhook_subscriptions where id = p_subscription_id;
end;
$$;


ALTER FUNCTION "orbit"."revoke_webhook_subscription"("p_subscription_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "orbit"."seed_qa_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid", "p_role" "orbit"."workspace_member_role" DEFAULT 'member'::"orbit"."workspace_member_role") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into orbit.workspace_members (workspace_id, user_id, role, status)
  values (p_workspace_id, p_user_id, p_role, 'active')
  on conflict (workspace_id, user_id) do update
  set role = excluded.role, status = 'active', removed_at = null;
end;
$$;


ALTER FUNCTION "orbit"."seed_qa_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid", "p_role" "orbit"."workspace_member_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit"."set_ai_preference"("p_workspace_id" "uuid", "p_enabled" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := orbit_private.current_user_id();
begin
  perform orbit_private.require_orbit_access();
  if not orbit_private.is_active_workspace_member(p_workspace_id, v_user_id) then
    raise exception 'workspace membership required' using errcode = '42501';
  end if;
  insert into orbit.ai_preferences (user_id, workspace_id, enabled, updated_at)
  values (v_user_id, p_workspace_id, p_enabled, now())
  on conflict (user_id, workspace_id) do update
  set enabled = excluded.enabled, updated_at = now();
end;
$$;


ALTER FUNCTION "orbit"."set_ai_preference"("p_workspace_id" "uuid", "p_enabled" boolean) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "orbit"."set_card_recurrence"("p_card_id" "uuid", "p_cadence" "text", "p_interval_count" integer DEFAULT 1, "p_timezone" "text" DEFAULT 'UTC'::"text", "p_title_template" "text" DEFAULT NULL::"text") RETURNS "uuid"
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
  if not orbit_private.can_manage_board(v_board_id) then
    raise exception 'board manager access required' using errcode = '42501';
  end if;
  if p_cadence = 'weekly' then v_next := now() + make_interval(days => 7 * p_interval_count);
  elsif p_cadence = 'monthly' then v_next := now() + make_interval(days => 30 * p_interval_count);
  else v_next := now() + make_interval(days => p_interval_count);
  end if;
  insert into orbit.card_recurrence (
    workspace_id, board_id, card_id, cadence, interval_count, next_run_at, created_by, timezone, title_template, active
  )
  values (
    v_workspace_id, v_board_id, p_card_id, p_cadence, p_interval_count, v_next, v_user_id,
    coalesce(nullif(trim(p_timezone), ''), 'UTC'), p_title_template, true
  )
  on conflict (card_id) do update
  set cadence = excluded.cadence,
      interval_count = excluded.interval_count,
      next_run_at = excluded.next_run_at,
      timezone = excluded.timezone,
      title_template = excluded.title_template,
      active = true
  returning id into v_id;
  return v_id;
end;
$$;


ALTER FUNCTION "orbit"."set_card_recurrence"("p_card_id" "uuid", "p_cadence" "text", "p_interval_count" integer, "p_timezone" "text", "p_title_template" "text") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "orbit"."summarize_card"("p_card_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_user_id uuid := orbit_private.current_user_id();
  v_board_id uuid;
  v_workspace_id uuid;
  v_title text;
  v_description text;
  v_enabled boolean := false;
begin
  perform orbit_private.require_orbit_access();
  select workspace_id, board_id, title, description
  into v_workspace_id, v_board_id, v_title, v_description
  from orbit.cards where id = p_card_id and deleted_at is null;
  if not orbit_private.can_read_board(v_board_id, v_user_id) then
    raise exception 'board read access required' using errcode = '42501';
  end if;
  select enabled into v_enabled from orbit.ai_preferences
  where user_id = v_user_id and workspace_id = v_workspace_id;
  if coalesce(v_enabled, false) is not true then
    raise exception 'AI assistance is not enabled for this workspace' using errcode = '42501';
  end if;
  return trim(format(
    'Summary for "%s": %s',
    v_title,
    coalesce(nullif(left(regexp_replace(coalesce(v_description, ''), '\s+', ' ', 'g'), 240), ''), 'No description provided.')
  ));
end;
$$;


ALTER FUNCTION "orbit"."summarize_card"("p_card_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "orbit"."transfer_workspace_ownership"("p_workspace_id" "uuid", "p_target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."transfer_workspace_ownership"("p_workspace_id" "uuid", "p_target_user_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "orbit"."unlink_card_github_link"("p_link_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_board_id uuid;
begin
  perform orbit_private.require_orbit_access();
  select board_id into v_board_id from orbit.card_github_links where id = p_link_id;
  if not orbit_private.can_edit_board(v_board_id) then
    raise exception 'board edit access required' using errcode = '42501';
  end if;
  delete from orbit.card_github_links where id = p_link_id;
end;
$$;


ALTER FUNCTION "orbit"."unlink_card_github_link"("p_link_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "orbit"."update_github_link_metadata"("p_link_id" "uuid", "p_issue_title" "text", "p_issue_state" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."update_github_link_metadata"("p_link_id" "uuid", "p_issue_title" "text", "p_issue_state" "text") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "orbit"."verify_api_token"("p_token_hash" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit"."verify_api_token"("p_token_hash" "text") OWNER TO "postgres";

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


CREATE TABLE IF NOT EXISTS "orbit"."ai_preferences" (
    "user_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "enabled" boolean DEFAULT false NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "orbit"."ai_preferences" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "orbit"."automation_rules" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "trigger_type" "text" NOT NULL,
    "trigger_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "action_type" "text" NOT NULL,
    "action_config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "automation_rules_action_type_check" CHECK (("action_type" = ANY (ARRAY['set_label'::"text", 'add_comment'::"text"]))),
    CONSTRAINT "automation_rules_trigger_type_check" CHECK (("trigger_type" = ANY (ARRAY['card_moved'::"text", 'card_created'::"text"])))
);


ALTER TABLE "orbit"."automation_rules" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "orbit"."card_github_links" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "repo_full_name" "text" NOT NULL,
    "issue_number" integer NOT NULL,
    "issue_url" "text" NOT NULL,
    "issue_title" "text",
    "issue_state" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "orbit"."card_github_links" OWNER TO "postgres";


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
    "timezone" "text" DEFAULT 'UTC'::"text" NOT NULL,
    "title_template" "text",
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


CREATE TABLE IF NOT EXISTS "orbit"."published_boards" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "projection" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "field_allowlist" "text"[] DEFAULT ARRAY['title'::"text", 'column'::"text", 'priority'::"text"] NOT NULL,
    "published_by" "uuid" NOT NULL,
    "published_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone
);


ALTER TABLE "orbit"."published_boards" OWNER TO "postgres";


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



ALTER TABLE ONLY "orbit"."ai_preferences"
    ADD CONSTRAINT "ai_preferences_pkey" PRIMARY KEY ("user_id", "workspace_id");



ALTER TABLE ONLY "orbit"."attachments"
    ADD CONSTRAINT "attachments_object_key_key" UNIQUE ("object_key");



ALTER TABLE ONLY "orbit"."attachments"
    ADD CONSTRAINT "attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."automation_rules"
    ADD CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "orbit"."card_github_links"
    ADD CONSTRAINT "card_github_links_card_id_issue_url_key" UNIQUE ("card_id", "issue_url");



ALTER TABLE ONLY "orbit"."card_github_links"
    ADD CONSTRAINT "card_github_links_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "orbit"."published_boards"
    ADD CONSTRAINT "published_boards_board_id_key" UNIQUE ("board_id");



ALTER TABLE ONLY "orbit"."published_boards"
    ADD CONSTRAINT "published_boards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."published_boards"
    ADD CONSTRAINT "published_boards_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "orbit"."saved_views"
    ADD CONSTRAINT "saved_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "orbit"."workspace_members"
    ADD CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("workspace_id", "user_id");



ALTER TABLE ONLY "orbit"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



CREATE INDEX "automation_rules_board_idx" ON "orbit"."automation_rules" USING "btree" ("board_id", "enabled");



CREATE INDEX "boards_workspace_visibility_idx" ON "orbit"."boards" USING "btree" ("workspace_id", "visibility", "lifecycle");



CREATE INDEX "cards_board_column_rank_idx" ON "orbit"."cards" USING "btree" ("board_id", "column_id", "rank", "id") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "labels_workspace_name_idx" ON "orbit"."labels" USING "btree" ("workspace_id", "lower"("name"));



CREATE INDEX "notifications_recipient_read_idx" ON "orbit"."notifications" USING "btree" ("recipient_id", "read_at", "created_at" DESC);



CREATE INDEX "published_boards_active_idx" ON "orbit"."published_boards" USING "btree" ("slug") WHERE ("revoked_at" IS NULL);



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



ALTER TABLE ONLY "orbit"."ai_preferences"
    ADD CONSTRAINT "ai_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."ai_preferences"
    ADD CONSTRAINT "ai_preferences_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."attachments"
    ADD CONSTRAINT "attachments_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."attachments"
    ADD CONSTRAINT "attachments_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit"."attachments"
    ADD CONSTRAINT "attachments_workspace_id_board_id_card_id_fkey" FOREIGN KEY ("workspace_id", "board_id", "card_id") REFERENCES "orbit"."cards"("workspace_id", "board_id", "id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "orbit"."automation_rules"
    ADD CONSTRAINT "automation_rules_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "orbit"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."automation_rules"
    ADD CONSTRAINT "automation_rules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit"."automation_rules"
    ADD CONSTRAINT "automation_rules_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



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
    ADD CONSTRAINT "card_assignees_workspace_id_board_id_card_id_fkey" FOREIGN KEY ("workspace_id", "board_id", "card_id") REFERENCES "orbit"."cards"("workspace_id", "board_id", "id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "orbit"."card_dependencies"
    ADD CONSTRAINT "card_dependencies_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_dependencies"
    ADD CONSTRAINT "card_dependencies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit"."card_dependencies"
    ADD CONSTRAINT "card_dependencies_depends_on_card_id_fkey" FOREIGN KEY ("depends_on_card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_dependencies"
    ADD CONSTRAINT "card_dependencies_workspace_id_board_id_card_id_fkey" FOREIGN KEY ("workspace_id", "board_id", "card_id") REFERENCES "orbit"."cards"("workspace_id", "board_id", "id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "orbit"."card_github_links"
    ADD CONSTRAINT "card_github_links_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_github_links"
    ADD CONSTRAINT "card_github_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit"."card_github_links"
    ADD CONSTRAINT "card_github_links_workspace_id_board_id_card_id_fkey" FOREIGN KEY ("workspace_id", "board_id", "card_id") REFERENCES "orbit"."cards"("workspace_id", "board_id", "id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;



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
    ADD CONSTRAINT "card_recurrence_workspace_id_board_id_card_id_fkey" FOREIGN KEY ("workspace_id", "board_id", "card_id") REFERENCES "orbit"."cards"("workspace_id", "board_id", "id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "orbit"."card_snoozes"
    ADD CONSTRAINT "card_snoozes_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_snoozes"
    ADD CONSTRAINT "card_snoozes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_watches"
    ADD CONSTRAINT "card_watches_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_watches"
    ADD CONSTRAINT "card_watches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."card_watches"
    ADD CONSTRAINT "card_watches_workspace_id_board_id_card_id_fkey" FOREIGN KEY ("workspace_id", "board_id", "card_id") REFERENCES "orbit"."cards"("workspace_id", "board_id", "id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;



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
    ADD CONSTRAINT "checklists_workspace_id_board_id_card_id_fkey" FOREIGN KEY ("workspace_id", "board_id", "card_id") REFERENCES "orbit"."cards"("workspace_id", "board_id", "id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;



ALTER TABLE ONLY "orbit"."columns"
    ADD CONSTRAINT "columns_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "orbit"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."columns"
    ADD CONSTRAINT "columns_workspace_id_board_id_fkey" FOREIGN KEY ("workspace_id", "board_id") REFERENCES "orbit"."boards"("workspace_id", "id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."comments"
    ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit"."comments"
    ADD CONSTRAINT "comments_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."comments"
    ADD CONSTRAINT "comments_workspace_id_board_id_card_id_fkey" FOREIGN KEY ("workspace_id", "board_id", "card_id") REFERENCES "orbit"."cards"("workspace_id", "board_id", "id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;



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



ALTER TABLE ONLY "orbit"."published_boards"
    ADD CONSTRAINT "published_boards_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "orbit"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit"."published_boards"
    ADD CONSTRAINT "published_boards_published_by_fkey" FOREIGN KEY ("published_by") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit"."published_boards"
    ADD CONSTRAINT "published_boards_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



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



ALTER TABLE "orbit"."ai_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_preferences_self" ON "orbit"."ai_preferences" TO "authenticated" USING (("user_id" = "orbit_private"."current_user_id"())) WITH CHECK (("user_id" = "orbit_private"."current_user_id"()));



ALTER TABLE "orbit"."attachments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "attachments_select_reader" ON "orbit"."attachments" FOR SELECT TO "authenticated" USING (("orbit_private"."can_read_board"("board_id") AND ("status" = 'ready'::"text") AND ("deleted_at" IS NULL)));



ALTER TABLE "orbit"."automation_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "automation_rules_manage" ON "orbit"."automation_rules" TO "authenticated" USING ("orbit_private"."can_manage_board"("board_id")) WITH CHECK ("orbit_private"."can_manage_board"("board_id"));



CREATE POLICY "automation_rules_select" ON "orbit"."automation_rules" FOR SELECT TO "authenticated" USING ("orbit_private"."can_read_board"("board_id"));



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



ALTER TABLE "orbit"."card_github_links" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "card_github_links_manage" ON "orbit"."card_github_links" TO "authenticated" USING ("orbit_private"."can_edit_board"("board_id")) WITH CHECK ("orbit_private"."can_edit_board"("board_id"));



CREATE POLICY "card_github_links_select" ON "orbit"."card_github_links" FOR SELECT TO "authenticated" USING ("orbit_private"."can_read_board"("board_id"));



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



ALTER TABLE "orbit"."published_boards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "published_boards_manage" ON "orbit"."published_boards" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "orbit"."workspaces" "w"
  WHERE (("w"."id" = "published_boards"."workspace_id") AND ("w"."owner_user_id" = "orbit_private"."current_user_id"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "orbit"."workspaces" "w"
  WHERE (("w"."id" = "published_boards"."workspace_id") AND ("w"."owner_user_id" = "orbit_private"."current_user_id"())))));



CREATE POLICY "published_boards_select" ON "orbit"."published_boards" FOR SELECT TO "authenticated" USING ("orbit_private"."is_active_workspace_member"("workspace_id", "orbit_private"."current_user_id"()));



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



GRANT ALL ON FUNCTION "orbit"."archive_workspace"("p_workspace_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."board_backlog_report"("p_board_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."board_completion_report"("p_board_id" "uuid", "p_days" integer) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."bulk_archive_cards"("p_board_id" "uuid", "p_card_ids" "uuid"[]) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."bulk_move_cards"("p_board_id" "uuid", "p_card_ids" "uuid"[], "p_target_column_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."bulk_trash_cards"("p_board_id" "uuid", "p_card_ids" "uuid"[]) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."cancel_workspace_deletion"("p_workspace_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."claim_webhook_deliveries"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."claim_webhook_deliveries"("p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "orbit"."create_api_token"("p_workspace_id" "uuid", "p_name" "text", "p_token_hash" "text", "p_token_prefix" "text", "p_scopes" "text"[], "p_expires_at" timestamp with time zone) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."create_automation_rule"("p_board_id" "uuid", "p_name" "text", "p_trigger_type" "text", "p_trigger_config" "jsonb", "p_action_type" "text", "p_action_config" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."create_board"("p_workspace_id" "uuid", "p_name" "text", "p_key" "text", "p_visibility" "orbit"."board_visibility") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."create_board"("p_workspace_id" "uuid", "p_name" "text", "p_key" "text", "p_visibility" "orbit"."board_visibility") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."create_board_from_template"("p_workspace_id" "uuid", "p_template_id" "uuid", "p_name" "text", "p_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."create_board_from_template"("p_workspace_id" "uuid", "p_template_id" "uuid", "p_name" "text", "p_key" "text") TO "authenticated";



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



REVOKE ALL ON FUNCTION "orbit"."create_workspace_invitation"("p_workspace_id" "uuid", "p_email" "text", "p_role" "orbit"."workspace_member_role", "p_token_hash" "text", "p_board_scope" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."create_workspace_invitation"("p_workspace_id" "uuid", "p_email" "text", "p_role" "orbit"."workspace_member_role", "p_token_hash" "text", "p_board_scope" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."delete_automation_rule"("p_rule_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."delete_column"("p_column_id" "uuid", "p_destination_column_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."delete_column"("p_column_id" "uuid", "p_destination_column_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."finalize_attachment_upload"("p_reservation_id" "uuid", "p_checksum" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."finalize_attachment_upload"("p_reservation_id" "uuid", "p_checksum" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."finalize_webhook_delivery"("p_delivery_id" "uuid", "p_success" boolean, "p_http_status" integer, "p_error" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."finalize_webhook_delivery"("p_delivery_id" "uuid", "p_success" boolean, "p_http_status" integer, "p_error" "text") TO "service_role";



REVOKE ALL ON FUNCTION "orbit"."get_published_board"("p_slug" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."get_published_board"("p_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "orbit"."get_published_board"("p_slug" "text") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."get_workspace_export_manifest"("p_job_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."link_card_github_issue"("p_card_id" "uuid", "p_issue_url" "text", "p_issue_title" "text") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."list_board_automation_rules"("p_board_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."list_stale_cards"("p_board_id" "uuid", "p_days" integer) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."list_webhook_deliveries"("p_workspace_id" "uuid", "p_limit" integer) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."list_workspace_api_tokens"("p_workspace_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."list_workspace_export_jobs"("p_workspace_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."list_workspace_webhooks"("p_workspace_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."mark_all_notifications_read"() FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."mark_all_notifications_read"() TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."mark_notification_read"("p_notification_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."mark_notification_read"("p_notification_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."move_card"("p_card_id" "uuid", "p_target_column_id" "uuid", "p_rank" "text", "p_expected_version" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."move_card"("p_card_id" "uuid", "p_target_column_id" "uuid", "p_rank" "text", "p_expected_version" integer) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."move_card_to_board"("p_card_id" "uuid", "p_target_board_id" "uuid", "p_target_column_id" "uuid", "p_rank" "text", "p_expected_version" integer) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."pause_card_recurrence"("p_card_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."process_due_recurrences_worker"() FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."process_due_recurrences_worker"() TO "service_role";



REVOKE ALL ON FUNCTION "orbit"."process_expired_trashed_cards"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."process_expired_trashed_cards"("p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "orbit"."process_pending_automation_events"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."process_pending_automation_events"("p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "orbit"."process_pending_export_jobs"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."process_pending_export_jobs"("p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "orbit"."process_pending_import_jobs"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."process_pending_import_jobs"("p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "orbit"."process_pending_webhook_deliveries"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."process_pending_webhook_deliveries"("p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "orbit"."process_pending_workspace_purges"("p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."process_pending_workspace_purges"("p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "orbit"."publish_board"("p_board_id" "uuid", "p_slug" "text") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."remove_card_dependency"("p_dependency_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."remove_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."remove_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."request_board_import"("p_board_id" "uuid", "p_payload" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."request_workspace_deletion"("p_workspace_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."request_workspace_export"("p_workspace_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."reserve_attachment_upload"("p_card_id" "uuid", "p_original_name" "text", "p_mime" "text", "p_bytes" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."reserve_attachment_upload"("p_card_id" "uuid", "p_original_name" "text", "p_mime" "text", "p_bytes" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."restore_board"("p_board_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."restore_board"("p_board_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."restore_card"("p_card_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."restore_card"("p_card_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."restore_workspace"("p_workspace_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."resume_card_recurrence"("p_card_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."revoke_api_token"("p_token_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."revoke_published_board"("p_board_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."revoke_webhook_subscription"("p_subscription_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."save_board_template"("p_board_id" "uuid", "p_name" "text", "p_description" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."seed_qa_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid", "p_role" "orbit"."workspace_member_role") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."seed_qa_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid", "p_role" "orbit"."workspace_member_role") TO "service_role";



GRANT ALL ON FUNCTION "orbit"."set_ai_preference"("p_workspace_id" "uuid", "p_enabled" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."set_card_assignee"("p_card_id" "uuid", "p_user_id" "uuid", "p_attach" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."set_card_assignee"("p_card_id" "uuid", "p_user_id" "uuid", "p_attach" boolean) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."snooze_card"("p_card_id" "uuid", "p_snooze_until" timestamp with time zone) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."summarize_card"("p_card_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."toggle_board_favorite"("p_board_id" "uuid", "p_favorite" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."toggle_board_favorite"("p_board_id" "uuid", "p_favorite" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."toggle_card_label"("p_card_id" "uuid", "p_label_id" "uuid", "p_attach" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."toggle_card_label"("p_card_id" "uuid", "p_label_id" "uuid", "p_attach" boolean) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."toggle_card_watch"("p_card_id" "uuid", "p_watch" boolean) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."toggle_checklist_item"("p_item_id" "uuid", "p_completed" boolean) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."transfer_workspace_ownership"("p_workspace_id" "uuid", "p_target_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."trash_board"("p_board_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."trash_board"("p_board_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."trash_card"("p_card_id" "uuid", "p_expected_version" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."trash_card"("p_card_id" "uuid", "p_expected_version" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."unarchive_card"("p_card_id" "uuid", "p_expected_version" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."unarchive_card"("p_card_id" "uuid", "p_expected_version" integer) TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."unlink_card_github_link"("p_link_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."update_board"("p_board_id" "uuid", "p_name" "text", "p_description" "text", "p_visibility" "orbit"."board_visibility", "p_expected_revision" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."update_board"("p_board_id" "uuid", "p_name" "text", "p_description" "text", "p_visibility" "orbit"."board_visibility", "p_expected_revision" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."update_card"("p_card_id" "uuid", "p_title" "text", "p_description" "text", "p_priority" "orbit"."card_priority", "p_due_date" "date", "p_expected_version" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."update_card"("p_card_id" "uuid", "p_title" "text", "p_description" "text", "p_priority" "orbit"."card_priority", "p_due_date" "date", "p_expected_version" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."update_column"("p_column_id" "uuid", "p_name" "text", "p_category" "orbit"."column_category") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."update_column"("p_column_id" "uuid", "p_name" "text", "p_category" "orbit"."column_category") TO "authenticated";



GRANT ALL ON FUNCTION "orbit"."update_github_link_metadata"("p_link_id" "uuid", "p_issue_title" "text", "p_issue_state" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."update_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid", "p_role" "orbit"."workspace_member_role") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."update_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid", "p_role" "orbit"."workspace_member_role") TO "authenticated";



REVOKE ALL ON FUNCTION "orbit"."verify_api_token"("p_token_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit"."verify_api_token"("p_token_hash" "text") TO "service_role";



GRANT SELECT ON TABLE "orbit"."activity_events" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."ai_preferences" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."attachments" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."automation_rules" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."board_favorites" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."board_members" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."board_templates" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."boards" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."card_assignees" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."card_dependencies" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."card_github_links" TO "authenticated";



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



GRANT SELECT ON TABLE "orbit"."published_boards" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."saved_views" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."user_preferences" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."workspace_members" TO "authenticated";



GRANT SELECT ON TABLE "orbit"."workspaces" TO "authenticated";




