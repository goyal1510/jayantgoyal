ALTER TABLE jg_app.file_manager_files
  ADD COLUMN IF NOT EXISTS is_starred boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_fm_files_user_starred
  ON jg_app.file_manager_files (user_id, updated_at DESC)
  WHERE is_starred AND NOT is_deleted;
