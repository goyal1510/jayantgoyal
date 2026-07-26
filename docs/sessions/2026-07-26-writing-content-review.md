# Writing Content Review

- **Date:** 2026-07-26
- **Area:** Portfolio — Writing

## Goal

Inventory the canonical Writing records and assess their relevance to Jayant's
current positioning. Existing articles will not be rewritten. Outdated or
unnecessary entries will be identified for deletion, and a focused plan for new
Writing will be developed from the actual platform and engineering work.

## Working Rules

- Treat `jg_app.writing_posts` as the source of truth.
- Review published, draft, visible, and hidden records.
- Report what each article currently contains before making deletion decisions.
- Preserve worthwhile existing articles unchanged.
- Separate the existing-content cleanup from the new-writing roadmap.

## Canonical Inventory

The verified `jayantgoyal` Supabase project contains three Writing records. All
three are published and visible; there are no hidden or draft records.

### 1. How I Built a Live Resume Download with Google Docs, Next.js, and Vercel

- Published: 2026-06-18
- Tags: Next.js, Google Drive API, Vercel, Automation, Portfolio
- Length: approximately 558 words
- Current content: explains service-account authentication, Google Drive PDF
  export, a public `/api/resume` endpoint, server-only credentials, Vercel
  configuration, and removing the committed static PDF workflow.
- Fact check: the Google Drive export and server-only credentials still exist,
  but the current route also has a committed static PDF fallback, serves the PDF
  inline rather than as an attachment, and belongs to the public Portfolio app
  without the old proxy-allowlist requirement.
- Recommendation: **delete** rather than rewrite. Its core implementation still
  exists, but the user-facing behavior, fallback model, and application boundary
  no longer match the article.

### 2. How I Fixed 86 Unindexed Pages and Made My Site Google-Ready

- Published: 2026-05-03
- Tags: SEO, Next.js, Google Search Console, Web Security
- Length: approximately 396 words
- Current content: documents the crawler/auth conflict, the move to layout-level
  gating, metadata, structured data, sitemap/robots coverage, CSP, and the
  resulting crawlability improvements.
- Fact check: Studio still uses the described proxy fast path plus
  `AuthGateWrapper` in its protected layout. Public paths, sitemap/robots,
  structured metadata, and CSP headers remain implemented.
- Recommendation: **keep unchanged**. It is a focused problem/architecture/result
  article and still demonstrates a meaningful engineering decision.

### 3. Introducing jayantgoyal.com — More Than a Portfolio

- Published: 2026-04-30
- Tags: Next.js, Supabase, Portfolio, Developer Tools, TypeScript
- Length: approximately 529 words
- Current content: inventories Portfolio, 87 tools, nine games, File Manager,
  Scratchpad, Activity Tracker, Weather, the stack, and several architecture
  highlights.
- Fact check: the 87-tool and nine-game counts are still accurate, but the
  architecture description predates the four-application Portfolio, Studio,
  Admin, and Auth split. It also duplicates the current Work and Studio product
  surfaces while offering less technical depth than either.
- Recommendation: **delete** rather than rewrite. It is a launch announcement
  for an earlier platform shape and does not support the current
  proof-oriented Writing strategy.

## Completed Cleanup

The user chose to delete all three existing records:

1. `how-i-built-a-live-resume-download-with-google-docs-next-js-and-vercel`
2. `fixing-google-indexing-seo`
3. `introducing-jayantgoyal-com`

The delete returned all three expected records, and the immediate
read-after-delete check returned zero remaining rows.

## New Writing Roadmap

New Writing should explain one real engineering problem per article. Avoid
general platform tours, generic technology lists, and articles that merely
repeat a Work case study.

### Priority 1 — From One Next.js App to Four Clear Product Surfaces

- Angle: why Portfolio, Studio, Admin, and Auth needed explicit ownership.
- Evidence: domain and route boundaries, shared brand/platform/auth packages,
  deployment independence, compatibility redirects, and rollback gates.
- Audience value: shows recruiters and founders that Jayant can restructure a
  growing product without treating the rewrite as the product.

### Priority 2 — Making Database-Backed Product Interactions Feel Immediate

- Angle: reducing perceived and measured latency across Activity Tracker,
  Calculator history, and Scratchpad.
- Evidence: proxy identity handoff, parallel reads, atomic upserts,
  ownership-scoped mutations, optimistic UI with rollback, query indexes, and
  before/after latency measurements.
- Audience value: demonstrates full-stack performance work across browser, API,
  auth, and PostgreSQL rather than isolated frontend tuning.

### Priority 3 — A Portfolio CMS With One Source of Truth

- Angle: keeping public content, Admin editing, database constraints, and typed
  application contracts synchronized.
- Evidence: `portfolio` schema, Admin workspaces, public server queries,
  `@repo/portfolio-data`, RLS, cache invalidation, asset ownership, and removal
  of static fallbacks and dead fields.
- Audience value: shows an end-to-end content product, not a hardcoded personal
  website.

### Priority 4 — Building Server-Validated Realtime Game Rooms

- Angle: one reusable Supabase session model supporting turn-based,
  simultaneous-choice, hidden-answer, and multi-player games.
- Evidence: rooms, participants, moves, results, Realtime refresh, RLS,
  server-owned rules, Wordle secret handling, and validated two-browser flows.
- Audience value: communicates state-modeling, concurrency, authorization, and
  realtime engineering depth.

### Priority 5 — What Actually Reduced the Next.js Bundle

- Angle: measured bundle optimization rather than dependency-list guesswork.
- Evidence: Turbopack route graphs, the Portfolio client-boundary split,
  deferred Prism and jsPDF, removal of unnecessary TanStack Table usage, and
  enforced bundle budgets.
- Audience value: demonstrates measurement discipline and durable performance
  regression controls.

### Priority 6 — Designing a Private File Manager on Supabase

- Angle: modeling folders and file operations while keeping storage
  user-scoped and recoverable.
- Evidence: Storage, signed access, virtual hierarchy, copy/move operations,
  soft delete, recovery, metadata, and RLS boundaries.
- Audience value: gives potential clients a concrete example of secure product
  infrastructure beyond CRUD forms.

## Recommended Story Sequence

The public archive should read as a progression. The first two entries establish
the person and journey; the six technical entries then show increasing product
and engineering responsibility.

1. **2025-12-07 — I’m Jayant — Here’s Why I Keep Building**
   - Introduction, motivation, professional context, and the purpose of Writing.
   - Date matches the first verified platform commit.
2. **2026-01-11 — From Shipping Features to Owning the Whole Product**
   - Journey from implementation work toward complete product ownership.
   - Date matches the point where planning moved from utilities toward the
     complete File Manager product.
3. **2026-01-24 — Designing a Private File Manager on Supabase**
   - First detailed product-system story.
4. **2026-05-19 — Building Server-Validated Realtime Game Rooms**
   - Reusable room model, server-owned rules, Realtime, and RLS.
5. **2026-07-17 — From One Next.js App to Four Clear Product Surfaces**
   - Portfolio, Studio, Admin, and Auth ownership boundaries.
6. **2026-07-19 — A Portfolio CMS With One Source of Truth**
   - Public/Admin/database synchronization and removal of duplicate contracts.
7. **2026-07-25 — What Actually Reduced the Next.js Bundle**
   - Measurement, client boundaries, lazy dependencies, and budgets.
8. **2026-07-26 — Making Database-Backed Product Interactions Feel Immediate**
   - API, auth, query, and optimistic-interface performance with measurements.

Defer a standalone SSO/Auth article until the canonical Auth cutover and
legacy-route retirement are complete. Publishing it before that gate would
create another article whose architecture becomes outdated too quickly.

## Article Standard

Every new article should contain:

1. The real problem and constraint
2. The architecture and data flow
3. Decisions and rejected alternatives
4. Authorization/security boundaries where relevant
5. Measured or observable outcome
6. Tradeoffs and the next improvement
7. Links to the relevant Work case study and live product

Do not publish a technology merely because it appears in `package.json`; mention
it only where it explains an engineering decision.

## Confirmed Cleanup

The user chose to remove all prior Writing instead of retaining the SEO article.
The three exact records were deleted from the verified `jayantgoyal` Supabase
project, and the immediate read-after-delete check confirmed that
`jg_app.writing_posts` contained zero rows.

## Manual Publication Dates

Admin previously replaced a blank publication date with the current timestamp
when a post was published. That fallback was removed. The publication date is
now required when `Published` is enabled, and the form explains that the date
must be chosen manually.

This preserves deliberate chronology. Dates should correspond to genuine
project or career milestones; the article can be identified as retrospective
when it is written after the period it describes.

## Opening Drafts

Two replacement entries now exist as unpublished, visible drafts:

1. `why-i-keep-building`
   - Title: I’m Jayant — Here’s Why I Keep Building
   - Manual date: 2025-12-07 10:00 IST
   - 738 words after the final editorial pass
2. `from-shipping-features-to-owning-the-whole-product`
   - Title: From Shipping Features to Owning the Whole Product
   - Manual date: 2026-01-11 10:00 IST
   - 821 words after the final editorial pass

Both use verified public experience facts and repository milestones. Neither is
published, so they can be reviewed without appearing on the Portfolio.

## Complete Drafting Pass

The user approved completing the full sequence without pausing for
article-by-article review. The implementation scope is now:

- Final editorial pass on the two opening journey articles.
- Six complete technical articles for File Manager, realtime game rooms, the
  four-application split, the canonical Portfolio CMS, bundle optimization, and
  database-backed interaction performance.
- Keep all eight records unpublished and visible only in Admin until the user
  reviews the collection.
- Preserve the verified milestone dates listed above instead of assigning the
  current date automatically.
- Ground claims, measurements, tradeoffs, and links in repository history,
  canonical schema snapshots, current source, and existing Work case studies.

## Completed Article Collection

All eight records now exist in `jg_app.writing_posts` as visible Admin drafts
with `is_published = false`:

1. 2025-12-07 — I’m Jayant — Here’s Why I Keep Building (738 words)
2. 2026-01-11 — From Shipping Features to Owning the Whole Product (821 words)
3. 2026-01-24 — Designing a Private File Manager on Supabase (1,226 words)
4. 2026-05-19 — Building Server-Validated Realtime Game Rooms (1,274 words)
5. 2026-07-17 — From One Next.js App to Four Clear Product Surfaces
   (1,277 words)
6. 2026-07-19 — A Portfolio CMS With One Source of Truth (1,380 words)
7. 2026-07-25 — What Actually Reduced the Next.js Bundle (1,253 words)
8. 2026-07-26 — Making Database-Backed Product Interactions Feel Immediate
   (1,378 words)

The two journey articles received a final editorial pass. The six technical
articles cover the real problem, system boundary, implementation decisions,
security model where relevant, tradeoffs, verified outcomes, and links to the
related Work or deployed Studio surfaces.

## Draft Integrity Verification

- Service-role read returned exactly eight records in the intended chronological
  order.
- Every record has a matching Markdown H1, at least four H2 sections, a
  nonblank excerpt, at least three tags, and its manually selected milestone
  timestamp.
- All eight records are visible in Admin and unpublished.
- An anonymous Data API read returned zero records, confirming that public RLS
  does not expose the drafts.
- The content contains no `Jayant Goyal` name copy and no localhost URL.
- A live-link pass caught hidden Work records that do not have public detail
  routes and the Activity Tracker's canonical nested route. Those links were
  corrected to the deployed Studio case study, File Manager, Games, and
  Activity Tracker destinations.
- All eight unique links used across the articles now resolve successfully with
  HTTP 200.

## Publication

The user approved publishing the complete collection. All eight canonical
`jg_app.writing_posts` records now have `is_published = true` while preserving
their manually selected milestone timestamps and visible state.

Post-publication verification confirmed:

- the anonymous Data API returns exactly eight visible, published records;
- the live `/writing` index renders both the newest and oldest entries;
- all eight live `/writing/[slug]` routes return HTTP 200 and render the article
  reader;
- the public order remains newest-first while the milestone dates preserve the
  intended story chronology.

The homepage Writing preview refreshed through its 60-second data cache. The
static sitemap did not refresh from the database write, so the current Portfolio
source was force-deployed to Production without changing application code.
Vercel deployment `dpl_F9yDQnXJkVzrzfuHrkrpVRkfzQNi` completed with `READY`
status and was assigned to `jayantgoyal.com`.

The final live check confirmed the homepage shows the newest article,
`/writing` shows the complete range, all eight detail routes render, and
`/sitemap.xml` contains all eight Writing URLs.

## Validation

- Formatted the modified Admin Writing files with the pinned Prettier version.
- Admin zero-warning lint passed.
- Admin route generation and strict TypeScript checking passed.
- The focused Writing API and shared content-guard suite passed 10 tests across
  two files.
- The Admin production build completed successfully with all 35 static pages
  generated.
- `git diff --check` passed.
