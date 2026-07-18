CREATE TABLE IF NOT EXISTS jg_app.custom_calculator_templates (
  id uuid DEFAULT jg_app.uuid_v7() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  components jsonb NOT NULL DEFAULT '[]'::jsonb,
  dark_mode boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT custom_calculator_templates_name_length_check
    CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  CONSTRAINT custom_calculator_templates_description_length_check
    CHECK (description IS NULL OR char_length(description) <= 280),
  CONSTRAINT custom_calculator_templates_components_array_check
    CHECK (jsonb_typeof(components) = 'array' AND jsonb_array_length(components) <= 80)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_calculator_templates_user_name
  ON jg_app.custom_calculator_templates (user_id, lower(btrim(name)));
CREATE INDEX IF NOT EXISTS idx_custom_calculator_templates_user_updated
  ON jg_app.custom_calculator_templates (user_id, updated_at DESC);
DROP TRIGGER IF EXISTS update_custom_calculator_templates_updated_at
  ON jg_app.custom_calculator_templates;
CREATE TRIGGER update_custom_calculator_templates_updated_at
  BEFORE UPDATE ON jg_app.custom_calculator_templates
  FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();
ALTER TABLE jg_app.custom_calculator_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own custom calculator templates"
  ON jg_app.custom_calculator_templates;
CREATE POLICY "Users can view own custom calculator templates"
  ON jg_app.custom_calculator_templates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own custom calculator templates"
  ON jg_app.custom_calculator_templates;
CREATE POLICY "Users can insert own custom calculator templates"
  ON jg_app.custom_calculator_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own custom calculator templates"
  ON jg_app.custom_calculator_templates;
CREATE POLICY "Users can update own custom calculator templates"
  ON jg_app.custom_calculator_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own custom calculator templates"
  ON jg_app.custom_calculator_templates;
CREATE POLICY "Users can delete own custom calculator templates"
  ON jg_app.custom_calculator_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
REVOKE ALL ON TABLE jg_app.custom_calculator_templates FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.custom_calculator_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jg_app.custom_calculator_templates TO service_role;
