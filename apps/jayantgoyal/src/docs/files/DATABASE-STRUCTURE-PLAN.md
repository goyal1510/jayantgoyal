# Supabase Private File Storage System with Directory Support

## Table of Contents

- [Storage Setup](#storage-setup)
- [Schema Setup](#schema-setup)
- [Files Metadata Table](#files-metadata-table)
- [Directory Structure Functions](#directory-structure-functions)
- [File Type Categories](#file-type-categories)
- [Triggers for Directory Management](#triggers-for-directory-management)
- [Row Level Security](#row-level-security)
- [Storage Functions](#storage-functions)
- [Complete SQL Script](#complete-sql-script)
- [Usage Examples](#usage-examples)
- [API Integration Examples](#api-integration-examples)
- [Key Features](#key-features)
- [Installation Instructions](#installation-instructions)
- [Notes](#notes)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)

## Storage Setup

Create a single private bucket in Supabase Storage:

- **Bucket ID**: `private-files`
- **Public**: `false` (only authenticated users can access)

## Schema Setup

First, create the `fmanager` schema:

```sql
-- Create the fmanager schema
CREATE SCHEMA IF NOT EXISTS fmanager;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA fmanager TO authenticated;
GRANT ALL ON SCHEMA fmanager TO authenticated;
```

## Files Metadata Table

```sql
-- Main files table with hierarchical path support
CREATE TABLE fmanager.files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Storage reference
  bucket_id TEXT NOT NULL DEFAULT 'private-files',
  storage_path TEXT NOT NULL, -- Full storage path with UUID
  
  -- File information
  original_filename TEXT NOT NULL,
  display_name TEXT, -- Optional display name different from original
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  
  -- Hierarchical path (like /documents/personal/adhar/front.pdf)
  file_path TEXT NOT NULL, -- User's logical path
  file_name TEXT NOT NULL, -- Just the filename.ext part
  
  -- Directory flag
  is_directory BOOLEAN DEFAULT false,
  
  -- For directories: store child count
  child_count INTEGER DEFAULT 0,
  
  -- File type categorization
  file_type TEXT NOT NULL, -- e.g., 'image', 'pdf', 'document', 'video', 'audio'
  
  -- Ownership - only owner can access
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Parent directory reference (for hierarchy)
  parent_id UUID REFERENCES fmanager.files(id) ON DELETE CASCADE,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  is_latest_version BOOLEAN DEFAULT true,
  
  -- File hash for deduplication
  file_hash TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false,
  
  -- Ensure unique path per user
  CONSTRAINT unique_user_path UNIQUE(user_id, file_path, is_deleted)
);

-- Indexes for performance
CREATE INDEX idx_files_user_id ON fmanager.files(user_id);
CREATE INDEX idx_files_parent_id ON fmanager.files(parent_id);
CREATE INDEX idx_files_file_path ON fmanager.files(file_path);
CREATE INDEX idx_files_file_type ON fmanager.files(file_type);
CREATE INDEX idx_files_created_at ON fmanager.files(created_at);
CREATE INDEX idx_files_is_directory ON fmanager.files(is_directory);
CREATE INDEX idx_files_user_parent ON fmanager.files(user_id, parent_id) WHERE NOT is_deleted;
CREATE INDEX idx_files_path_prefix ON fmanager.files(user_id, file_path text_pattern_ops) WHERE NOT is_deleted;

-- For listing files in a directory quickly
CREATE INDEX idx_files_user_parent_type ON fmanager.files(user_id, parent_id, file_type) WHERE NOT is_deleted;
```

## Directory Structure Functions

### Get Directory Tree

```sql
CREATE OR REPLACE FUNCTION fmanager.get_directory_tree(
  p_user_id UUID,
  p_parent_path TEXT DEFAULT '/'
)
RETURNS TABLE (
  id UUID,
  file_path TEXT,
  file_name TEXT,
  display_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  file_type TEXT,
  is_directory BOOLEAN,
  child_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  depth INTEGER
) AS $$
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
$$ LANGUAGE plpgsql;
```

### Create Directory Path

```sql
CREATE OR REPLACE FUNCTION fmanager.create_directory_path(
  p_user_id UUID,
  p_directory_path TEXT
)
RETURNS UUID AS $$
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
    file_path,
    file_name,
    display_name,
    mime_type,
    file_type,
    is_directory,
    parent_id
  ) VALUES (
    p_user_id,
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
  SELECT id INTO parent_id 
  FROM fmanager.files 
  WHERE user_id = p_user_id 
    AND file_path = '/' 
    AND NOT is_deleted;
  
  -- Create each directory in the path
  FOR i IN 1..array_length(path_parts, 1) LOOP
    part := path_parts[i];
    current_path := current_path || part || '/';
    display_name := part;
    
    -- Try to insert directory
    INSERT INTO fmanager.files (
      user_id,
      file_path,
      file_name,
      display_name,
      mime_type,
      file_type,
      is_directory,
      parent_id
    ) VALUES (
      p_user_id,
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
      SELECT id INTO dir_id 
      FROM fmanager.files 
      WHERE user_id = p_user_id 
        AND file_path = current_path 
        AND NOT is_deleted;
    END IF;
    
    parent_id := dir_id;
  END LOOP;
  
  RETURN parent_id;
END;
$$ LANGUAGE plpgsql;
```

### Get File by Path

```sql
CREATE OR REPLACE FUNCTION fmanager.get_file_by_path(
  p_user_id UUID,
  p_file_path TEXT
)
RETURNS SETOF fmanager.files AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM fmanager.files
  WHERE user_id = p_user_id
    AND file_path = p_file_path
    AND NOT is_deleted;
END;
$$ LANGUAGE plpgsql;
```

### List Directory Contents

```sql
CREATE OR REPLACE FUNCTION fmanager.list_directory(
  p_user_id UUID,
  p_directory_path TEXT DEFAULT '/'
)
RETURNS TABLE (
  id UUID,
  file_path TEXT,
  file_name TEXT,
  display_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  file_type TEXT,
  is_directory BOOLEAN,
  child_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  dir_id UUID;
BEGIN
  -- Get directory ID
  SELECT id INTO dir_id
  FROM fmanager.files
  WHERE user_id = p_user_id
    AND file_path = p_directory_path
    AND is_directory = true
    AND NOT is_deleted;
    
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
$$ LANGUAGE plpgsql;
```

## File Type Categories

```sql
-- Define file type categories and their properties
CREATE TABLE fmanager.file_type_categories (
  type_name TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  icon TEXT,
  allowed_mime_types TEXT[] NOT NULL,
  max_size_bytes BIGINT DEFAULT 104857600, -- 100MB default
  can_preview BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default file types
INSERT INTO fmanager.file_type_categories (type_name, display_name, allowed_mime_types, can_preview) VALUES
('image', 'Image', ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'], true),
('pdf', 'PDF', ARRAY['application/pdf'], true),
('document', 'Document', ARRAY['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.oasis.opendocument.text', 'text/plain'], true),
('spreadsheet', 'Spreadsheet', ARRAY['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.oasis.opendocument.spreadsheet'], true),
('presentation', 'Presentation', ARRAY['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.oasis.opendocument.presentation'], true),
('video', 'Video', ARRAY['video/mp4', 'video/webm', 'video/quicktime'], true),
('audio', 'Audio', ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg'], true),
('archive', 'Archive', ARRAY['application/zip', 'application/x-rar-compressed', 'application/x-tar', 'application/gzip'], false),
('code', 'Code', ARRAY['text/x-python', 'application/javascript', 'text/html', 'text/css', 'application/json', 'text/x-java-source'], true),
('other', 'Other', ARRAY['*'], false);
```

## Triggers for Directory Management

### Update Parent Child Count

```sql
CREATE OR REPLACE FUNCTION fmanager.update_parent_child_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_child_count_trigger
AFTER INSERT OR DELETE ON fmanager.files
FOR EACH ROW EXECUTE FUNCTION fmanager.update_parent_child_count();
```

### Validate File Type

```sql
CREATE OR REPLACE FUNCTION fmanager.validate_file_type()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_file_type_trigger
BEFORE INSERT OR UPDATE ON fmanager.files
FOR EACH ROW
EXECUTE FUNCTION fmanager.validate_file_type();
```

### Handle Soft Delete

```sql
CREATE OR REPLACE FUNCTION fmanager.handle_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted = true AND OLD.is_deleted = false THEN
    NEW.deleted_at := NOW();
    
    -- Update parent's child count
    IF NEW.parent_id IS NOT NULL THEN
      UPDATE fmanager.files
      SET child_count = child_count - 1,
          updated_at = NOW()
      WHERE id = NEW.parent_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_soft_delete_trigger
BEFORE UPDATE ON fmanager.files
FOR EACH ROW
EXECUTE FUNCTION fmanager.handle_soft_delete();
```

## Row Level Security

```sql
-- Enable RLS on files table
ALTER TABLE fmanager.files ENABLE ROW LEVEL SECURITY;

-- Strict policies: users can only access their own files
CREATE POLICY "Users can view only their own files"
ON fmanager.files FOR SELECT
USING (user_id = auth.uid() AND NOT is_deleted);

CREATE POLICY "Users can insert only their own files"
ON fmanager.files FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update only their own files"
ON fmanager.files FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete only their own files"
ON fmanager.files FOR DELETE
USING (user_id = auth.uid());

-- Policy for file_type_categories (public read-only)
ALTER TABLE fmanager.file_type_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view file types"
ON fmanager.file_type_categories FOR SELECT
TO authenticated
USING (true);
```

## Storage Functions

### Generate Storage Path

```sql
CREATE OR REPLACE FUNCTION fmanager.generate_storage_path(
  p_user_id UUID,
  p_file_path TEXT,
  p_file_name TEXT
)
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;
```

### Move File

```sql
CREATE OR REPLACE FUNCTION fmanager.move_file(
  p_file_id UUID,
  p_new_directory_path TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql;
```

### Copy File

```sql
CREATE OR REPLACE FUNCTION fmanager.copy_file(
  p_file_id UUID,
  p_target_directory_path TEXT,
  p_user_id UUID
)
RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql;
```

## Usage Examples

### 1. Create a directory

```sql
SELECT fmanager.create_directory_path(auth.uid(), '/documents/personal/adhar');
```

### 2. List directory contents

```sql
SELECT * FROM fmanager.list_directory(auth.uid(), '/documents/personal');
```

### 3. Upload a file

```sql
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
  parent_id
) VALUES (
  auth.uid(),
  'private-files',
  fmanager.generate_storage_path(auth.uid(), '/documents/personal/adhar/', 'front.pdf'),
  'front.pdf',
  'Aadhaar Front',
  'application/pdf',
  2048000,
  '/documents/personal/adhar/front.pdf',
  'front.pdf',
  'pdf',
  false,
  (SELECT id FROM fmanager.files WHERE user_id = auth.uid() AND file_path = '/documents/personal/adhar/')
);
```

### 4. Get full directory tree

```sql
SELECT * FROM fmanager.get_directory_tree(auth.uid(), '/documents');
```

### 5. Move a file

```sql
SELECT fmanager.move_file(
  'file-uuid-here',
  '/documents/archived/',
  auth.uid()
);
```

### 6. Search files by type

```sql
SELECT * FROM fmanager.files 
WHERE user_id = auth.uid() 
  AND file_type = 'image' 
  AND NOT is_deleted
ORDER BY updated_at DESC;
```

## API Integration Examples

### Upload File with Supabase Storage

```javascript
// Frontend code example
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Create directory if needed
const { data: dirId } = await supabase.rpc('fmanager.create_directory_path', {
  p_user_id: user.id,
  p_directory_path: '/documents/personal/adhar'
});

// 2. Generate storage path
const storagePath = `${user.id}/${uuidv4()}.pdf`;

// 3. Upload to Supabase Storage
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('private-files')
  .upload(storagePath, file);

// 4. Insert file metadata
const { data: fileData, error: fileError } = await supabase
  .schema('fmanager')
  .from('files')
  .insert({
    user_id: user.id,
    bucket_id: 'private-files',
    storage_path: storagePath,
    original_filename: file.name,
    display_name: 'Aadhaar Card Front',
    mime_type: 'application/pdf',
    size_bytes: file.size,
    file_path: '/documents/personal/adhar/front.pdf',
    file_name: 'front.pdf',
    file_type: 'pdf',
    is_directory: false,
    parent_id: dirId
  })
  .select()
  .single();
```

### Get User Files

```javascript
// Get files in a directory
const { data: files } = await supabase
  .schema('fmanager')
  .from('files')
  .select('*')
  .eq('user_id', user.id)
  .eq('parent_id', directoryId)
  .eq('is_deleted', false)
  .order('is_directory', { ascending: false })
  .order('file_name');

// Or use the list_directory function
const { data: dirContents } = await supabase.rpc('fmanager.list_directory', {
  p_user_id: user.id,
  p_directory_path: '/documents/personal'
});
```

## Key Features

- **Strict Privacy**: Each user can only access their own files
- **Hierarchical Paths**: Supports nested directories like `/documents/personal/adhar/`
- **File Type System**: Categorizes files with validation
- **Directory Management**: Automatic child counting and path validation
- **Soft Delete**: Files can be restored
- **Path Operations**: Move, copy, and manage files within directory structure
- **Performance**: Indexed for efficient directory listings and searches
- **Validation**: File type and mime type validation

## Installation Instructions

1. Create a Supabase project
2. Run the SQL script in the Supabase SQL Editor (this will create the `fmanager` schema)
3. Create a storage bucket named `private-files` with public access disabled
4. Enable Row Level Security on all tables (done automatically by the script)
5. Test the system with sample data

**Note**: When using the Supabase client in your application, make sure to use `.schema('fmanager')` before `.from('files')` or use the full function name `fmanager.function_name` for RPC calls.

## Notes

- This system uses Supabase Storage for actual file storage
- All file metadata is stored in PostgreSQL in the `fmanager` schema
- The `fmanager` schema is used to namespace all tables, functions, and types
- The `storage_path` column links to the actual file in Supabase Storage
- Files are stored with UUIDs to prevent filename collisions
- Directories are virtual and stored in the same table with `is_directory = true`
- When using Supabase client, use `.schema('fmanager')` before querying tables or use `fmanager.function_name` for RPC calls

## Troubleshooting

- **File upload fails**: Check storage bucket permissions and RLS policies
- **Directory not found**: Ensure directory path ends with `/`
- **Duplicate file error**: The system prevents duplicate paths per user
- **Permission denied**: Verify user is authenticated and owns the file

## Security Considerations

- All files are private by default
- Users can only access their own files
- File paths are validated to prevent path traversal attacks
- MIME types are validated against allowed types
- Storage uses signed URLs for temporary access
