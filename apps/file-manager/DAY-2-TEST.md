# Database Functions Testing Guide

**Note**: This testing guide is intended to be used after Day 3 (Authentication Setup) is complete, as it requires an authenticated user context.

This guide provides test queries and examples to verify that all database functions are working correctly.

## Prerequisites

- ✅ Database schema has been run (`supabase/schema.sql`)
- ✅ Storage bucket `private-files` has been created
- ✅ Authentication is set up (Day 3 completed)
- ✅ You have access to Supabase SQL Editor
- ✅ You have a user account and can authenticate

## Getting Your User ID

First, you need to get your user ID to test the functions:

```sql
-- Get your user ID
SELECT id, email FROM auth.users LIMIT 1;
```

Save this UUID for use in the test queries below.

## Test Queries

### Test 1: Create Directory Path

This function creates a directory and all parent directories if they don't exist.

```sql
-- Replace YOUR_USER_ID with your actual user ID
SELECT fmanager.create_directory_path(
  'YOUR_USER_ID'::uuid,
  '/documents/personal/adhar'
) AS directory_id;
```

**Expected Result**: Should return a UUID (the directory ID)

**Test Multiple Paths**:
```sql
-- Create nested directories
SELECT fmanager.create_directory_path('YOUR_USER_ID'::uuid, '/documents');
SELECT fmanager.create_directory_path('YOUR_USER_ID'::uuid, '/documents/work');
SELECT fmanager.create_directory_path('YOUR_USER_ID'::uuid, '/documents/personal');
SELECT fmanager.create_directory_path('YOUR_USER_ID'::uuid, '/images');
```

### Test 2: List Directory Contents

List all files and folders in a directory.

```sql
-- List root directory
SELECT * FROM fmanager.list_directory(
  'YOUR_USER_ID'::uuid,
  '/'
);

-- List a specific directory
SELECT * FROM fmanager.list_directory(
  'YOUR_USER_ID'::uuid,
  '/documents/'
);
```

**Expected Result**: Should return an array of directory items (should include the directories you created in Test 1)

### Test 3: Get Directory Tree

Get a recursive tree of all subdirectories and files.

```sql
-- Get full tree from root
SELECT * FROM fmanager.get_directory_tree(
  'YOUR_USER_ID'::uuid,
  '/'
);

-- Get tree from a specific directory
SELECT * FROM fmanager.get_directory_tree(
  'YOUR_USER_ID'::uuid,
  '/documents/'
);
```

**Expected Result**: Should return all directories and files with depth information

### Test 4: Get File by Path

Retrieve a file or directory by its path.

```sql
-- Get root directory
SELECT * FROM fmanager.get_file_by_path(
  'YOUR_USER_ID'::uuid,
  '/'
);

-- Get a specific directory
SELECT * FROM fmanager.get_file_by_path(
  'YOUR_USER_ID'::uuid,
  '/documents/'
);
```

**Expected Result**: Should return the file/directory record

### Test 5: Generate Storage Path

Generate a unique storage path for file uploads.

```sql
-- Generate a storage path
SELECT fmanager.generate_storage_path(
  'YOUR_USER_ID'::uuid,
  '/documents/personal/adhar/',
  'front.pdf'
) AS storage_path;
```

**Expected Result**: Should return a path like `user_id/uuid.pdf`

### Test 6: Create a Test File Record

Insert a test file into the database (simulating a file upload).

```sql
-- First, get the parent directory ID
SELECT id FROM fmanager.files 
WHERE user_id = 'YOUR_USER_ID'::uuid 
  AND file_path = '/documents/personal/adhar/'
  AND is_directory = true;

-- Then insert a test file (replace PARENT_ID with the ID from above)
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
  'YOUR_USER_ID'::uuid,
  'private-files',
  fmanager.generate_storage_path('YOUR_USER_ID'::uuid, '/documents/personal/adhar/', 'test.pdf'),
  'test.pdf',
  'Test PDF File',
  'application/pdf',
  1024,
  '/documents/personal/adhar/test.pdf',
  'test.pdf',
  'pdf',
  false,
  'PARENT_ID'::uuid
) RETURNING *;
```

**Expected Result**: Should return the created file record

### Test 7: Move File

Move a file to a different directory.

```sql
-- First, get a file ID (use the file created in Test 6)
SELECT id, file_name, file_path FROM fmanager.files 
WHERE user_id = 'YOUR_USER_ID'::uuid 
  AND is_directory = false 
  AND NOT is_deleted
LIMIT 1;

-- Move the file (replace FILE_ID with actual file ID)
SELECT fmanager.move_file(
  'FILE_ID'::uuid,
  '/documents/work/',
  'YOUR_USER_ID'::uuid
) AS success;
```

**Expected Result**: Should return `true` if successful

### Test 8: Copy File

Create a copy of a file in a different directory.

```sql
-- Copy a file (replace FILE_ID with actual file ID)
SELECT fmanager.copy_file(
  'FILE_ID'::uuid,
  '/documents/',
  'YOUR_USER_ID'::uuid
) AS new_file_id;
```

**Expected Result**: Should return the UUID of the new file

### Test 9: Soft Delete File

Mark a file as deleted (soft delete).

```sql
-- Soft delete a file (replace FILE_ID with actual file ID)
UPDATE fmanager.files
SET is_deleted = true
WHERE id = 'FILE_ID'::uuid
  AND user_id = 'YOUR_USER_ID'::uuid
RETURNING *;
```

**Expected Result**: Should return the updated file with `is_deleted = true`

### Test 10: Verify RLS Policies

Test that RLS is working correctly (users can only see their own files).

```sql
-- This should only return files for the authenticated user
-- If you're not authenticated, this will return empty
SELECT * FROM fmanager.files 
WHERE NOT is_deleted
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result**: Should only return files for the current authenticated user

## Testing File Type Categories

```sql
-- Get all file type categories
SELECT * FROM fmanager.file_type_categories 
ORDER BY display_name;

-- Check allowed mime types for a specific type
SELECT type_name, display_name, allowed_mime_types, can_preview
FROM fmanager.file_type_categories
WHERE type_name = 'pdf';
```

## Testing Triggers

### Test Child Count Trigger

```sql
-- Create a directory
SELECT fmanager.create_directory_path('YOUR_USER_ID'::uuid, '/test-trigger/');

-- Get the directory and check child_count (should be 0)
SELECT id, file_path, child_count 
FROM fmanager.files 
WHERE user_id = 'YOUR_USER_ID'::uuid 
  AND file_path = '/test-trigger/';

-- Create a subdirectory
SELECT fmanager.create_directory_path('YOUR_USER_ID'::uuid, '/test-trigger/subdir/');

-- Check child_count again (should be 1)
SELECT id, file_path, child_count 
FROM fmanager.files 
WHERE user_id = 'YOUR_USER_ID'::uuid 
  AND file_path = '/test-trigger/';
```

**Expected Result**: `child_count` should automatically increment when a child is added

## Cleanup Test Data

After testing, you can clean up test data:

```sql
-- Soft delete test files
UPDATE fmanager.files
SET is_deleted = true
WHERE user_id = 'YOUR_USER_ID'::uuid
  AND file_path LIKE '/test%';

-- Or permanently delete (be careful!)
-- DELETE FROM fmanager.files
-- WHERE user_id = 'YOUR_USER_ID'::uuid
--   AND file_path LIKE '/test%';
```

## Common Issues

### "Directory not found" error
- Make sure directory paths end with `/` for directories
- Ensure the directory exists before listing it

### "Permission denied" error
- Check that you're using the correct user ID
- Verify RLS policies are enabled
- Make sure you're authenticated in Supabase

### Functions return null
- Check the SQL Editor output for error messages
- Verify the function parameters are correct
- Ensure the schema and functions were created successfully

## Next Steps

Once all tests pass:
- ✅ Database functions are working
- ✅ RLS policies are active
- ✅ Triggers are functioning
- ✅ Ready to integrate with the application

You can now proceed to use these functions in your application code using the utility functions in `src/lib/db/files.ts`.
