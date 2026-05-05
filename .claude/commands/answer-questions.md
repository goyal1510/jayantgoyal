Draft answers for application form questions the user added in the admin UI.

## When this runs

User typed real-form questions in `/jobs/listings` → expanded view → "Add question". Those are stored in `jg_app.job_listings.ai_application_qa[]` with `needs_answer: true`. This command finds all of them, drafts personalized answers, and persists.

## Arguments

`$ARGUMENTS` (optional) — a listing UUID. If provided, only that listing. If empty, every listing with pending questions.

## Steps

1. Read `docs/resume.md` for context — early-career, Hyderabad, Next.js/React/Supabase, Java foundations, ~1 yr experience, jayantgoyal.com portfolio.
2. Fetch pending Q&A:
   ```bash
   node scripts/jobs/list-pending-qa.mjs ${ARGUMENTS:+--id $ARGUMENTS}
   ```
   Parse the JSON. Each entry has `listing_id`, `title`, `company`, `description_text`, `qa` (full array including the pending items).
3. If no entries, report "Nothing pending — type questions in the admin UI when you hit them" and stop.
4. For each listing, for each item where `needs_answer === true`:
   - Read the question carefully.
   - Use the JD's `description_text` for company/role context (specific team, products, language stack mentioned).
   - Use `docs/resume.md` for user-side context. Stay strictly within what the resume claims; do not fabricate experience.
   - Draft an answer:
     - **Length:** match the question's expected weight. "Years of experience": 1 line. "Why this company": 3-5 sentences. "Tell me about a project": 6-9 sentences. "Salary expectation": ₹14-20 LPA range with a note about openness given the right team. "Notice period": 60 days (NeuraOak). "Visa": Indian citizen, no sponsorship needed for India roles.
     - **Voice:** first person, plain language, no buzzwords. Reference specifics (NeuraOak RCM platform, HighRadius Java/Spring intern, jayantgoyal.com).
     - **JD anchoring:** every "why us" / "why this role" must reference one concrete JD detail (team name, product, technical challenge mentioned).
     - For behavioural ("tell me about a time..."), use NeuraOak (RLS multi-tenancy, billing UI redesign, query optimization) or HighRadius (Java REST APIs).
     - For sketchy questions (gender/age/illegal), refuse politely and flag.
5. Build the full updated `ai_application_qa` array for each listing — copy through every existing item, replacing `answer`, `needs_answer: false`, `answered_at` for the ones you just drafted.
6. Save via `save-ai-result.mjs` — one JSON array, one item per listing:
   ```json
   [
     {
       "listing_id": "...",
       "ai_application_qa": [ ... full updated array ... ]
     }
   ]
   ```
7. Pipe through:
   ```bash
   echo '<json>' | node scripts/jobs/save-ai-result.mjs
   ```
   Or write to a temp file and `cat`. Verify "✓ listings: N" output.
8. Report inline to the user: per-listing count of newly answered, plus a one-line preview of one answer they're likely to use first. Don't dump every answer — they're in the admin UI now.

## Don'ts

- Don't fabricate skills, projects, or experience not in `docs/resume.md`.
- Don't pre-generate questions the user didn't ask. Only answer what's in the pending queue.
- Don't overwrite existing answered items — preserve the array's history.
- Don't write generic answers. Every "Why us" needs the company's actual product or team.

## Standard answers (use as defaults when these come up)

| Question pattern | Default answer |
|---|---|
| Years of experience | "≈1 year full-time at NeuraOak (Mar 2025 – present, Associate Product Engineer) plus a 6-month software internship at HighRadius (May–Nov 2023). Total ≈18 months of professional engineering work." |
| Notice period | "60 days at NeuraOak — happy to discuss buyout if that helps speed things up." |
| Salary expectation | "Looking at ₹14–20 LPA range. Open to discussing if the team and growth path are the right fit." |
| Current CTC | "[Leave blank — let user fill]" — flag this for the user to fill manually. |
| Visa / authorization | "Indian citizen, no sponsorship required for India-based roles. For non-India roles I'd need sponsorship." |
| Available start date | "Two months from offer (60-day notice). Open to negotiation if needed." |
| LinkedIn / portfolio | "Portfolio: https://www.jayantgoyal.com  ·  GitHub: https://github.com/goyal1510  ·  LinkedIn: https://www.linkedin.com/in/goyal1510" |
| Are you an Indian citizen? | "Yes." |
| Willing to relocate? | "Open to relocating within India if the role asks for it. Currently based in Hyderabad." |

For everything else, draft fresh.
