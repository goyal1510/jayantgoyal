Run today's job-application triage. You (Claude) are the AI agent. The user has no Anthropic API key — you operate from the terminal manually each day.

## Goal

Surface 50–60 high-fit roles from today's pool, draft their applications, and persist everything (scores, drafts, status) to Supabase + a dated folder.

Target volume: **50–60 marked `interested` per run**. Better fewer than weak fits — the user prefers high-signal applications.

## Inputs

- Resume context: read `docs/resume.md` first. This is the canonical resume.
  - Note especially: **early-career (~1 yr exp), Hyderabad-based, strong Next.js/React/Supabase, Java foundations**.
  - Target: junior / SDE-1 / 0-3 yr experience roles ≥ 10 LPA in India.
- Candidates: `node scripts/jobs/list-candidates.mjs --mode compact --days 21 --limit 400` (defaults to unscored only)
- Already-known good filters live in `jg_app.job_search_criteria`. Don't re-fetch — the candidate list already respects `is_india`.

## Steps

1. **Read** `docs/resume.md`. Lock in: title-fit weighting heavily favors early-career.
2. **Fetch compact candidates:** run `node scripts/jobs/list-candidates.mjs --mode compact --days 21 --limit 400` and parse the JSON.
3. **First-pass triage** — discard obvious skips by reading title + snippet only. Drop:
   - Senior / Staff / Principal / Lead / Manager / Director / Head / Architect / VP titles
   - Sales, BD, Customer Success, Solutions Architect, Account Executive, Recruiting (unless user explicitly wants)
   - "5+ years", "8+ years", "10+ years" requirements
   - US-only / Canada-only / EU-only roles (India must be eligible)
   - Internships (user is past that stage)
   - Off-stack roles (deep ML research, embedded, hardware, OS, finance quant)
   Keep a list of ≤ 100 candidate IDs that survive the cut.
4. **Fetch full descriptions** for survivors: `node scripts/jobs/list-candidates.mjs --mode full --ids <csv-of-ids>` (works in batches if CSV is huge — split if > 60 IDs).
5. **Score each** 0-100 using:
   - Title fit (35%): early-career match? Specific stack mentioned?
   - Stack fit (25%): Next.js, React, TS, Supabase, PostgreSQL, Tailwind, Node, Java, Spring
   - Location (15%): explicit India offices, India remote, or genuine global remote with no exclusion
   - Salary signal (10%): visible ≥ 10 LPA = boost; visible < 10 LPA = hard cap at 40
   - Company tier (10%): well-known tech, well-funded, India-presence
   - Recency (5%): posted in last 7 days = boost
6. **Map to recommendations** and **priority**:
   - 85–100 → `apply` + `priority: critical`
   - 70–84 → `apply` + `priority: high`
   - 60–69 → `apply_with_referral` + `priority: high` (referral worth pursuing)
   - 50–59 → `apply_if_time` + `priority: medium`
   - < 50 → `skip` + (no priority, no application row)
   - Any red flag (visa-only, US-only, scam, illegal questions) → `skip_red_flags`
7. **Cap the "apply"-eligible set** (score ≥ 60) at **60 listings**. If more qualify, keep the highest scores. The rest become `apply_if_time` (priority medium).
8. **Draft for everything score ≥ 60**:
   - `ai_cover_letter` — 150-200 words. Three short paragraphs:
     1. Hook: which JD detail caught attention + 1-line credible match
     2. Evidence: 2 bullet-style claims tying NeuraOak / HighRadius / portfolio to the JD
     3. Close: enthusiasm + concrete next step (interview / portfolio link / LinkedIn)
     Use plain text (markdown ok). No "I am writing to apply" boilerplate.
   - `ai_referral_message` — 60-90 words. Cold DM you'd send to a 1st/2nd-degree connection at the company. Friendly, specific, asks for referral with context. Include a placeholder `{{connection_name}}` you'll personalize.
   - `ai_red_flags` — array of strings if you found any
   - `ai_reasoning` — 1-2 sentences on why this score
8a. For score < 60, only save `ai_score`, `ai_recommendation`, `ai_reasoning`, `ai_red_flags`. Skip drafts.
9. **Persist**:
   - Build a JSON array shaped like the input to `scripts/jobs/save-ai-result.mjs`. Each item has `listing_id`, all `ai_*` fields you populated, and `application: { status, priority, notes }` for ones you're tracking. Use `notes` to capture a 1-line justification.
   - Write the JSON to `docs/applications/<YYYY-MM-DD>/payload.json` (overwriting if it exists).
   - Pipe it: `cat docs/applications/<YYYY-MM-DD>/payload.json | node scripts/jobs/save-ai-result.mjs`.
   - Verify the script printed `✓ listings: N  apps: +X ↻Y ✗Z`.
10. **Write per-job folders** ONLY for `priority: critical` and `priority: high`:
    - Folder: `docs/applications/<YYYY-MM-DD>/<priority>/<company-slug>__<role-slug>/`
    - Files: `jd.md` (title, company, location, link, ai_score, ai_reasoning, source URL, full description), `cover_letter.md`, `referral_message.md` (only if recommendation is `apply_with_referral`), `apply.md` (1-paragraph manual checklist: link, custom Qs to expect, follow-up plan).
    - Slug rule: kebab-case, max 60 chars, strip punctuation.
11. **Write the day's `SUMMARY.md`** at `docs/applications/<YYYY-MM-DD>/SUMMARY.md` with sections:
    - **Apply now (critical):** ranked table of company / role / score / link
    - **Apply this week (high):** same table
    - **If time permits (medium):** company / role / score / link
    - **Referral leads:** subset where recommendation = apply_with_referral. List company → suggested LinkedIn search query.
    - **Skipped (with reasoning):** brief table — useful audit
    - **Stats:** total scored, total interested, score distribution
12. **Final report to user**: short message with the count breakdown and a link-style path to `SUMMARY.md`. Don't dump the full SUMMARY into the chat — it's already on disk.

## Conventions

- Use TaskCreate at start to break this into 4–5 trackable tasks (fetch, triage, score, draft, persist) so the user sees progress.
- Bulk shell calls; avoid one-at-a-time DB hits beyond what `save-ai-result.mjs` already does.
- If `payload.json` already exists from a partial earlier run, reuse it — don't restart from scratch unless user asks.
- If a listing was already scored (returned with `already_processed: true`), skip it. The candidate query filters to unscored by default; if rescore needed user passes `--rescore`.

## Don'ts

- Don't apply on the user's behalf — every "apply" is them clicking through the link.
- Don't fabricate experience. Stay strictly within what `docs/resume.md` claims.
- Don't write generic letters. Each cover letter must reference one concrete JD detail and one concrete user-side credibility line.
- Don't exceed 60 high/critical priority — quality matters.
