BEGIN;
-- ============================================================================
-- Job Discovery System - Phase 1
-- Tables: job_sources, job_listings, job_applications, job_search_criteria
-- Schema: jg_app
-- Access: super_admin (via jg_account.is_admin())
-- ============================================================================

-- Source kind enum
CREATE TYPE jg_app.job_source_kind AS ENUM (
    'remotive',
    'wwr',
    'greenhouse',
    'lever',
    'hn_hiring'
);
-- Application status enum
CREATE TYPE jg_app.job_application_status AS ENUM (
    'new',
    'interested',
    'applied',
    'interviewing',
    'offer',
    'rejected',
    'withdrawn'
);
-- ----------------------------------------------------------------------------
-- job_sources: configured ingestion sources (a row per Greenhouse company, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE jg_app.job_sources (
    id uuid DEFAULT jg_app.uuid_v7() PRIMARY KEY,
    kind jg_app.job_source_kind NOT NULL,
    label text NOT NULL,
    config jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active boolean NOT NULL DEFAULT true,
    last_fetched_at timestamptz,
    last_fetch_status text,
    last_fetch_error text,
    last_fetch_count integer,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_job_sources_kind_label ON jg_app.job_sources (kind, label);
CREATE INDEX idx_job_sources_active ON jg_app.job_sources (is_active) WHERE is_active = true;
CREATE TRIGGER update_job_sources_updated_at
    BEFORE UPDATE ON jg_app.job_sources
    FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();
-- ----------------------------------------------------------------------------
-- job_listings: aggregated job postings from all sources
-- ----------------------------------------------------------------------------
CREATE TABLE jg_app.job_listings (
    id uuid DEFAULT jg_app.uuid_v7() PRIMARY KEY,
    source_id uuid NOT NULL REFERENCES jg_app.job_sources(id) ON DELETE CASCADE,
    external_id text NOT NULL,
    title text NOT NULL,
    company text NOT NULL,
    location text,
    is_remote boolean NOT NULL DEFAULT false,
    is_india boolean NOT NULL DEFAULT false,
    salary_text text,
    salary_min_inr bigint,
    salary_max_inr bigint,
    salary_currency text,
    description_html text,
    description_text text,
    apply_url text NOT NULL,
    tags text[] NOT NULL DEFAULT '{}'::text[],
    posted_at timestamptz,
    raw jsonb,
    fetched_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_job_listings_source_external ON jg_app.job_listings (source_id, external_id);
CREATE INDEX idx_job_listings_posted_at ON jg_app.job_listings (posted_at DESC NULLS LAST);
CREATE INDEX idx_job_listings_is_remote ON jg_app.job_listings (is_remote) WHERE is_remote = true;
CREATE INDEX idx_job_listings_is_india ON jg_app.job_listings (is_india) WHERE is_india = true;
CREATE INDEX idx_job_listings_company ON jg_app.job_listings (company);
CREATE INDEX idx_job_listings_tags ON jg_app.job_listings USING GIN (tags);
CREATE TRIGGER update_job_listings_updated_at
    BEFORE UPDATE ON jg_app.job_listings
    FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();
-- ----------------------------------------------------------------------------
-- job_applications: pipeline tracking (status, notes, referral)
-- ----------------------------------------------------------------------------
CREATE TABLE jg_app.job_applications (
    id uuid DEFAULT jg_app.uuid_v7() PRIMARY KEY,
    listing_id uuid REFERENCES jg_app.job_listings(id) ON DELETE SET NULL,
    -- denormalized snapshot in case listing is deleted or for manual entries
    title text NOT NULL,
    company text NOT NULL,
    apply_url text,
    status jg_app.job_application_status NOT NULL DEFAULT 'new',
    applied_at timestamptz,
    notes text,
    referral_contact text,
    referral_status text,
    next_action_at timestamptz,
    next_action_note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_job_applications_status ON jg_app.job_applications (status);
CREATE INDEX idx_job_applications_listing ON jg_app.job_applications (listing_id);
CREATE INDEX idx_job_applications_next_action ON jg_app.job_applications (next_action_at) WHERE next_action_at IS NOT NULL;
CREATE UNIQUE INDEX idx_job_applications_listing_unique ON jg_app.job_applications (listing_id) WHERE listing_id IS NOT NULL;
CREATE TRIGGER update_job_applications_updated_at
    BEFORE UPDATE ON jg_app.job_applications
    FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();
-- ----------------------------------------------------------------------------
-- job_search_criteria: singleton config for filtering / scoring
-- ----------------------------------------------------------------------------
CREATE TABLE jg_app.job_search_criteria (
    id uuid DEFAULT jg_app.uuid_v7() PRIMARY KEY,
    is_active boolean NOT NULL DEFAULT true,
    keywords text[] NOT NULL DEFAULT '{}'::text[],
    excluded_keywords text[] NOT NULL DEFAULT '{}'::text[],
    locations text[] NOT NULL DEFAULT '{}'::text[],
    min_salary_inr bigint,
    remote_ok boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER update_job_search_criteria_updated_at
    BEFORE UPDATE ON jg_app.job_search_criteria
    FOR EACH ROW EXECUTE FUNCTION jg_app.update_updated_at();
-- Seed default criteria row (Phase 1 confirmed values)
INSERT INTO jg_app.job_search_criteria (
    keywords,
    excluded_keywords,
    locations,
    min_salary_inr,
    remote_ok
) VALUES (
    ARRAY['nextjs', 'next.js', 'react', 'typescript', 'javascript', 'node', 'node.js', 'fullstack', 'full-stack', 'full stack', 'java', 'spring', 'spring boot'],
    ARRAY['intern', 'unpaid', 'commission only'],
    ARRAY['india', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'gurgaon', 'gurugram', 'noida', 'hyderabad', 'pune', 'chennai', 'remote'],
    1000000,
    true
);
-- ----------------------------------------------------------------------------
-- RLS: super_admin only (via jg_account.is_admin which covers admin + super_admin)
-- ----------------------------------------------------------------------------
ALTER TABLE jg_app.job_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE jg_app.job_search_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage job_sources" ON jg_app.job_sources
    TO authenticated USING (jg_account.is_admin()) WITH CHECK (jg_account.is_admin());
CREATE POLICY "Admins can manage job_listings" ON jg_app.job_listings
    TO authenticated USING (jg_account.is_admin()) WITH CHECK (jg_account.is_admin());
CREATE POLICY "Admins can manage job_applications" ON jg_app.job_applications
    TO authenticated USING (jg_account.is_admin()) WITH CHECK (jg_account.is_admin());
CREATE POLICY "Admins can manage job_search_criteria" ON jg_app.job_search_criteria
    TO authenticated USING (jg_account.is_admin()) WITH CHECK (jg_account.is_admin());
-- ----------------------------------------------------------------------------
-- Seed initial sources
-- ----------------------------------------------------------------------------
INSERT INTO jg_app.job_sources (kind, label, config) VALUES
    ('remotive', 'remotive-software-dev', '{"category": "software-dev"}'::jsonb),
    ('wwr', 'wwr-programming', '{"category": "remote-programming-jobs"}'::jsonb),
    ('hn_hiring', 'hn-who-is-hiring', '{}'::jsonb);
-- Greenhouse + Lever company seeds inserted by the curation script
-- (see scripts/jobs/seed-companies.mjs — runs after migration push)

-- ----------------------------------------------------------------------------
-- Grants (mirror existing jg_app pattern)
-- ----------------------------------------------------------------------------
GRANT ALL ON TABLE jg_app.job_sources TO authenticated, service_role;
GRANT ALL ON TABLE jg_app.job_listings TO authenticated, service_role;
GRANT ALL ON TABLE jg_app.job_applications TO authenticated, service_role;
GRANT ALL ON TABLE jg_app.job_search_criteria TO authenticated, service_role;
GRANT USAGE ON TYPE jg_app.job_source_kind TO authenticated, service_role;
GRANT USAGE ON TYPE jg_app.job_application_status TO authenticated, service_role;
COMMIT;
