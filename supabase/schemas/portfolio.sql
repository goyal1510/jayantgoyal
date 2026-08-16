


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


CREATE SCHEMA IF NOT EXISTS "portfolio";


ALTER SCHEMA "portfolio" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "portfolio"."consume_contact_rate_limit"("p_key_hash" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
  now_at timestamptz := pg_catalog.clock_timestamp();
  current_attempts integer;
begin
  if p_key_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid contact rate-limit key';
  end if;

  insert into portfolio.contact_rate_limits (
    key_hash,
    attempts,
    reset_at,
    updated_at
  )
  values (
    p_key_hash,
    1,
    now_at + interval '15 minutes',
    now_at
  )
  on conflict (key_hash) do update
  set
    attempts = case
      when portfolio.contact_rate_limits.reset_at <= now_at then 1
      when portfolio.contact_rate_limits.attempts >= 5 then 6
      else portfolio.contact_rate_limits.attempts + 1
    end,
    reset_at = case
      when portfolio.contact_rate_limits.reset_at <= now_at
        then now_at + interval '15 minutes'
      else portfolio.contact_rate_limits.reset_at
    end,
    updated_at = now_at
  returning attempts into current_attempts;

  return current_attempts <= 5;
end;
$_$;


ALTER FUNCTION "portfolio"."consume_contact_rate_limit"("p_key_hash" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "portfolio"."is_complete_work_case_study"("value" "jsonb") RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
  select case
    when not portfolio.is_work_case_study_shape(value) then false
    else
      pg_catalog.btrim(value ->> 'problem') <> ''
      and pg_catalog.btrim(value ->> 'solution') <> ''
      and pg_catalog.btrim(value ->> 'architecture') <> ''
      and pg_catalog.btrim(value ->> 'security') <> ''
      and pg_catalog.btrim(value ->> 'tradeoffs') <> ''
      and pg_catalog.btrim(value ->> 'outcome') <> ''
      and pg_catalog.btrim(value ->> 'next_improvement') <> ''
      and pg_catalog.jsonb_array_length(value -> 'decisions') >= 2
      and not exists (
        select 1
        from pg_catalog.jsonb_array_elements(value -> 'decisions') as decision
        where pg_catalog.btrim(decision ->> 'title') = ''
          or pg_catalog.btrim(decision ->> 'detail') = ''
      )
  end;
$$;


ALTER FUNCTION "portfolio"."is_complete_work_case_study"("value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "portfolio"."is_exact_text_object_array"("value" "jsonb", "required_fields" "text"[]) RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE STRICT
    SET "search_path" TO ''
    AS $$
declare
  element jsonb;
  required_field text;
  object_key text;
begin
  if jsonb_typeof(value) is distinct from 'array' then
    return false;
  end if;

  for element in
    select item
    from jsonb_array_elements(value) as elements(item)
  loop
    if jsonb_typeof(element) is distinct from 'object' then
      return false;
    end if;

    foreach required_field in array required_fields loop
      if jsonb_typeof(element -> required_field) is distinct from 'string'
        or btrim(element ->> required_field) = '' then
        return false;
      end if;
    end loop;

    for object_key in
      select key
      from jsonb_object_keys(element) as object_keys(key)
    loop
      if not object_key = any(required_fields) then
        return false;
      end if;
    end loop;
  end loop;

  return true;
end;
$$;


ALTER FUNCTION "portfolio"."is_exact_text_object_array"("value" "jsonb", "required_fields" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "portfolio"."is_work_case_study_shape"("value" "jsonb") RETURNS boolean
    LANGUAGE "sql" IMMUTABLE
    SET "search_path" TO ''
    AS $$
  select
    value is not null
    and pg_catalog.jsonb_typeof(value) = 'object'
    and pg_catalog.jsonb_typeof(value -> 'problem') = 'string'
    and pg_catalog.jsonb_typeof(value -> 'solution') = 'string'
    and pg_catalog.jsonb_typeof(value -> 'architecture') = 'string'
    and pg_catalog.jsonb_typeof(value -> 'security') = 'string'
    and pg_catalog.jsonb_typeof(value -> 'tradeoffs') = 'string'
    and pg_catalog.jsonb_typeof(value -> 'outcome') = 'string'
    and pg_catalog.jsonb_typeof(value -> 'next_improvement') = 'string'
    and pg_catalog.jsonb_typeof(value -> 'decisions') = 'array'
    and not exists (
      select 1
      from pg_catalog.jsonb_array_elements(value -> 'decisions') as decision
      where pg_catalog.jsonb_typeof(decision) <> 'object'
        or pg_catalog.jsonb_typeof(decision -> 'title') <> 'string'
        or pg_catalog.jsonb_typeof(decision -> 'detail') <> 'string'
    );
$$;


ALTER FUNCTION "portfolio"."is_work_case_study_shape"("value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "portfolio"."save_section_presentation"("p_section_key" "text", "p_copy" "jsonb", "p_navigation" "jsonb" DEFAULT NULL::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
declare
  saved_copy portfolio.section_content%rowtype;
  saved_navigation portfolio.nav_items%rowtype;
begin
  insert into portfolio.section_content (
    section_key,
    eyebrow,
    headline,
    accent,
    description,
    supporting_text,
    is_visible
  )
  values (
    p_section_key,
    p_copy ->> 'eyebrow',
    p_copy ->> 'headline',
    p_copy ->> 'accent',
    p_copy ->> 'description',
    p_copy ->> 'supporting_text',
    (p_copy ->> 'is_visible')::boolean
  )
  on conflict (section_key) do update
  set
    eyebrow = excluded.eyebrow,
    headline = excluded.headline,
    accent = excluded.accent,
    description = excluded.description,
    supporting_text = excluded.supporting_text,
    is_visible = excluded.is_visible
  returning * into saved_copy;

  if p_navigation is not null and p_navigation <> 'null'::jsonb then
    insert into portfolio.nav_items (
      section_id,
      label,
      note,
      sort_order,
      is_visible
    )
    values (
      p_section_key,
      p_navigation ->> 'label',
      p_navigation ->> 'note',
      (p_navigation ->> 'sort_order')::integer,
      (p_navigation ->> 'is_visible')::boolean
    )
    on conflict (section_id) do update
    set
      label = excluded.label,
      note = excluded.note,
      sort_order = excluded.sort_order,
      is_visible = excluded.is_visible
    returning * into saved_navigation;
  end if;

  return jsonb_build_object(
    'sectionContent',
    to_jsonb(saved_copy),
    'navigation',
    case
      when saved_navigation.id is null then null
      else to_jsonb(saved_navigation)
    end
  );
end;
$$;


ALTER FUNCTION "portfolio"."save_section_presentation"("p_section_key" "text", "p_copy" "jsonb", "p_navigation" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "portfolio"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "portfolio"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "portfolio"."about" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "summary" "text" NOT NULL,
    "personal" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "headline" "text" NOT NULL,
    "objective" "text" NOT NULL,
    "principles" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "story" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    CONSTRAINT "about_personal_shape_check" CHECK ("portfolio"."is_exact_text_object_array"("personal", ARRAY['label'::"text", 'value'::"text"])),
    CONSTRAINT "about_principles_shape_check" CHECK ("portfolio"."is_exact_text_object_array"("principles", ARRAY['title'::"text", 'copy'::"text"])),
    CONSTRAINT "about_required_copy_nonblank_check" CHECK ((("btrim"("summary") <> ''::"text") AND ("btrim"("headline") <> ''::"text") AND ("btrim"("objective") <> ''::"text"))),
    CONSTRAINT "about_story_items_check" CHECK ("jg_app"."is_nonblank_text_array"("story"))
);


ALTER TABLE "portfolio"."about" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."certificates" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "issuer" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "issued_at" "date",
    "credential_id" "text",
    "credential_url" "text",
    "image_alt" "text" NOT NULL,
    "document_url" "text" NOT NULL,
    "preview_url" "text" NOT NULL,
    CONSTRAINT "certificates_required_fields_nonblank_check" CHECK ((("btrim"("name") <> ''::"text") AND ("btrim"("category") <> ''::"text") AND ("btrim"("issuer") <> ''::"text") AND ("btrim"("image_alt") <> ''::"text") AND ("btrim"("document_url") <> ''::"text") AND ("btrim"("preview_url") <> ''::"text"))),
    CONSTRAINT "certificates_sort_order_nonnegative_check" CHECK (("sort_order" >= 0))
);


ALTER TABLE "portfolio"."certificates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."contact" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "location" "text" NOT NULL,
    "socials" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "contact_required_fields_nonblank_check" CHECK ((("btrim"("email") <> ''::"text") AND ("btrim"("phone") <> ''::"text") AND ("btrim"("location") <> ''::"text"))),
    CONSTRAINT "contact_socials_shape_check" CHECK ("portfolio"."is_exact_text_object_array"("socials", ARRAY['label'::"text", 'href'::"text", 'icon_key'::"text"]))
);


ALTER TABLE "portfolio"."contact" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."contact_rate_limits" (
    "key_hash" "text" NOT NULL,
    "attempts" integer DEFAULT 1 NOT NULL,
    "reset_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "contact_rate_limits_attempts_check" CHECK ((("attempts" >= 1) AND ("attempts" <= 6))),
    CONSTRAINT "contact_rate_limits_key_hash_check" CHECK (("key_hash" ~ '^[a-f0-9]{64}$'::"text"))
);


ALTER TABLE "portfolio"."contact_rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."education" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "school" "text" NOT NULL,
    "degree" "text" NOT NULL,
    "period" "text" NOT NULL,
    "location" "text",
    "detail" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "education_required_fields_nonblank_check" CHECK ((("btrim"("school") <> ''::"text") AND ("btrim"("degree") <> ''::"text") AND ("btrim"("period") <> ''::"text"))),
    CONSTRAINT "education_sort_order_nonnegative_check" CHECK (("sort_order" >= 0))
);


ALTER TABLE "portfolio"."education" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."experience" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "company" "text" NOT NULL,
    "role" "text" NOT NULL,
    "period" "text" NOT NULL,
    "location" "text",
    "summary" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "bullets" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "company_url" "text",
    "company_linkedin_url" "text",
    CONSTRAINT "experience_bullets_items_check" CHECK ("jg_app"."is_nonblank_text_array"("bullets")),
    CONSTRAINT "experience_company_linkedin_url_check" CHECK ((("company_linkedin_url" IS NULL) OR (("company_linkedin_url" = "btrim"("company_linkedin_url")) AND ("company_linkedin_url" ~* '^https://([[:alnum:]-]+\.)?linkedin\.com/(company|in)/[^[:space:]]+/?$'::"text")))),
    CONSTRAINT "experience_company_url_public_check" CHECK ((("company_url" IS NULL) OR (("company_url" = "btrim"("company_url")) AND ("company_url" ~* '^https?://[^[:space:]]+$'::"text")))),
    CONSTRAINT "experience_required_fields_nonblank_check" CHECK ((("btrim"("company") <> ''::"text") AND ("btrim"("role") <> ''::"text") AND ("btrim"("period") <> ''::"text"))),
    CONSTRAINT "experience_sort_order_nonnegative_check" CHECK (("sort_order" >= 0))
);


ALTER TABLE "portfolio"."experience" OWNER TO "postgres";


COMMENT ON COLUMN "portfolio"."experience"."company_url" IS 'Public website for the employer or the customer-facing product associated with the role.';



COMMENT ON COLUMN "portfolio"."experience"."company_linkedin_url" IS 'LinkedIn company page or organization profile associated with the experience.';



CREATE TABLE IF NOT EXISTS "portfolio"."hero" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "name" "text",
    "role" "text" NOT NULL,
    "tagline" "text" NOT NULL,
    "blurb" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "headline" "text" NOT NULL,
    "current_title" "text" NOT NULL,
    "availability" "text" NOT NULL,
    "resume_url" "text" NOT NULL,
    "display_name" "text",
    "github_username" "text" NOT NULL,
    "seo_title" "text",
    "seo_description" "text" NOT NULL,
    CONSTRAINT "hero_required_fields_nonblank_check" CHECK ((("btrim"("name") <> ''::"text") AND ("btrim"("display_name") <> ''::"text") AND ("btrim"("role") <> ''::"text") AND ("btrim"("tagline") <> ''::"text") AND ("btrim"("blurb") <> ''::"text") AND ("btrim"("headline") <> ''::"text") AND ("btrim"("current_title") <> ''::"text") AND ("btrim"("availability") <> ''::"text") AND ("btrim"("resume_url") <> ''::"text") AND ("btrim"("github_username") <> ''::"text") AND ("btrim"("seo_title") <> ''::"text") AND ("btrim"("seo_description") <> ''::"text")))
);


ALTER TABLE "portfolio"."hero" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."nav_items" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "section_id" "text" NOT NULL,
    "label" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "note" "text",
    CONSTRAINT "nav_items_required_fields_nonblank_check" CHECK ((("btrim"("section_id") <> ''::"text") AND ("btrim"("label") <> ''::"text"))),
    CONSTRAINT "nav_items_section_id_check" CHECK (("section_id" = ANY (ARRAY['hero'::"text", 'about'::"text", 'skills'::"text", 'education'::"text", 'experience'::"text", 'credentials'::"text", 'activity'::"text", 'work'::"text", 'contact'::"text", 'writing'::"text", 'article'::"text", 'resume'::"text", 'studio'::"text", 'case-studies'::"text", 'engineering'::"text"]))),
    CONSTRAINT "nav_items_sort_order_nonnegative_check" CHECK (("sort_order" >= 0))
);


ALTER TABLE "portfolio"."nav_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."section_content" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "section_key" "text" NOT NULL,
    "eyebrow" "text" NOT NULL,
    "headline" "text",
    "accent" "text",
    "description" "text",
    "supporting_text" "text",
    "is_visible" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "section_content_required_fields_nonblank_check" CHECK ((("btrim"("section_key") <> ''::"text") AND ("btrim"("eyebrow") <> ''::"text"))),
    CONSTRAINT "section_content_section_key_check" CHECK (("section_key" = ANY (ARRAY['hero'::"text", 'about'::"text", 'skills'::"text", 'education'::"text", 'experience'::"text", 'credentials'::"text", 'activity'::"text", 'work'::"text", 'contact'::"text", 'writing'::"text", 'article'::"text", 'resume'::"text", 'studio'::"text", 'case-studies'::"text", 'engineering'::"text"])))
);


ALTER TABLE "portfolio"."section_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."skill_categories" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "title" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description" "text" NOT NULL,
    CONSTRAINT "skill_categories_required_fields_nonblank_check" CHECK ((("btrim"("title") <> ''::"text") AND ("btrim"("description") <> ''::"text"))),
    CONSTRAINT "skill_categories_sort_order_nonnegative_check" CHECK (("sort_order" >= 0))
);


ALTER TABLE "portfolio"."skill_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."skills" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "proficiency" "text" NOT NULL,
    "evidence" "text" NOT NULL,
    CONSTRAINT "skills_proficiency_check" CHECK (("proficiency" = ANY (ARRAY['core'::"text", 'strong'::"text", 'working'::"text", 'exploring'::"text"]))),
    CONSTRAINT "skills_required_fields_nonblank_check" CHECK ((("btrim"("name") <> ''::"text") AND ("btrim"("evidence") <> ''::"text"))),
    CONSTRAINT "skills_sort_order_nonnegative_check" CHECK (("sort_order" >= 0))
);


ALTER TABLE "portfolio"."skills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "portfolio"."work" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "name" "text" NOT NULL,
    "short_description" "text" NOT NULL,
    "github_link" "text",
    "live_link" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "slug" "text" NOT NULL,
    "eyebrow" "text" NOT NULL,
    "impact" "text" NOT NULL,
    "contribution" "text" NOT NULL,
    "year_label" "text" NOT NULL,
    "image_alt" "text" NOT NULL,
    "image_url" "text" NOT NULL,
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "case_study" "jsonb",
    "case_study_published" boolean DEFAULT false NOT NULL,
    CONSTRAINT "work_case_study_publication_check" CHECK (((NOT "case_study_published") OR "portfolio"."is_complete_work_case_study"("case_study"))),
    CONSTRAINT "work_case_study_shape_check" CHECK ((("case_study" IS NULL) OR "portfolio"."is_work_case_study_shape"("case_study"))),
    CONSTRAINT "work_required_fields_nonblank_check" CHECK ((("btrim"("name") <> ''::"text") AND ("btrim"("short_description") <> ''::"text") AND ("btrim"("slug") <> ''::"text") AND ("btrim"("eyebrow") <> ''::"text") AND ("btrim"("impact") <> ''::"text") AND ("btrim"("contribution") <> ''::"text") AND ("btrim"("year_label") <> ''::"text") AND ("btrim"("image_alt") <> ''::"text") AND ("btrim"("image_url") <> ''::"text"))),
    CONSTRAINT "work_slug_format_check" CHECK (("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::"text")),
    CONSTRAINT "work_sort_order_nonnegative_check" CHECK (("sort_order" >= 0)),
    CONSTRAINT "work_tags_items_check" CHECK ("jg_app"."is_nonblank_text_array"("tags"))
);


ALTER TABLE "portfolio"."work" OWNER TO "postgres";


ALTER TABLE ONLY "portfolio"."about"
    ADD CONSTRAINT "about_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."certificates"
    ADD CONSTRAINT "certificates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."contact"
    ADD CONSTRAINT "contact_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."contact_rate_limits"
    ADD CONSTRAINT "contact_rate_limits_pkey" PRIMARY KEY ("key_hash");



ALTER TABLE ONLY "portfolio"."education"
    ADD CONSTRAINT "education_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."experience"
    ADD CONSTRAINT "experience_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."hero"
    ADD CONSTRAINT "hero_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."nav_items"
    ADD CONSTRAINT "nav_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."section_content"
    ADD CONSTRAINT "section_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."skill_categories"
    ADD CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."skills"
    ADD CONSTRAINT "skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "portfolio"."work"
    ADD CONSTRAINT "work_pkey" PRIMARY KEY ("id");



CREATE INDEX "contact_rate_limits_reset_at_idx" ON "portfolio"."contact_rate_limits" USING "btree" ("reset_at");



CREATE INDEX "idx_certificates_sort_order" ON "portfolio"."certificates" USING "btree" ("sort_order");



CREATE INDEX "idx_education_sort_order" ON "portfolio"."education" USING "btree" ("sort_order");



CREATE INDEX "idx_experience_sort_order" ON "portfolio"."experience" USING "btree" ("sort_order");



CREATE INDEX "idx_nav_items_sort_order" ON "portfolio"."nav_items" USING "btree" ("sort_order");



CREATE INDEX "idx_skill_categories_sort_order" ON "portfolio"."skill_categories" USING "btree" ("sort_order");



CREATE INDEX "idx_skills_sort_order" ON "portfolio"."skills" USING "btree" ("sort_order");



CREATE INDEX "idx_work_sort_order" ON "portfolio"."work" USING "btree" ("sort_order");



CREATE UNIQUE INDEX "portfolio_about_singleton_key" ON "portfolio"."about" USING "btree" ((true));



CREATE UNIQUE INDEX "portfolio_contact_singleton_key" ON "portfolio"."contact" USING "btree" ((true));



CREATE UNIQUE INDEX "portfolio_hero_singleton_key" ON "portfolio"."hero" USING "btree" ((true));



CREATE UNIQUE INDEX "portfolio_nav_items_section_id_key" ON "portfolio"."nav_items" USING "btree" ("section_id");



CREATE UNIQUE INDEX "portfolio_section_content_key_key" ON "portfolio"."section_content" USING "btree" ("section_key");



CREATE UNIQUE INDEX "portfolio_skill_categories_title_key" ON "portfolio"."skill_categories" USING "btree" ("lower"(TRIM(BOTH FROM "title")));



CREATE UNIQUE INDEX "portfolio_skills_category_name_key" ON "portfolio"."skills" USING "btree" ("category_id", "lower"(TRIM(BOTH FROM "name")));



CREATE UNIQUE INDEX "portfolio_work_slug_key" ON "portfolio"."work" USING "btree" ("slug");



CREATE OR REPLACE TRIGGER "about_updated_at" BEFORE UPDATE ON "portfolio"."about" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "certificates_updated_at" BEFORE UPDATE ON "portfolio"."certificates" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "contact_updated_at" BEFORE UPDATE ON "portfolio"."contact" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "education_updated_at" BEFORE UPDATE ON "portfolio"."education" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "experience_updated_at" BEFORE UPDATE ON "portfolio"."experience" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "hero_updated_at" BEFORE UPDATE ON "portfolio"."hero" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "nav_items_updated_at" BEFORE UPDATE ON "portfolio"."nav_items" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "section_content_updated_at" BEFORE UPDATE ON "portfolio"."section_content" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "skill_categories_updated_at" BEFORE UPDATE ON "portfolio"."skill_categories" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "skills_updated_at" BEFORE UPDATE ON "portfolio"."skills" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "work_updated_at" BEFORE UPDATE ON "portfolio"."work" FOR EACH ROW EXECUTE FUNCTION "portfolio"."update_updated_at_column"();



ALTER TABLE ONLY "portfolio"."nav_items"
    ADD CONSTRAINT "nav_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "portfolio"."section_content"("section_key") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "portfolio"."skills"
    ADD CONSTRAINT "skills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "portfolio"."skill_categories"("id") ON DELETE CASCADE;



CREATE POLICY "Admin work access" ON "portfolio"."work" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."about" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."certificates" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."contact" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."education" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."experience" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."hero" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."nav_items" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."section_content" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."skill_categories" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Admin write access" ON "portfolio"."skills" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Public read access" ON "portfolio"."about" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "portfolio"."certificates" FOR SELECT USING (("is_visible" = true));



CREATE POLICY "Public read access" ON "portfolio"."contact" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "portfolio"."education" FOR SELECT USING (("is_visible" = true));



CREATE POLICY "Public read access" ON "portfolio"."experience" FOR SELECT USING (("is_visible" = true));



CREATE POLICY "Public read access" ON "portfolio"."hero" FOR SELECT USING (true);



CREATE POLICY "Public read access" ON "portfolio"."nav_items" FOR SELECT USING (("is_visible" AND (EXISTS ( SELECT 1
   FROM "portfolio"."section_content"
  WHERE (("section_content"."section_key" = "nav_items"."section_id") AND "section_content"."is_visible")))));



CREATE POLICY "Public read access" ON "portfolio"."section_content" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public read access" ON "portfolio"."skill_categories" FOR SELECT USING (("is_visible" = true));



CREATE POLICY "Public read access" ON "portfolio"."skills" FOR SELECT USING (("is_visible" AND (EXISTS ( SELECT 1
   FROM "portfolio"."skill_categories"
  WHERE (("skill_categories"."id" = "skills"."category_id") AND "skill_categories"."is_visible")))));



CREATE POLICY "Public work access" ON "portfolio"."work" FOR SELECT USING (("is_visible" = true));



ALTER TABLE "portfolio"."about" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."certificates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."contact" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."contact_rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."education" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."experience" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."hero" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."nav_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."section_content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."skill_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "portfolio"."work" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "portfolio" TO "anon";
GRANT USAGE ON SCHEMA "portfolio" TO "authenticated";
GRANT USAGE ON SCHEMA "portfolio" TO "service_role";



REVOKE ALL ON FUNCTION "portfolio"."consume_contact_rate_limit"("p_key_hash" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "portfolio"."consume_contact_rate_limit"("p_key_hash" "text") TO "anon";
GRANT ALL ON FUNCTION "portfolio"."consume_contact_rate_limit"("p_key_hash" "text") TO "authenticated";
GRANT ALL ON FUNCTION "portfolio"."consume_contact_rate_limit"("p_key_hash" "text") TO "service_role";



REVOKE ALL ON FUNCTION "portfolio"."is_complete_work_case_study"("value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "portfolio"."is_complete_work_case_study"("value" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "portfolio"."is_complete_work_case_study"("value" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "portfolio"."is_work_case_study_shape"("value" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "portfolio"."is_work_case_study_shape"("value" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "portfolio"."is_work_case_study_shape"("value" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "portfolio"."save_section_presentation"("p_section_key" "text", "p_copy" "jsonb", "p_navigation" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "portfolio"."save_section_presentation"("p_section_key" "text", "p_copy" "jsonb", "p_navigation" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "portfolio"."update_updated_at_column"() TO "service_role";
GRANT ALL ON FUNCTION "portfolio"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "portfolio"."update_updated_at_column"() TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."about" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."about" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."about" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."certificates" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."certificates" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."certificates" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."contact" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."contact" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."contact" TO "service_role";



GRANT ALL ON TABLE "portfolio"."contact_rate_limits" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."education" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."education" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."education" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."experience" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."experience" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."experience" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."hero" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."hero" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."hero" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."nav_items" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."nav_items" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."nav_items" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."section_content" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."section_content" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."section_content" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."skill_categories" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."skill_categories" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."skill_categories" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."skills" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."skills" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."skills" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."work" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "portfolio"."work" TO "authenticated";
GRANT ALL ON TABLE "portfolio"."work" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "portfolio" GRANT SELECT,USAGE ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "portfolio" GRANT SELECT ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "portfolio" GRANT SELECT ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "portfolio" GRANT ALL ON TABLES TO "service_role";
