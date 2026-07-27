# Portfolio experience company links

- Date: 2026-07-27
- Area: Portfolio experience data, public About page, and Admin portfolio editor
- Problem: Experience entries show company names as plain text, so visitors
  cannot open the corresponding company or product websites.
- Current approach: Add a database-backed company URL to experience records,
  render company names as safe external links, expose the field in Admin, and
  populate CodeSync.ai, HighRadius, and Desire Foundation URLs.
- Key decision: Keep `Neuraoak Technologies Private Limited` as the official
  employer name while linking it to `https://www.codesync.ai/`, the product
  platform Jayant works on.
- Workspace: `codex/portfolio-experience-links` in the protected implementation
  worktree. Machine-local environment and Supabase link metadata were copied
  without secret-bearing pooler state.
- Implemented:
  - Added nullable, URL-constrained `portfolio.experience.company_url`.
  - Seeded CodeSync.ai, HighRadius, and Desire Foundation links with guarded
    one-row updates in the migration.
  - Added the field to shared CMS contracts, Admin validation/selects, and the
    Experience editor.
  - Rendered company names as accessible external links with a visible
    directional affordance while retaining plain text when no URL exists.
- LinkedIn audit: The CodeSync company page currently has 8 followers, no
  posts, a one-line overview, and a medical-coding-only tagline that does not
  represent the end-to-end RCM positioning on `codesync.ai`.
- Follow-up: Extended each experience record with a separately validated
  LinkedIn profile URL and added an accessible LinkedIn icon next to the
  company website link. CodeSync and HighRadius use official company pages;
  Desire Foundation uses its Bhubaneswar organization profile associated with
  `desirefoundation.org`.
- LinkedIn database update: Applied migration `20260727065551` as the only
  pending change to the verified production project. Refreshed the canonical
  Portfolio schema snapshot; the diff contains only the LinkedIn URL column,
  LinkedIn-specific constraint, and column documentation.
- LinkedIn verification: Re-ran the focused tests, lint, and type checks;
  rebuilt Portfolio and Admin successfully; and inspected the built About page
  to confirm three accessible LinkedIn links render with the intended URLs and
  safe new-tab attributes.
- Shipping preparation: Reviewed the complete diff for unrelated formatting,
  generated artifacts, credentials, service-role exposure, unsafe URLs, and
  database scope before creating the commit series.
- Validation: Ran the repository formatter across every changed TypeScript,
  TSX, CSS, and session file. The migration remains intentionally reviewed as
  SQL because the repository formatter has no SQL parser.
- Remote database: Applied migration `20260727064543` to the verified
  `jayantgoyal` Supabase project (`orwfvyditlguqvxvztkw`) from a disposable
  minimal workspace after confirming it was the only pending migration.
- Schema snapshots: Refreshed all three canonical remote schema dumps. The
  `jg_account` and `jg_app` snapshots were unchanged; the `portfolio` snapshot
  contains only the reviewed company URL column, constraint, and comment.
- Final verification:
  - Confirmed the three production experience rows contain the intended URLs.
  - Confirmed the linked database has no error-level advisor findings.
  - Passed focused Portfolio data/Admin API tests, relevant lint and type-check
    commands, and production builds for both Portfolio and Admin.
  - Inspected the built About page and verified all three company links render
    with their intended destinations, accessible labels, and safe new-tab
    behavior.
