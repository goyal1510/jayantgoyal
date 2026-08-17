


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


CREATE SCHEMA IF NOT EXISTS "studio";


ALTER SCHEMA "studio" OWNER TO "postgres";


CREATE TYPE "studio"."game_session_status" AS ENUM (
    'waiting',
    'active',
    'completed',
    'abandoned'
);


ALTER TYPE "studio"."game_session_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."assert_file_actor"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "studio"."assert_file_actor"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."create_directory_path"("p_user_id" "uuid", "p_directory_path" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "studio"."create_directory_path"("p_user_id" "uuid", "p_directory_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."generate_storage_path"("p_user_id" "uuid", "p_file_name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $_$
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
$_$;


ALTER FUNCTION "studio"."generate_storage_path"("p_user_id" "uuid", "p_file_name" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "studio"."file_entries" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "bucket_id" "text" DEFAULT 'studio-files'::"text" NOT NULL,
    "storage_path" "text",
    "original_filename" "text",
    "display_name" "text",
    "mime_type" "text" NOT NULL,
    "size_bytes" bigint DEFAULT 0 NOT NULL,
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "is_directory" boolean DEFAULT false NOT NULL,
    "child_count" integer DEFAULT 0 NOT NULL,
    "file_type" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_deleted" boolean DEFAULT false NOT NULL,
    CONSTRAINT "file_entries_child_count_check" CHECK (("child_count" >= 0)),
    CONSTRAINT "file_entries_deletion_state_check" CHECK (("is_deleted" = ("deleted_at" IS NOT NULL))),
    CONSTRAINT "file_entries_size_check" CHECK (("size_bytes" >= 0))
);


ALTER TABLE "studio"."file_entries" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."get_file_by_path"("p_user_id" "uuid", "p_file_path" "text") RETURNS SETOF "studio"."file_entries"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "studio"."get_file_by_path"("p_user_id" "uuid", "p_file_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."handle_soft_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "studio"."handle_soft_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."list_directory"("p_user_id" "uuid", "p_directory_path" "text" DEFAULT '/'::"text") RETURNS TABLE("id" "uuid", "file_path" "text", "file_name" "text", "display_name" "text", "mime_type" "text", "size_bytes" bigint, "file_type" "text", "is_directory" boolean, "child_count" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "studio"."list_directory"("p_user_id" "uuid", "p_directory_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."record_game_action"("p_actor_user_id" "uuid", "p_session_id" "uuid", "p_participant_id" "uuid", "p_move_number" integer, "p_move_payload" "jsonb", "p_resulting_state" "jsonb", "p_next_turn_participant_id" "uuid", "p_winner_participant_id" "uuid", "p_session_status" "studio"."game_session_status", "p_completed_at" timestamp with time zone, "p_result_outcome" "text" DEFAULT NULL::"text", "p_result_winner_participant_id" "uuid" DEFAULT NULL::"uuid", "p_result_summary" "jsonb" DEFAULT NULL::"jsonb") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "studio"."record_game_action"("p_actor_user_id" "uuid", "p_session_id" "uuid", "p_participant_id" "uuid", "p_move_number" integer, "p_move_payload" "jsonb", "p_resulting_state" "jsonb", "p_next_turn_participant_id" "uuid", "p_winner_participant_id" "uuid", "p_session_status" "studio"."game_session_status", "p_completed_at" timestamp with time zone, "p_result_outcome" "text", "p_result_winner_participant_id" "uuid", "p_result_summary" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."soft_delete_file"("p_file_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "studio"."soft_delete_file"("p_file_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."update_parent_child_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "studio"."update_parent_child_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "studio"."validate_file_type"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "studio"."validate_file_type"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."activity_tracker_activities" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "name" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
);


ALTER TABLE "studio"."activity_tracker_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."activity_tracker_entries" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "completed" boolean DEFAULT false,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "studio"."activity_tracker_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."currency_calculation_denominations" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "calculation_id" "uuid" NOT NULL,
    "denomination" integer NOT NULL,
    "count" integer NOT NULL,
    "total" integer,
    "bundle_count" bigint,
    "open_count" bigint,
    CONSTRAINT "currency_denominations_value_check" CHECK ((("denomination" > 0) AND ("count" >= 0) AND (("total" IS NULL) OR ("total" >= 0)) AND (("bundle_count" IS NULL) OR ("bundle_count" >= 0)) AND (("open_count" IS NULL) OR ("open_count" >= 0))))
);


ALTER TABLE "studio"."currency_calculation_denominations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."currency_calculations" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "note" "text",
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "studio"."currency_calculations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."file_type_categories" (
    "type_name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "icon" "text",
    "allowed_mime_types" "text"[] NOT NULL,
    "max_size_bytes" bigint DEFAULT 104857600,
    "can_preview" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "studio"."file_type_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."game_session_moves" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "participant_id" "uuid" NOT NULL,
    "move_number" integer NOT NULL,
    "move_payload" "jsonb" NOT NULL,
    "resulting_state" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "game_hub_session_moves_move_number_check" CHECK (("move_number" > 0)),
    CONSTRAINT "game_hub_session_moves_move_payload_check" CHECK (("jsonb_typeof"("move_payload") = 'object'::"text"))
);


ALTER TABLE "studio"."game_session_moves" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."game_session_participants" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "seat" "text" NOT NULL,
    "is_host" boolean DEFAULT false NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "left_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "game_hub_session_participants_display_name_check" CHECK ((("char_length"("display_name") >= 1) AND ("char_length"("display_name") <= 80))),
    CONSTRAINT "game_hub_session_participants_seat_check" CHECK (("seat" ~ '^[A-Z0-9_-]{1,16}$'::"text"))
);


ALTER TABLE "studio"."game_session_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."game_session_results" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "winner_participant_id" "uuid",
    "outcome" "text" NOT NULL,
    "summary" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "game_hub_session_results_outcome_check" CHECK (("outcome" = ANY (ARRAY['win'::"text", 'draw'::"text", 'abandoned'::"text"])))
);


ALTER TABLE "studio"."game_session_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."game_sessions" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "room_code" "text" NOT NULL,
    "game_slug" "text" NOT NULL,
    "status" "studio"."game_session_status" DEFAULT 'waiting'::"studio"."game_session_status" NOT NULL,
    "max_players" smallint DEFAULT 2 NOT NULL,
    "created_by" "uuid" NOT NULL,
    "current_turn_participant_id" "uuid",
    "winner_participant_id" "uuid",
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "state" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '24:00:00'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "game_hub_sessions_game_slug_check" CHECK (("game_slug" = ANY (ARRAY['rock-paper-scissors'::"text", 'tic-tac-toe'::"text", 'dare-x'::"text", 'connect-four'::"text", 'memory-match'::"text", 'wordle'::"text", 'typing-speed'::"text", 'chess'::"text", 'ludo'::"text"]))),
    CONSTRAINT "game_hub_sessions_max_players_check" CHECK ((("max_players" >= 1) AND ("max_players" <= 8))),
    CONSTRAINT "game_hub_sessions_room_code_check" CHECK (("room_code" ~ '^[A-Z0-9]{6,10}$'::"text"))
);


ALTER TABLE "studio"."game_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."scratchpad_entries" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "entry_type" "text" NOT NULL,
    "language" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_read" boolean DEFAULT false,
    CONSTRAINT "scratchpad_entries_type_check" CHECK (("entry_type" = ANY (ARRAY['text'::"text", 'code'::"text"])))
);

ALTER TABLE ONLY "studio"."scratchpad_entries" REPLICA IDENTITY FULL;


ALTER TABLE "studio"."scratchpad_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."tool_favorites" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tool_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tool_favorites_tool_id_check" CHECK (("length"(TRIM(BOTH FROM "tool_id")) > 0))
);


ALTER TABLE "studio"."tool_favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."tool_history" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tool_id" "text" NOT NULL,
    "visited_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visit_count" integer DEFAULT 1 NOT NULL,
    CONSTRAINT "tool_history_tool_id_check" CHECK (("length"(TRIM(BOTH FROM "tool_id")) > 0)),
    CONSTRAINT "tool_history_visit_count_check" CHECK (("visit_count" > 0))
);


ALTER TABLE "studio"."tool_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "studio"."typing_test_results" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "wpm" integer NOT NULL,
    "accuracy" numeric(5,2) NOT NULL,
    "duration_seconds" integer NOT NULL,
    "total_characters" integer NOT NULL,
    "correct_characters" integer NOT NULL,
    "text_length" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "typing_test_results_metrics_check" CHECK ((("wpm" >= 0) AND (("accuracy" >= (0)::numeric) AND ("accuracy" <= (100)::numeric)) AND ("duration_seconds" > 0) AND ("total_characters" >= 0) AND (("correct_characters" >= 0) AND ("correct_characters" <= "total_characters")) AND ("text_length" >= 0)))
);


ALTER TABLE "studio"."typing_test_results" OWNER TO "postgres";


ALTER TABLE ONLY "studio"."activity_tracker_activities"
    ADD CONSTRAINT "activity_tracker_activities_id_user_key" UNIQUE ("id", "user_id");



ALTER TABLE ONLY "studio"."activity_tracker_activities"
    ADD CONSTRAINT "activity_tracker_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "studio"."activity_tracker_entries"
    ADD CONSTRAINT "activity_tracker_entries_activity_id_date_user_id_key" UNIQUE ("activity_id", "date", "user_id");



ALTER TABLE ONLY "studio"."activity_tracker_entries"
    ADD CONSTRAINT "activity_tracker_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "studio"."currency_calculation_denominations"
    ADD CONSTRAINT "currency_calculation_denominations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "studio"."currency_calculations"
    ADD CONSTRAINT "currency_calculations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "studio"."file_entries"
    ADD CONSTRAINT "file_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "studio"."file_entries"
    ADD CONSTRAINT "file_manager_files_user_id_file_path_is_deleted_key" UNIQUE ("user_id", "file_path", "is_deleted");



ALTER TABLE ONLY "studio"."file_type_categories"
    ADD CONSTRAINT "file_type_categories_pkey" PRIMARY KEY ("type_name");



ALTER TABLE ONLY "studio"."game_session_moves"
    ADD CONSTRAINT "game_hub_session_moves_session_move_key" UNIQUE ("session_id", "move_number");



ALTER TABLE ONLY "studio"."game_session_participants"
    ADD CONSTRAINT "game_hub_session_participants_session_user_key" UNIQUE ("session_id", "user_id");



ALTER TABLE ONLY "studio"."game_session_results"
    ADD CONSTRAINT "game_hub_session_results_session_key" UNIQUE ("session_id");



ALTER TABLE ONLY "studio"."game_sessions"
    ADD CONSTRAINT "game_hub_sessions_room_code_key" UNIQUE ("room_code");



ALTER TABLE ONLY "studio"."game_session_moves"
    ADD CONSTRAINT "game_session_moves_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "studio"."game_session_participants"
    ADD CONSTRAINT "game_session_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "studio"."game_session_results"
    ADD CONSTRAINT "game_session_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "studio"."game_sessions"
    ADD CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "studio"."scratchpad_entries"
    ADD CONSTRAINT "scratchpad_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "studio"."tool_favorites"
    ADD CONSTRAINT "tool_favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "studio"."tool_favorites"
    ADD CONSTRAINT "tool_favorites_user_tool_key" UNIQUE ("user_id", "tool_id");



ALTER TABLE ONLY "studio"."tool_history"
    ADD CONSTRAINT "tool_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "studio"."tool_history"
    ADD CONSTRAINT "tool_history_user_tool_key" UNIQUE ("user_id", "tool_id");



ALTER TABLE ONLY "studio"."typing_test_results"
    ADD CONSTRAINT "typing_test_results_pkey" PRIMARY KEY ("id");



CREATE INDEX "activity_entries_activity_owner_idx" ON "studio"."activity_tracker_entries" USING "btree" ("activity_id", "user_id");



CREATE UNIQUE INDEX "game_hub_session_participants_active_seat_key" ON "studio"."game_session_participants" USING "btree" ("session_id", "seat") WHERE ("left_at" IS NULL);



CREATE INDEX "game_session_moves_participant_idx" ON "studio"."game_session_moves" USING "btree" ("participant_id");



CREATE INDEX "game_session_results_winner_idx" ON "studio"."game_session_results" USING "btree" ("winner_participant_id") WHERE ("winner_participant_id" IS NOT NULL);



CREATE INDEX "game_sessions_current_turn_idx" ON "studio"."game_sessions" USING "btree" ("current_turn_participant_id") WHERE ("current_turn_participant_id" IS NOT NULL);



CREATE INDEX "game_sessions_winner_idx" ON "studio"."game_sessions" USING "btree" ("winner_participant_id") WHERE ("winner_participant_id" IS NOT NULL);



CREATE INDEX "idx_at_activities_user_id" ON "studio"."activity_tracker_activities" USING "btree" ("user_id");



CREATE INDEX "idx_at_entries_activity_id" ON "studio"."activity_tracker_entries" USING "btree" ("activity_id");



CREATE INDEX "idx_at_entries_date" ON "studio"."activity_tracker_entries" USING "btree" ("date");



CREATE INDEX "idx_at_entries_user_activity_date" ON "studio"."activity_tracker_entries" USING "btree" ("user_id", "activity_id", "date");



CREATE INDEX "idx_at_entries_user_id" ON "studio"."activity_tracker_entries" USING "btree" ("user_id");



CREATE INDEX "idx_currency_calculations_user_created" ON "studio"."currency_calculations" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_currency_denominations_calculation" ON "studio"."currency_calculation_denominations" USING "btree" ("calculation_id");



CREATE INDEX "idx_fm_files_created_at" ON "studio"."file_entries" USING "btree" ("created_at");



CREATE INDEX "idx_fm_files_file_path" ON "studio"."file_entries" USING "btree" ("file_path");



CREATE INDEX "idx_fm_files_file_type" ON "studio"."file_entries" USING "btree" ("file_type");



CREATE INDEX "idx_fm_files_is_directory" ON "studio"."file_entries" USING "btree" ("is_directory");



CREATE INDEX "idx_fm_files_parent_id" ON "studio"."file_entries" USING "btree" ("parent_id");



CREATE INDEX "idx_fm_files_path_prefix" ON "studio"."file_entries" USING "btree" ("user_id", "file_path" "text_pattern_ops") WHERE (NOT "is_deleted");



CREATE INDEX "idx_fm_files_user_id" ON "studio"."file_entries" USING "btree" ("user_id");



CREATE INDEX "idx_fm_files_user_parent" ON "studio"."file_entries" USING "btree" ("user_id", "parent_id") WHERE (NOT "is_deleted");



CREATE INDEX "idx_fm_files_user_parent_type" ON "studio"."file_entries" USING "btree" ("user_id", "parent_id", "file_type") WHERE (NOT "is_deleted");



CREATE INDEX "idx_game_hub_session_moves_session_number" ON "studio"."game_session_moves" USING "btree" ("session_id", "move_number");



CREATE INDEX "idx_game_hub_session_participants_session" ON "studio"."game_session_participants" USING "btree" ("session_id");



CREATE INDEX "idx_game_hub_session_participants_user" ON "studio"."game_session_participants" USING "btree" ("user_id");



CREATE INDEX "idx_game_hub_sessions_created_by" ON "studio"."game_sessions" USING "btree" ("created_by");



CREATE INDEX "idx_game_hub_sessions_room_code" ON "studio"."game_sessions" USING "btree" ("room_code");



CREATE INDEX "idx_game_hub_sessions_status_expires" ON "studio"."game_sessions" USING "btree" ("status", "expires_at");



CREATE INDEX "idx_gh_typing_created_at" ON "studio"."typing_test_results" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_gh_typing_user_id" ON "studio"."typing_test_results" USING "btree" ("user_id");



CREATE INDEX "idx_scratchpad_entries_created_at" ON "studio"."scratchpad_entries" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_scratchpad_entries_user_created" ON "studio"."scratchpad_entries" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_scratchpad_entries_user_id" ON "studio"."scratchpad_entries" USING "btree" ("user_id");



CREATE INDEX "idx_tool_favorites_user_created" ON "studio"."tool_favorites" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_tool_history_user_visited" ON "studio"."tool_history" USING "btree" ("user_id", "visited_at" DESC);



CREATE OR REPLACE TRIGGER "handle_soft_delete_trigger" BEFORE UPDATE ON "studio"."file_entries" FOR EACH ROW EXECUTE FUNCTION "studio"."handle_soft_delete"();



CREATE OR REPLACE TRIGGER "update_child_count_trigger" AFTER INSERT OR DELETE ON "studio"."file_entries" FOR EACH ROW EXECUTE FUNCTION "studio"."update_parent_child_count"();



CREATE OR REPLACE TRIGGER "update_game_hub_session_participants_updated_at" BEFORE UPDATE ON "studio"."game_session_participants" FOR EACH ROW EXECUTE FUNCTION "foundation"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_game_hub_sessions_updated_at" BEFORE UPDATE ON "studio"."game_sessions" FOR EACH ROW EXECUTE FUNCTION "foundation"."set_updated_at"();



CREATE OR REPLACE TRIGGER "update_scratchpad_entries_updated_at" BEFORE UPDATE ON "studio"."scratchpad_entries" FOR EACH ROW EXECUTE FUNCTION "foundation"."set_updated_at"();



CREATE OR REPLACE TRIGGER "validate_file_type_trigger" BEFORE INSERT OR UPDATE ON "studio"."file_entries" FOR EACH ROW EXECUTE FUNCTION "studio"."validate_file_type"();



ALTER TABLE ONLY "studio"."activity_tracker_activities"
    ADD CONSTRAINT "activity_tracker_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."activity_tracker_entries"
    ADD CONSTRAINT "activity_tracker_entries_activity_owner_fkey" FOREIGN KEY ("activity_id", "user_id") REFERENCES "studio"."activity_tracker_activities"("id", "user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."activity_tracker_entries"
    ADD CONSTRAINT "activity_tracker_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."currency_calculations"
    ADD CONSTRAINT "currency_calculator_calculations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."currency_calculation_denominations"
    ADD CONSTRAINT "currency_calculator_denominations_calc_fkey" FOREIGN KEY ("calculation_id") REFERENCES "studio"."currency_calculations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."file_entries"
    ADD CONSTRAINT "file_manager_files_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "studio"."file_entries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."file_entries"
    ADD CONSTRAINT "file_manager_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."game_session_moves"
    ADD CONSTRAINT "game_hub_session_moves_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "studio"."game_session_participants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."game_session_moves"
    ADD CONSTRAINT "game_hub_session_moves_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "studio"."game_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."game_session_participants"
    ADD CONSTRAINT "game_hub_session_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "studio"."game_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."game_session_participants"
    ADD CONSTRAINT "game_hub_session_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."game_session_results"
    ADD CONSTRAINT "game_hub_session_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "studio"."game_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."game_session_results"
    ADD CONSTRAINT "game_hub_session_results_winner_participant_id_fkey" FOREIGN KEY ("winner_participant_id") REFERENCES "studio"."game_session_participants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "studio"."game_sessions"
    ADD CONSTRAINT "game_hub_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."game_sessions"
    ADD CONSTRAINT "game_hub_sessions_current_turn_participant_id_fkey" FOREIGN KEY ("current_turn_participant_id") REFERENCES "studio"."game_session_participants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "studio"."game_sessions"
    ADD CONSTRAINT "game_hub_sessions_winner_participant_id_fkey" FOREIGN KEY ("winner_participant_id") REFERENCES "studio"."game_session_participants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "studio"."typing_test_results"
    ADD CONSTRAINT "game_hub_typing_speed_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."scratchpad_entries"
    ADD CONSTRAINT "scratchpad_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."tool_favorites"
    ADD CONSTRAINT "tool_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "studio"."tool_history"
    ADD CONSTRAINT "tool_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "activity_activities_delete_owned" ON "studio"."activity_tracker_activities" FOR DELETE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.activity.delete'::"text") AS "has_capability")));



CREATE POLICY "activity_activities_insert_owned" ON "studio"."activity_tracker_activities" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.activity.create'::"text") AS "has_capability")));



CREATE POLICY "activity_activities_select_owned" ON "studio"."activity_tracker_activities" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.activity.read'::"text") AS "has_capability")));



CREATE POLICY "activity_activities_update_owned" ON "studio"."activity_tracker_activities" FOR UPDATE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.activity.update'::"text") AS "has_capability"))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.activity.update'::"text") AS "has_capability")));



CREATE POLICY "activity_entries_delete_owned" ON "studio"."activity_tracker_entries" FOR DELETE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.activity.delete'::"text") AS "has_capability")));



CREATE POLICY "activity_entries_insert_owned" ON "studio"."activity_tracker_entries" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.activity.create'::"text") AS "has_capability")));



CREATE POLICY "activity_entries_select_owned" ON "studio"."activity_tracker_entries" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.activity.read'::"text") AS "has_capability")));



CREATE POLICY "activity_entries_update_owned" ON "studio"."activity_tracker_entries" FOR UPDATE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.activity.update'::"text") AS "has_capability"))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.activity.update'::"text") AS "has_capability")));



ALTER TABLE "studio"."activity_tracker_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."activity_tracker_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."currency_calculation_denominations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."currency_calculations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "currency_calculations_delete_owned" ON "studio"."currency_calculations" FOR DELETE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.calculator.delete'::"text") AS "has_capability")));



CREATE POLICY "currency_calculations_insert_owned" ON "studio"."currency_calculations" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.calculator.create'::"text") AS "has_capability")));



CREATE POLICY "currency_calculations_select_owned" ON "studio"."currency_calculations" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.calculator.read'::"text") AS "has_capability")));



CREATE POLICY "currency_calculations_update_owned" ON "studio"."currency_calculations" FOR UPDATE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.calculator.update'::"text") AS "has_capability"))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.calculator.update'::"text") AS "has_capability")));



CREATE POLICY "currency_denominations_delete_owned" ON "studio"."currency_calculation_denominations" FOR DELETE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "studio"."currency_calculations" "calculation"
  WHERE (("calculation"."id" = "currency_calculation_denominations"."calculation_id") AND ("calculation"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) AND ( SELECT "iam_private"."has_capability"('studio.calculator.delete'::"text") AS "has_capability")));



CREATE POLICY "currency_denominations_insert_owned" ON "studio"."currency_calculation_denominations" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "studio"."currency_calculations" "calculation"
  WHERE (("calculation"."id" = "currency_calculation_denominations"."calculation_id") AND ("calculation"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) AND ( SELECT "iam_private"."has_capability"('studio.calculator.create'::"text") AS "has_capability")));



CREATE POLICY "currency_denominations_select_owned" ON "studio"."currency_calculation_denominations" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "studio"."currency_calculations" "calculation"
  WHERE (("calculation"."id" = "currency_calculation_denominations"."calculation_id") AND ("calculation"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) AND ( SELECT "iam_private"."has_capability"('studio.calculator.read'::"text") AS "has_capability")));



CREATE POLICY "currency_denominations_update_owned" ON "studio"."currency_calculation_denominations" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "studio"."currency_calculations" "calculation"
  WHERE (("calculation"."id" = "currency_calculation_denominations"."calculation_id") AND ("calculation"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) AND ( SELECT "iam_private"."has_capability"('studio.calculator.update'::"text") AS "has_capability"))) WITH CHECK (((EXISTS ( SELECT 1
   FROM "studio"."currency_calculations" "calculation"
  WHERE (("calculation"."id" = "currency_calculation_denominations"."calculation_id") AND ("calculation"."user_id" = ( SELECT "auth"."uid"() AS "uid"))))) AND ( SELECT "iam_private"."has_capability"('studio.calculator.update'::"text") AS "has_capability")));



ALTER TABLE "studio"."file_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "file_entries_delete_owned" ON "studio"."file_entries" FOR DELETE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.files.delete'::"text") AS "has_capability")));



CREATE POLICY "file_entries_insert_owned" ON "studio"."file_entries" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.files.create'::"text") AS "has_capability")));



CREATE POLICY "file_entries_select_owned" ON "studio"."file_entries" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND (NOT "is_deleted") AND ( SELECT "iam_private"."has_capability"('studio.files.read'::"text") AS "has_capability")));



CREATE POLICY "file_entries_update_owned" ON "studio"."file_entries" FOR UPDATE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.files.update'::"text") AS "has_capability"))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.files.update'::"text") AS "has_capability")));



ALTER TABLE "studio"."file_type_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "file_type_categories_select_members" ON "studio"."file_type_categories" FOR SELECT TO "authenticated" USING (( SELECT "iam_private"."has_capability"('studio.files.read'::"text") AS "has_capability"));



CREATE POLICY "game_moves_select_participant" ON "studio"."game_session_moves" FOR SELECT TO "authenticated" USING ((( SELECT "iam_private"."has_capability"('studio.games.read'::"text") AS "has_capability") AND ( SELECT "iam_private"."is_active_game_participant"("game_session_moves"."session_id") AS "is_active_game_participant")));



CREATE POLICY "game_participants_select_joined_session" ON "studio"."game_session_participants" FOR SELECT TO "authenticated" USING ((( SELECT "iam_private"."has_capability"('studio.games.read'::"text") AS "has_capability") AND ( SELECT "iam_private"."is_active_game_participant"("game_session_participants"."session_id") AS "is_active_game_participant")));



CREATE POLICY "game_results_select_participant" ON "studio"."game_session_results" FOR SELECT TO "authenticated" USING ((( SELECT "iam_private"."has_capability"('studio.games.read'::"text") AS "has_capability") AND ( SELECT "iam_private"."is_active_game_participant"("game_session_results"."session_id") AS "is_active_game_participant")));



ALTER TABLE "studio"."game_session_moves" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."game_session_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."game_session_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "studio"."game_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "game_sessions_select_accessible" ON "studio"."game_sessions" FOR SELECT TO "authenticated" USING ((( SELECT "iam_private"."has_capability"('studio.games.read'::"text") AS "has_capability") AND (("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR ("status" = 'waiting'::"studio"."game_session_status") OR ( SELECT "iam_private"."is_active_game_participant"("game_sessions"."id") AS "is_active_game_participant"))));



CREATE POLICY "scratchpad_delete_owned" ON "studio"."scratchpad_entries" FOR DELETE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.scratchpad.delete'::"text") AS "has_capability")));



ALTER TABLE "studio"."scratchpad_entries" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scratchpad_insert_owned" ON "studio"."scratchpad_entries" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.scratchpad.create'::"text") AS "has_capability")));



CREATE POLICY "scratchpad_select_owned" ON "studio"."scratchpad_entries" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.scratchpad.read'::"text") AS "has_capability")));



CREATE POLICY "scratchpad_update_owned" ON "studio"."scratchpad_entries" FOR UPDATE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.scratchpad.update'::"text") AS "has_capability"))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.scratchpad.update'::"text") AS "has_capability")));



ALTER TABLE "studio"."tool_favorites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tool_favorites_delete_owned" ON "studio"."tool_favorites" FOR DELETE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.tools.delete'::"text") AS "has_capability")));



CREATE POLICY "tool_favorites_insert_owned" ON "studio"."tool_favorites" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.tools.create'::"text") AS "has_capability")));



CREATE POLICY "tool_favorites_select_owned" ON "studio"."tool_favorites" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.tools.read'::"text") AS "has_capability")));



ALTER TABLE "studio"."tool_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tool_history_delete_owned" ON "studio"."tool_history" FOR DELETE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.tools.delete'::"text") AS "has_capability")));



CREATE POLICY "tool_history_insert_owned" ON "studio"."tool_history" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.tools.create'::"text") AS "has_capability")));



CREATE POLICY "tool_history_select_owned" ON "studio"."tool_history" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.tools.read'::"text") AS "has_capability")));



CREATE POLICY "tool_history_update_owned" ON "studio"."tool_history" FOR UPDATE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.tools.update'::"text") AS "has_capability"))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.tools.update'::"text") AS "has_capability")));



CREATE POLICY "typing_results_insert_owned" ON "studio"."typing_test_results" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.typing.create'::"text") AS "has_capability")));



CREATE POLICY "typing_results_select_owned" ON "studio"."typing_test_results" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ( SELECT "iam_private"."has_capability"('studio.typing.read'::"text") AS "has_capability")));



ALTER TABLE "studio"."typing_test_results" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "studio" TO "authenticated";
GRANT USAGE ON SCHEMA "studio" TO "service_role";



GRANT ALL ON TYPE "studio"."game_session_status" TO "authenticated";
GRANT ALL ON TYPE "studio"."game_session_status" TO "service_role";



REVOKE ALL ON FUNCTION "studio"."assert_file_actor"("p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "studio"."assert_file_actor"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "studio"."assert_file_actor"("p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "studio"."create_directory_path"("p_user_id" "uuid", "p_directory_path" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "studio"."create_directory_path"("p_user_id" "uuid", "p_directory_path" "text") TO "service_role";
GRANT ALL ON FUNCTION "studio"."create_directory_path"("p_user_id" "uuid", "p_directory_path" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "studio"."generate_storage_path"("p_user_id" "uuid", "p_file_name" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "studio"."generate_storage_path"("p_user_id" "uuid", "p_file_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "studio"."generate_storage_path"("p_user_id" "uuid", "p_file_name" "text") TO "service_role";



GRANT ALL ON TABLE "studio"."file_entries" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "studio"."file_entries" TO "authenticated";



REVOKE ALL ON FUNCTION "studio"."get_file_by_path"("p_user_id" "uuid", "p_file_path" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "studio"."get_file_by_path"("p_user_id" "uuid", "p_file_path" "text") TO "service_role";
GRANT ALL ON FUNCTION "studio"."get_file_by_path"("p_user_id" "uuid", "p_file_path" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "studio"."handle_soft_delete"() FROM PUBLIC;
GRANT ALL ON FUNCTION "studio"."handle_soft_delete"() TO "service_role";



REVOKE ALL ON FUNCTION "studio"."list_directory"("p_user_id" "uuid", "p_directory_path" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "studio"."list_directory"("p_user_id" "uuid", "p_directory_path" "text") TO "service_role";
GRANT ALL ON FUNCTION "studio"."list_directory"("p_user_id" "uuid", "p_directory_path" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "studio"."record_game_action"("p_actor_user_id" "uuid", "p_session_id" "uuid", "p_participant_id" "uuid", "p_move_number" integer, "p_move_payload" "jsonb", "p_resulting_state" "jsonb", "p_next_turn_participant_id" "uuid", "p_winner_participant_id" "uuid", "p_session_status" "studio"."game_session_status", "p_completed_at" timestamp with time zone, "p_result_outcome" "text", "p_result_winner_participant_id" "uuid", "p_result_summary" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "studio"."record_game_action"("p_actor_user_id" "uuid", "p_session_id" "uuid", "p_participant_id" "uuid", "p_move_number" integer, "p_move_payload" "jsonb", "p_resulting_state" "jsonb", "p_next_turn_participant_id" "uuid", "p_winner_participant_id" "uuid", "p_session_status" "studio"."game_session_status", "p_completed_at" timestamp with time zone, "p_result_outcome" "text", "p_result_winner_participant_id" "uuid", "p_result_summary" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "studio"."soft_delete_file"("p_file_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "studio"."soft_delete_file"("p_file_id" "uuid", "p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "studio"."soft_delete_file"("p_file_id" "uuid", "p_user_id" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "studio"."update_parent_child_count"() FROM PUBLIC;
GRANT ALL ON FUNCTION "studio"."update_parent_child_count"() TO "service_role";



REVOKE ALL ON FUNCTION "studio"."validate_file_type"() FROM PUBLIC;
GRANT ALL ON FUNCTION "studio"."validate_file_type"() TO "service_role";



GRANT ALL ON TABLE "studio"."activity_tracker_activities" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "studio"."activity_tracker_activities" TO "authenticated";



GRANT ALL ON TABLE "studio"."activity_tracker_entries" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "studio"."activity_tracker_entries" TO "authenticated";



GRANT ALL ON TABLE "studio"."currency_calculation_denominations" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "studio"."currency_calculation_denominations" TO "authenticated";



GRANT ALL ON TABLE "studio"."currency_calculations" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "studio"."currency_calculations" TO "authenticated";



GRANT ALL ON TABLE "studio"."file_type_categories" TO "service_role";
GRANT SELECT ON TABLE "studio"."file_type_categories" TO "authenticated";



GRANT ALL ON TABLE "studio"."game_session_moves" TO "service_role";
GRANT SELECT ON TABLE "studio"."game_session_moves" TO "authenticated";



GRANT ALL ON TABLE "studio"."game_session_participants" TO "service_role";
GRANT SELECT ON TABLE "studio"."game_session_participants" TO "authenticated";



GRANT ALL ON TABLE "studio"."game_session_results" TO "service_role";
GRANT SELECT ON TABLE "studio"."game_session_results" TO "authenticated";



GRANT ALL ON TABLE "studio"."game_sessions" TO "service_role";
GRANT SELECT ON TABLE "studio"."game_sessions" TO "authenticated";



GRANT ALL ON TABLE "studio"."scratchpad_entries" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "studio"."scratchpad_entries" TO "authenticated";



GRANT ALL ON TABLE "studio"."tool_favorites" TO "service_role";
GRANT SELECT,INSERT,DELETE ON TABLE "studio"."tool_favorites" TO "authenticated";



GRANT ALL ON TABLE "studio"."tool_history" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "studio"."tool_history" TO "authenticated";



GRANT ALL ON TABLE "studio"."typing_test_results" TO "service_role";
GRANT SELECT,INSERT ON TABLE "studio"."typing_test_results" TO "authenticated";
