


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


CREATE SCHEMA IF NOT EXISTS "fmanager";


ALTER SCHEMA "fmanager" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "fmanager"."copy_file"("p_file_id" "uuid", "p_target_directory_path" "text", "p_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  file_record RECORD;
  target_parent_id UUID;
  new_file_id UUID;
  new_storage_path TEXT;
  new_file_path TEXT;
BEGIN
  -- Get file details
  SELECT * INTO file_record 
  FROM fmanager.files 
  WHERE id = p_file_id 
    AND user_id = p_user_id 
    AND NOT is_deleted;
    
  IF file_record IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get target directory
  SELECT id INTO target_parent_id 
  FROM fmanager.files 
  WHERE user_id = p_user_id 
    AND file_path = p_target_directory_path 
    AND is_directory = true 
    AND NOT is_deleted;
    
  IF target_parent_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Generate new file path
  new_file_path := p_target_directory_path || file_record.file_name;
  
  -- Check if file already exists
  IF EXISTS (
    SELECT 1 FROM fmanager.files 
    WHERE user_id = p_user_id 
      AND file_path = new_file_path 
      AND NOT is_deleted
  ) THEN
    -- Append copy suffix
    new_file_path := p_target_directory_path || 
                    substring(file_record.file_name from '^(.*?)(\.[^\.]*)?$') || 
                    ' (copy)' || 
                    coalesce(substring(file_record.file_name from '(\.[^\.]*)$'), '');
  END IF;
  
  -- Generate new storage path
  new_storage_path := fmanager.generate_storage_path(p_user_id, new_file_path, file_record.file_name);
  
  -- Insert copy
  INSERT INTO fmanager.files (
    user_id,
    bucket_id,
    storage_path,
    original_filename,
    display_name,
    mime_type,
    size_bytes,
    file_path,
    file_name,
    file_type,
    is_directory,
    parent_id,
    file_hash
  ) VALUES (
    p_user_id,
    file_record.bucket_id,
    new_storage_path,
    file_record.original_filename,
    file_record.display_name || ' (copy)',
    file_record.mime_type,
    file_record.size_bytes,
    new_file_path,
    substring(new_file_path from '[^/]+$'),
    file_record.file_type,
    false,
    target_parent_id,
    file_record.file_hash
  ) RETURNING id INTO new_file_id;
  
  -- In a real system, you would also copy the actual file in storage here
  
  RETURN new_file_id;
END;
$_$;


ALTER FUNCTION "fmanager"."copy_file"("p_file_id" "uuid", "p_target_directory_path" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "fmanager"."create_directory_path"("p_user_id" "uuid", "p_directory_path" "text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  path_parts TEXT[];
  current_path TEXT;
  parent_id UUID := NULL;
  dir_id UUID;
  i INTEGER;
  part TEXT;
  display_name TEXT;
BEGIN
  -- Split path into parts
  path_parts := string_to_array(trim(both '/' from p_directory_path), '/');
  current_path := '/';
  
  -- Ensure root directory exists
  INSERT INTO fmanager.files (
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
  ) VALUES (
    p_user_id,
    'private-files',
    NULL, -- Directories don't have storage paths
    NULL, -- Directories don't have original filenames
    '/',
    '',
    'Root',
    'inode/directory',
    'directory',
    true,
    NULL
  ) ON CONFLICT (user_id, file_path, is_deleted) 
  WHERE NOT is_deleted DO NOTHING;
  
  -- Get root ID
  SELECT f.id INTO parent_id 
  FROM fmanager.files f
  WHERE f.user_id = p_user_id 
    AND f.file_path = '/' 
    AND NOT f.is_deleted;
  
  -- If path is root, just return root ID
  IF p_directory_path = '/' OR p_directory_path = '' OR array_length(path_parts, 1) IS NULL THEN
    RETURN parent_id;
  END IF;
  
  -- Create each directory in the path (only if path_parts is not empty)
  FOR i IN 1..array_length(path_parts, 1) LOOP
    part := path_parts[i];
    current_path := current_path || part || '/';
    display_name := part;
    
    -- Try to insert directory
    INSERT INTO fmanager.files (
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
    ) VALUES (
      p_user_id,
      'private-files',
      NULL, -- Directories don't have storage paths
      NULL, -- Directories don't have original filenames
      current_path,
      part,
      display_name,
      'inode/directory',
      'directory',
      true,
      parent_id
    )
    ON CONFLICT (user_id, file_path, is_deleted) 
    WHERE NOT is_deleted DO UPDATE
    SET updated_at = NOW()
    RETURNING id INTO dir_id;
    
    -- Get the ID if insertion succeeded
    IF dir_id IS NULL THEN
      SELECT f.id INTO dir_id 
      FROM fmanager.files f
      WHERE f.user_id = p_user_id 
        AND f.file_path = current_path 
        AND NOT f.is_deleted;
    END IF;
    
    parent_id := dir_id;
  END LOOP;
  
  RETURN parent_id;
END;
$$;


ALTER FUNCTION "fmanager"."create_directory_path"("p_user_id" "uuid", "p_directory_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "fmanager"."generate_storage_path"("p_user_id" "uuid", "p_file_path" "text", "p_file_name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  file_uuid TEXT;
  file_ext TEXT;
BEGIN
  -- Generate UUID for file
  file_uuid := gen_random_uuid()::text;
  
  -- Get file extension
  file_ext := substring(p_file_name from '\.([^\.]+)$');
  
  -- Return storage path: user_id/uuid_filename.ext
  RETURN p_user_id::text || '/' || file_uuid || 
         CASE WHEN file_ext IS NOT NULL THEN '.' || file_ext ELSE '' END;
END;
$_$;


ALTER FUNCTION "fmanager"."generate_storage_path"("p_user_id" "uuid", "p_file_path" "text", "p_file_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "fmanager"."get_directory_tree"("p_user_id" "uuid", "p_parent_path" "text" DEFAULT '/'::"text") RETURNS TABLE("id" "uuid", "file_path" "text", "file_name" "text", "display_name" "text", "mime_type" "text", "size_bytes" bigint, "file_type" "text", "is_directory" boolean, "child_count" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "depth" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE dir_tree AS (
    -- Start with requested directory
    SELECT 
      f.id,
      f.file_path,
      f.file_name,
      f.display_name,
      f.mime_type,
      f.size_bytes,
      f.file_type,
      f.is_directory,
      f.child_count,
      f.created_at,
      f.updated_at,
      0 as depth
    FROM fmanager.files f
    WHERE f.user_id = p_user_id
      AND f.file_path = p_parent_path
      AND f.is_directory = true
      AND NOT f.is_deleted
    
    UNION ALL
    
    -- Get all children recursively
    SELECT 
      f.id,
      f.file_path,
      f.file_name,
      f.display_name,
      f.mime_type,
      f.size_bytes,
      f.file_type,
      f.is_directory,
      f.child_count,
      f.created_at,
      f.updated_at,
      dt.depth + 1
    FROM fmanager.files f
    INNER JOIN dir_tree dt ON f.parent_id = dt.id
    WHERE f.user_id = p_user_id
      AND NOT f.is_deleted
  )
  SELECT * FROM dir_tree
  ORDER BY is_directory DESC, file_name;
END;
$$;


ALTER FUNCTION "fmanager"."get_directory_tree"("p_user_id" "uuid", "p_parent_path" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "fmanager"."files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
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


ALTER TABLE "fmanager"."files" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "fmanager"."get_file_by_path"("p_user_id" "uuid", "p_file_path" "text") RETURNS SETOF "fmanager"."files"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM fmanager.files
  WHERE user_id = p_user_id
    AND file_path = p_file_path
    AND NOT is_deleted;
END;
$$;


ALTER FUNCTION "fmanager"."get_file_by_path"("p_user_id" "uuid", "p_file_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "fmanager"."handle_soft_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
    NEW.deleted_at := NOW();
    
    -- Update parent's child count (this needs SECURITY DEFINER to bypass RLS)
    IF NEW.parent_id IS NOT NULL THEN
      UPDATE fmanager.files
      SET child_count = child_count - 1,
          updated_at = NOW()
      WHERE id = NEW.parent_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "fmanager"."handle_soft_delete"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "fmanager"."list_directory"("p_user_id" "uuid", "p_directory_path" "text" DEFAULT '/'::"text") RETURNS TABLE("id" "uuid", "file_path" "text", "file_name" "text", "display_name" "text", "mime_type" "text", "size_bytes" bigint, "file_type" "text", "is_directory" boolean, "child_count" integer, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
                                                                                                                                                      DECLARE
                                                                                                                                                        dir_id UUID;
                                                                                                                                                        BEGIN
                                                                                                                                                          -- Get directory ID - use table alias to avoid ambiguity with RETURNS TABLE column
                                                                                                                                                            SELECT f.id INTO dir_id
                                                                                                                                                              FROM fmanager.files f
                                                                                                                                                                WHERE f.user_id = p_user_id
                                                                                                                                                                    AND f.file_path = p_directory_path
                                                                                                                                                                        AND f.is_directory = true
                                                                                                                                                                            AND NOT f.is_deleted;
                                                                                                                                                                                
                                                                                                                                                                                  IF dir_id IS NULL THEN
                                                                                                                                                                                      RAISE EXCEPTION 'Directory not found';
                                                                                                                                                                                        END IF;
                                                                                                                                                                                          
                                                                                                                                                                                            RETURN QUERY
                                                                                                                                                                                              SELECT 
                                                                                                                                                                                                  f.id,
                                                                                                                                                                                                      f.file_path,
                                                                                                                                                                                                          f.file_name,
                                                                                                                                                                                                              f.display_name,
                                                                                                                                                                                                                  f.mime_type,
                                                                                                                                                                                                                      f.size_bytes,
                                                                                                                                                                                                                          f.file_type,
                                                                                                                                                                                                                              f.is_directory,
                                                                                                                                                                                                                                  f.child_count,
                                                                                                                                                                                                                                      f.created_at,
                                                                                                                                                                                                                                          f.updated_at
                                                                                                                                                                                                                                            FROM fmanager.files f
                                                                                                                                                                                                                                              WHERE f.user_id = p_user_id
                                                                                                                                                                                                                                                  AND f.parent_id = dir_id
                                                                                                                                                                                                                                                      AND NOT f.is_deleted
                                                                                                                                                                                                                                                        ORDER BY f.is_directory DESC, f.file_name;
                                                                                                                                                                                                                                                        END;
                                                                                                                                                                                                                                                        $$;


ALTER FUNCTION "fmanager"."list_directory"("p_user_id" "uuid", "p_directory_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "fmanager"."move_file"("p_file_id" "uuid", "p_new_directory_path" "text", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  old_parent_id UUID;
  new_parent_id UUID;
  file_record RECORD;
  new_file_path TEXT;
BEGIN
  -- Get file details
  SELECT * INTO file_record 
  FROM fmanager.files 
  WHERE id = p_file_id 
    AND user_id = p_user_id 
    AND NOT is_deleted;
    
  IF file_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get new parent directory ID
  SELECT id INTO new_parent_id 
  FROM fmanager.files 
  WHERE user_id = p_user_id 
    AND file_path = p_new_directory_path 
    AND is_directory = true 
    AND NOT is_deleted;
    
  IF new_parent_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Construct new file path
  new_file_path := p_new_directory_path || file_record.file_name;
  
  -- Check if file already exists at new location
  IF EXISTS (
    SELECT 1 FROM fmanager.files 
    WHERE user_id = p_user_id 
      AND file_path = new_file_path 
      AND NOT is_deleted
  ) THEN
    RETURN false;
  END IF;
  
  -- Update file
  UPDATE fmanager.files
  SET 
    parent_id = new_parent_id,
    file_path = new_file_path,
    updated_at = NOW()
  WHERE id = p_file_id;
  
  -- Update child counts
  IF file_record.parent_id IS NOT NULL THEN
    UPDATE fmanager.files
    SET child_count = child_count - 1
    WHERE id = file_record.parent_id;
  END IF;
  
  UPDATE fmanager.files
  SET child_count = child_count + 1
  WHERE id = new_parent_id;
  
  RETURN true;
END;
$$;


ALTER FUNCTION "fmanager"."move_file"("p_file_id" "uuid", "p_new_directory_path" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "fmanager"."soft_delete_file"("p_file_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  file_record RECORD;
BEGIN
  -- Get file details and verify ownership
  SELECT * INTO file_record 
  FROM fmanager.files 
  WHERE id = p_file_id 
    AND user_id = p_user_id 
    AND NOT is_deleted;
    
  IF file_record IS NULL THEN
    RETURN false;
  END IF;
  
  -- Soft delete the file
  UPDATE fmanager.files
  SET 
    is_deleted = true,
    deleted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_file_id;
  
  RETURN true;
END;
$$;


ALTER FUNCTION "fmanager"."soft_delete_file"("p_file_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "fmanager"."update_parent_child_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE fmanager.files
    SET child_count = child_count + 1,
        updated_at = NOW()
    WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL AND NOT OLD.is_deleted THEN
    UPDATE fmanager.files
    SET child_count = child_count - 1,
        updated_at = NOW()
    WHERE id = OLD.parent_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "fmanager"."update_parent_child_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "fmanager"."validate_file_type"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  allowed_types TEXT[];
BEGIN
  -- Get allowed mime types for this file_type
  SELECT allowed_mime_types INTO allowed_types
  FROM fmanager.file_type_categories
  WHERE type_name = NEW.file_type;
  
  -- Check if mime type is allowed
  IF NOT (
    NEW.mime_type = ANY(allowed_types) 
    OR (allowed_types @> ARRAY['*'])
  ) THEN
    RAISE EXCEPTION 'Mime type % is not allowed for file type %', NEW.mime_type, NEW.file_type;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "fmanager"."validate_file_type"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "fmanager"."file_type_categories" (
    "type_name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "icon" "text",
    "allowed_mime_types" "text"[] NOT NULL,
    "max_size_bytes" bigint DEFAULT 104857600,
    "can_preview" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "fmanager"."file_type_categories" OWNER TO "postgres";


ALTER TABLE ONLY "fmanager"."file_type_categories"
    ADD CONSTRAINT "file_type_categories_pkey" PRIMARY KEY ("type_name");



ALTER TABLE ONLY "fmanager"."files"
    ADD CONSTRAINT "files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "fmanager"."files"
    ADD CONSTRAINT "unique_user_path" UNIQUE ("user_id", "file_path", "is_deleted");



CREATE INDEX "idx_files_created_at" ON "fmanager"."files" USING "btree" ("created_at");



CREATE INDEX "idx_files_file_path" ON "fmanager"."files" USING "btree" ("file_path");



CREATE INDEX "idx_files_file_type" ON "fmanager"."files" USING "btree" ("file_type");



CREATE INDEX "idx_files_is_directory" ON "fmanager"."files" USING "btree" ("is_directory");



CREATE INDEX "idx_files_parent_id" ON "fmanager"."files" USING "btree" ("parent_id");



CREATE INDEX "idx_files_path_prefix" ON "fmanager"."files" USING "btree" ("user_id", "file_path" "text_pattern_ops") WHERE (NOT "is_deleted");



CREATE INDEX "idx_files_user_id" ON "fmanager"."files" USING "btree" ("user_id");



CREATE INDEX "idx_files_user_parent" ON "fmanager"."files" USING "btree" ("user_id", "parent_id") WHERE (NOT "is_deleted");



CREATE INDEX "idx_files_user_parent_type" ON "fmanager"."files" USING "btree" ("user_id", "parent_id", "file_type") WHERE (NOT "is_deleted");



CREATE OR REPLACE TRIGGER "handle_soft_delete_trigger" BEFORE UPDATE ON "fmanager"."files" FOR EACH ROW EXECUTE FUNCTION "fmanager"."handle_soft_delete"();



CREATE OR REPLACE TRIGGER "update_child_count_trigger" AFTER INSERT OR DELETE ON "fmanager"."files" FOR EACH ROW EXECUTE FUNCTION "fmanager"."update_parent_child_count"();



CREATE OR REPLACE TRIGGER "validate_file_type_trigger" BEFORE INSERT OR UPDATE ON "fmanager"."files" FOR EACH ROW EXECUTE FUNCTION "fmanager"."validate_file_type"();



ALTER TABLE ONLY "fmanager"."files"
    ADD CONSTRAINT "files_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "fmanager"."files"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "fmanager"."files"
    ADD CONSTRAINT "files_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can view file types" ON "fmanager"."file_type_categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can delete only their own files" ON "fmanager"."files" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert only their own files" ON "fmanager"."files" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update only their own files" ON "fmanager"."files" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view only their own files" ON "fmanager"."files" FOR SELECT USING ((("user_id" = "auth"."uid"()) AND (NOT "is_deleted")));



ALTER TABLE "fmanager"."file_type_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "fmanager"."files" ENABLE ROW LEVEL SECURITY;


GRANT ALL ON SCHEMA "fmanager" TO "authenticated";
GRANT USAGE ON SCHEMA "fmanager" TO "anon";
GRANT USAGE ON SCHEMA "fmanager" TO "service_role";



GRANT ALL ON FUNCTION "fmanager"."copy_file"("p_file_id" "uuid", "p_target_directory_path" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "fmanager"."copy_file"("p_file_id" "uuid", "p_target_directory_path" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "fmanager"."copy_file"("p_file_id" "uuid", "p_target_directory_path" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "fmanager"."create_directory_path"("p_user_id" "uuid", "p_directory_path" "text") TO "anon";
GRANT ALL ON FUNCTION "fmanager"."create_directory_path"("p_user_id" "uuid", "p_directory_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "fmanager"."create_directory_path"("p_user_id" "uuid", "p_directory_path" "text") TO "service_role";



GRANT ALL ON FUNCTION "fmanager"."generate_storage_path"("p_user_id" "uuid", "p_file_path" "text", "p_file_name" "text") TO "anon";
GRANT ALL ON FUNCTION "fmanager"."generate_storage_path"("p_user_id" "uuid", "p_file_path" "text", "p_file_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "fmanager"."generate_storage_path"("p_user_id" "uuid", "p_file_path" "text", "p_file_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "fmanager"."get_directory_tree"("p_user_id" "uuid", "p_parent_path" "text") TO "anon";
GRANT ALL ON FUNCTION "fmanager"."get_directory_tree"("p_user_id" "uuid", "p_parent_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "fmanager"."get_directory_tree"("p_user_id" "uuid", "p_parent_path" "text") TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "fmanager"."files" TO "authenticated";



GRANT ALL ON FUNCTION "fmanager"."get_file_by_path"("p_user_id" "uuid", "p_file_path" "text") TO "anon";
GRANT ALL ON FUNCTION "fmanager"."get_file_by_path"("p_user_id" "uuid", "p_file_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "fmanager"."get_file_by_path"("p_user_id" "uuid", "p_file_path" "text") TO "service_role";



GRANT ALL ON FUNCTION "fmanager"."handle_soft_delete"() TO "anon";
GRANT ALL ON FUNCTION "fmanager"."handle_soft_delete"() TO "authenticated";
GRANT ALL ON FUNCTION "fmanager"."handle_soft_delete"() TO "service_role";



GRANT ALL ON FUNCTION "fmanager"."list_directory"("p_user_id" "uuid", "p_directory_path" "text") TO "anon";
GRANT ALL ON FUNCTION "fmanager"."list_directory"("p_user_id" "uuid", "p_directory_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "fmanager"."list_directory"("p_user_id" "uuid", "p_directory_path" "text") TO "service_role";



GRANT ALL ON FUNCTION "fmanager"."move_file"("p_file_id" "uuid", "p_new_directory_path" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "fmanager"."move_file"("p_file_id" "uuid", "p_new_directory_path" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "fmanager"."move_file"("p_file_id" "uuid", "p_new_directory_path" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "fmanager"."soft_delete_file"("p_file_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "fmanager"."soft_delete_file"("p_file_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "fmanager"."soft_delete_file"("p_file_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "fmanager"."update_parent_child_count"() TO "anon";
GRANT ALL ON FUNCTION "fmanager"."update_parent_child_count"() TO "authenticated";
GRANT ALL ON FUNCTION "fmanager"."update_parent_child_count"() TO "service_role";



GRANT ALL ON FUNCTION "fmanager"."validate_file_type"() TO "anon";
GRANT ALL ON FUNCTION "fmanager"."validate_file_type"() TO "authenticated";
GRANT ALL ON FUNCTION "fmanager"."validate_file_type"() TO "service_role";



GRANT SELECT ON TABLE "fmanager"."file_type_categories" TO "authenticated";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "fmanager" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "fmanager" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "fmanager" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "fmanager" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "authenticated";




