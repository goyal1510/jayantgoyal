


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


CREATE SCHEMA IF NOT EXISTS "orbit_private";


ALTER SCHEMA "orbit_private" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit_private"."current_user_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
  select auth.uid();
$$;


ALTER FUNCTION "orbit_private"."current_user_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit_private"."can_edit_board"("p_board_id" "uuid", "p_user_id" "uuid" DEFAULT "orbit_private"."current_user_id"()) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit_private"."can_edit_board"("p_board_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit_private"."can_manage_board"("p_board_id" "uuid", "p_user_id" "uuid" DEFAULT "orbit_private"."current_user_id"()) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit_private"."can_manage_board"("p_board_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit_private"."can_read_board"("p_board_id" "uuid", "p_user_id" "uuid" DEFAULT "orbit_private"."current_user_id"()) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit_private"."can_read_board"("p_board_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit_private"."is_active_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid" DEFAULT "orbit_private"."current_user_id"()) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from orbit.workspace_members member
    where member.workspace_id = p_workspace_id
      and member.user_id = p_user_id
      and member.status = 'active'
  );
$$;


ALTER FUNCTION "orbit_private"."is_active_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit_private"."is_workspace_admin"("p_workspace_id" "uuid", "p_user_id" "uuid" DEFAULT "orbit_private"."current_user_id"()) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit_private"."is_workspace_admin"("p_workspace_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit_private"."notify_card_event"("p_recipient_id" "uuid", "p_workspace_id" "uuid", "p_board_id" "uuid", "p_card_id" "uuid", "p_event_id" "uuid", "p_reason" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
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


ALTER FUNCTION "orbit_private"."notify_card_event"("p_recipient_id" "uuid", "p_workspace_id" "uuid", "p_board_id" "uuid", "p_card_id" "uuid", "p_event_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit_private"."process_due_recurrences"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_row orbit.card_recurrence%rowtype;
  v_count integer := 0;
  v_column_id uuid;
  v_title text;
  v_number integer;
  v_new_card_id uuid;
  v_occurrence timestamptz;
begin
  for v_row in
    select cr.*
    from orbit.card_recurrence cr
    join orbit.boards b on b.id = cr.board_id and b.lifecycle = 'active'
    where cr.active and cr.next_run_at <= now()
    for update of cr skip locked
  loop
    v_occurrence := v_row.next_run_at;
    if exists (
      select 1 from orbit_private.recurrence_occurrences
      where recurrence_id = v_row.id and occurrence_at = v_occurrence
    ) then
      update orbit.card_recurrence
      set next_run_at = next_run_at + (
        case v_row.cadence
          when 'weekly' then make_interval(days => 7 * v_row.interval_count)
          when 'monthly' then make_interval(days => 30 * v_row.interval_count)
          else make_interval(days => v_row.interval_count)
        end
      )
      where id = v_row.id;
      continue;
    end if;

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
      coalesce(v_row.title_template, v_title || ' (recurring)'),
      v_row.created_by
    )
    returning id into v_new_card_id;

    insert into orbit_private.recurrence_occurrences (recurrence_id, occurrence_at, card_id)
    values (v_row.id, v_occurrence, v_new_card_id);

    update orbit.card_recurrence
    set next_run_at = next_run_at + (
      case v_row.cadence
        when 'weekly' then make_interval(days => 7 * v_row.interval_count)
        when 'monthly' then make_interval(days => 30 * v_row.interval_count)
        else make_interval(days => v_row.interval_count)
      end
    )
    where id = v_row.id;

    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;


ALTER FUNCTION "orbit_private"."process_due_recurrences"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit_private"."queue_webhook_event"("p_workspace_id" "uuid", "p_event_type" "text", "p_payload" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into orbit_private.webhook_deliveries (subscription_id, event_type, payload)
  select s.id, p_event_type, p_payload
  from orbit_private.webhook_subscriptions s
  where s.workspace_id = p_workspace_id
    and s.enabled
    and p_event_type = any (s.events);
end;
$$;


ALTER FUNCTION "orbit_private"."queue_webhook_event"("p_workspace_id" "uuid", "p_event_type" "text", "p_payload" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "orbit_private"."require_orbit_access"() RETURNS "void"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if orbit_private.current_user_id() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not iam_private.user_has_product_access(orbit_private.current_user_id(), 'orbit') then
    raise exception 'orbit access required' using errcode = '42501';
  end if;
end;
$$;


ALTER FUNCTION "orbit_private"."require_orbit_access"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "orbit_private"."api_tokens" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "token_hash" "text" NOT NULL,
    "token_prefix" "text" NOT NULL,
    "scopes" "text"[] DEFAULT ARRAY['boards:read'::"text", 'cards:read'::"text"] NOT NULL,
    "expires_at" timestamp with time zone,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "orbit_private"."api_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit_private"."automation_runs" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "rule_id" "uuid" NOT NULL,
    "card_id" "uuid",
    "status" "text" NOT NULL,
    "detail" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "automation_runs_status_check" CHECK (("status" = ANY (ARRAY['completed'::"text", 'skipped'::"text", 'failed'::"text"])))
);


ALTER TABLE "orbit_private"."automation_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit_private"."board_sequences" (
    "board_id" "uuid" NOT NULL,
    "next_number" integer DEFAULT 1 NOT NULL,
    CONSTRAINT "board_sequences_next_number_check" CHECK (("next_number" > 0))
);


ALTER TABLE "orbit_private"."board_sequences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit_private"."command_receipts" (
    "actor_id" "uuid" NOT NULL,
    "command_name" "text" NOT NULL,
    "idempotency_key" "text" NOT NULL,
    "request_hash" "text" NOT NULL,
    "result_ref" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "orbit_private"."command_receipts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit_private"."export_jobs" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "manifest" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "object_key" "text",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone,
    CONSTRAINT "export_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'ready'::"text", 'failed'::"text"])))
);


ALTER TABLE "orbit_private"."export_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit_private"."import_jobs" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "source_format" "text" DEFAULT 'orbit_json'::"text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "result" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone,
    CONSTRAINT "import_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'ready'::"text", 'failed'::"text"])))
);


ALTER TABLE "orbit_private"."import_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit_private"."invitations" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "email_normalized" "text" NOT NULL,
    "workspace_role" "orbit"."workspace_member_role" NOT NULL,
    "token_hash" "text" NOT NULL,
    "inviter_id" "uuid" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "board_scope" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'revoked'::"text", 'expired'::"text"])))
);


ALTER TABLE "orbit_private"."invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit_private"."outbox_events" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "next_attempt_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "lease_expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone,
    CONSTRAINT "outbox_events_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'dead'::"text"])))
);


ALTER TABLE "orbit_private"."outbox_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit_private"."recurrence_occurrences" (
    "recurrence_id" "uuid" NOT NULL,
    "occurrence_at" timestamp with time zone NOT NULL,
    "card_id" "uuid" NOT NULL
);


ALTER TABLE "orbit_private"."recurrence_occurrences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit_private"."upload_reservations" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "board_id" "uuid" NOT NULL,
    "card_id" "uuid" NOT NULL,
    "uploader_id" "uuid" NOT NULL,
    "object_key" "text" NOT NULL,
    "reserved_bytes" bigint NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'reserved'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "original_name" "text",
    "mime" "text",
    CONSTRAINT "upload_reservations_reserved_bytes_check" CHECK (("reserved_bytes" > 0)),
    CONSTRAINT "upload_reservations_status_check" CHECK (("status" = ANY (ARRAY['reserved'::"text", 'finalized'::"text", 'expired'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "orbit_private"."upload_reservations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit_private"."webhook_deliveries" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone,
    "last_error" "text",
    "http_status" integer,
    "next_attempt_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "webhook_deliveries_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "orbit_private"."webhook_deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "orbit_private"."webhook_subscriptions" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "secret_hash" "text" NOT NULL,
    "events" "text"[] DEFAULT ARRAY['card.created'::"text", 'card.moved'::"text"] NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "signing_secret" "text",
    CONSTRAINT "webhook_subscriptions_url_https" CHECK (("url" ~* '^https://'::"text"))
);


ALTER TABLE "orbit_private"."webhook_subscriptions" OWNER TO "postgres";


ALTER TABLE ONLY "orbit_private"."api_tokens"
    ADD CONSTRAINT "api_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit_private"."api_tokens"
    ADD CONSTRAINT "api_tokens_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "orbit_private"."automation_runs"
    ADD CONSTRAINT "automation_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit_private"."board_sequences"
    ADD CONSTRAINT "board_sequences_pkey" PRIMARY KEY ("board_id");



ALTER TABLE ONLY "orbit_private"."command_receipts"
    ADD CONSTRAINT "command_receipts_pkey" PRIMARY KEY ("actor_id", "command_name", "idempotency_key");



ALTER TABLE ONLY "orbit_private"."export_jobs"
    ADD CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit_private"."import_jobs"
    ADD CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit_private"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit_private"."invitations"
    ADD CONSTRAINT "invitations_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "orbit_private"."outbox_events"
    ADD CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit_private"."recurrence_occurrences"
    ADD CONSTRAINT "recurrence_occurrences_pkey" PRIMARY KEY ("recurrence_id", "occurrence_at");



ALTER TABLE ONLY "orbit_private"."upload_reservations"
    ADD CONSTRAINT "upload_reservations_object_key_key" UNIQUE ("object_key");



ALTER TABLE ONLY "orbit_private"."upload_reservations"
    ADD CONSTRAINT "upload_reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit_private"."webhook_deliveries"
    ADD CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit_private"."webhook_subscriptions"
    ADD CONSTRAINT "webhook_subscriptions_pkey" PRIMARY KEY ("id");



CREATE INDEX "export_jobs_status_idx" ON "orbit_private"."export_jobs" USING "btree" ("status", "created_at");



CREATE INDEX "outbox_status_next_attempt_idx" ON "orbit_private"."outbox_events" USING "btree" ("status", "next_attempt_at");



CREATE INDEX "webhook_deliveries_pending_idx" ON "orbit_private"."webhook_deliveries" USING "btree" ("status", "next_attempt_at", "created_at") WHERE ("status" = ANY (ARRAY['pending'::"text", 'processing'::"text"]));



ALTER TABLE ONLY "orbit_private"."api_tokens"
    ADD CONSTRAINT "api_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."api_tokens"
    ADD CONSTRAINT "api_tokens_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."automation_runs"
    ADD CONSTRAINT "automation_runs_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "orbit_private"."automation_runs"
    ADD CONSTRAINT "automation_runs_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "orbit"."automation_rules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."board_sequences"
    ADD CONSTRAINT "board_sequences_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "orbit"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."command_receipts"
    ADD CONSTRAINT "command_receipts_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."export_jobs"
    ADD CONSTRAINT "export_jobs_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."export_jobs"
    ADD CONSTRAINT "export_jobs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."import_jobs"
    ADD CONSTRAINT "import_jobs_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "orbit"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."import_jobs"
    ADD CONSTRAINT "import_jobs_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."import_jobs"
    ADD CONSTRAINT "import_jobs_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."invitations"
    ADD CONSTRAINT "invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit_private"."invitations"
    ADD CONSTRAINT "invitations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."recurrence_occurrences"
    ADD CONSTRAINT "recurrence_occurrences_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."recurrence_occurrences"
    ADD CONSTRAINT "recurrence_occurrences_recurrence_id_fkey" FOREIGN KEY ("recurrence_id") REFERENCES "orbit"."card_recurrence"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."upload_reservations"
    ADD CONSTRAINT "upload_reservations_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "orbit"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."upload_reservations"
    ADD CONSTRAINT "upload_reservations_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."upload_reservations"
    ADD CONSTRAINT "upload_reservations_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."upload_reservations"
    ADD CONSTRAINT "upload_reservations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."webhook_deliveries"
    ADD CONSTRAINT "webhook_deliveries_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "orbit_private"."webhook_subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."webhook_subscriptions"
    ADD CONSTRAINT "webhook_subscriptions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit_private"."webhook_subscriptions"
    ADD CONSTRAINT "webhook_subscriptions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



GRANT USAGE ON SCHEMA "orbit_private" TO "service_role";



REVOKE ALL ON FUNCTION "orbit_private"."current_user_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit_private"."current_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "orbit_private"."current_user_id"() TO "service_role";



REVOKE ALL ON FUNCTION "orbit_private"."can_edit_board"("p_board_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit_private"."can_edit_board"("p_board_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "orbit_private"."can_edit_board"("p_board_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "orbit_private"."can_manage_board"("p_board_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit_private"."can_manage_board"("p_board_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "orbit_private"."can_manage_board"("p_board_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "orbit_private"."can_read_board"("p_board_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit_private"."can_read_board"("p_board_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "orbit_private"."can_read_board"("p_board_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "orbit_private"."is_active_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit_private"."is_active_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "orbit_private"."is_active_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "orbit_private"."is_workspace_admin"("p_workspace_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit_private"."is_workspace_admin"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "orbit_private"."is_workspace_admin"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "orbit_private"."notify_card_event"("p_recipient_id" "uuid", "p_workspace_id" "uuid", "p_board_id" "uuid", "p_card_id" "uuid", "p_event_id" "uuid", "p_reason" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit_private"."notify_card_event"("p_recipient_id" "uuid", "p_workspace_id" "uuid", "p_board_id" "uuid", "p_card_id" "uuid", "p_event_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "orbit_private"."notify_card_event"("p_recipient_id" "uuid", "p_workspace_id" "uuid", "p_board_id" "uuid", "p_card_id" "uuid", "p_event_id" "uuid", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "orbit_private"."process_due_recurrences"() FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit_private"."process_due_recurrences"() TO "service_role";



REVOKE ALL ON FUNCTION "orbit_private"."queue_webhook_event"("p_workspace_id" "uuid", "p_event_type" "text", "p_payload" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit_private"."queue_webhook_event"("p_workspace_id" "uuid", "p_event_type" "text", "p_payload" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "orbit_private"."require_orbit_access"() FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit_private"."require_orbit_access"() TO "authenticated";
GRANT ALL ON FUNCTION "orbit_private"."require_orbit_access"() TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "orbit_private"."api_tokens" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "orbit_private"."automation_runs" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "orbit_private"."export_jobs" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "orbit_private"."import_jobs" TO "service_role";



GRANT SELECT,INSERT ON TABLE "orbit_private"."recurrence_occurrences" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "orbit_private"."webhook_deliveries" TO "service_role";



GRANT SELECT,INSERT,UPDATE ON TABLE "orbit_private"."webhook_subscriptions" TO "service_role";




