CREATE SCHEMA IF NOT EXISTS url_shortener;

-- Short URLs table
CREATE TABLE url_shortener.short_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  target_url text NOT NULL,
  title text,
  clicks integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_short_urls_slug ON url_shortener.short_urls (slug);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION url_shortener.update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON url_shortener.short_urls
  FOR EACH ROW EXECUTE FUNCTION url_shortener.update_updated_at();

-- Click events table
CREATE TABLE url_shortener.click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_url_id uuid NOT NULL REFERENCES url_shortener.short_urls(id) ON DELETE CASCADE,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  referer text
);

CREATE INDEX idx_click_events_short_url_id ON url_shortener.click_events (short_url_id);

-- Atomic click increment function
CREATE OR REPLACE FUNCTION url_shortener.increment_clicks(url_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE url_shortener.short_urls SET clicks = clicks + 1 WHERE id = url_id;
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE url_shortener.short_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_shortener.click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on short_urls" ON url_shortener.short_urls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on click_events" ON url_shortener.click_events FOR ALL USING (true) WITH CHECK (true);

-- Grant schema and table access to Supabase roles
GRANT USAGE ON SCHEMA url_shortener TO service_role, authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA url_shortener TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA url_shortener TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA url_shortener TO authenticated, anon;
