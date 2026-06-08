BEGIN;
-- ============================================================================
-- Rollback the entire job-discovery system from jg_app schema.
-- Drops 4 tables and 4 enum types added across phase 1 + phase 2.
-- Indexes, triggers, RLS policies are all gathered up by CASCADE.
-- ============================================================================

DROP TABLE IF EXISTS jg_app.job_applications CASCADE;
DROP TABLE IF EXISTS jg_app.job_listings CASCADE;
DROP TABLE IF EXISTS jg_app.job_sources CASCADE;
DROP TABLE IF EXISTS jg_app.job_search_criteria CASCADE;
DROP TYPE IF EXISTS jg_app.job_priority CASCADE;
DROP TYPE IF EXISTS jg_app.job_ai_recommendation CASCADE;
DROP TYPE IF EXISTS jg_app.job_application_status CASCADE;
DROP TYPE IF EXISTS jg_app.job_source_kind CASCADE;
COMMIT;
