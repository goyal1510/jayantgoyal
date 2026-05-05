# Job Discovery System (Admin App)

**Date:** 2026-05-05
**App:** `apps/admin`
**Status:** Planning

## Problem

Manually searching for jobs across LinkedIn, YC, Wellfound, etc. is slow and unstructured. Need an internal system to aggregate relevant jobs into one pipeline with status tracking — referral hunting, applications, and interview tracking layered on later.

## Scope (Phase 1 — Discovery + Tracking)

Internal-only. Lives in admin app. Not exposed on main portfolio app.

- Aggregate jobs from multiple sources (RSS/APIs only — no scraping)
- Filter by user-defined criteria (role keywords, stack, location, salary band, remote)
- Store in Supabase (`jg_app` schema, new tables)
- Admin UI: list view, filters, status pipeline (new → interested → applied → interviewing → rejected/offer)
- Manual fetch button + cron-style script for periodic ingestion

## Out of Scope (Future Phases)

- Referral discovery (Phase 2)
- Resume/cover letter tailoring with Claude API (Phase 3)
- Auto-apply (never — ToS + ATS issues)

## Confirmed Criteria

- **Location:** India (remote/hybrid/onsite all fine)
- **Stack:** Next.js, React, full-stack JS, Java
- **Min salary:** ₹10,00,000 INR / 10 LPA (≈ $12k USD)
- **Cron:** Daily 9am IST
- **Greenhouse seed:** Option A — curated list, agent verifies ATS per company

## Phase 1 Tasks

1. Migration: `job_sources`, `job_listings`, `job_applications`, `job_search_criteria` (jg_app schema, RLS = is_admin)
2. Curate Greenhouse + Lever seed (~40 India-friendly companies)
3. Ingestion script `scripts/jobs/` mirroring `scripts/linkedin/` layout — Remotive first
4. Add WWR RSS, Greenhouse iter, HN Who's Hiring (Claude API parse)
5. Admin UI under `(admin)/jobs/` mirroring portfolio CRUD pattern
6. Vercel Cron 9am IST → `/api/jobs/ingest`

## Decisions

- **Store all jobs, filter in UI** — don't reject at ingest based on salary/location. Criteria can change.
- **RLS uses `jg_account.is_admin()`** — already covers both admin + super_admin.
- **Sidebar gated to super_admin** at the UI layer (per existing admin app pattern).
- **Salary parsed best-effort** to INR/USD numeric where possible, raw text always kept.
- **Stub migration files** created for the 4 already-applied remote migrations so `supabase db push` could see local state. `migrations/` is gitignored — schema dumps are the source of truth.

## Progress

- [x] Migration `20260505120000_jobs_phase1.sql` written + pushed; schema dump refreshed
- [x] Search criteria seed row inserted (10 LPA, India keywords, JS/Java stack)
- [x] 3 default sources seeded: Remotive, WWR, HN Who's Hiring
- [x] Ingestion script scaffolding under `scripts/jobs/`:
  - `lib/env.mjs` — load env from `apps/admin/.env.local`
  - `lib/supabase.mjs` — PostgREST service-role wrapper (select/insert/upsert/update)
  - `lib/companies.mjs` — 42 candidate companies for Greenhouse + Lever probing
  - `lib/normalize.mjs` — canonical shape, India/remote detection, salary parsing (USD→INR @84)
  - `sources/remotive.mjs` — Remotive API impl (no auth, software-dev category)
  - `seed-companies.mjs` — probes Greenhouse/Lever endpoints, upserts working ones into `job_sources`
  - `ingest.mjs` — main runner: loads active sources → dispatches → upserts listings → updates source status
- [x] Seed: 24 of 43 candidates verified on Greenhouse/Lever (others use Ashby/Workday/custom — Phase 2)
- [x] WWR (RSS, no deps), Greenhouse (per-company), Lever (per-company), HN Who's Hiring (regex extract, no LLM yet)
- [x] Full ingestion run: **4,055 listings** across 27 active sources
- [x] Salary parser handles `$20k`, `120,000`, `10 LPA`, `5 lakh`, `€60k`, USD/EUR/GBP/CAD → INR conversion
- [x] India-eligible detection: explicit India mention OR (worldwide remote AND not US-only)
- [ ] Admin UI under `(admin)/jobs/`
- [ ] Vercel Cron 9am IST

## Notes for UI build

- PostgREST default max-rows = 1000; UI must paginate.
- Most jobs (Greenhouse/Lever/WWR) have **no salary data** — UI filter must default to "unknown salary OK" rather than rejecting them.
- HN Hiring rows often have `(see description)` for company/title — UI should show description excerpt prominently for hn_hiring kind.

## UI built (Phase 1A)

Routes (all gated to super_admin via sidebar):
- `/jobs` → redirect to `/jobs/listings`
- `/jobs/listings` — search + filters (India, source, status, keyword match) + paginated list with status mutation dropdown + collapsible description
- `/jobs/sources` — view source health (last fetch time, count, status), toggle active
- `/jobs/pipeline` — kanban-ish view by application status

API routes:
- `GET /api/jobs/listings` — server-side filtering + pagination (Supabase `.from('job_listings').select()` with embedded source + application)
- `PATCH /api/jobs/listings/[id]/status` — upsert/delete `job_applications` row by listing
- `PATCH /api/jobs/sources/[id]` — toggle is_active / edit
- `DELETE /api/jobs/sources/[id]` — remove source

Admin auth pattern duplicated as `apps/admin/src/app/api/jobs/_helpers.ts` mirroring portfolio helpers; uses jg_app schema-bound facade.

`pnpm lint` + `pnpm check-types` pass. Routes return 307→login when unauthenticated (expected). User must verify in-browser since auth required.

## Cron (Phase 1)

GitHub Actions workflow at `.github/workflows/jobs-ingest.yml` running 03:30 UTC daily (= 09:00 IST). Requires 2 secrets:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Set via:
```bash
gh secret set NEXT_PUBLIC_SUPABASE_URL -R goyal1510/jayantgoyal -b "<value>"
gh secret set SUPABASE_SERVICE_ROLE_KEY -R goyal1510/jayantgoyal -b "<value>"
```

Manual trigger: `gh workflow run jobs-ingest.yml -R goyal1510/jayantgoyal`

## Phase 2 — Claude Code as the AI agent

User has no Anthropic API key, so AI runs via this terminal manually each day.

**Schema additions** (`20260505180000_jobs_ai_fields.sql`):
- `job_listings`: `ai_score` (0-100), `ai_recommendation` (enum), `ai_reasoning`, `ai_red_flags[]`, `ai_cover_letter`, `ai_referral_message`, `ai_processed_at`, `ai_resume_version`
- `job_applications`: `priority` (low/medium/high/critical, default medium)

**Helper scripts:**
- `scripts/jobs/list-candidates.mjs` — outputs job rows as JSON. Modes: `compact` (snippet only) or `full`. Filters: days, ids, india-only, unscored-only.
- `scripts/jobs/save-ai-result.mjs` — accepts JSON via stdin/--file. Writes `ai_*` fields onto listings, upserts `job_applications` with status + priority. Idempotent.

**Resume reference:** `docs/resume.md` — extracted from PDF. Source of truth Claude reads before scoring. Re-extract if PDF changes. Note: user is **early-career (~1 yr), Hyderabad, Next.js/Supabase strong, Java foundations**.

**Slash commands** (in `.claude/commands/`, repo-scoped):
- `/apply-day` — daily flow: read resume → fetch unscored candidates (last 21 days) → first-pass triage by title → fetch full JDs for survivors → score 0-100 → cap "apply" tier at 60 → draft cover letter + referral DM → persist via save-ai-result + write per-job folders → SUMMARY.md
- `/apply-job <id|substring>` — deep-dive one listing
- `/save-from-url <url>` — paste any URL (LinkedIn, custom), WebFetch extracts → insert into manual `job_sources` row → score immediately

**Output structure:** `docs/applications/YYYY-MM-DD/`
- `SUMMARY.md` (ranked tables + referral leads + skipped audit)
- `payload.json` (raw input to save-ai-result.mjs)
- `<priority>/<company>__<role>/{jd.md, cover_letter.md, referral_message.md, apply.md}` for high+critical only

**Admin UI updates** (`/jobs/listings`):
- AI score badge (left rail, color-coded by tier)
- Recommendation pill, red-flag warnings
- Priority badge on tracked applications
- New filters: "AI scored only", min score, recommendation, priority, sort by ai_score
- Expanded view: AI reasoning panel + cover-letter draft (with copy button) + referral DM draft + collapsed full JD

`pnpm lint` + `check-types` pass.
