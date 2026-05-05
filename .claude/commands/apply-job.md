Deep-dive a single listing — score, draft cover letter + referral, mark application status.

## Arguments

`$ARGUMENTS` is the listing UUID (or a substring of company + title that uniquely identifies one).

## Steps

1. Read `docs/resume.md` for context.
2. Fetch the listing in full mode:
   ```bash
   node scripts/jobs/list-candidates.mjs --mode full --ids <uuid> --rescore
   ```
   If the user passed a substring instead of UUID, run a quick `node -e` query against `job_listings` to find a single matching row by `ilike` on `company || ' ' || title`. If 0 or >1 match, ask the user to disambiguate.
3. Score thoroughly using the same rubric as `/apply-day` (see that file). Write reasoning explicitly.
4. Generate `ai_cover_letter` (150-200 words) and, if recommendation is `apply_with_referral` or score >= 60, `ai_referral_message` (60-90 words).
5. Persist via `save-ai-result.mjs`:
   ```bash
   echo '[<single payload>]' | node scripts/jobs/save-ai-result.mjs
   ```
6. Write the per-job folder under `docs/applications/<YYYY-MM-DD>/<priority>/<company-slug>__<role-slug>/` with `jd.md`, `cover_letter.md`, `referral_message.md`, `apply.md`.
7. Output a brief summary in chat: score, recommendation, priority, file path. Include the cover letter inline so the user can paste-edit.

## When to use

- User found a job manually and wants AI judgment on it
- A specific listing was previously skipped and the user wants reconsideration
- Re-scoring after the resume changes
