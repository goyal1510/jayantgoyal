# Day 2: Database Setup Instructions

This guide will walk you through setting up the database schema and storage bucket for the File Manager application.

## Prerequisites

- Supabase project created (completed in Day 1)
- Access to Supabase Dashboard
- Environment variables configured in `.env.local`

## Step 1: Run Database Schema

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** in the left sidebar
   - Click **New Query**

2. **Copy and Run the Schema**
   - Open the file: `supabase/schema.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **Run** (or press `Ctrl/Cmd + Enter`)

3. **Verify Schema Creation**
   - Check for any errors in the output
   - Navigate to **Table Editor** → You should see:
     - `fmanager.files` table
     - `fmanager.file_type_categories` table
   - Navigate to **Database** → **Functions** → You should see:
     - `fmanager.create_directory_path`
     - `fmanager.list_directory`
     - `fmanager.get_directory_tree`
     - `fmanager.get_file_by_path`
     - `fmanager.generate_storage_path`
     - `fmanager.move_file`
     - `fmanager.copy_file`

## Step 2: Create Storage Bucket

1. **Navigate to Storage**
   - In Supabase Dashboard, go to **Storage** in the left sidebar

2. **Create New Bucket**
   - Click **New bucket**
   - Configure the bucket:
     - **Name**: `private-files`
     - **Public bucket**: **OFF** (unchecked) - This is important for security!
     - Click **Create bucket**

3. **Configure Bucket Policies** (Optional - RLS handles this, but you can add storage policies)
   - Click on the `private-files` bucket
   - Go to **Policies** tab
   - The bucket should be private by default
   - You can add policies if needed, but RLS on the database handles access control

## Step 3: Verify Setup

### Verify RLS Policies

1. **Check RLS is Enabled**
   - Go to **Table Editor** → `fmanager.files`
   - Click on the table
   - Check that **RLS** is enabled (should show a lock icon)

2. **Verify Policies**
   - In the table view, click on **Policies** tab
   - You should see 4 policies:
     - "Users can view only their own files"
     - "Users can insert only their own files"
     - "Users can update only their own files"
     - "Users can delete only their own files"

## Step 4: Testing (Moved to Day 3)

**Note**: Testing of database functions will be done in Day 3 after authentication is set up, as it requires an authenticated user. See `DAY-2-TEST.md` for testing queries that you can use once authentication is ready.

## Troubleshooting

### Error: "schema fmanager does not exist"
- Make sure you ran the complete SQL script
- The schema creation is at the top of `schema.sql`

### Error: "permission denied for schema fmanager"
- Check that the GRANT statements in the schema were executed
- Try running just the schema creation part again:
  ```sql
  GRANT USAGE ON SCHEMA fmanager TO authenticated;
  GRANT ALL ON SCHEMA fmanager TO authenticated;
  ```

### Storage bucket not accessible
- Ensure the bucket is named exactly `private-files`
- Check that it's set to private (not public)
- Verify your environment variables are correct

### Functions not found
- Make sure all functions were created successfully
- Check the SQL Editor output for any errors
- Functions should be in the `fmanager` schema

## Next Steps

After completing this setup:
- ✅ Database schema is ready
- ✅ Storage bucket is configured
- ✅ RLS policies are active
- ✅ Database functions are available
- ✅ TypeScript types are in place
- ✅ Database utility functions are ready

**Testing Note**: Database function testing will be done in Day 3 after authentication is set up, as it requires an authenticated user context.

You're ready to proceed to **Day 3: Authentication Setup**!

## Notes

- The `fmanager` schema isolates all file manager tables and functions
- All file metadata is stored in PostgreSQL
- Actual files are stored in Supabase Storage
- RLS ensures users can only access their own files
- The root directory (`/`) is automatically created for each user when they first create a directory
