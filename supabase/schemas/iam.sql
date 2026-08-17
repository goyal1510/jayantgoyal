


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


CREATE SCHEMA IF NOT EXISTS "iam";


ALTER SCHEMA "iam" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iam"."count_my_sessions"() RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select count(*)::integer
  from auth.sessions session
  where session.user_id = (select auth.uid())
    and (session.not_after is null or session.not_after > now());
$$;


ALTER FUNCTION "iam"."count_my_sessions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iam"."has_capability"("p_capability_key" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select coalesce(iam_private.has_capability(p_capability_key), false);
$$;


ALTER FUNCTION "iam"."has_capability"("p_capability_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iam"."has_product_access"("p_product_key" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select coalesce(iam_private.has_product_access(p_product_key), false);
$$;


ALTER FUNCTION "iam"."has_product_access"("p_product_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iam"."list_my_capabilities"() RETURNS TABLE("capability_key" "text")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select capability.key
  from iam.capabilities capability
  where iam_private.has_capability(capability.key)
  order by capability.key;
$$;


ALTER FUNCTION "iam"."list_my_capabilities"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iam"."revoke_admin_access"("p_actor_user_id" "uuid", "p_target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  now_at timestamptz := now();
begin
  if p_actor_user_id = p_target_user_id then
    raise exception using errcode = '22023', message = 'Self access changes are not allowed';
  end if;
  if not iam_private.user_has_capability(
    p_actor_user_id,
    'admin.users.delete'
  ) then
    raise exception using errcode = '42501', message = 'Admin access revocation is not allowed';
  end if;

  delete from iam.product_role_assignments
  where product_key = 'admin'
    and user_id = p_target_user_id;

  update iam.product_memberships
  set status = 'revoked',
      revoked_by = p_actor_user_id,
      revoked_at = now_at
  where product_key = 'admin'
    and user_id = p_target_user_id;

  insert into iam.access_audit_events (
    actor_user_id,
    target_user_id,
    product_key,
    action,
    subject_type,
    subject_key,
    source
  )
  values (
    p_actor_user_id,
    p_target_user_id,
    'admin',
    'access_revoked',
    'product_membership',
    'admin',
    'admin_web'
  );
end;
$$;


ALTER FUNCTION "iam"."revoke_admin_access"("p_actor_user_id" "uuid", "p_target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "iam"."set_admin_access"("p_actor_user_id" "uuid", "p_target_user_id" "uuid", "p_role_key" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  existing_access boolean;
  required_capability text;
  now_at timestamptz := now();
begin
  if p_actor_user_id = p_target_user_id then
    raise exception using errcode = '22023', message = 'Self access changes are not allowed';
  end if;
  if p_role_key not in ('admin.viewer', 'admin.full_access') then
    raise exception using errcode = '22023', message = 'Invalid Admin role';
  end if;
  if not exists (select 1 from auth.users where id = p_target_user_id) then
    raise exception using errcode = 'P0002', message = 'Target user not found';
  end if;

  select exists (
    select 1
    from iam.product_memberships membership
    where membership.product_key = 'admin'
      and membership.user_id = p_target_user_id
      and membership.status = 'active'
  ) into existing_access;
  required_capability := case
    when existing_access then 'admin.users.update'
    else 'admin.users.create'
  end;

  if not iam_private.user_has_capability(
    p_actor_user_id,
    required_capability
  ) then
    raise exception using errcode = '42501', message = 'Admin access change is not allowed';
  end if;

  insert into iam.product_memberships as membership (
    product_key,
    user_id,
    status,
    valid_from,
    expires_at,
    granted_by,
    granted_at,
    revoked_by,
    revoked_at
  )
  values
    ('admin', p_target_user_id, 'active', now_at, null, p_actor_user_id, now_at, null, null),
    ('portfolio', p_target_user_id, 'active', now_at, null, p_actor_user_id, now_at, null, null)
  on conflict (product_key, user_id) do update
  set status = 'active',
      valid_from = excluded.valid_from,
      expires_at = null,
      granted_by = excluded.granted_by,
      granted_at = excluded.granted_at,
      revoked_by = null,
      revoked_at = null;

  delete from iam.product_role_assignments
  where product_key = 'admin'
    and user_id = p_target_user_id;

  insert into iam.product_role_assignments (
    product_key,
    user_id,
    role_key,
    assigned_by,
    assigned_at
  )
  values ('admin', p_target_user_id, p_role_key, p_actor_user_id, now_at);

  insert into iam.access_audit_events (
    actor_user_id,
    target_user_id,
    product_key,
    action,
    subject_type,
    subject_key,
    source
  )
  values (
    p_actor_user_id,
    p_target_user_id,
    'admin',
    case when existing_access then 'access_updated' else 'access_created' end,
    'product_role_assignment',
    p_role_key,
    'admin_web'
  );
end;
$$;


ALTER FUNCTION "iam"."set_admin_access"("p_actor_user_id" "uuid", "p_target_user_id" "uuid", "p_role_key" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "iam"."access_audit_events" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "actor_user_id" "uuid",
    "target_user_id" "uuid",
    "product_key" "text",
    "workforce_id" "uuid",
    "action" "text" NOT NULL,
    "subject_type" "text" NOT NULL,
    "subject_key" "text",
    "request_id" "text",
    "source" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "access_audit_events_action_check" CHECK ((NULLIF("btrim"("action"), ''::"text") IS NOT NULL)),
    CONSTRAINT "access_audit_events_metadata_check" CHECK (("jsonb_typeof"("metadata") = 'object'::"text")),
    CONSTRAINT "access_audit_events_source_check" CHECK (("source" = ANY (ARRAY['migration'::"text", 'admin_web'::"text", 'trusted_backend'::"text", 'system'::"text"]))),
    CONSTRAINT "access_audit_events_subject_type_check" CHECK ((NULLIF("btrim"("subject_type"), ''::"text") IS NOT NULL))
);


ALTER TABLE "iam"."access_audit_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iam"."capabilities" (
    "key" "text" NOT NULL,
    "product_key" "text" NOT NULL,
    "resource" "text" NOT NULL,
    "action" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "is_sensitive" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "capabilities_action_check" CHECK (("action" ~ '^[a-z][a-z0-9_]*$'::"text")),
    CONSTRAINT "capabilities_key_check" CHECK (("key" ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'::"text")),
    CONSTRAINT "capabilities_key_parts_check" CHECK (("key" = (((("product_key" || '.'::"text") || "resource") || '.'::"text") || "action"))),
    CONSTRAINT "capabilities_resource_check" CHECK (("resource" ~ '^[a-z][a-z0-9_]*$'::"text"))
);


ALTER TABLE "iam"."capabilities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iam"."policy_acceptances" (
    "user_id" "uuid" NOT NULL,
    "policy_version_id" "uuid" NOT NULL,
    "accepted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "acceptance_source" "text" DEFAULT 'web'::"text" NOT NULL,
    CONSTRAINT "policy_acceptances_source_check" CHECK (("acceptance_source" = ANY (ARRAY['web'::"text", 'native'::"text", 'migration'::"text", 'operator'::"text"])))
);


ALTER TABLE "iam"."policy_acceptances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iam"."policy_versions" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "product_key" "text" NOT NULL,
    "policy_key" "text" NOT NULL,
    "version" "text" NOT NULL,
    "effective_at" timestamp with time zone NOT NULL,
    "is_required" boolean DEFAULT true NOT NULL,
    "retired_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "policy_versions_key_check" CHECK (("policy_key" ~ '^[a-z][a-z0-9_]*$'::"text")),
    CONSTRAINT "policy_versions_retirement_check" CHECK ((("retired_at" IS NULL) OR ("retired_at" > "effective_at"))),
    CONSTRAINT "policy_versions_version_check" CHECK ((NULLIF("btrim"("version"), ''::"text") IS NOT NULL))
);


ALTER TABLE "iam"."policy_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iam"."product_memberships" (
    "product_key" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "valid_from" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "granted_by" "uuid",
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_by" "uuid",
    "revoked_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "product_memberships_expiry_check" CHECK ((("expires_at" IS NULL) OR ("expires_at" > "valid_from"))),
    CONSTRAINT "product_memberships_revocation_check" CHECK (((("status" = 'revoked'::"text") AND ("revoked_at" IS NOT NULL)) OR (("status" <> 'revoked'::"text") AND ("revoked_at" IS NULL) AND ("revoked_by" IS NULL)))),
    CONSTRAINT "product_memberships_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'suspended'::"text", 'revoked'::"text"])))
);


ALTER TABLE "iam"."product_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iam"."product_role_assignments" (
    "product_key" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_key" "text" NOT NULL,
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    CONSTRAINT "product_role_assignments_expiry_check" CHECK ((("expires_at" IS NULL) OR ("expires_at" > "assigned_at")))
);


ALTER TABLE "iam"."product_role_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iam"."products" (
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "products_key_check" CHECK (("key" ~ '^[a-z][a-z0-9_]*$'::"text")),
    CONSTRAINT "products_name_check" CHECK ((NULLIF("btrim"("name"), ''::"text") IS NOT NULL)),
    CONSTRAINT "products_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'disabled'::"text"])))
);


ALTER TABLE "iam"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iam"."profiles" (
    "user_id" "uuid" NOT NULL,
    "first_name" "text" DEFAULT ''::"text" NOT NULL,
    "last_name" "text" DEFAULT ''::"text" NOT NULL,
    "avatar_url" "text",
    "avatar_mode" "text" DEFAULT 'provider'::"text" NOT NULL,
    "avatar_provider" "text",
    "avatar_storage_path" "text",
    "avatar_updated_at" timestamp with time zone,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_avatar_mode_check" CHECK (("avatar_mode" = ANY (ARRAY['provider'::"text", 'upload'::"text", 'initials'::"text"]))),
    CONSTRAINT "profiles_avatar_upload_path_check" CHECK ((("avatar_mode" <> 'upload'::"text") OR (NULLIF("btrim"("avatar_storage_path"), ''::"text") IS NOT NULL))),
    CONSTRAINT "profiles_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'suspended'::"text", 'deactivated'::"text"])))
);


ALTER TABLE "iam"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iam"."role_capabilities" (
    "role_key" "text" NOT NULL,
    "capability_key" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "iam"."role_capabilities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iam"."roles" (
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "scope_type" "text" NOT NULL,
    "product_key" "text",
    "workforce_id" "uuid",
    "is_system" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "roles_key_check" CHECK (("key" ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'::"text")),
    CONSTRAINT "roles_name_check" CHECK ((NULLIF("btrim"("name"), ''::"text") IS NOT NULL)),
    CONSTRAINT "roles_scope_check" CHECK (((("scope_type" = 'product'::"text") AND ("product_key" IS NOT NULL) AND ("workforce_id" IS NULL)) OR (("scope_type" = 'workforce'::"text") AND ("product_key" IS NULL) AND ("workforce_id" IS NOT NULL)))),
    CONSTRAINT "roles_scope_type_check" CHECK (("scope_type" = ANY (ARRAY['product'::"text", 'workforce'::"text"])))
);


ALTER TABLE "iam"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iam"."workforce_memberships" (
    "workforce_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "granted_by" "uuid",
    "revoked_by" "uuid",
    "revoked_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workforce_memberships_expiry_check" CHECK ((("expires_at" IS NULL) OR ("expires_at" > "joined_at"))),
    CONSTRAINT "workforce_memberships_revocation_check" CHECK (((("status" = 'revoked'::"text") AND ("revoked_at" IS NOT NULL)) OR (("status" <> 'revoked'::"text") AND ("revoked_at" IS NULL) AND ("revoked_by" IS NULL)))),
    CONSTRAINT "workforce_memberships_status_check" CHECK (("status" = ANY (ARRAY['invited'::"text", 'active'::"text", 'suspended'::"text", 'revoked'::"text"])))
);


ALTER TABLE "iam"."workforce_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iam"."workforce_role_assignments" (
    "workforce_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role_key" "text" NOT NULL,
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    CONSTRAINT "workforce_role_assignments_expiry_check" CHECK ((("expires_at" IS NULL) OR ("expires_at" > "assigned_at")))
);


ALTER TABLE "iam"."workforce_role_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "iam"."workforces" (
    "id" "uuid" DEFAULT "foundation"."uuid_v7"() NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workforces_key_check" CHECK (("key" ~ '^[a-z][a-z0-9_-]*$'::"text")),
    CONSTRAINT "workforces_name_check" CHECK ((NULLIF("btrim"("name"), ''::"text") IS NOT NULL)),
    CONSTRAINT "workforces_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'disabled'::"text"])))
);


ALTER TABLE "iam"."workforces" OWNER TO "postgres";


ALTER TABLE ONLY "iam"."access_audit_events"
    ADD CONSTRAINT "access_audit_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iam"."capabilities"
    ADD CONSTRAINT "capabilities_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "iam"."policy_acceptances"
    ADD CONSTRAINT "policy_acceptances_pkey" PRIMARY KEY ("user_id", "policy_version_id");



ALTER TABLE ONLY "iam"."policy_versions"
    ADD CONSTRAINT "policy_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "iam"."policy_versions"
    ADD CONSTRAINT "policy_versions_product_key_policy_key_version_key" UNIQUE ("product_key", "policy_key", "version");



ALTER TABLE ONLY "iam"."product_memberships"
    ADD CONSTRAINT "product_memberships_pkey" PRIMARY KEY ("product_key", "user_id");



ALTER TABLE ONLY "iam"."product_role_assignments"
    ADD CONSTRAINT "product_role_assignments_pkey" PRIMARY KEY ("product_key", "user_id", "role_key");



ALTER TABLE ONLY "iam"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "iam"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "iam"."role_capabilities"
    ADD CONSTRAINT "role_capabilities_pkey" PRIMARY KEY ("role_key", "capability_key");



ALTER TABLE ONLY "iam"."roles"
    ADD CONSTRAINT "roles_key_product_key_key" UNIQUE ("key", "product_key");



ALTER TABLE ONLY "iam"."roles"
    ADD CONSTRAINT "roles_key_workforce_id_key" UNIQUE ("key", "workforce_id");



ALTER TABLE ONLY "iam"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "iam"."workforce_memberships"
    ADD CONSTRAINT "workforce_memberships_pkey" PRIMARY KEY ("workforce_id", "user_id");



ALTER TABLE ONLY "iam"."workforce_role_assignments"
    ADD CONSTRAINT "workforce_role_assignments_pkey" PRIMARY KEY ("workforce_id", "user_id", "role_key");



ALTER TABLE ONLY "iam"."workforces"
    ADD CONSTRAINT "workforces_key_key" UNIQUE ("key");



ALTER TABLE ONLY "iam"."workforces"
    ADD CONSTRAINT "workforces_pkey" PRIMARY KEY ("id");



CREATE INDEX "access_audit_events_actor_idx" ON "iam"."access_audit_events" USING "btree" ("actor_user_id", "occurred_at" DESC) WHERE ("actor_user_id" IS NOT NULL);



CREATE INDEX "access_audit_events_occurred_at_idx" ON "iam"."access_audit_events" USING "btree" ("occurred_at" DESC);



CREATE INDEX "access_audit_events_product_idx" ON "iam"."access_audit_events" USING "btree" ("product_key", "occurred_at" DESC) WHERE ("product_key" IS NOT NULL);



CREATE INDEX "access_audit_events_target_idx" ON "iam"."access_audit_events" USING "btree" ("target_user_id", "occurred_at" DESC) WHERE ("target_user_id" IS NOT NULL);



CREATE INDEX "access_audit_events_workforce_idx" ON "iam"."access_audit_events" USING "btree" ("workforce_id", "occurred_at" DESC) WHERE ("workforce_id" IS NOT NULL);



CREATE INDEX "capabilities_product_key_idx" ON "iam"."capabilities" USING "btree" ("product_key", "key");



CREATE INDEX "policy_acceptances_policy_version_idx" ON "iam"."policy_acceptances" USING "btree" ("policy_version_id", "user_id");



CREATE INDEX "policy_versions_active_product_idx" ON "iam"."policy_versions" USING "btree" ("product_key", "policy_key", "effective_at" DESC) WHERE ("retired_at" IS NULL);



CREATE INDEX "product_memberships_active_expiry_idx" ON "iam"."product_memberships" USING "btree" ("expires_at") WHERE (("status" = 'active'::"text") AND ("expires_at" IS NOT NULL));



CREATE INDEX "product_memberships_granted_by_idx" ON "iam"."product_memberships" USING "btree" ("granted_by") WHERE ("granted_by" IS NOT NULL);



CREATE INDEX "product_memberships_revoked_by_idx" ON "iam"."product_memberships" USING "btree" ("revoked_by") WHERE ("revoked_by" IS NOT NULL);



CREATE INDEX "product_memberships_user_status_idx" ON "iam"."product_memberships" USING "btree" ("user_id", "status", "product_key");



CREATE INDEX "product_role_assignments_assigned_by_idx" ON "iam"."product_role_assignments" USING "btree" ("assigned_by") WHERE ("assigned_by" IS NOT NULL);



CREATE INDEX "product_role_assignments_role_idx" ON "iam"."product_role_assignments" USING "btree" ("role_key", "product_key");



CREATE INDEX "product_role_assignments_user_idx" ON "iam"."product_role_assignments" USING "btree" ("user_id", "product_key", "role_key");



CREATE INDEX "role_capabilities_capability_role_idx" ON "iam"."role_capabilities" USING "btree" ("capability_key", "role_key");



CREATE INDEX "roles_product_key_idx" ON "iam"."roles" USING "btree" ("product_key") WHERE ("product_key" IS NOT NULL);



CREATE INDEX "roles_workforce_id_idx" ON "iam"."roles" USING "btree" ("workforce_id") WHERE ("workforce_id" IS NOT NULL);



CREATE INDEX "workforce_memberships_granted_by_idx" ON "iam"."workforce_memberships" USING "btree" ("granted_by") WHERE ("granted_by" IS NOT NULL);



CREATE INDEX "workforce_memberships_revoked_by_idx" ON "iam"."workforce_memberships" USING "btree" ("revoked_by") WHERE ("revoked_by" IS NOT NULL);



CREATE INDEX "workforce_memberships_user_status_idx" ON "iam"."workforce_memberships" USING "btree" ("user_id", "status", "workforce_id");



CREATE INDEX "workforce_role_assignments_assigned_by_idx" ON "iam"."workforce_role_assignments" USING "btree" ("assigned_by") WHERE ("assigned_by" IS NOT NULL);



CREATE INDEX "workforce_role_assignments_role_idx" ON "iam"."workforce_role_assignments" USING "btree" ("role_key", "workforce_id");



CREATE INDEX "workforce_role_assignments_user_idx" ON "iam"."workforce_role_assignments" USING "btree" ("user_id", "workforce_id", "role_key");



CREATE INDEX "workforces_owner_user_idx" ON "iam"."workforces" USING "btree" ("owner_user_id");



CREATE OR REPLACE TRIGGER "product_memberships_set_updated_at" BEFORE UPDATE ON "iam"."product_memberships" FOR EACH ROW EXECUTE FUNCTION "foundation"."set_updated_at"();



CREATE OR REPLACE TRIGGER "products_set_updated_at" BEFORE UPDATE ON "iam"."products" FOR EACH ROW EXECUTE FUNCTION "foundation"."set_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON "iam"."profiles" FOR EACH ROW EXECUTE FUNCTION "foundation"."set_updated_at"();



CREATE OR REPLACE TRIGGER "roles_set_updated_at" BEFORE UPDATE ON "iam"."roles" FOR EACH ROW EXECUTE FUNCTION "foundation"."set_updated_at"();



CREATE OR REPLACE TRIGGER "workforce_memberships_set_updated_at" BEFORE UPDATE ON "iam"."workforce_memberships" FOR EACH ROW EXECUTE FUNCTION "foundation"."set_updated_at"();



CREATE OR REPLACE TRIGGER "workforces_set_updated_at" BEFORE UPDATE ON "iam"."workforces" FOR EACH ROW EXECUTE FUNCTION "foundation"."set_updated_at"();



ALTER TABLE ONLY "iam"."access_audit_events"
    ADD CONSTRAINT "access_audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iam"."access_audit_events"
    ADD CONSTRAINT "access_audit_events_product_key_fkey" FOREIGN KEY ("product_key") REFERENCES "iam"."products"("key") ON DELETE SET NULL;



ALTER TABLE ONLY "iam"."access_audit_events"
    ADD CONSTRAINT "access_audit_events_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iam"."access_audit_events"
    ADD CONSTRAINT "access_audit_events_workforce_id_fkey" FOREIGN KEY ("workforce_id") REFERENCES "iam"."workforces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iam"."capabilities"
    ADD CONSTRAINT "capabilities_product_key_fkey" FOREIGN KEY ("product_key") REFERENCES "iam"."products"("key") ON DELETE CASCADE;



ALTER TABLE ONLY "iam"."policy_acceptances"
    ADD CONSTRAINT "policy_acceptances_policy_version_id_fkey" FOREIGN KEY ("policy_version_id") REFERENCES "iam"."policy_versions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "iam"."policy_acceptances"
    ADD CONSTRAINT "policy_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iam"."policy_versions"
    ADD CONSTRAINT "policy_versions_product_key_fkey" FOREIGN KEY ("product_key") REFERENCES "iam"."products"("key") ON DELETE CASCADE;



ALTER TABLE ONLY "iam"."product_memberships"
    ADD CONSTRAINT "product_memberships_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iam"."product_memberships"
    ADD CONSTRAINT "product_memberships_product_key_fkey" FOREIGN KEY ("product_key") REFERENCES "iam"."products"("key") ON DELETE CASCADE;



ALTER TABLE ONLY "iam"."product_memberships"
    ADD CONSTRAINT "product_memberships_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iam"."product_memberships"
    ADD CONSTRAINT "product_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iam"."product_role_assignments"
    ADD CONSTRAINT "product_role_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iam"."product_role_assignments"
    ADD CONSTRAINT "product_role_assignments_product_key_user_id_fkey" FOREIGN KEY ("product_key", "user_id") REFERENCES "iam"."product_memberships"("product_key", "user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "iam"."product_role_assignments"
    ADD CONSTRAINT "product_role_assignments_role_key_product_key_fkey" FOREIGN KEY ("role_key", "product_key") REFERENCES "iam"."roles"("key", "product_key") ON DELETE CASCADE;



ALTER TABLE ONLY "iam"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iam"."role_capabilities"
    ADD CONSTRAINT "role_capabilities_capability_key_fkey" FOREIGN KEY ("capability_key") REFERENCES "iam"."capabilities"("key") ON DELETE CASCADE;



ALTER TABLE ONLY "iam"."role_capabilities"
    ADD CONSTRAINT "role_capabilities_role_key_fkey" FOREIGN KEY ("role_key") REFERENCES "iam"."roles"("key") ON DELETE CASCADE;



ALTER TABLE ONLY "iam"."roles"
    ADD CONSTRAINT "roles_product_key_fkey" FOREIGN KEY ("product_key") REFERENCES "iam"."products"("key") ON DELETE CASCADE;



ALTER TABLE ONLY "iam"."roles"
    ADD CONSTRAINT "roles_workforce_id_fkey" FOREIGN KEY ("workforce_id") REFERENCES "iam"."workforces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iam"."workforce_memberships"
    ADD CONSTRAINT "workforce_memberships_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iam"."workforce_memberships"
    ADD CONSTRAINT "workforce_memberships_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iam"."workforce_memberships"
    ADD CONSTRAINT "workforce_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iam"."workforce_memberships"
    ADD CONSTRAINT "workforce_memberships_workforce_id_fkey" FOREIGN KEY ("workforce_id") REFERENCES "iam"."workforces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "iam"."workforce_role_assignments"
    ADD CONSTRAINT "workforce_role_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "iam"."workforce_role_assignments"
    ADD CONSTRAINT "workforce_role_assignments_role_key_workforce_id_fkey" FOREIGN KEY ("role_key", "workforce_id") REFERENCES "iam"."roles"("key", "workforce_id") ON DELETE CASCADE;



ALTER TABLE ONLY "iam"."workforce_role_assignments"
    ADD CONSTRAINT "workforce_role_assignments_workforce_id_user_id_fkey" FOREIGN KEY ("workforce_id", "user_id") REFERENCES "iam"."workforce_memberships"("workforce_id", "user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "iam"."workforces"
    ADD CONSTRAINT "workforces_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT;



ALTER TABLE "iam"."access_audit_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "iam"."capabilities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "capabilities_select_authenticated" ON "iam"."capabilities" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "iam"."policy_acceptances" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "policy_acceptances_insert_self" ON "iam"."policy_acceptances" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "policy_acceptances_select_self_or_access_reader" ON "iam"."policy_acceptances" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "iam_private"."has_capability"('admin.access.read'::"text") AS "has_capability")));



ALTER TABLE "iam"."policy_versions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "policy_versions_select_authenticated" ON "iam"."policy_versions" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "iam"."product_memberships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_memberships_select_self_or_access_reader" ON "iam"."product_memberships" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "iam_private"."has_capability"('admin.access.read'::"text") AS "has_capability")));



ALTER TABLE "iam"."product_role_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_role_assignments_select_self_or_access_reader" ON "iam"."product_role_assignments" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "iam_private"."has_capability"('admin.access.read'::"text") AS "has_capability")));



ALTER TABLE "iam"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_select_authenticated" ON "iam"."products" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "iam"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_self_or_user_reader" ON "iam"."profiles" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "iam_private"."has_capability"('admin.users.read'::"text") AS "has_capability")));



CREATE POLICY "profiles_update_self" ON "iam"."profiles" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "iam"."role_capabilities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "role_capabilities_select_authenticated" ON "iam"."role_capabilities" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "iam"."roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "roles_select_authenticated" ON "iam"."roles" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "iam"."workforce_memberships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workforce_memberships_select_self_or_access_reader" ON "iam"."workforce_memberships" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "iam_private"."has_capability"('admin.access.read'::"text") AS "has_capability")));



ALTER TABLE "iam"."workforce_role_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workforce_role_assignments_select_self_or_access_reader" ON "iam"."workforce_role_assignments" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "iam_private"."has_capability"('admin.access.read'::"text") AS "has_capability")));



ALTER TABLE "iam"."workforces" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workforces_select_members_or_access_reader" ON "iam"."workforces" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "iam"."workforce_memberships" "membership"
  WHERE (("membership"."workforce_id" = "workforces"."id") AND ("membership"."user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("membership"."status" = 'active'::"text")))) OR ( SELECT "iam_private"."has_capability"('admin.access.read'::"text") AS "has_capability")));



GRANT USAGE ON SCHEMA "iam" TO "authenticated";
GRANT USAGE ON SCHEMA "iam" TO "service_role";



REVOKE ALL ON FUNCTION "iam"."count_my_sessions"() FROM PUBLIC;
GRANT ALL ON FUNCTION "iam"."count_my_sessions"() TO "authenticated";
GRANT ALL ON FUNCTION "iam"."count_my_sessions"() TO "service_role";



REVOKE ALL ON FUNCTION "iam"."has_capability"("p_capability_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "iam"."has_capability"("p_capability_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "iam"."has_capability"("p_capability_key" "text") TO "service_role";



REVOKE ALL ON FUNCTION "iam"."has_product_access"("p_product_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "iam"."has_product_access"("p_product_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "iam"."has_product_access"("p_product_key" "text") TO "service_role";



REVOKE ALL ON FUNCTION "iam"."list_my_capabilities"() FROM PUBLIC;
GRANT ALL ON FUNCTION "iam"."list_my_capabilities"() TO "authenticated";
GRANT ALL ON FUNCTION "iam"."list_my_capabilities"() TO "service_role";



REVOKE ALL ON FUNCTION "iam"."revoke_admin_access"("p_actor_user_id" "uuid", "p_target_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "iam"."revoke_admin_access"("p_actor_user_id" "uuid", "p_target_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "iam"."set_admin_access"("p_actor_user_id" "uuid", "p_target_user_id" "uuid", "p_role_key" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "iam"."set_admin_access"("p_actor_user_id" "uuid", "p_target_user_id" "uuid", "p_role_key" "text") TO "service_role";



GRANT ALL ON TABLE "iam"."access_audit_events" TO "service_role";



GRANT SELECT ON TABLE "iam"."capabilities" TO "authenticated";
GRANT ALL ON TABLE "iam"."capabilities" TO "service_role";



GRANT SELECT,INSERT ON TABLE "iam"."policy_acceptances" TO "authenticated";
GRANT ALL ON TABLE "iam"."policy_acceptances" TO "service_role";



GRANT SELECT ON TABLE "iam"."policy_versions" TO "authenticated";
GRANT ALL ON TABLE "iam"."policy_versions" TO "service_role";



GRANT SELECT ON TABLE "iam"."product_memberships" TO "authenticated";
GRANT ALL ON TABLE "iam"."product_memberships" TO "service_role";



GRANT SELECT ON TABLE "iam"."product_role_assignments" TO "authenticated";
GRANT ALL ON TABLE "iam"."product_role_assignments" TO "service_role";



GRANT SELECT ON TABLE "iam"."products" TO "authenticated";
GRANT ALL ON TABLE "iam"."products" TO "service_role";



GRANT SELECT ON TABLE "iam"."profiles" TO "authenticated";
GRANT ALL ON TABLE "iam"."profiles" TO "service_role";



GRANT UPDATE("first_name") ON TABLE "iam"."profiles" TO "authenticated";



GRANT UPDATE("last_name") ON TABLE "iam"."profiles" TO "authenticated";



GRANT UPDATE("avatar_url") ON TABLE "iam"."profiles" TO "authenticated";



GRANT UPDATE("avatar_mode") ON TABLE "iam"."profiles" TO "authenticated";



GRANT UPDATE("avatar_provider") ON TABLE "iam"."profiles" TO "authenticated";



GRANT UPDATE("avatar_storage_path") ON TABLE "iam"."profiles" TO "authenticated";



GRANT UPDATE("avatar_updated_at") ON TABLE "iam"."profiles" TO "authenticated";



GRANT SELECT ON TABLE "iam"."role_capabilities" TO "authenticated";
GRANT ALL ON TABLE "iam"."role_capabilities" TO "service_role";



GRANT SELECT ON TABLE "iam"."roles" TO "authenticated";
GRANT ALL ON TABLE "iam"."roles" TO "service_role";



GRANT SELECT ON TABLE "iam"."workforce_memberships" TO "authenticated";
GRANT ALL ON TABLE "iam"."workforce_memberships" TO "service_role";



GRANT SELECT ON TABLE "iam"."workforce_role_assignments" TO "authenticated";
GRANT ALL ON TABLE "iam"."workforce_role_assignments" TO "service_role";



GRANT SELECT ON TABLE "iam"."workforces" TO "authenticated";
GRANT ALL ON TABLE "iam"."workforces" TO "service_role";
