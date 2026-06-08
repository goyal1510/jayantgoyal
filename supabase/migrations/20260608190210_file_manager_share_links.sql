CREATE TABLE IF NOT EXISTS jg_app.file_manager_share_links (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL PRIMARY KEY,
  file_id uuid NOT NULL REFERENCES jg_app.file_manager_files(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_accessed_at timestamptz,
  download_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT file_manager_share_links_token_hash_key UNIQUE (token_hash),
  CONSTRAINT file_manager_share_links_expiry_check CHECK (expires_at > created_at),
  CONSTRAINT file_manager_share_links_download_count_check CHECK (download_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_file_manager_share_links_file_id
  ON jg_app.file_manager_share_links (file_id);

CREATE INDEX IF NOT EXISTS idx_file_manager_share_links_user_created
  ON jg_app.file_manager_share_links (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_file_manager_share_links_active
  ON jg_app.file_manager_share_links (token_hash, expires_at)
  WHERE revoked_at IS NULL;

DROP TRIGGER IF EXISTS update_file_manager_share_links_updated_at
  ON jg_app.file_manager_share_links;
CREATE TRIGGER update_file_manager_share_links_updated_at
  BEFORE UPDATE ON jg_app.file_manager_share_links
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();

ALTER TABLE jg_app.file_manager_share_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own file share links"
  ON jg_app.file_manager_share_links;
CREATE POLICY "Users can view own file share links"
  ON jg_app.file_manager_share_links
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own file share links"
  ON jg_app.file_manager_share_links;
CREATE POLICY "Users can insert own file share links"
  ON jg_app.file_manager_share_links
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own file share links"
  ON jg_app.file_manager_share_links;
CREATE POLICY "Users can update own file share links"
  ON jg_app.file_manager_share_links
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own file share links"
  ON jg_app.file_manager_share_links;
CREATE POLICY "Users can delete own file share links"
  ON jg_app.file_manager_share_links
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

REVOKE ALL ON TABLE jg_app.file_manager_share_links FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.file_manager_share_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.file_manager_share_links TO service_role;
