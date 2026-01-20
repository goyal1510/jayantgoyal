-- Create an RPC function for soft delete that handles RLS properly
-- This function runs with SECURITY DEFINER, so it bypasses RLS checks
-- but still validates that the user owns the file

CREATE OR REPLACE FUNCTION fmanager.soft_delete_file(
  p_file_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION fmanager.soft_delete_file(UUID, UUID) TO authenticated;
