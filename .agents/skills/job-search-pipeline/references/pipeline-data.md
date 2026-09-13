# Career tracker contract

The canonical tracker is the private Supabase `career` schema. The Admin page at `/career` is the human-readable view. Trusted local automation writes through `scripts/career/pipeline.mjs`.

## State meanings

- `discovered`: captured but not yet assessed.
- `shortlisted`: credible fit selected for preparation.
- `preparing`: application or outreach research is in progress.
- `ready_for_review`: final content is waiting for the user's batch confirmation.
- `approved`: the user approved this exact item, but submission has not been verified.
- `applied`: submission success was verified and an `applications` record exists.
- Later-stage and terminal states are `interviewing`, `offer`, `rejected`, `withdrawn`, `closed`, and `skipped`.

Never use `applied` merely because a form was filled or a submit control was clicked. Require a visible success state or reliable source confirmation.

## Input bundle

A tracker input is one JSON object with `company`, `opportunity`, and optional `draft`, `outreach`, `application`, and `run` objects. `confirmed_external_action` is required and true when recording a submitted application or sent or replied outreach.

Keep job-description excerpts under 4,000 characters and paraphrase where possible. Store links and factual summaries, not full copied listings.

Nightly update input contains optional `applications` and `outreach` arrays.
Each update requires an existing row `id` and may set the observed `status`,
source text or thread URL, `last_checked_at`, reply timestamp, and next action.
Never put message bodies or inbox contents into a status-update file.

## Contact privacy

Only store professional profile URLs and contact details intentionally made public by the person or supplied by the user. When storing a public email, `public_email_source_url` is mandatory. Do not derive an address from a naming pattern, use enrichment or data-broker services, scrape private contact data, or bypass site access controls.
