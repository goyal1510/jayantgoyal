BEGIN;
-- ============================================================================
-- Phase 2: AI scoring + drafted artifacts on job_listings
-- + priority on job_applications
-- Driven by the /apply-day slash command (Claude Code as the agent).
-- ============================================================================

CREATE TYPE jg_app.job_ai_recommendation AS ENUM (
    'apply',
    'apply_with_referral',
    'apply_if_time',
    'skip',
    'skip_red_flags'
);
CREATE TYPE jg_app.job_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);
ALTER TABLE jg_app.job_listings
    ADD COLUMN ai_score smallint,
    ADD COLUMN ai_recommendation jg_app.job_ai_recommendation,
    ADD COLUMN ai_reasoning text,
    ADD COLUMN ai_red_flags text[] DEFAULT '{}'::text[] NOT NULL,
    ADD COLUMN ai_cover_letter text,
    ADD COLUMN ai_referral_message text,
    ADD COLUMN ai_processed_at timestamptz,
    ADD COLUMN ai_resume_version text;
ALTER TABLE jg_app.job_listings
    ADD CONSTRAINT job_listings_ai_score_range CHECK (ai_score IS NULL OR (ai_score >= 0 AND ai_score <= 100));
CREATE INDEX idx_job_listings_ai_score ON jg_app.job_listings (ai_score DESC NULLS LAST);
CREATE INDEX idx_job_listings_ai_processed ON jg_app.job_listings (ai_processed_at DESC NULLS LAST);
CREATE INDEX idx_job_listings_ai_recommendation ON jg_app.job_listings (ai_recommendation);
ALTER TABLE jg_app.job_applications
    ADD COLUMN priority jg_app.job_priority DEFAULT 'medium'::jg_app.job_priority NOT NULL;
CREATE INDEX idx_job_applications_priority ON jg_app.job_applications (priority);
GRANT USAGE ON TYPE jg_app.job_ai_recommendation TO authenticated, service_role;
GRANT USAGE ON TYPE jg_app.job_priority TO authenticated, service_role;
COMMIT;
