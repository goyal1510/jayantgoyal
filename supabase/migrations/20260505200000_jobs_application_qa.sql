BEGIN;
-- ============================================================================
-- Phase 2.1: Pre-drafted Q&A bank per listing.
--
-- Stores AI-generated answers to common application form questions
-- (Why us? Salary? Notice period? + role-specific). User pulls these
-- from the admin UI when filling out the actual application form.
--
-- Shape: JSONB array of objects:
--   [{ question: string, answer: string, category: string, needs_answer?: bool }]
-- ============================================================================

ALTER TABLE jg_app.job_listings
    ADD COLUMN ai_application_qa jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE INDEX idx_job_listings_qa_count
    ON jg_app.job_listings ((jsonb_array_length(ai_application_qa)))
    WHERE jsonb_array_length(ai_application_qa) > 0;
COMMIT;
