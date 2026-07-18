CREATE TABLE IF NOT EXISTS jg_app.tool_saved_items (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id text NOT NULL,
  title text NOT NULL,
  input_payload jsonb,
  output_payload jsonb NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tool_saved_items_tool_id_length_check
    CHECK (char_length(btrim(tool_id)) BETWEEN 1 AND 80),
  CONSTRAINT tool_saved_items_title_length_check
    CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  CONSTRAINT tool_saved_items_input_size_check
    CHECK (input_payload IS NULL OR octet_length(input_payload::text) <= 262144),
  CONSTRAINT tool_saved_items_output_size_check
    CHECK (octet_length(output_payload::text) <= 262144),
  CONSTRAINT tool_saved_items_metadata_object_check
    CHECK (jsonb_typeof(metadata) = 'object' AND octet_length(metadata::text) <= 32768)
);
CREATE INDEX IF NOT EXISTS idx_tool_saved_items_user_tool_created
  ON jg_app.tool_saved_items (user_id, tool_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_saved_items_user_updated
  ON jg_app.tool_saved_items (user_id, updated_at DESC);
DROP TRIGGER IF EXISTS update_tool_saved_items_updated_at
  ON jg_app.tool_saved_items;
CREATE TRIGGER update_tool_saved_items_updated_at
  BEFORE UPDATE ON jg_app.tool_saved_items
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();
ALTER TABLE jg_app.tool_saved_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own tool saved items"
  ON jg_app.tool_saved_items;
CREATE POLICY "Users can view own tool saved items"
  ON jg_app.tool_saved_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own tool saved items"
  ON jg_app.tool_saved_items;
CREATE POLICY "Users can insert own tool saved items"
  ON jg_app.tool_saved_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own tool saved items"
  ON jg_app.tool_saved_items;
CREATE POLICY "Users can update own tool saved items"
  ON jg_app.tool_saved_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own tool saved items"
  ON jg_app.tool_saved_items;
CREATE POLICY "Users can delete own tool saved items"
  ON jg_app.tool_saved_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
REVOKE ALL ON TABLE jg_app.tool_saved_items FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.tool_saved_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.tool_saved_items TO service_role;
