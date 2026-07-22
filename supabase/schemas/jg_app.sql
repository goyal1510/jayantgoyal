


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


CREATE SCHEMA IF NOT EXISTS "jg_app";


ALTER SCHEMA "jg_app" OWNER TO "postgres";


CREATE TYPE "jg_app"."game_hub_session_status" AS ENUM (
    'waiting',
    'active',
    'completed',
    'abandoned'
);


ALTER TYPE "jg_app"."game_hub_session_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."claim_expired_media_conversion_job"() RETURNS TABLE("job_id" "uuid", "object_path" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  claimed_id uuid;
begin
  select job.id
  into claimed_id
  from jg_app.media_conversion_jobs as job
  where
    job.status = 'expired'
    or (
      job.status = 'completed'
      and job.expires_at is not null
      and job.expires_at <= now()
    )
    or (
      job.status in ('failed', 'queued')
      and job.updated_at < now() - interval '24 hours'
    )
  order by job.updated_at
  for update skip locked
  limit 1;

  if claimed_id is null then
    return;
  end if;

  update jg_app.media_conversion_jobs
  set status = 'expired'
  where id = claimed_id;

  return query
    select job.id, job.storage_path
    from jg_app.media_conversion_jobs as job
    where job.id = claimed_id;
end;
$$;


ALTER FUNCTION "jg_app"."claim_expired_media_conversion_job"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."uuid_v7"() RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  ts_ms bigint;
  uuid_bytes bytea;
BEGIN
  ts_ms := extract(epoch FROM clock_timestamp()) * 1000;
  uuid_bytes := set_byte(
    set_byte(
      overlay(
        -- 6 bytes timestamp + 10 bytes random
        substring(int8send(ts_ms) FROM 3 FOR 6) ||
        extensions.gen_random_bytes(10)
        -- set version 7
        PLACING '\x70'::bytea FROM 7 FOR 1
      ),
      -- set variant bits (10xx)
      8,
      (get_byte(extensions.gen_random_bytes(1), 0) & 63) | 128
    ),
    -- preserve version nibble
    6,
    (get_byte(substring(int8send(ts_ms) FROM 3 FOR 6) || extensions.gen_random_bytes(10), 6) & 15) | 112
  );
  RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$;


ALTER FUNCTION "jg_app"."uuid_v7"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "jg_app"."media_conversion_jobs" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "source_url" "text" NOT NULL,
    "output_format" "text" NOT NULL,
    "quality" "text" NOT NULL,
    "status" "text" DEFAULT 'queued'::"text" NOT NULL,
    "progress" smallint DEFAULT 0 NOT NULL,
    "title" "text",
    "output_filename" "text",
    "mime_type" "text",
    "size_bytes" bigint,
    "storage_path" "text",
    "error_message" "text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "media_conversion_jobs_output_format_check" CHECK (("output_format" = ANY (ARRAY['mp3'::"text", 'mp4'::"text"]))),
    CONSTRAINT "media_conversion_jobs_progress_check" CHECK ((("progress" >= 0) AND ("progress" <= 100))),
    CONSTRAINT "media_conversion_jobs_quality_check" CHECK (("quality" = ANY (ARRAY['small'::"text", 'balanced'::"text", 'high'::"text"]))),
    CONSTRAINT "media_conversion_jobs_size_bytes_check" CHECK ((("size_bytes" IS NULL) OR ("size_bytes" >= 0))),
    CONSTRAINT "media_conversion_jobs_source_url_check" CHECK ((("char_length"("btrim"("source_url")) >= 1) AND ("char_length"("btrim"("source_url")) <= 2048))),
    CONSTRAINT "media_conversion_jobs_status_check" CHECK (("status" = ANY (ARRAY['queued'::"text", 'downloading'::"text", 'converting'::"text", 'uploading'::"text", 'completed'::"text", 'failed'::"text", 'expired'::"text"])))
);


ALTER TABLE "jg_app"."media_conversion_jobs" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."claim_media_conversion_job"() RETURNS SETOF "jg_app"."media_conversion_jobs"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  return query
    with candidate as (
      select queued.id
      from jg_app.media_conversion_jobs as queued
      where queued.status = 'queued'
      order by queued.created_at
      for update skip locked
      limit 1
    )
    update jg_app.media_conversion_jobs as job
    set
      status = 'downloading',
      progress = 1,
      started_at = now(),
      error_message = null
    from candidate
    where job.id = candidate.id
    returning job.*;
end;
$$;


ALTER FUNCTION "jg_app"."claim_media_conversion_job"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."copy_file"("p_file_id" "uuid", "p_target_directory_path" "text", "p_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  file_record RECORD;
  target_parent_id UUID;
  new_file_id UUID;
  new_storage_path TEXT;
  new_file_path TEXT;
BEGIN
  SELECT * INTO file_record FROM jg_app.file_manager_files
  WHERE id = p_file_id AND user_id = p_user_id AND NOT is_deleted;
  IF file_record IS NULL THEN RETURN NULL; END IF;
  SELECT id INTO target_parent_id FROM jg_app.file_manager_files
  WHERE user_id = p_user_id AND file_path = p_target_directory_path
    AND is_directory = true AND NOT is_deleted;
  IF target_parent_id IS NULL THEN RETURN NULL; END IF;
  new_file_path := p_target_directory_path || file_record.file_name;
  IF EXISTS (SELECT 1 FROM jg_app.file_manager_files WHERE user_id = p_user_id AND file_path = new_file_path AND NOT is_deleted) THEN
    new_file_path := p_target_directory_path ||
                    substring(file_record.file_name from '^(.*?)(\.[^\.]*)?$') ||
                    ' (copy)' ||
                    coalesce(substring(file_record.file_name from '(\.[^\.]*)$'), '');
  END IF;
  new_storage_path := jg_app.generate_storage_path(p_user_id, new_file_path, file_record.file_name);
  INSERT INTO jg_app.file_manager_files (
    user_id, bucket_id, storage_path, original_filename, display_name, mime_type,
    size_bytes, file_path, file_name, file_type, is_directory, parent_id, file_hash
  ) VALUES (
    p_user_id, file_record.bucket_id, new_storage_path, file_record.original_filename,
    file_record.display_name || ' (copy)', file_record.mime_type, file_record.size_bytes,
    new_file_path, substring(new_file_path from '[^/]+$'), file_record.file_type,
    false, target_parent_id, file_record.file_hash
  ) RETURNING id INTO new_file_id;
  RETURN new_file_id;
END;
$_$;


ALTER FUNCTION "jg_app"."copy_file"("p_file_id" "uuid", "p_target_directory_path" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."create_directory_path"("p_user_id" "uuid", "p_directory_path" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  path_parts TEXT[];
  current_path TEXT;
  parent_id UUID := NULL;
  dir_id UUID;
  i INTEGER;
  part TEXT;
BEGIN
  path_parts := string_to_array(trim(both '/' from p_directory_path), '/');
  current_path := '/';
  INSERT INTO jg_app.file_manager_files (
    user_id, bucket_id, storage_path, original_filename, file_path, file_name,
    display_name, mime_type, file_type, is_directory, parent_id
  ) VALUES (
    p_user_id, 'private-files', NULL, NULL, '/', '', 'Root',
    'inode/directory', 'directory', true, NULL
  ) ON CONFLICT (user_id, file_path, is_deleted) WHERE NOT is_deleted DO NOTHING;
  SELECT f.id INTO parent_id FROM jg_app.file_manager_files f
  WHERE f.user_id = p_user_id AND f.file_path = '/' AND NOT f.is_deleted;
  IF p_directory_path = '/' OR p_directory_path = '' OR array_length(path_parts, 1) IS NULL THEN
    RETURN parent_id;
  END IF;
  FOR i IN 1..array_length(path_parts, 1) LOOP
    part := path_parts[i];
    current_path := current_path || part || '/';
    INSERT INTO jg_app.file_manager_files (
      user_id, bucket_id, storage_path, original_filename, file_path, file_name,
      display_name, mime_type, file_type, is_directory, parent_id
    ) VALUES (
      p_user_id, 'private-files', NULL, NULL, current_path, part, part,
      'inode/directory', 'directory', true, parent_id
    ) ON CONFLICT (user_id, file_path, is_deleted) WHERE NOT is_deleted
    DO UPDATE SET updated_at = NOW()
    RETURNING id INTO dir_id;
    IF dir_id IS NULL THEN
      SELECT f.id INTO dir_id FROM jg_app.file_manager_files f
      WHERE f.user_id = p_user_id AND f.file_path = current_path AND NOT f.is_deleted;
    END IF;
    parent_id := dir_id;
  END LOOP;
  RETURN parent_id;
END;
$$;


ALTER FUNCTION "jg_app"."create_directory_path"("p_user_id" "uuid", "p_directory_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."generate_storage_path"("p_user_id" "uuid", "p_file_path" "text", "p_file_name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  file_uuid TEXT;
  file_ext TEXT;
BEGIN
  file_uuid := gen_random_uuid()::text;
  file_ext := substring(p_file_name from '\.([^\.]+)$');
  RETURN p_user_id::text || '/' || file_uuid ||
         CASE WHEN file_ext IS NOT NULL THEN '.' || file_ext ELSE '' END;
END;
$_$;


ALTER FUNCTION "jg_app"."generate_storage_path"("p_user_id" "uuid", "p_file_path" "text", "p_file_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."get_directory_tree"("p_user_id" "uuid", "p_parent_path" "text" DEFAULT '/'::"text") RETURNS TABLE("id" "uuid", "file_path" "text", "file_name" "text", "display_name" "text", "mime_type" "text", "size_bytes" bigint, "file_type" "text", "is_directory" boolean, "child_count" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "depth" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE dir_tree AS (
    SELECT f.id, f.file_path, f.file_name, f.display_name, f.mime_type,
           f.size_bytes, f.file_type, f.is_directory, f.child_count,
           f.created_at, f.updated_at, 0 as depth
    FROM jg_app.file_manager_files f
    WHERE f.user_id = p_user_id AND f.file_path = p_parent_path
      AND f.is_directory = true AND NOT f.is_deleted
    UNION ALL
    SELECT f.id, f.file_path, f.file_name, f.display_name, f.mime_type,
           f.size_bytes, f.file_type, f.is_directory, f.child_count,
           f.created_at, f.updated_at, dt.depth + 1
    FROM jg_app.file_manager_files f
    INNER JOIN dir_tree dt ON f.parent_id = dt.id
    WHERE f.user_id = p_user_id AND NOT f.is_deleted
  )
  SELECT * FROM dir_tree ORDER BY is_directory DESC, file_name;
END;
$$;


ALTER FUNCTION "jg_app"."get_directory_tree"("p_user_id" "uuid", "p_parent_path" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jg_app"."file_manager_files" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "bucket_id" "text" DEFAULT 'private-files'::"text" NOT NULL,
    "storage_path" "text",
    "original_filename" "text",
    "display_name" "text",
    "mime_type" "text" NOT NULL,
    "size_bytes" bigint DEFAULT 0 NOT NULL,
    "file_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "is_directory" boolean DEFAULT false,
    "child_count" integer DEFAULT 0,
    "file_type" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "version" integer DEFAULT 1,
    "is_latest_version" boolean DEFAULT true,
    "file_hash" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "is_deleted" boolean DEFAULT false
);


ALTER TABLE "jg_app"."file_manager_files" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."get_file_by_path"("p_user_id" "uuid", "p_file_path" "text") RETURNS SETOF "jg_app"."file_manager_files"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM jg_app.file_manager_files
  WHERE user_id = p_user_id AND file_path = p_file_path AND NOT is_deleted;
END;
$$;


ALTER FUNCTION "jg_app"."get_file_by_path"("p_user_id" "uuid", "p_file_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."handle_soft_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
    NEW.deleted_at := NOW();
    IF NEW.parent_id IS NOT NULL THEN
      UPDATE jg_app.file_manager_files
      SET child_count = child_count - 1, updated_at = NOW()
      WHERE id = NEW.parent_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "jg_app"."handle_soft_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."is_nonblank_text_array"("value" "text"[]) RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE STRICT
    SET "search_path" TO ''
    AS $$
declare
  item text;
begin
  foreach item in array value loop
    if item is null or btrim(item) = '' then
      return false;
    end if;
  end loop;

  return true;
end;
$$;


ALTER FUNCTION "jg_app"."is_nonblank_text_array"("value" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."list_directory"("p_user_id" "uuid", "p_directory_path" "text" DEFAULT '/'::"text") RETURNS TABLE("id" "uuid", "file_path" "text", "file_name" "text", "display_name" "text", "mime_type" "text", "size_bytes" bigint, "file_type" "text", "is_directory" boolean, "child_count" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  dir_id UUID;
BEGIN
  SELECT f.id INTO dir_id FROM jg_app.file_manager_files f
  WHERE f.user_id = p_user_id AND f.file_path = p_directory_path
    AND f.is_directory = true AND NOT f.is_deleted;
  IF dir_id IS NULL THEN RAISE EXCEPTION 'Directory not found'; END IF;
  RETURN QUERY
  SELECT f.id, f.file_path, f.file_name, f.display_name, f.mime_type,
         f.size_bytes, f.file_type, f.is_directory, f.child_count,
         f.created_at, f.updated_at
  FROM jg_app.file_manager_files f
  WHERE f.user_id = p_user_id AND f.parent_id = dir_id AND NOT f.is_deleted
  ORDER BY f.is_directory DESC, f.file_name;
END;
$$;


ALTER FUNCTION "jg_app"."list_directory"("p_user_id" "uuid", "p_directory_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."move_file"("p_file_id" "uuid", "p_new_directory_path" "text", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  old_parent_id UUID;
  new_parent_id UUID;
  file_record RECORD;
  new_file_path TEXT;
BEGIN
  SELECT * INTO file_record FROM jg_app.file_manager_files
  WHERE id = p_file_id AND user_id = p_user_id AND NOT is_deleted;
  IF file_record IS NULL THEN RETURN false; END IF;
  SELECT id INTO new_parent_id FROM jg_app.file_manager_files
  WHERE user_id = p_user_id AND file_path = p_new_directory_path
    AND is_directory = true AND NOT is_deleted;
  IF new_parent_id IS NULL THEN RETURN false; END IF;
  new_file_path := p_new_directory_path || file_record.file_name;
  IF EXISTS (SELECT 1 FROM jg_app.file_manager_files WHERE user_id = p_user_id AND file_path = new_file_path AND NOT is_deleted) THEN
    RETURN false;
  END IF;
  UPDATE jg_app.file_manager_files
  SET parent_id = new_parent_id, file_path = new_file_path, updated_at = NOW()
  WHERE id = p_file_id;
  IF file_record.parent_id IS NOT NULL THEN
    UPDATE jg_app.file_manager_files SET child_count = child_count - 1 WHERE id = file_record.parent_id;
  END IF;
  UPDATE jg_app.file_manager_files SET child_count = child_count + 1 WHERE id = new_parent_id;
  RETURN true;
END;
$$;


ALTER FUNCTION "jg_app"."move_file"("p_file_id" "uuid", "p_new_directory_path" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."requeue_stale_media_conversion_jobs"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  affected integer;
begin
  update jg_app.media_conversion_jobs
  set
    status = 'queued',
    progress = 0,
    started_at = null,
    error_message = 'The worker restarted before this job completed. Retrying.'
  where status in ('downloading', 'converting', 'uploading')
    and updated_at < now() - interval '30 minutes';

  get diagnostics affected = row_count;
  return affected;
end;
$$;


ALTER FUNCTION "jg_app"."requeue_stale_media_conversion_jobs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."soft_delete_file"("p_file_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  file_record RECORD;
BEGIN
  SELECT * INTO file_record FROM jg_app.file_manager_files
  WHERE id = p_file_id AND user_id = p_user_id AND NOT is_deleted;
  IF file_record IS NULL THEN RETURN false; END IF;
  UPDATE jg_app.file_manager_files
  SET is_deleted = true, deleted_at = NOW(), updated_at = NOW()
  WHERE id = p_file_id;
  RETURN true;
END;
$$;


ALTER FUNCTION "jg_app"."soft_delete_file"("p_file_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."update_parent_child_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE jg_app.file_manager_files
    SET child_count = child_count + 1, updated_at = NOW()
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL AND NOT OLD.is_deleted THEN
    UPDATE jg_app.file_manager_files
    SET child_count = child_count - 1, updated_at = NOW()
    WHERE id = OLD.parent_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "jg_app"."update_parent_child_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "jg_app"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "jg_app"."validate_file_type"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  allowed_types TEXT[];
BEGIN
  SELECT allowed_mime_types INTO allowed_types
  FROM jg_app.file_manager_type_categories
  WHERE type_name = NEW.file_type;
  IF NOT (NEW.mime_type = ANY(allowed_types) OR (allowed_types @> ARRAY['*'])) THEN
    RAISE EXCEPTION 'Mime type % is not allowed for file type %', NEW.mime_type, NEW.file_type;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "jg_app"."validate_file_type"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jg_app"."activity_tracker_activities" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "name" "text" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true
);


ALTER TABLE "jg_app"."activity_tracker_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jg_app"."activity_tracker_entries" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "activity_id" "uuid",
    "date" "date" NOT NULL,
    "completed" boolean DEFAULT false,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "jg_app"."activity_tracker_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jg_app"."blog_posts" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "excerpt" "text",
    "content" "text" DEFAULT ''::"text" NOT NULL,
    "cover_image" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "blog_posts_published_at_check" CHECK (((NOT "is_published") OR ("published_at" IS NOT NULL))),
    CONSTRAINT "blog_posts_published_content_check" CHECK (((NOT "is_published") OR ("btrim"("content") <> ''::"text"))),
    CONSTRAINT "blog_posts_required_fields_nonblank_check" CHECK ((("btrim"("title") <> ''::"text") AND ("btrim"("slug") <> ''::"text"))),
    CONSTRAINT "blog_posts_slug_format_check" CHECK (("slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'::"text")),
    CONSTRAINT "blog_posts_tags_items_check" CHECK ("jg_app"."is_nonblank_text_array"("tags"))
);


ALTER TABLE "jg_app"."blog_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jg_app"."currency_calculator_calculations" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "note" "text",
    "ist_timestamp" "text",
    "user_id" "uuid"
);


ALTER TABLE "jg_app"."currency_calculator_calculations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jg_app"."currency_calculator_denominations" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "calculation_id" "uuid",
    "denomination" integer NOT NULL,
    "count" integer NOT NULL,
    "total" integer,
    "bundle_count" bigint,
    "open_count" bigint
);


ALTER TABLE "jg_app"."currency_calculator_denominations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jg_app"."file_manager_type_categories" (
    "type_name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "icon" "text",
    "allowed_mime_types" "text"[] NOT NULL,
    "max_size_bytes" bigint DEFAULT 104857600,
    "can_preview" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "jg_app"."file_manager_type_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jg_app"."game_hub_session_moves" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "participant_id" "uuid" NOT NULL,
    "move_number" integer NOT NULL,
    "move_payload" "jsonb" NOT NULL,
    "resulting_state" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "game_hub_session_moves_move_number_check" CHECK (("move_number" > 0)),
    CONSTRAINT "game_hub_session_moves_move_payload_check" CHECK (("jsonb_typeof"("move_payload") = 'object'::"text"))
);


ALTER TABLE "jg_app"."game_hub_session_moves" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jg_app"."game_hub_session_participants" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
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


ALTER TABLE "jg_app"."game_hub_session_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jg_app"."game_hub_session_results" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "winner_participant_id" "uuid",
    "outcome" "text" NOT NULL,
    "summary" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "game_hub_session_results_outcome_check" CHECK (("outcome" = ANY (ARRAY['win'::"text", 'draw'::"text", 'abandoned'::"text"])))
);


ALTER TABLE "jg_app"."game_hub_session_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jg_app"."game_hub_sessions" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "room_code" "text" NOT NULL,
    "game_slug" "text" NOT NULL,
    "status" "jg_app"."game_hub_session_status" DEFAULT 'waiting'::"jg_app"."game_hub_session_status" NOT NULL,
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


ALTER TABLE "jg_app"."game_hub_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jg_app"."game_hub_typing_speed_results" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "wpm" integer NOT NULL,
    "accuracy" numeric(5,2) NOT NULL,
    "duration_seconds" integer NOT NULL,
    "total_characters" integer NOT NULL,
    "correct_characters" integer NOT NULL,
    "text_length" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "jg_app"."game_hub_typing_speed_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jg_app"."messenger_messages" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "message_type" "text" NOT NULL,
    "language" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_read" boolean DEFAULT false,
    CONSTRAINT "messenger_messages_type_check" CHECK (("message_type" = ANY (ARRAY['text'::"text", 'code'::"text"])))
);


ALTER TABLE "jg_app"."messenger_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jg_app"."tool_favorites" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tool_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tool_favorites_tool_id_check" CHECK (("length"(TRIM(BOTH FROM "tool_id")) > 0))
);


ALTER TABLE "jg_app"."tool_favorites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "jg_app"."tool_history" (
    "id" "uuid" DEFAULT "jg_app"."uuid_v7"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tool_id" "text" NOT NULL,
    "visited_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "visit_count" integer DEFAULT 1 NOT NULL,
    CONSTRAINT "tool_history_tool_id_check" CHECK (("length"(TRIM(BOTH FROM "tool_id")) > 0)),
    CONSTRAINT "tool_history_visit_count_check" CHECK (("visit_count" > 0))
);


ALTER TABLE "jg_app"."tool_history" OWNER TO "postgres";


ALTER TABLE ONLY "jg_app"."activity_tracker_activities"
    ADD CONSTRAINT "activity_tracker_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jg_app"."activity_tracker_entries"
    ADD CONSTRAINT "activity_tracker_entries_activity_id_date_user_id_key" UNIQUE ("activity_id", "date", "user_id");



ALTER TABLE ONLY "jg_app"."activity_tracker_entries"
    ADD CONSTRAINT "activity_tracker_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jg_app"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jg_app"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "jg_app"."currency_calculator_calculations"
    ADD CONSTRAINT "currency_calculator_calculations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jg_app"."currency_calculator_denominations"
    ADD CONSTRAINT "currency_calculator_denominations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jg_app"."file_manager_files"
    ADD CONSTRAINT "file_manager_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jg_app"."file_manager_files"
    ADD CONSTRAINT "file_manager_files_user_id_file_path_is_deleted_key" UNIQUE ("user_id", "file_path", "is_deleted");



ALTER TABLE ONLY "jg_app"."file_manager_type_categories"
    ADD CONSTRAINT "file_manager_type_categories_pkey" PRIMARY KEY ("type_name");



ALTER TABLE ONLY "jg_app"."game_hub_session_moves"
    ADD CONSTRAINT "game_hub_session_moves_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jg_app"."game_hub_session_moves"
    ADD CONSTRAINT "game_hub_session_moves_session_move_key" UNIQUE ("session_id", "move_number");



ALTER TABLE ONLY "jg_app"."game_hub_session_participants"
    ADD CONSTRAINT "game_hub_session_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jg_app"."game_hub_session_participants"
    ADD CONSTRAINT "game_hub_session_participants_session_user_key" UNIQUE ("session_id", "user_id");



ALTER TABLE ONLY "jg_app"."game_hub_session_results"
    ADD CONSTRAINT "game_hub_session_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jg_app"."game_hub_session_results"
    ADD CONSTRAINT "game_hub_session_results_session_key" UNIQUE ("session_id");



ALTER TABLE ONLY "jg_app"."game_hub_sessions"
    ADD CONSTRAINT "game_hub_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jg_app"."game_hub_sessions"
    ADD CONSTRAINT "game_hub_sessions_room_code_key" UNIQUE ("room_code");



ALTER TABLE ONLY "jg_app"."game_hub_typing_speed_results"
    ADD CONSTRAINT "game_hub_typing_speed_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jg_app"."media_conversion_jobs"
    ADD CONSTRAINT "media_conversion_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jg_app"."messenger_messages"
    ADD CONSTRAINT "messenger_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jg_app"."tool_favorites"
    ADD CONSTRAINT "tool_favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jg_app"."tool_favorites"
    ADD CONSTRAINT "tool_favorites_user_tool_key" UNIQUE ("user_id", "tool_id");



ALTER TABLE ONLY "jg_app"."tool_history"
    ADD CONSTRAINT "tool_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "jg_app"."tool_history"
    ADD CONSTRAINT "tool_history_user_tool_key" UNIQUE ("user_id", "tool_id");



CREATE UNIQUE INDEX "game_hub_session_participants_active_seat_key" ON "jg_app"."game_hub_session_participants" USING "btree" ("session_id", "seat") WHERE ("left_at" IS NULL);



CREATE INDEX "idx_at_activities_user_id" ON "jg_app"."activity_tracker_activities" USING "btree" ("user_id");



CREATE INDEX "idx_at_entries_activity_id" ON "jg_app"."activity_tracker_entries" USING "btree" ("activity_id");



CREATE INDEX "idx_at_entries_date" ON "jg_app"."activity_tracker_entries" USING "btree" ("date");



CREATE INDEX "idx_at_entries_user_activity_date" ON "jg_app"."activity_tracker_entries" USING "btree" ("user_id", "activity_id", "date");



CREATE INDEX "idx_at_entries_user_id" ON "jg_app"."activity_tracker_entries" USING "btree" ("user_id");



CREATE INDEX "idx_blog_published" ON "jg_app"."blog_posts" USING "btree" ("is_published", "is_visible", "published_at" DESC);



CREATE INDEX "idx_fm_files_created_at" ON "jg_app"."file_manager_files" USING "btree" ("created_at");



CREATE INDEX "idx_fm_files_file_path" ON "jg_app"."file_manager_files" USING "btree" ("file_path");



CREATE INDEX "idx_fm_files_file_type" ON "jg_app"."file_manager_files" USING "btree" ("file_type");



CREATE INDEX "idx_fm_files_is_directory" ON "jg_app"."file_manager_files" USING "btree" ("is_directory");



CREATE INDEX "idx_fm_files_parent_id" ON "jg_app"."file_manager_files" USING "btree" ("parent_id");



CREATE INDEX "idx_fm_files_path_prefix" ON "jg_app"."file_manager_files" USING "btree" ("user_id", "file_path" "text_pattern_ops") WHERE (NOT "is_deleted");



CREATE INDEX "idx_fm_files_user_id" ON "jg_app"."file_manager_files" USING "btree" ("user_id");



CREATE INDEX "idx_fm_files_user_parent" ON "jg_app"."file_manager_files" USING "btree" ("user_id", "parent_id") WHERE (NOT "is_deleted");



CREATE INDEX "idx_fm_files_user_parent_type" ON "jg_app"."file_manager_files" USING "btree" ("user_id", "parent_id", "file_type") WHERE (NOT "is_deleted");



CREATE INDEX "idx_game_hub_session_moves_session_number" ON "jg_app"."game_hub_session_moves" USING "btree" ("session_id", "move_number");



CREATE INDEX "idx_game_hub_session_participants_session" ON "jg_app"."game_hub_session_participants" USING "btree" ("session_id");



CREATE INDEX "idx_game_hub_session_participants_user" ON "jg_app"."game_hub_session_participants" USING "btree" ("user_id");



CREATE INDEX "idx_game_hub_sessions_created_by" ON "jg_app"."game_hub_sessions" USING "btree" ("created_by");



CREATE INDEX "idx_game_hub_sessions_room_code" ON "jg_app"."game_hub_sessions" USING "btree" ("room_code");



CREATE INDEX "idx_game_hub_sessions_status_expires" ON "jg_app"."game_hub_sessions" USING "btree" ("status", "expires_at");



CREATE INDEX "idx_gh_typing_created_at" ON "jg_app"."game_hub_typing_speed_results" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_gh_typing_user_id" ON "jg_app"."game_hub_typing_speed_results" USING "btree" ("user_id");



CREATE INDEX "idx_media_conversion_jobs_cleanup" ON "jg_app"."media_conversion_jobs" USING "btree" ("expires_at") WHERE ("status" = ANY (ARRAY['completed'::"text", 'expired'::"text"]));



CREATE UNIQUE INDEX "idx_media_conversion_jobs_one_active_per_user" ON "jg_app"."media_conversion_jobs" USING "btree" ("user_id") WHERE ("status" = ANY (ARRAY['queued'::"text", 'downloading'::"text", 'converting'::"text", 'uploading'::"text"]));



CREATE INDEX "idx_media_conversion_jobs_queue" ON "jg_app"."media_conversion_jobs" USING "btree" ("created_at") WHERE ("status" = 'queued'::"text");



CREATE INDEX "idx_media_conversion_jobs_user_created" ON "jg_app"."media_conversion_jobs" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_msg_messages_created_at" ON "jg_app"."messenger_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_msg_messages_user_id" ON "jg_app"."messenger_messages" USING "btree" ("user_id");



CREATE INDEX "idx_tool_favorites_user_created" ON "jg_app"."tool_favorites" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_tool_history_user_visited" ON "jg_app"."tool_history" USING "btree" ("user_id", "visited_at" DESC);



CREATE OR REPLACE TRIGGER "handle_soft_delete_trigger" BEFORE UPDATE ON "jg_app"."file_manager_files" FOR EACH ROW EXECUTE FUNCTION "jg_app"."handle_soft_delete"();



CREATE OR REPLACE TRIGGER "update_blog_posts_updated_at" BEFORE UPDATE ON "jg_app"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "jg_app"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_child_count_trigger" AFTER INSERT OR DELETE ON "jg_app"."file_manager_files" FOR EACH ROW EXECUTE FUNCTION "jg_app"."update_parent_child_count"();



CREATE OR REPLACE TRIGGER "update_game_hub_session_participants_updated_at" BEFORE UPDATE ON "jg_app"."game_hub_session_participants" FOR EACH ROW EXECUTE FUNCTION "jg_app"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_game_hub_sessions_updated_at" BEFORE UPDATE ON "jg_app"."game_hub_sessions" FOR EACH ROW EXECUTE FUNCTION "jg_app"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_media_conversion_jobs_updated_at" BEFORE UPDATE ON "jg_app"."media_conversion_jobs" FOR EACH ROW EXECUTE FUNCTION "jg_app"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_messenger_messages_updated_at" BEFORE UPDATE ON "jg_app"."messenger_messages" FOR EACH ROW EXECUTE FUNCTION "jg_app"."update_updated_at"();



CREATE OR REPLACE TRIGGER "validate_file_type_trigger" BEFORE INSERT OR UPDATE ON "jg_app"."file_manager_files" FOR EACH ROW EXECUTE FUNCTION "jg_app"."validate_file_type"();



ALTER TABLE ONLY "jg_app"."activity_tracker_activities"
    ADD CONSTRAINT "activity_tracker_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."activity_tracker_entries"
    ADD CONSTRAINT "activity_tracker_entries_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "jg_app"."activity_tracker_activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."activity_tracker_entries"
    ADD CONSTRAINT "activity_tracker_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."currency_calculator_calculations"
    ADD CONSTRAINT "currency_calculator_calculations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."currency_calculator_denominations"
    ADD CONSTRAINT "currency_calculator_denominations_calc_fkey" FOREIGN KEY ("calculation_id") REFERENCES "jg_app"."currency_calculator_calculations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."file_manager_files"
    ADD CONSTRAINT "file_manager_files_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "jg_app"."file_manager_files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."file_manager_files"
    ADD CONSTRAINT "file_manager_files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."game_hub_session_moves"
    ADD CONSTRAINT "game_hub_session_moves_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "jg_app"."game_hub_session_participants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."game_hub_session_moves"
    ADD CONSTRAINT "game_hub_session_moves_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "jg_app"."game_hub_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."game_hub_session_participants"
    ADD CONSTRAINT "game_hub_session_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "jg_app"."game_hub_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."game_hub_session_participants"
    ADD CONSTRAINT "game_hub_session_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."game_hub_session_results"
    ADD CONSTRAINT "game_hub_session_results_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "jg_app"."game_hub_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."game_hub_session_results"
    ADD CONSTRAINT "game_hub_session_results_winner_participant_id_fkey" FOREIGN KEY ("winner_participant_id") REFERENCES "jg_app"."game_hub_session_participants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "jg_app"."game_hub_sessions"
    ADD CONSTRAINT "game_hub_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."game_hub_sessions"
    ADD CONSTRAINT "game_hub_sessions_current_turn_participant_id_fkey" FOREIGN KEY ("current_turn_participant_id") REFERENCES "jg_app"."game_hub_session_participants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "jg_app"."game_hub_sessions"
    ADD CONSTRAINT "game_hub_sessions_winner_participant_id_fkey" FOREIGN KEY ("winner_participant_id") REFERENCES "jg_app"."game_hub_session_participants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "jg_app"."game_hub_typing_speed_results"
    ADD CONSTRAINT "game_hub_typing_speed_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."media_conversion_jobs"
    ADD CONSTRAINT "media_conversion_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."messenger_messages"
    ADD CONSTRAINT "messenger_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."tool_favorites"
    ADD CONSTRAINT "tool_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "jg_app"."tool_history"
    ADD CONSTRAINT "tool_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage posts" ON "jg_app"."blog_posts" TO "authenticated" USING ("jg_account"."is_admin"()) WITH CHECK ("jg_account"."is_admin"());



CREATE POLICY "Anyone can read published posts" ON "jg_app"."blog_posts" FOR SELECT USING ((("is_published" = true) AND ("is_visible" = true)));



CREATE POLICY "Anyone can view file types" ON "jg_app"."file_manager_type_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Participants can insert game results" ON "jg_app"."game_hub_session_results" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "jg_app"."game_hub_session_participants" "p"
  WHERE (("p"."session_id" = "game_hub_session_results"."session_id") AND ("p"."user_id" = "auth"."uid"()) AND ("p"."left_at" IS NULL)))));



CREATE POLICY "Participants can insert own game moves" ON "jg_app"."game_hub_session_moves" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "jg_app"."game_hub_session_participants" "p"
  WHERE (("p"."id" = "game_hub_session_moves"."participant_id") AND ("p"."session_id" = "game_hub_session_moves"."session_id") AND ("p"."user_id" = "auth"."uid"()) AND ("p"."left_at" IS NULL)))));



CREATE POLICY "Participants can view game moves" ON "jg_app"."game_hub_session_moves" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "jg_app"."game_hub_session_participants" "p"
  WHERE (("p"."session_id" = "game_hub_session_moves"."session_id") AND ("p"."user_id" = "auth"."uid"()) AND ("p"."left_at" IS NULL)))));



CREATE POLICY "Participants can view game results" ON "jg_app"."game_hub_session_results" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "jg_app"."game_hub_session_participants" "p"
  WHERE (("p"."session_id" = "game_hub_session_results"."session_id") AND ("p"."user_id" = "auth"."uid"()) AND ("p"."left_at" IS NULL)))));



CREATE POLICY "Session participants can update game sessions" ON "jg_app"."game_hub_sessions" FOR UPDATE TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "jg_app"."game_hub_session_participants" "p"
  WHERE (("p"."session_id" = "game_hub_sessions"."id") AND ("p"."user_id" = "auth"."uid"()) AND ("p"."left_at" IS NULL)))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "jg_app"."game_hub_session_participants" "p"
  WHERE (("p"."session_id" = "game_hub_sessions"."id") AND ("p"."user_id" = "auth"."uid"()) AND ("p"."left_at" IS NULL))))));



CREATE POLICY "Users can create owned game sessions" ON "jg_app"."game_hub_sessions" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can delete own activities" ON "jg_app"."activity_tracker_activities" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own entries" ON "jg_app"."activity_tracker_entries" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own files" ON "jg_app"."file_manager_files" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own messages" ON "jg_app"."messenger_messages" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own tool favorites" ON "jg_app"."tool_favorites" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own tool history" ON "jg_app"."tool_history" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can enqueue own media conversion jobs" ON "jg_app"."media_conversion_jobs" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND ("status" = 'queued'::"text") AND ("progress" = 0) AND ("title" IS NULL) AND ("output_filename" IS NULL) AND ("mime_type" IS NULL) AND ("size_bytes" IS NULL) AND ("storage_path" IS NULL) AND ("error_message" IS NULL) AND ("started_at" IS NULL) AND ("completed_at" IS NULL) AND ("expires_at" IS NULL)));



CREATE POLICY "Users can insert own activities" ON "jg_app"."activity_tracker_activities" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own entries" ON "jg_app"."activity_tracker_entries" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own files" ON "jg_app"."file_manager_files" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own messages" ON "jg_app"."messenger_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own results" ON "jg_app"."game_hub_typing_speed_results" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own tool favorites" ON "jg_app"."tool_favorites" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own tool history" ON "jg_app"."tool_history" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can join game sessions as themselves" ON "jg_app"."game_hub_session_participants" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "jg_app"."game_hub_sessions" "s"
  WHERE (("s"."id" = "game_hub_session_participants"."session_id") AND ("s"."status" = ANY (ARRAY['waiting'::"jg_app"."game_hub_session_status", 'active'::"jg_app"."game_hub_session_status"])) AND ("s"."expires_at" > "now"()))))));



CREATE POLICY "Users can update own activities" ON "jg_app"."activity_tracker_activities" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own entries" ON "jg_app"."activity_tracker_entries" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own files" ON "jg_app"."file_manager_files" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own game participant row" ON "jg_app"."game_hub_session_participants" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own messages" ON "jg_app"."messenger_messages" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own tool history" ON "jg_app"."tool_history" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view joinable or joined game sessions" ON "jg_app"."game_hub_sessions" FOR SELECT TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR ("status" = 'waiting'::"jg_app"."game_hub_session_status") OR (EXISTS ( SELECT 1
   FROM "jg_app"."game_hub_session_participants" "p"
  WHERE (("p"."session_id" = "game_hub_sessions"."id") AND ("p"."user_id" = "auth"."uid"()) AND ("p"."left_at" IS NULL))))));



CREATE POLICY "Users can view own activities" ON "jg_app"."activity_tracker_activities" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own entries" ON "jg_app"."activity_tracker_entries" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own files" ON "jg_app"."file_manager_files" FOR SELECT USING ((("user_id" = "auth"."uid"()) AND (NOT "is_deleted")));



CREATE POLICY "Users can view own game participants" ON "jg_app"."game_hub_session_participants" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own media conversion jobs" ON "jg_app"."media_conversion_jobs" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own messages" ON "jg_app"."messenger_messages" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own results" ON "jg_app"."game_hub_typing_speed_results" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own tool favorites" ON "jg_app"."tool_favorites" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own tool history" ON "jg_app"."tool_history" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "jg_app"."activity_tracker_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "jg_app"."activity_tracker_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "jg_app"."blog_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "jg_app"."currency_calculator_calculations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "jg_app"."currency_calculator_denominations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_own_calculations" ON "jg_app"."currency_calculator_calculations" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "delete_own_denominations" ON "jg_app"."currency_calculator_denominations" FOR DELETE TO "authenticated" USING (("calculation_id" IN ( SELECT "currency_calculator_calculations"."id"
   FROM "jg_app"."currency_calculator_calculations"
  WHERE ("currency_calculator_calculations"."user_id" = "auth"."uid"()))));



ALTER TABLE "jg_app"."file_manager_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "jg_app"."file_manager_type_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "jg_app"."game_hub_session_moves" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "jg_app"."game_hub_session_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "jg_app"."game_hub_session_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "jg_app"."game_hub_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "jg_app"."game_hub_typing_speed_results" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_own_calculations" ON "jg_app"."currency_calculator_calculations" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "insert_own_denominations" ON "jg_app"."currency_calculator_denominations" FOR INSERT TO "authenticated" WITH CHECK (("calculation_id" IN ( SELECT "currency_calculator_calculations"."id"
   FROM "jg_app"."currency_calculator_calculations"
  WHERE ("currency_calculator_calculations"."user_id" = "auth"."uid"()))));



ALTER TABLE "jg_app"."media_conversion_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "jg_app"."messenger_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_own_calculations" ON "jg_app"."currency_calculator_calculations" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "select_own_denominations" ON "jg_app"."currency_calculator_denominations" FOR SELECT TO "authenticated" USING (("calculation_id" IN ( SELECT "currency_calculator_calculations"."id"
   FROM "jg_app"."currency_calculator_calculations"
  WHERE ("currency_calculator_calculations"."user_id" = "auth"."uid"()))));



ALTER TABLE "jg_app"."tool_favorites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "jg_app"."tool_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_own_calculations" ON "jg_app"."currency_calculator_calculations" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "update_own_denominations" ON "jg_app"."currency_calculator_denominations" FOR UPDATE TO "authenticated" USING (("calculation_id" IN ( SELECT "currency_calculator_calculations"."id"
   FROM "jg_app"."currency_calculator_calculations"
  WHERE ("currency_calculator_calculations"."user_id" = "auth"."uid"())))) WITH CHECK (("calculation_id" IN ( SELECT "currency_calculator_calculations"."id"
   FROM "jg_app"."currency_calculator_calculations"
  WHERE ("currency_calculator_calculations"."user_id" = "auth"."uid"()))));



GRANT USAGE ON SCHEMA "jg_app" TO "anon";
GRANT USAGE ON SCHEMA "jg_app" TO "authenticated";
GRANT USAGE ON SCHEMA "jg_app" TO "service_role";



GRANT ALL ON TYPE "jg_app"."game_hub_session_status" TO "authenticated";
GRANT ALL ON TYPE "jg_app"."game_hub_session_status" TO "service_role";



REVOKE ALL ON FUNCTION "jg_app"."claim_expired_media_conversion_job"() FROM PUBLIC;
GRANT ALL ON FUNCTION "jg_app"."claim_expired_media_conversion_job"() TO "service_role";



GRANT ALL ON FUNCTION "jg_app"."uuid_v7"() TO "anon";
GRANT ALL ON FUNCTION "jg_app"."uuid_v7"() TO "authenticated";
GRANT ALL ON FUNCTION "jg_app"."uuid_v7"() TO "service_role";



GRANT SELECT,INSERT ON TABLE "jg_app"."media_conversion_jobs" TO "authenticated";
GRANT ALL ON TABLE "jg_app"."media_conversion_jobs" TO "service_role";



REVOKE ALL ON FUNCTION "jg_app"."claim_media_conversion_job"() FROM PUBLIC;
GRANT ALL ON FUNCTION "jg_app"."claim_media_conversion_job"() TO "service_role";



GRANT ALL ON FUNCTION "jg_app"."copy_file"("p_file_id" "uuid", "p_target_directory_path" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "jg_app"."copy_file"("p_file_id" "uuid", "p_target_directory_path" "text", "p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "jg_app"."copy_file"("p_file_id" "uuid", "p_target_directory_path" "text", "p_user_id" "uuid") TO "anon";



GRANT ALL ON FUNCTION "jg_app"."create_directory_path"("p_user_id" "uuid", "p_directory_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "jg_app"."create_directory_path"("p_user_id" "uuid", "p_directory_path" "text") TO "service_role";
GRANT ALL ON FUNCTION "jg_app"."create_directory_path"("p_user_id" "uuid", "p_directory_path" "text") TO "anon";



GRANT ALL ON FUNCTION "jg_app"."generate_storage_path"("p_user_id" "uuid", "p_file_path" "text", "p_file_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "jg_app"."generate_storage_path"("p_user_id" "uuid", "p_file_path" "text", "p_file_name" "text") TO "service_role";
GRANT ALL ON FUNCTION "jg_app"."generate_storage_path"("p_user_id" "uuid", "p_file_path" "text", "p_file_name" "text") TO "anon";



GRANT ALL ON FUNCTION "jg_app"."get_directory_tree"("p_user_id" "uuid", "p_parent_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "jg_app"."get_directory_tree"("p_user_id" "uuid", "p_parent_path" "text") TO "service_role";
GRANT ALL ON FUNCTION "jg_app"."get_directory_tree"("p_user_id" "uuid", "p_parent_path" "text") TO "anon";



GRANT ALL ON TABLE "jg_app"."file_manager_files" TO "authenticated";
GRANT ALL ON TABLE "jg_app"."file_manager_files" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "jg_app"."file_manager_files" TO "anon";



GRANT ALL ON FUNCTION "jg_app"."get_file_by_path"("p_user_id" "uuid", "p_file_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "jg_app"."get_file_by_path"("p_user_id" "uuid", "p_file_path" "text") TO "service_role";
GRANT ALL ON FUNCTION "jg_app"."get_file_by_path"("p_user_id" "uuid", "p_file_path" "text") TO "anon";



GRANT ALL ON FUNCTION "jg_app"."handle_soft_delete"() TO "service_role";



GRANT ALL ON FUNCTION "jg_app"."is_nonblank_text_array"("value" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "jg_app"."is_nonblank_text_array"("value" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "jg_app"."is_nonblank_text_array"("value" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "jg_app"."list_directory"("p_user_id" "uuid", "p_directory_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "jg_app"."list_directory"("p_user_id" "uuid", "p_directory_path" "text") TO "service_role";
GRANT ALL ON FUNCTION "jg_app"."list_directory"("p_user_id" "uuid", "p_directory_path" "text") TO "anon";



GRANT ALL ON FUNCTION "jg_app"."move_file"("p_file_id" "uuid", "p_new_directory_path" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "jg_app"."move_file"("p_file_id" "uuid", "p_new_directory_path" "text", "p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "jg_app"."move_file"("p_file_id" "uuid", "p_new_directory_path" "text", "p_user_id" "uuid") TO "anon";



REVOKE ALL ON FUNCTION "jg_app"."requeue_stale_media_conversion_jobs"() FROM PUBLIC;
GRANT ALL ON FUNCTION "jg_app"."requeue_stale_media_conversion_jobs"() TO "service_role";



GRANT ALL ON FUNCTION "jg_app"."soft_delete_file"("p_file_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "jg_app"."soft_delete_file"("p_file_id" "uuid", "p_user_id" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "jg_app"."soft_delete_file"("p_file_id" "uuid", "p_user_id" "uuid") TO "anon";



GRANT ALL ON FUNCTION "jg_app"."update_parent_child_count"() TO "service_role";



GRANT ALL ON FUNCTION "jg_app"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "jg_app"."validate_file_type"() TO "service_role";



GRANT ALL ON TABLE "jg_app"."activity_tracker_activities" TO "authenticated";
GRANT ALL ON TABLE "jg_app"."activity_tracker_activities" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "jg_app"."activity_tracker_activities" TO "anon";



GRANT ALL ON TABLE "jg_app"."activity_tracker_entries" TO "authenticated";
GRANT ALL ON TABLE "jg_app"."activity_tracker_entries" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "jg_app"."activity_tracker_entries" TO "anon";



GRANT ALL ON TABLE "jg_app"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "jg_app"."blog_posts" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "jg_app"."blog_posts" TO "anon";



GRANT ALL ON TABLE "jg_app"."currency_calculator_calculations" TO "authenticated";
GRANT ALL ON TABLE "jg_app"."currency_calculator_calculations" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "jg_app"."currency_calculator_calculations" TO "anon";



GRANT ALL ON TABLE "jg_app"."currency_calculator_denominations" TO "authenticated";
GRANT ALL ON TABLE "jg_app"."currency_calculator_denominations" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "jg_app"."currency_calculator_denominations" TO "anon";



GRANT ALL ON TABLE "jg_app"."file_manager_type_categories" TO "authenticated";
GRANT ALL ON TABLE "jg_app"."file_manager_type_categories" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "jg_app"."file_manager_type_categories" TO "anon";



GRANT SELECT ON TABLE "jg_app"."game_hub_session_moves" TO "anon";
GRANT ALL ON TABLE "jg_app"."game_hub_session_moves" TO "authenticated";
GRANT ALL ON TABLE "jg_app"."game_hub_session_moves" TO "service_role";



GRANT SELECT ON TABLE "jg_app"."game_hub_session_participants" TO "anon";
GRANT ALL ON TABLE "jg_app"."game_hub_session_participants" TO "authenticated";
GRANT ALL ON TABLE "jg_app"."game_hub_session_participants" TO "service_role";



GRANT SELECT ON TABLE "jg_app"."game_hub_session_results" TO "anon";
GRANT ALL ON TABLE "jg_app"."game_hub_session_results" TO "authenticated";
GRANT ALL ON TABLE "jg_app"."game_hub_session_results" TO "service_role";



GRANT SELECT ON TABLE "jg_app"."game_hub_sessions" TO "anon";
GRANT ALL ON TABLE "jg_app"."game_hub_sessions" TO "authenticated";
GRANT ALL ON TABLE "jg_app"."game_hub_sessions" TO "service_role";



GRANT ALL ON TABLE "jg_app"."game_hub_typing_speed_results" TO "authenticated";
GRANT ALL ON TABLE "jg_app"."game_hub_typing_speed_results" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "jg_app"."game_hub_typing_speed_results" TO "anon";



GRANT ALL ON TABLE "jg_app"."messenger_messages" TO "authenticated";
GRANT ALL ON TABLE "jg_app"."messenger_messages" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "jg_app"."messenger_messages" TO "anon";



GRANT ALL ON TABLE "jg_app"."tool_favorites" TO "authenticated";
GRANT ALL ON TABLE "jg_app"."tool_favorites" TO "service_role";



GRANT ALL ON TABLE "jg_app"."tool_history" TO "authenticated";
GRANT ALL ON TABLE "jg_app"."tool_history" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "jg_app" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "jg_app" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "jg_app" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "jg_app" GRANT SELECT ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "jg_app" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "authenticated";
