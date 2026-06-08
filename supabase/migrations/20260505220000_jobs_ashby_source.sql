BEGIN;
-- ============================================================================
-- Phase 2: add Ashby ATS as a job source kind.
-- Used by Linear, Notion, Replit, Supabase, Ramp, OpenAI, Cohere, Perplexity,
-- Mistral, Deel, PostHog, Modal, Pinecone, Railway, Wealthsimple, etc.
-- ============================================================================

ALTER TYPE jg_app.job_source_kind ADD VALUE IF NOT EXISTS 'ashby';
COMMIT;
