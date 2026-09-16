


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


ALTER TABLE ONLY "orbit_private"."board_sequences"
    ADD CONSTRAINT "board_sequences_pkey" PRIMARY KEY ("board_id");



ALTER TABLE ONLY "orbit_private"."command_receipts"
    ADD CONSTRAINT "command_receipts_pkey" PRIMARY KEY ("actor_id", "command_name", "idempotency_key");



ALTER TABLE ONLY "orbit_private"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit_private"."invitations"
    ADD CONSTRAINT "invitations_token_hash_key" UNIQUE ("token_hash");



ALTER TABLE ONLY "orbit_private"."outbox_events"
    ADD CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "orbit_private"."upload_reservations"
    ADD CONSTRAINT "upload_reservations_object_key_key" UNIQUE ("object_key");



ALTER TABLE ONLY "orbit_private"."upload_reservations"
    ADD CONSTRAINT "upload_reservations_pkey" PRIMARY KEY ("id");



CREATE INDEX "outbox_status_next_attempt_idx" ON "orbit_private"."outbox_events" USING "btree" ("status", "next_attempt_at");



ALTER TABLE ONLY "orbit_private"."board_sequences"
    ADD CONSTRAINT "board_sequences_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "orbit"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."command_receipts"
    ADD CONSTRAINT "command_receipts_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."invitations"
    ADD CONSTRAINT "invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "iam"."profiles"("user_id") ON DELETE RESTRICT;



ALTER TABLE ONLY "orbit_private"."invitations"
    ADD CONSTRAINT "invitations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."upload_reservations"
    ADD CONSTRAINT "upload_reservations_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "orbit"."boards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."upload_reservations"
    ADD CONSTRAINT "upload_reservations_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "orbit"."cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."upload_reservations"
    ADD CONSTRAINT "upload_reservations_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "iam"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "orbit_private"."upload_reservations"
    ADD CONSTRAINT "upload_reservations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "orbit"."workspaces"("id") ON DELETE CASCADE;



GRANT USAGE ON SCHEMA "orbit_private" TO "service_role";



REVOKE ALL ON FUNCTION "orbit_private"."current_user_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit_private"."current_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "orbit_private"."current_user_id"() TO "service_role";



REVOKE ALL ON FUNCTION "orbit_private"."can_edit_board"("p_board_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit_private"."can_edit_board"("p_board_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "orbit_private"."can_edit_board"("p_board_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "orbit_private"."can_read_board"("p_board_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit_private"."can_read_board"("p_board_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "orbit_private"."can_read_board"("p_board_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "orbit_private"."is_active_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit_private"."is_active_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "orbit_private"."is_active_workspace_member"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "orbit_private"."is_workspace_admin"("p_workspace_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit_private"."is_workspace_admin"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "orbit_private"."is_workspace_admin"("p_workspace_id" "uuid", "p_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "orbit_private"."require_orbit_access"() FROM PUBLIC;
GRANT ALL ON FUNCTION "orbit_private"."require_orbit_access"() TO "authenticated";
GRANT ALL ON FUNCTION "orbit_private"."require_orbit_access"() TO "service_role";




