-- Fix RLS UPDATE policy to include WITH CHECK clause
-- This is required for UPDATE operations to work correctly with RLS

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update only their own files" ON fmanager.files;

-- Create the UPDATE policy with both USING and WITH CHECK clauses
CREATE POLICY "Users can update only their own files"
ON fmanager.files FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
