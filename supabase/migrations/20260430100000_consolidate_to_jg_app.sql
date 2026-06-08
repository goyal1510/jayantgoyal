-- ============================================================================
-- MIGRATION: Consolidate 5 schemas into jg_app + UUID v7 migration + blog
-- ============================================================================
-- Merges: activity_tracker, currency_calculator, fmanager, game_hub, messenger
-- Into:   jg_app (single consolidated schema)
-- Adds:   uuid_v7() function, shared update_updated_at(), blog_posts table
-- ============================================================================

BEGIN;
-- ============================================================================
-- 1. CREATE SCHEMA + SHARED FUNCTIONS
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS jg_app;
ALTER SCHEMA jg_app OWNER TO postgres;
GRANT USAGE ON SCHEMA jg_app TO anon, authenticated, service_role;
-- UUID v7: time-based UUIDs for better B-tree index performance
CREATE OR REPLACE FUNCTION jg_app.uuid_v7() RETURNS uuid
LANGUAGE plpgsql VOLATILE
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
-- UUID v7 from a specific timestamp (for migrating existing data)
CREATE OR REPLACE FUNCTION jg_app.uuid_v7_from_ts(ts timestamptz) RETURNS uuid
LANGUAGE plpgsql VOLATILE
AS $$
DECLARE
  ts_ms bigint;
  uuid_bytes bytea;
BEGIN
  ts_ms := extract(epoch FROM ts) * 1000;
  uuid_bytes := set_byte(
    set_byte(
      overlay(
        substring(int8send(ts_ms) FROM 3 FOR 6) ||
        extensions.gen_random_bytes(10)
        PLACING '\x70'::bytea FROM 7 FOR 1
      ),
      8,
      (get_byte(extensions.gen_random_bytes(1), 0) & 63) | 128
    ),
    6,
    (get_byte(substring(int8send(ts_ms) FROM 3 FOR 6) || extensions.gen_random_bytes(10), 6) & 15) | 112
  );
  RETURN encode(uuid_bytes, 'hex')::uuid;
END;
$$;
-- Shared trigger function: auto-update updated_at on row change
CREATE OR REPLACE FUNCTION jg_app.update_updated_at() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
ALTER FUNCTION jg_app.uuid_v7() OWNER TO postgres;
ALTER FUNCTION jg_app.uuid_v7_from_ts(timestamptz) OWNER TO postgres;
ALTER FUNCTION jg_app.update_updated_at() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION jg_app.uuid_v7() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION jg_app.uuid_v7_from_ts(timestamptz) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION jg_app.update_updated_at() TO anon, authenticated, service_role;
-- ============================================================================
-- 2. CREATE UUID MIGRATION MAPPING TABLE
-- ============================================================================

CREATE TABLE jg_app._uuid_migration_map (
  old_id uuid NOT NULL,
  new_id uuid NOT NULL,
  table_name text NOT NULL,
  PRIMARY KEY (old_id, table_name)
);
-- ============================================================================
-- 3. CREATE TABLES (fresh, with new names and uuid_v7 defaults)
-- ============================================================================

-- ---- Activity Tracker ----

CREATE TABLE jg_app.activity_tracker_activities (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);
CREATE TABLE jg_app.activity_tracker_entries (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL PRIMARY KEY,
  activity_id uuid,
  date date NOT NULL,
  completed boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (activity_id, date, user_id)
);
ALTER TABLE jg_app.activity_tracker_entries
  ADD CONSTRAINT activity_tracker_entries_activity_id_fkey
  FOREIGN KEY (activity_id) REFERENCES jg_app.activity_tracker_activities(id) ON DELETE CASCADE;
-- ---- Currency Calculator ----

CREATE TABLE jg_app.currency_calculator_calculations (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL PRIMARY KEY,
  created_at timestamptz DEFAULT timezone('utc', now()),
  note text,
  ist_timestamp text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE TABLE jg_app.currency_calculator_denominations (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL PRIMARY KEY,
  calculation_id uuid,
  denomination integer NOT NULL,
  count integer NOT NULL,
  total integer,
  bundle_count bigint,
  open_count bigint
);
ALTER TABLE jg_app.currency_calculator_denominations
  ADD CONSTRAINT currency_calculator_denominations_calc_fkey
  FOREIGN KEY (calculation_id) REFERENCES jg_app.currency_calculator_calculations(id) ON DELETE CASCADE;
-- ---- File Manager ----

CREATE TABLE jg_app.file_manager_type_categories (
  type_name text NOT NULL PRIMARY KEY,
  display_name text NOT NULL,
  icon text,
  allowed_mime_types text[] NOT NULL,
  max_size_bytes bigint DEFAULT 104857600,
  can_preview boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TABLE jg_app.file_manager_files (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL PRIMARY KEY,
  bucket_id text DEFAULT 'private-files' NOT NULL,
  storage_path text,
  original_filename text,
  display_name text,
  mime_type text NOT NULL,
  size_bytes bigint DEFAULT 0 NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  is_directory boolean DEFAULT false,
  child_count integer DEFAULT 0,
  file_type text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES jg_app.file_manager_files(id) ON DELETE CASCADE,
  version integer DEFAULT 1,
  is_latest_version boolean DEFAULT true,
  file_hash text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  is_deleted boolean DEFAULT false,
  UNIQUE (user_id, file_path, is_deleted)
);
-- ---- Game Hub ----

CREATE TABLE jg_app.game_hub_typing_speed_results (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wpm integer NOT NULL,
  accuracy numeric(5,2) NOT NULL,
  duration_seconds integer NOT NULL,
  total_characters integer NOT NULL,
  correct_characters integer NOT NULL,
  text_length integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
-- ---- Messenger ----

CREATE TABLE jg_app.messenger_messages (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text NOT NULL,
  language text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  is_read boolean DEFAULT false,
  CONSTRAINT messenger_messages_type_check CHECK (message_type = ANY (ARRAY['text', 'code']))
);
-- ---- Blog Posts (new) ----

CREATE TABLE jg_app.blog_posts (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL DEFAULT '',
  cover_image text,
  tags text[] NOT NULL DEFAULT '{}',
  is_visible boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- ============================================================================
-- 4. COPY DATA + GENERATE UUID v7 MAPPINGS
-- ============================================================================

-- ---- Activity Tracker: activities (parent table first) ----
INSERT INTO jg_app._uuid_migration_map (old_id, new_id, table_name)
SELECT id, jg_app.uuid_v7_from_ts(COALESCE(created_at, now())), 'activity_tracker_activities'
FROM activity_tracker.activities;
INSERT INTO jg_app.activity_tracker_activities (id, name, user_id, created_at, is_active)
SELECT m.new_id, a.name, a.user_id, a.created_at, a.is_active
FROM activity_tracker.activities a
JOIN jg_app._uuid_migration_map m ON m.old_id = a.id AND m.table_name = 'activity_tracker_activities';
-- ---- Activity Tracker: entries (child, needs activity_id mapped) ----
INSERT INTO jg_app._uuid_migration_map (old_id, new_id, table_name)
SELECT id, jg_app.uuid_v7_from_ts(COALESCE(created_at, now())), 'activity_tracker_entries'
FROM activity_tracker.activity_entries;
INSERT INTO jg_app.activity_tracker_entries (id, activity_id, date, completed, user_id, created_at)
SELECT
  em.new_id,
  am.new_id,  -- mapped activity_id
  e.date, e.completed, e.user_id, e.created_at
FROM activity_tracker.activity_entries e
JOIN jg_app._uuid_migration_map em ON em.old_id = e.id AND em.table_name = 'activity_tracker_entries'
LEFT JOIN jg_app._uuid_migration_map am ON am.old_id = e.activity_id AND am.table_name = 'activity_tracker_activities';
-- ---- Currency Calculator: calculations (parent) ----
INSERT INTO jg_app._uuid_migration_map (old_id, new_id, table_name)
SELECT id, jg_app.uuid_v7_from_ts(COALESCE(created_at, now())), 'currency_calculator_calculations'
FROM currency_calculator.calculations;
INSERT INTO jg_app.currency_calculator_calculations (id, created_at, note, ist_timestamp, user_id)
SELECT m.new_id, c.created_at, c.note, c.ist_timestamp, c.user_id
FROM currency_calculator.calculations c
JOIN jg_app._uuid_migration_map m ON m.old_id = c.id AND m.table_name = 'currency_calculator_calculations';
-- ---- Currency Calculator: denominations (child) ----
INSERT INTO jg_app._uuid_migration_map (old_id, new_id, table_name)
SELECT id, jg_app.uuid_v7(), 'currency_calculator_denominations'
FROM currency_calculator.denominations;
INSERT INTO jg_app.currency_calculator_denominations (id, calculation_id, denomination, count, total, bundle_count, open_count)
SELECT
  dm.new_id,
  cm.new_id,  -- mapped calculation_id
  d.denomination, d.count, d.total, d.bundle_count, d.open_count
FROM currency_calculator.denominations d
JOIN jg_app._uuid_migration_map dm ON dm.old_id = d.id AND dm.table_name = 'currency_calculator_denominations'
LEFT JOIN jg_app._uuid_migration_map cm ON cm.old_id = d.calculation_id AND cm.table_name = 'currency_calculator_calculations';
-- ---- File Manager: type_categories (TEXT PK, no UUID migration) ----
INSERT INTO jg_app.file_manager_type_categories
SELECT * FROM fmanager.file_type_categories;
-- ---- File Manager: files (self-referential FK — two-pass approach) ----
-- Pass 1: Generate mappings
INSERT INTO jg_app._uuid_migration_map (old_id, new_id, table_name)
SELECT id, jg_app.uuid_v7_from_ts(COALESCE(created_at, now())), 'file_manager_files'
FROM fmanager.files;
-- Pass 2: Insert with mapped IDs (parent_id mapped via same table)
INSERT INTO jg_app.file_manager_files (
  id, bucket_id, storage_path, original_filename, display_name, mime_type,
  size_bytes, file_path, file_name, is_directory, child_count, file_type,
  user_id, parent_id, version, is_latest_version, file_hash,
  created_at, updated_at, deleted_at, is_deleted
)
SELECT
  fm.new_id,
  f.bucket_id, f.storage_path, f.original_filename, f.display_name, f.mime_type,
  f.size_bytes, f.file_path, f.file_name, f.is_directory, f.child_count, f.file_type,
  f.user_id,
  pm.new_id,  -- mapped parent_id (NULL if root)
  f.version, f.is_latest_version, f.file_hash,
  f.created_at, f.updated_at, f.deleted_at, f.is_deleted
FROM fmanager.files f
JOIN jg_app._uuid_migration_map fm ON fm.old_id = f.id AND fm.table_name = 'file_manager_files'
LEFT JOIN jg_app._uuid_migration_map pm ON pm.old_id = f.parent_id AND pm.table_name = 'file_manager_files';
-- ---- Game Hub: typing_speed_results ----
INSERT INTO jg_app._uuid_migration_map (old_id, new_id, table_name)
SELECT id, jg_app.uuid_v7_from_ts(created_at), 'game_hub_typing_speed_results'
FROM game_hub.typing_speed_results;
INSERT INTO jg_app.game_hub_typing_speed_results (id, user_id, wpm, accuracy, duration_seconds, total_characters, correct_characters, text_length, created_at)
SELECT m.new_id, t.user_id, t.wpm, t.accuracy, t.duration_seconds, t.total_characters, t.correct_characters, t.text_length, t.created_at
FROM game_hub.typing_speed_results t
JOIN jg_app._uuid_migration_map m ON m.old_id = t.id AND m.table_name = 'game_hub_typing_speed_results';
-- ---- Messenger: messages ----
INSERT INTO jg_app._uuid_migration_map (old_id, new_id, table_name)
SELECT id, jg_app.uuid_v7_from_ts(created_at), 'messenger_messages'
FROM messenger.messages;
INSERT INTO jg_app.messenger_messages (id, user_id, content, message_type, language, created_at, updated_at, is_read)
SELECT m.new_id, msg.user_id, msg.content, msg.message_type, msg.language, msg.created_at, msg.updated_at, msg.is_read
FROM messenger.messages msg
JOIN jg_app._uuid_migration_map m ON m.old_id = msg.id AND m.table_name = 'messenger_messages';
-- ============================================================================
-- 5. VERIFY ROW COUNTS
-- ============================================================================

DO $$
DECLARE
  old_count bigint;
  new_count bigint;
BEGIN
  SELECT count(*) INTO old_count FROM activity_tracker.activities;
  SELECT count(*) INTO new_count FROM jg_app.activity_tracker_activities;
  IF old_count != new_count THEN RAISE EXCEPTION 'activity_tracker_activities count mismatch: % vs %', old_count, new_count; END IF;

  SELECT count(*) INTO old_count FROM activity_tracker.activity_entries;
  SELECT count(*) INTO new_count FROM jg_app.activity_tracker_entries;
  IF old_count != new_count THEN RAISE EXCEPTION 'activity_tracker_entries count mismatch: % vs %', old_count, new_count; END IF;

  SELECT count(*) INTO old_count FROM currency_calculator.calculations;
  SELECT count(*) INTO new_count FROM jg_app.currency_calculator_calculations;
  IF old_count != new_count THEN RAISE EXCEPTION 'currency_calculator_calculations count mismatch: % vs %', old_count, new_count; END IF;

  SELECT count(*) INTO old_count FROM currency_calculator.denominations;
  SELECT count(*) INTO new_count FROM jg_app.currency_calculator_denominations;
  IF old_count != new_count THEN RAISE EXCEPTION 'currency_calculator_denominations count mismatch: % vs %', old_count, new_count; END IF;

  SELECT count(*) INTO old_count FROM fmanager.files;
  SELECT count(*) INTO new_count FROM jg_app.file_manager_files;
  IF old_count != new_count THEN RAISE EXCEPTION 'file_manager_files count mismatch: % vs %', old_count, new_count; END IF;

  SELECT count(*) INTO old_count FROM fmanager.file_type_categories;
  SELECT count(*) INTO new_count FROM jg_app.file_manager_type_categories;
  IF old_count != new_count THEN RAISE EXCEPTION 'file_manager_type_categories count mismatch: % vs %', old_count, new_count; END IF;

  SELECT count(*) INTO old_count FROM game_hub.typing_speed_results;
  SELECT count(*) INTO new_count FROM jg_app.game_hub_typing_speed_results;
  IF old_count != new_count THEN RAISE EXCEPTION 'game_hub_typing_speed_results count mismatch: % vs %', old_count, new_count; END IF;

  SELECT count(*) INTO old_count FROM messenger.messages;
  SELECT count(*) INTO new_count FROM jg_app.messenger_messages;
  IF old_count != new_count THEN RAISE EXCEPTION 'messenger_messages count mismatch: % vs %', old_count, new_count; END IF;

  RAISE NOTICE 'All row counts verified successfully!';
END;
$$;
-- ============================================================================
-- 6. CREATE INDEXES
-- ============================================================================

-- Activity Tracker
CREATE INDEX idx_at_activities_user_id ON jg_app.activity_tracker_activities (user_id);
CREATE INDEX idx_at_entries_activity_id ON jg_app.activity_tracker_entries (activity_id);
CREATE INDEX idx_at_entries_date ON jg_app.activity_tracker_entries (date);
CREATE INDEX idx_at_entries_user_id ON jg_app.activity_tracker_entries (user_id);
CREATE INDEX idx_at_entries_user_activity_date ON jg_app.activity_tracker_entries (user_id, activity_id, date);
-- Game Hub
CREATE INDEX idx_gh_typing_user_id ON jg_app.game_hub_typing_speed_results (user_id);
CREATE INDEX idx_gh_typing_created_at ON jg_app.game_hub_typing_speed_results (created_at DESC);
-- Messenger
CREATE INDEX idx_msg_messages_user_id ON jg_app.messenger_messages (user_id);
CREATE INDEX idx_msg_messages_created_at ON jg_app.messenger_messages (created_at DESC);
-- File Manager
CREATE INDEX idx_fm_files_user_id ON jg_app.file_manager_files (user_id);
CREATE INDEX idx_fm_files_parent_id ON jg_app.file_manager_files (parent_id);
CREATE INDEX idx_fm_files_file_path ON jg_app.file_manager_files (file_path);
CREATE INDEX idx_fm_files_file_type ON jg_app.file_manager_files (file_type);
CREATE INDEX idx_fm_files_is_directory ON jg_app.file_manager_files (is_directory);
CREATE INDEX idx_fm_files_created_at ON jg_app.file_manager_files (created_at);
CREATE INDEX idx_fm_files_path_prefix ON jg_app.file_manager_files (user_id, file_path text_pattern_ops) WHERE NOT is_deleted;
CREATE INDEX idx_fm_files_user_parent ON jg_app.file_manager_files (user_id, parent_id) WHERE NOT is_deleted;
CREATE INDEX idx_fm_files_user_parent_type ON jg_app.file_manager_files (user_id, parent_id, file_type) WHERE NOT is_deleted;
-- Blog Posts
CREATE INDEX idx_blog_slug ON jg_app.blog_posts (slug);
CREATE INDEX idx_blog_published ON jg_app.blog_posts (is_published, is_visible, published_at DESC);
CREATE INDEX idx_blog_sort_order ON jg_app.blog_posts (sort_order);
-- ============================================================================
-- 7. FILE MANAGER FUNCTIONS (schema-specific, reference jg_app tables)
-- ============================================================================

CREATE OR REPLACE FUNCTION jg_app.handle_soft_delete() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
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
CREATE OR REPLACE FUNCTION jg_app.update_parent_child_count() RETURNS trigger
LANGUAGE plpgsql
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
CREATE OR REPLACE FUNCTION jg_app.validate_file_type() RETURNS trigger
LANGUAGE plpgsql
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
CREATE OR REPLACE FUNCTION jg_app.generate_storage_path(p_user_id uuid, p_file_path text, p_file_name text) RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  file_uuid TEXT;
  file_ext TEXT;
BEGIN
  file_uuid := gen_random_uuid()::text;
  file_ext := substring(p_file_name from '\.([^\.]+)$');
  RETURN p_user_id::text || '/' || file_uuid ||
         CASE WHEN file_ext IS NOT NULL THEN '.' || file_ext ELSE '' END;
END;
$$;
CREATE OR REPLACE FUNCTION jg_app.create_directory_path(p_user_id uuid, p_directory_path text) RETURNS uuid
LANGUAGE plpgsql
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
CREATE OR REPLACE FUNCTION jg_app.list_directory(p_user_id uuid, p_directory_path text DEFAULT '/')
RETURNS TABLE(id uuid, file_path text, file_name text, display_name text, mime_type text,
              size_bytes bigint, file_type text, is_directory boolean, child_count integer,
              created_at timestamptz, updated_at timestamptz)
LANGUAGE plpgsql
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
CREATE OR REPLACE FUNCTION jg_app.get_directory_tree(p_user_id uuid, p_parent_path text DEFAULT '/')
RETURNS TABLE(id uuid, file_path text, file_name text, display_name text, mime_type text,
              size_bytes bigint, file_type text, is_directory boolean, child_count integer,
              created_at timestamptz, updated_at timestamptz, depth integer)
LANGUAGE plpgsql
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
CREATE OR REPLACE FUNCTION jg_app.get_file_by_path(p_user_id uuid, p_file_path text)
RETURNS SETOF jg_app.file_manager_files
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM jg_app.file_manager_files
  WHERE user_id = p_user_id AND file_path = p_file_path AND NOT is_deleted;
END;
$$;
CREATE OR REPLACE FUNCTION jg_app.soft_delete_file(p_file_id uuid, p_user_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
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
CREATE OR REPLACE FUNCTION jg_app.copy_file(p_file_id uuid, p_target_directory_path text, p_user_id uuid) RETURNS uuid
LANGUAGE plpgsql
AS $$
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
$$;
CREATE OR REPLACE FUNCTION jg_app.move_file(p_file_id uuid, p_new_directory_path text, p_user_id uuid) RETURNS boolean
LANGUAGE plpgsql
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
-- Grant all functions
DO $$
DECLARE
  func_name text;
BEGIN
  FOR func_name IN
    SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'jg_app' AND p.proname NOT IN ('uuid_v7', 'uuid_v7_from_ts', 'update_updated_at')
  LOOP
    -- Functions already accessible via schema grant
  END LOOP;
END;
$$;
-- ============================================================================
-- 8. CREATE TRIGGERS
-- ============================================================================

-- File Manager triggers
CREATE TRIGGER handle_soft_delete_trigger
  BEFORE UPDATE ON jg_app.file_manager_files
  FOR EACH ROW EXECUTE FUNCTION jg_app.handle_soft_delete();
CREATE TRIGGER update_child_count_trigger
  AFTER INSERT OR DELETE ON jg_app.file_manager_files
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_parent_child_count();
CREATE TRIGGER validate_file_type_trigger
  BEFORE INSERT OR UPDATE ON jg_app.file_manager_files
  FOR EACH ROW EXECUTE FUNCTION jg_app.validate_file_type();
-- Messenger updated_at trigger (uses shared function)
CREATE TRIGGER update_messenger_messages_updated_at
  BEFORE UPDATE ON jg_app.messenger_messages
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();
-- Blog posts updated_at trigger
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON jg_app.blog_posts
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();
-- ============================================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================================

-- Activity Tracker
ALTER TABLE jg_app.activity_tracker_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.activity_tracker_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activities" ON jg_app.activity_tracker_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON jg_app.activity_tracker_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON jg_app.activity_tracker_activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON jg_app.activity_tracker_activities FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own entries" ON jg_app.activity_tracker_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entries" ON jg_app.activity_tracker_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries" ON jg_app.activity_tracker_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries" ON jg_app.activity_tracker_entries FOR DELETE USING (auth.uid() = user_id);
-- Currency Calculator
ALTER TABLE jg_app.currency_calculator_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.currency_calculator_denominations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_calculations" ON jg_app.currency_calculator_calculations FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "insert_own_calculations" ON jg_app.currency_calculator_calculations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own_calculations" ON jg_app.currency_calculator_calculations FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete_own_calculations" ON jg_app.currency_calculator_calculations FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "select_own_denominations" ON jg_app.currency_calculator_denominations FOR SELECT TO authenticated
  USING (calculation_id IN (SELECT id FROM jg_app.currency_calculator_calculations WHERE user_id = auth.uid()));
CREATE POLICY "insert_own_denominations" ON jg_app.currency_calculator_denominations FOR INSERT TO authenticated
  WITH CHECK (calculation_id IN (SELECT id FROM jg_app.currency_calculator_calculations WHERE user_id = auth.uid()));
CREATE POLICY "update_own_denominations" ON jg_app.currency_calculator_denominations FOR UPDATE TO authenticated
  USING (calculation_id IN (SELECT id FROM jg_app.currency_calculator_calculations WHERE user_id = auth.uid()))
  WITH CHECK (calculation_id IN (SELECT id FROM jg_app.currency_calculator_calculations WHERE user_id = auth.uid()));
CREATE POLICY "delete_own_denominations" ON jg_app.currency_calculator_denominations FOR DELETE TO authenticated
  USING (calculation_id IN (SELECT id FROM jg_app.currency_calculator_calculations WHERE user_id = auth.uid()));
-- File Manager
ALTER TABLE jg_app.file_manager_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.file_manager_type_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own files" ON jg_app.file_manager_files FOR SELECT USING (user_id = auth.uid() AND NOT is_deleted);
CREATE POLICY "Users can insert own files" ON jg_app.file_manager_files FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own files" ON jg_app.file_manager_files FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own files" ON jg_app.file_manager_files FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Anyone can view file types" ON jg_app.file_manager_type_categories FOR SELECT TO authenticated USING (true);
-- Game Hub
ALTER TABLE jg_app.game_hub_typing_speed_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own results" ON jg_app.game_hub_typing_speed_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results" ON jg_app.game_hub_typing_speed_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- Messenger
ALTER TABLE jg_app.messenger_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON jg_app.messenger_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON jg_app.messenger_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own messages" ON jg_app.messenger_messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON jg_app.messenger_messages FOR DELETE USING (auth.uid() = user_id);
-- Blog Posts (public read, admin write)
ALTER TABLE jg_app.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published posts" ON jg_app.blog_posts FOR SELECT USING (is_published = true AND is_visible = true);
CREATE POLICY "Admins can manage posts" ON jg_app.blog_posts FOR ALL TO authenticated USING (jg_account.is_admin()) WITH CHECK (jg_account.is_admin());
-- ============================================================================
-- 10. GRANTS
-- ============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA jg_app TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA jg_app TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA jg_app TO anon;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA jg_app TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA jg_app TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA jg_app TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA jg_app
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA jg_app
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA jg_app
  GRANT ALL ON FUNCTIONS TO authenticated, anon, service_role;
-- ============================================================================
-- 11. CLEANUP (old schemas dropped — data is safely in jg_app)
-- ============================================================================

DROP SCHEMA IF EXISTS activity_tracker CASCADE;
DROP SCHEMA IF EXISTS currency_calculator CASCADE;
DROP SCHEMA IF EXISTS fmanager CASCADE;
DROP SCHEMA IF EXISTS game_hub CASCADE;
DROP SCHEMA IF EXISTS messenger CASCADE;
-- Drop the migration helper function and mapping table
DROP FUNCTION IF EXISTS jg_app.uuid_v7_from_ts(timestamptz);
DROP TABLE IF EXISTS jg_app._uuid_migration_map;
COMMIT;
