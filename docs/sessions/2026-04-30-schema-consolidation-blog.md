# 2026-04-30 — Schema Consolidation + Blog Feature

**App:** Full stack (Supabase + main app + admin app)
**Area:** Database architecture, blog feature

## Problem
- 7 separate Supabase schemas — too fragmented for 5 small feature schemas
- Need blog feature for SEO (Google crawl rate improvement)
- UUID v4 (random) causes poor B-tree index performance

## Solution

### Phase 1: Schema Consolidation
- Merged `activity_tracker`, `currency_calculator`, `fmanager`, `game_hub`, `messenger` → `jg_app`
- Kept `jg_account` and `portfolio` separate
- Renamed tables with feature prefixes (e.g., `files` → `file_manager_files`)
- Created `uuid_v7()` function for time-based UUIDs (better indexing)
- Migrated all existing UUIDs from v4 → v7 using `created_at` timestamps
- Shared `update_updated_at()` trigger function (deduplicated from messenger/portfolio)
- Migration: `supabase/migrations/20260430100000_consolidate_to_jg_app.sql`
- Migration ran successfully — all row counts verified, old schemas dropped
- Fixed: `gen_random_bytes()` → `extensions.gen_random_bytes()` for Supabase compatibility
- **TODO**: Enable Realtime on `jg_app.messenger_messages` in Supabase dashboard
- Fixed PostgREST PGRST002 crash: old schema names stuck in PostgREST config even after dashboard removal. Fixed via `ALTER ROLE authenticator SET pgrst.db_schemas` to override config at DB level.
- Revoked EXECUTE on trigger functions from anon/authenticated (trigger functions shouldn't be exposed via Data API)

### Phase 2: Code Updates
- Updated all `.schema()` and `.from()` calls across ~54 references in 19 files
- Activity tracker (4 files): schema → `jg_app`, tables → `activity_tracker_activities` / `activity_tracker_entries`
- Currency calculator (2 files): tables → `currency_calculator_calculations` / `currency_calculator_denominations`
- File manager (9 files, 24+ refs): tables → `file_manager_files` / `file_manager_type_categories`
- Game hub (1 file): table → `game_hub_typing_speed_results`
- Messenger (3 files): table → `messenger_messages` (including Realtime subscriptions)
- Updated AGENTS.md, .agents/rules/database.md
- Created `supabase/schemas/jg_app.sql`, deleted 5 old schema files

### Phase 3: Blog Feature
- `jg_app.blog_posts` table with markdown content
- Admin CRUD at `/(admin)/blog/` (NOT under portfolio — blog is a separate feature)
  - API route: `/api/jg-app/[table]/` targeting `jg_app` schema
  - Blog list with publish/visibility toggles, edit/delete
  - Blog dialog with slug auto-generation, markdown textarea, tags
- Main app public pages:
  - `/blog` listing page, `/blog/[slug]` post page with `generateMetadata()` + Article JSON-LD
  - Markdown rendering via `react-markdown` + `remark-gfm`
  - Added to proxy PUBLIC_PAGES, auth-gate PUBLIC_PREFIXES, sitemap (async), breadcrumbs, sidebar
