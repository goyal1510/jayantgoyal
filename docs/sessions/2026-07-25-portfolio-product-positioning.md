# Portfolio Product Positioning

## Date and area

- Date: 2026-07-25
- Areas: Portfolio, Studio, Admin, Auth, Supabase, content strategy

## Problem

The underlying system demonstrates substantial product-engineering depth, but
the public Portfolio presents it primarily as a resume and a flat collection of
projects. Resume and Blog must remain prominent while the site is repositioned
for recruiters, engineers, founders, and potential clients.

## Current direction

- Preserve the existing editorial design language.
- Document the completed technical, content, project, navigation, homepage, and
  conversion audit in the repository.
- Implement the work in phased, independently verifiable batches.
- Start with security and correctness, then public positioning and navigation,
  then case studies and proof.
- Do not use Figma or another external design workflow.

## Worktree

- Branch: `codex/portfolio-product-positioning`
- Worktree:
  `/Users/jgoyal1510/Desktop/Jayant/Developer/projects/worktrees/jayantgoyal/portfolio-product-positioning`

## Status

- Worktree created from the current `origin/main`.
- Environment files and non-secret Supabase link metadata copied from the
  protected source clone.
- Local Supabase project ID made unique to this worktree.
- Supabase project identity verified as `jayantgoyal`
  (`orwfvyditlguqvxvztkw`); current local and remote migration histories align.
- Ephemeral `supabase/.temp/pooler-url` removed after link verification.
- Created `docs/portfolio-audit-and-implementation-roadmap.md` as the
  source-of-truth audit, project evaluation, information architecture,
  conversion strategy, and accelerated one-to-two-week implementation plan.
- Established the first checkpoint: session RPC hardening, hidden-section
  reliability, CI gates, and explicit Resume navigation.
- Verified against the linked project that the three legacy session RPCs are
  owned by `postgres`, run as `SECURITY DEFINER`, and are executable by
  `anon` and `authenticated`; verified that they have no database
  dependents and no application callers.
- Added `supabase/migrations/20260725143006_harden_portfolio_foundation.sql` to remove those unused RPCs, restrict the safe
  caller-bound session counter, align section visibility with the typed public
  CMS contract, label Writing as Blog in navigation, and add Resume as a
  managed primary-navigation destination.
- The migration was reviewed locally before guarded remote application, then
  the canonical schema snapshots were refreshed from the verified project.
- Added dedicated Portfolio navigation helpers and regression coverage so
  Resume resolves to `/resume` from both the homepage and subpages and receives
  the correct current-page state.
- Extended the shared public-navigation contract to include Resume.
- Added a migration-contract regression test covering the removed session
  functions, complete section-content policy, and Resume navigation seed.
- Added `.github/workflows/quality.yml` to enforce architecture, brand,
  service-role, lint, type, and test gates on pull requests and `main`.
- Kept the migration-contract test with the Portfolio application, whose test
  TypeScript configuration already includes the Node types needed to inspect
  repository migration files.
- Formatted the Checkpoint 1 TypeScript, workflow, audit, and session files with
  the repository's pinned Prettier configuration.
- Applied the reviewed foundation migration to project
  `orwfvyditlguqvxvztkw` through a disposable Supabase workdir after verifying
  that all 38 historical migrations matched and only the new migration was
  pending.
- Verified remotely that the unsafe session functions are absent, anonymous
  session-count execution is blocked, authenticated execution remains
  available, the section-content policy reads `true`, and Blog/Resume
  navigation records exist.
- Staged the Resume navigation record as hidden until the matching Portfolio
  renderer is deployed, preventing the current production renderer from
  pointing visitors at a nonexistent `#resume` anchor.
- Added `supabase/migrations/20260725143755_stage_resume_navigation_for_web_release.sql` to preserve that release gate in migration
  history; Resume will be enabled through Admin after the web release.
- Applied the Resume staging migration and verified that all 40 local and
  remote migration versions align.
- Refreshed all three canonical remote schema dumps after the migration. The
  reviewed `jg_account` and `portfolio` diffs contain only the expected
  function/grant, navigation constraint, and section-policy changes;
  `jg_app.sql` is byte-for-byte unchanged.
- Ran the full monorepo validation: 54 test files and 269 tests passed, all 11
  lint targets passed, all 11 type-check targets passed, and architecture,
  brand, and service-role boundary checks passed.
- Re-ran Supabase security advisors after DDL. No new finding was introduced;
  the remaining warnings predate this checkpoint and are tracked for later
  hardening.
- Added `supabase/migrations/20260725144132_reposition_portfolio_content.sql` for Checkpoint 2. It updates the hero and Work
  positioning, corrects project descriptions and decision-level technology
  tags, reframes Sync Messenger as Sync Scratchpad, removes unsupported
  E-commerce claims, promotes File Manager and Game Hub, and hides Currency
  Calculator and Weather from the professional archive while retaining both in
  Studio.
- Replaced the vague homepage CTA with `Explore product work`.
- Removed stale `99+` and five-game claims from public Studio metadata and
  repository documentation. Tool JSON-LD now derives its count from the live
  typed registry, while static public references state the verified current
  count of 87 tools and nine games.
- Added a regression contract for the hero, tool count, Sync Scratchpad,
  E-commerce scope, and hidden archive projects.
- Formatted the Checkpoint 2 code and documentation with the repository's
  pinned Prettier configuration.
- Applied the Checkpoint 2 content migration to
  `orwfvyditlguqvxvztkw` through a new disposable workdir after confirming the
  first 40 migrations were aligned and only the reviewed content migration was
  pending.
- Verified the new hero copy, all nine project records, their decision-level
  technology tags and sort order, the two hidden archive projects, the Blog
  label, and the staged Resume record directly on the remote database.
- Refreshed all three canonical schema dumps after the data migration and
  confirmed that `jg_account.sql`, `jg_app.sql`, and `portfolio.sql` remain
  byte-for-byte identical to the reviewed snapshots, as expected for a
  data-only migration.
- Restored the tracked Supabase `project_id` after remote work; the temporary
  worktree-only identifier is not part of the implementation diff.
- Completed production builds for Portfolio and Studio after Checkpoints 1 and
  2; both compiled and generated their route output successfully.
- Started Checkpoint 3 by moving featured product work directly behind the
  outcome-led hero, ahead of About, Education, Skills, Experience, and GitHub
  activity. This changes information priority without replacing the existing
  editorial design.
- Moved selected Blog content directly behind featured work so technical
  thinking appears before the long professional context. Confirmed the existing
  `/work` archive remains separate from homepage flagships and recorded the
  completed removal of Category C products from that professional archive.
- Added a compact, responsive product-proof strip between the hero and featured
  work. It communicates end-to-end ownership, the four-application platform,
  backend depth, and delivery capability; the application count is derived
  from the canonical shared brand registry and covered by regression tests.
- Upgraded the mobile navigation overlay to an explicitly labelled modal dialog,
  hid the decorative toggle strokes from assistive technology, and trapped
  keyboard focus between the first and last menu actions while preserving
  Escape-to-close and focus restoration.
- Reduced the homepage project selection from four to the three strongest
  flagships while preserving every visible project in the dedicated Work
  archive. The selection limit is explicit and covered by a focused test.
- Kept the flagship-selection test framework-independent by placing the pure
  selector in the Portfolio library boundary instead of importing a TSX/Next
  component into the repository's Node-oriented Vitest transform.
- Added a reviewed primary-navigation migration that orders Work, Blog, About,
  and Resume around visitor intent while removing Skills, Experience, and
  Activity from the menu without removing their homepage sections. Resume
  remains staged off until the matching web renderer is deployed.
- Applied the reviewed navigation migration to the verified `jayantgoyal`
  project (`orwfvyditlguqvxvztkw`) through a disposable workdir. The CLI's new
  migration-history guard required canonical historical files as read-only
  context; an assertion confirmed that only `20260725144500` was pending before
  apply and that every local/remote version aligned afterward.
- Verified the resulting navigation rows through the authenticated REST
  boundary: Work, Blog, and About are visible in that order; Skills,
  Experience, and Activity are hidden only from navigation; Resume remains
  hidden at its release gate.
- Refreshed all three canonical schema dumps after the data-only navigation
  migration and confirmed `jg_account.sql`, `jg_app.sql`, and `portfolio.sql`
  are byte-for-byte unchanged.
- Re-ran the complete quality suite after Checkpoint 3: 56 test files and 274
  tests passed; all 11 lint and type-check targets passed; architecture, brand
  asset, service-role, formatting, and diff checks passed; the Portfolio
  production build completed successfully.
- Started Checkpoint 4 with a typed, reusable project case-study contract.
  Published studies require a complete problem, solution, architecture,
  decision list, security, tradeoff, outcome, and next-improvement narrative.
  Shared guards protect both Admin writes and public reads, and the Portfolio
  mapping exposes only explicitly published, structurally valid studies.
- Kept the case-study workflow draftable: Admin may save structurally valid
  incomplete draft copy, while publication requires every narrative field and
  at least two complete engineering decisions.
- Extended the existing Admin project editor with a managed case-study draft
  workflow, decision-list editing, explicit publication control, and a visible
  published-state badge. The fields remain part of the existing project CMS
  instead of creating a disconnected content surface.
- Added the reusable `/work/[slug]` case-study route within the existing
  editorial system. Published studies receive project-card links, canonical
  metadata, sitemap entries, real product imagery, technical decisions,
  security and tradeoff sections, product/source paths, and a return to the
  complete Work archive.
- Styled the case-study route with the Portfolio's existing paper, ink, serif,
  border, and responsive systems. No new visual language or generated asset was
  introduced; the layout uses each project's managed product screenshot.
- Added a reviewed Supabase migration for the case-study fields, database shape
  and publication constraints, and the first three source-backed studies: Tech
  Tools, File Manager, and Game Hub. The copy names current tradeoffs and
  follow-up work instead of implying unsupported scale or completeness.
- Updated the Admin API contract fixture for the new nullable draft and explicit
  publication fields after strict type checking correctly exposed the changed
  project-create shape.
- Applied `20260725150000_add_project_case_studies.sql` to the verified
  `jayantgoyal` project through the guarded disposable workflow after asserting
  that it was the only pending version. All local and remote migrations align.
- Verified through the authenticated REST boundary that Tech Tools, File
  Manager, and Game Hub are published with three complete engineering decisions
  each, and ran Supabase database lint for the Portfolio schema with no errors.
- Refreshed every canonical remote schema snapshot. `jg_account.sql` and
  `jg_app.sql` remain byte-for-byte identical; `portfolio.sql` contains only the
  reviewed case-study functions, grants, columns, and constraints in addition
  to the earlier foundation changes.
- Reworked the contact flow around lightweight opportunity qualification:
  visitors now describe what they are building, current stage, target timeline,
  required outcome, and optional context. Server validation accepts only the
  declared stage/timeline values, and the delivery email presents the brief in
  a decision-ready format without creating a long sales form.
- Replaced the single hero action with an explicit three-path hierarchy: View
  case studies for product proof, Résumé for the recruiter path, and Discuss a
  product for founders and potential clients. The proof strip and complete
  case studies provide verifiable confidence without inventing testimonials.
- Added a reviewed CMS migration that positions Contact around product
  ownership and asks for a short, decision-useful brief instead of a generic
  message.
- Replaced Admin's two independent section-presentation writes and compensating
  rollback with one service-role-only PostgreSQL RPC. Section copy and optional
  navigation now upsert in a single database transaction, and route tests cover
  success, null-navigation, validation, and transaction failure.
- Replaced the process-local contact throttle with an atomic Supabase-backed
  rate-limit bucket. The application HMACs normalized client IPs with a
  dedicated server secret, the database stores only 64-character hashes, and a
  narrowly granted security-definer function enforces five attempts per
  15-minute window across all server instances.
- Capped blocked rate-limit buckets explicitly at six attempts so sustained
  abuse cannot overflow the counter while the current window remains active.
- Declared the new server-only contact secret in Turborepo's environment
  contract so linting and build cache invalidation both recognize it.
- Replaced online Wordle's Supabase credential/public-URL fallback with a
  required purpose-specific `WORDLE_SEED_SECRET`. The route fails closed with a
  service-unavailable response when configuration is missing, and focused tests
  cover deterministic selection and rejection of the former fallbacks.
- Inspected the linked Storage schema and found the manually created
  `private-files` policies allowed every authenticated user to access every
  object in the bucket. Added a canonical migration that keeps the bucket
  private, enforces the application's 25 MB limit, and binds read, upload,
  update, and delete access to the first path segment matching `auth.uid()`.
- Started the online-game consistency hardening with a service-role-only
  transaction contract that locks the session, rejects stale move numbers, and
  commits the move, optional result, and session state together.
- Added a self-cleaning linked-database verification suite for role grants,
  bounded anonymous contact throttling, owner-versus-cross-user Storage access,
  stale-action rejection, and all-or-nothing game move/result/session
  persistence. The suite creates only unique temporary fixtures, deletes them
  in a `finally` boundary, and is exposed as `pnpm test:db:linked`.
- Applied the transactional game action migration and its conflict-code
  correction to the verified `jayantgoyal` project. All 49 local and remote
  migration versions align; anonymous execution is blocked, service execution
  is available, and the linked verification suite passes with no retained test
  accounts, files, sessions, results, moves, or rate-limit records.
- Refreshed all three canonical schema snapshots after both game migrations.
  `jg_account.sql` and `portfolio.sql` are unchanged; `jg_app.sql` records the
  reviewed transaction function and its service-role-only grant. Database lint
  reports no errors and only three pre-existing file-manager warnings.
- Documented the Auth production cutover gate, environment matrix, complete
  black-box flow checklist, 48-hour observation gate, immediate rollback, and
  staged legacy-route/cookie retirement in
  `docs/operations/auth-cutover-and-legacy-retirement.md`.
- Completed the final repository gate after the reliability work: 58 test files
  and 285 tests pass; all 11 lint and type-check targets pass; architecture,
  brand-asset, and service-role boundary checks pass; and Portfolio, Admin, and
  Studio production builds complete successfully. The Portfolio build includes
  `/resume`, `/work`, and `/work/[slug]`.
- Began the authorized production release by preparing one reviewed migration
  that activates Resume in primary navigation, publishes JG Platform as the
  first flagship project, and updates the File Manager and Game Hub studies to
  reflect the storage-policy and transactional-game hardening already shipped.
- Created `jg-platform.png` as a 2940×1678 case-study visual composed from four
  real Studio product captures already maintained in the repository: Tech
  Tools, Calculator Builder, Game Hub, and Activity Tracker. No Figma,
  sensitive private-file listing, or invented interface artwork was used.
- Closed the audit roadmap's final NAV-01 and CASE-01 implementation items in
  preparation for database apply, release validation, and the production merge.
- Paused implementation and created `docs/portfolio-content-blueprint.md` as
  the content-only source of truth. The blueprint removes the rejected personal
  umbrella-project concept, keeps every legitimate Studio project findable,
  gives Portfolio CMS, Auth, and delivery foundations their own visible
  engineering-system proof, and defines the complete homepage, Work, Blog,
  Resume, About, Experience, and Contact information architecture.
- Locked the public identity as `Jayant · Software Engineer`, the Hero headline
  as “I build complete software products—from product decisions to production
  systems,” and the SEO title as `Jayant | Software Engineer`. SaaS and
  full-stack remain contextual capabilities rather than the public title.
- Explicitly kept UI styling, screenshots, responsive behavior, accessibility
  review, and deployment out of scope until the content blueprint is accepted
  and implemented separately.
- Added the verified technology-language matrix and supporting-page contracts
  to the content blueprint so each project is described with evidenced
  architecture and each Work, Systems, Blog, About, Resume, and Contact path
  has an explicit information contract.
- Simplified the navigation model after review: Work is the single umbrella
  destination, Studio is one suite inside Work, and its apps are named
  sub-products/evidence rather than separate primary links. Engineering
  systems remain a labeled Work subsection, with Contact as the conversion
  destination.
- Restored the earlier six-destination navigation direction—Work, Systems,
  Blog, About, Resume, and Contact—after clarifying that the concern was the
  project presentation, not the navigation. Work now explicitly contains a
  Studio suite layer, a selected Case Studies layer, and the complete archive;
  Systems remains a direct destination for CMS, Auth, and delivery proof.
- Started implementation of the approved scalable content architecture:
  Studio, Projects, Case Studies, Engineering, About/Experience, Blog,
  Resume, and Contact as explicit public destinations. Existing case-study
  support will be reused, `/work` will remain a compatibility entry point,
  and the internal Messenger route/database identifiers will remain stable
  while every visitor-facing product label becomes “Sync Scratchpad.”
- Direction changed during implementation: internal naming must be brought into
  the same canonical vocabulary as the public portfolio. The next pass will
  rename runtime routes, app identifiers, database objects, CMS keys, tests,
  docs, and rewrites for Scratchpad and the other portfolio destinations. Old
  migration files remain historical audit records; current schema snapshots
  and runtime code will use the new names, with compatibility redirects only
  where they protect existing links.

- Implemented canonical public destinations and detail routes locally:
  `/about`, `/studio`, `/projects`, `/case-studies`, `/engineering`, `/blog`,
  `/resume`, and `/contact`. `/work` and old Admin workspaces are compatibility
  redirects.
- Applied and verified the live CMS vocabulary migration from `work`/`activity`
  /`writing` to `projects`/`github`/`blog`, plus canonical Blog/GitHub labels.
- Applied and verified the live Studio rename from `jg_app.messenger_messages`
  to `jg_app.scratchpad_entries` with `entry_type`. Studio routes, APIs,
  components, types, breadcrumbs, active-app mapping, inventory, README, and
  llms metadata now use `Sync Scratchpad` and `/scratchpad`.
- Migrated the portfolio project slug from `sync-messenger` to
  `sync-scratchpad`.
- Reviewed migrations applied remotely: `20260725173211_portfolio_content_destinations.sql`,
  `20260725174306_rename_messenger_to_scratchpad.sql`,
  `20260725175641_normalize_portfolio_labels.sql`, and
  `20260725175746_rename_sync_messenger_project.sql`. All three canonical
  schema snapshots were refreshed after each apply. The rejected JG Platform
  migration was not applied.
- Finalized the live public identity through `20260725180156_finalize_public_identity.sql`:
  Hero name/display name are `Jayant`, public role is `Software Engineer`, the
  headline is product-focused without making SaaS the identity, and SEO copy
  uses `Jayant | Software Engineer`.
- Completed the canonical naming sweep: active Studio, Portfolio, Admin,
  shared data contracts, redirects, schemas, and project metadata now use
  Scratchpad, Projects, Blog, GitHub, Studio, Case Studies, and Engineering.
  Legacy `/messenger`, `/work`, `/writing`, and `/activity` paths remain only as
  compatibility redirects or historical migration records.
- Corrected cross-app section redirects so canonical Portfolio pages are not
  redirected back to obsolete homepage anchors. Updated current Admin and
  repository documentation to match the runtime vocabulary.
- Verification after the final sweep: Portfolio, Admin, and Studio production
  builds pass; `pnpm check-types`, `pnpm lint`, and `pnpm test` pass with 58 test
  files and 286 tests; `git diff --check` is clean.
- Updated the content blueprint status and release gate so it reflects reality:
  implementation is complete, while final claim/Blog accuracy review, the
  separate UI/accessibility audit, and commit/deploy smoke testing remain.

## Vocabulary correction and implementation continuation — 2026-07-25

- Direction was clarified again: the canonical portfolio terms are **Work**,
  **Writing**, and **Activity**. GitHub remains the underlying provider for
  Activity, not its public section label. This supersedes the immediately
  preceding Projects/Blog/GitHub wording; that wording remains only in this
  historical log and compatibility routes.
- Renamed the active Portfolio public routes and data contracts to `/work`,
  `/writing`, `portfolio.work`, and `jg_app.writing_posts`. Added permanent
  compatibility redirects for `/projects`, `/blog`, `/blogs`, and the former
  Admin workspace paths.
- Renamed the active Admin workspaces and APIs to Work, Writing, and Activity;
  renamed the Studio external portfolio surface from Blog to Writing; updated
  route maps, active-app resolution, breadcrumbs, llms metadata, LinkedIn
  publishing helpers, tests, and current documentation.
- Renamed Work-specific Admin types and asset kind from Project/project-image
  to WorkRecord/work-image. Provider-specific GitHub fields, packages, URLs,
  and GitHub Stats remain intentionally unchanged.
- Added and applied
  `supabase/migrations/20260725182646_rename_portfolio_work_writing_activity.sql`.
  It renamed live tables, constraints, indexes, triggers, policies, case-study
  validation functions, CMS keys, and navigation labels. Remote verification
  confirms only `portfolio.work`, `jg_app.writing_posts`, and Activity/Work/
  Writing section keys are active.
- Refreshed `supabase/schemas/jg_account.sql`, `jg_app.sql`, and
  `portfolio.sql` from the verified remote project after the migration.
- Validation: 58 test files / 286 tests pass; lint and type checks pass;
  Portfolio, Admin, and Studio builds pass after clearing stale `.next`
  output. The content blueprint and audit roadmap now describe Work, Writing,
  and Activity consistently. No Figma or visual redesign workflow was used.

## Public identity normalization — 2026-07-25

- Normalized active brand and metadata contracts to use **Jayant** as the
  displayed person name; the `jayantgoyal.com` domain, account handles, email,
  repository names, and external profile URLs remain unchanged because they
  are identifiers rather than display labels.
- Updated shared app branding, Auth copy, Studio metadata, Portfolio Open Graph
  copy, llms files, README wording, and the current audit owner label. The
  public role is now **Software Engineer**.
- Updated Studio structured data and the repository title to remove the last
  active “Full-Stack Developer” and “Jayant Platform” display labels.
- Final validation after the identity cleanup: `pnpm check-types`, `pnpm lint`,
  and `pnpm test` pass (58 files / 286 tests); Portfolio, Admin, and Studio
  production builds pass; `git diff --check` is clean.

## Editorial accuracy pass — 2026-07-26

- Audited the live `portfolio.work`, `portfolio.section_content`, `portfolio.hero`,
  `portfolio.about`, `portfolio.experience`, and `jg_app.writing_posts` records
  against the current code and canonical routes.
- Found and corrected the remaining visitor-facing drift: Sync Scratchpad was
  still linking to `/messenger`, its CMS asset metadata still said Messenger,
  and older Writing posts still contained old `/tools`, `/blogs`, and GitHub
  Stats origins, the old surname, outdated tool/game counts, and a stale
  React Context architecture description.
- Added `20260725184925_finalize_portfolio_editorial_accuracy.sql` to apply the
  corrections reproducibly, including the canonical Scratchpad asset path and
  Writing link/content updates. The remote apply and record-level verification
  are the next steps in this pass.
- Added `20260725185127_polish_writing_labels.sql` to replace the last active
  “blog posts” and “platform” labels in published Writing copy, while retaining
  platform as a technical architecture concept where it is accurate. Updated
  the Portfolio SEO keyword and roadmap language to use Software Engineer as
  the identity and full-stack as the capability.
- Applied both editorial migrations to the verified `jayantgoyal` Supabase
  project (`orwfvyditlguqvxvztkw`) through disposable guarded worktrees. Remote
  verification confirmed the canonical Scratchpad link/asset metadata and no
  remaining old Writing routes, surname, counts, or architecture wording.
- Refreshed and reviewed all three canonical schema snapshots after the apply;
  the migrations are data/editorial updates, so no schema contract changed.
- Final local validation passes: `pnpm check-types`, `pnpm lint`, and `pnpm test`
  (58 files / 286 tests); Portfolio, Admin, and Studio production builds pass;
  stale active editorial references are limited to compatibility routes and
  historical audit notes; `git diff --check` is clean.
- Added `20260725185632_align_case_study_accuracy.sql` to align the published
  File Manager and Game Hub case studies with the security-policy and
  transactional-action hardening that is now present in the implementation.
  The remote apply and focused case-study verification remain to be completed.
- Applied and verified `20260725185632_align_case_study_accuracy.sql` remotely;
  File Manager now describes the enforced private-bucket boundary and Game Hub
  now describes the transactional action RPC and stale-move protection. All
  three schema snapshots were refreshed again and remained unchanged.
- Updated the blueprint release gate: the content, route, CMS, database, and
  editorial accuracy phases are complete. Only the separate UI/accessibility
  review and commit/deploy/smoke-test sequence remain.
- During the initial UI evidence capture, found two active CMS copy mismatches:
  the About objective still used “full-stack product engineer” and certificate
  alt text still used the surname. Added
  `20260725190017_finalize_about_and_certificate_copy.sql` to correct both
  before accepting the UI audit evidence.

## UI evidence and visual asset accuracy — 2026-07-26

- Captured and inspected fresh Portfolio evidence at desktop and mobile sizes:
  homepage, mobile navigation, Work, and the Tech Tools case study. The
  screenshots are stored under `docs/audits/2026-07-26-portfolio-ui-audit/`.
- Captured a current Studio Tech Tools view from the production build/live
  surface and confirmed it uses the current Studio vocabulary with no visible
  surname. Replaced the stale `apps/portfolio/public/images/studio-tools.png`
  asset, which visibly contained “Jayant Goyal”, with the current clean Studio
  capture. The accepted evidence copy is `07-studio-tools-current.png`.
- Evidence currently shows a clear hero and a complete case-study structure;
  the main UI issue is that the Work page delays project proof below the first
  viewport, while the mobile navigation CTA sits close to the viewport edge.
  The separate UI audit report will record these findings and the limits of
  screenshot-only accessibility evidence before any UI implementation starts.

## Canonical information architecture implementation — 2026-07-26

- Rechecked the live/local implementation before starting the next phase. The
  current Resume page is only a summary plus download link, `/api/resume` has
  no reliable PDF fallback, `/about` is not the canonical profile destination,
  and the homepage repeats the full About, Experience, Education, Work, and
  Contact content.
- Direction is now finalized: Home, About, Work, Writing, Resume, and Contact
  are the only primary destinations. About groups profile, experience,
  education, and certificates. Work is the canonical index for Portfolio,
  Studio, Admin, and Identity & SSO; Engineering and Case Studies are not
  separate navigation surfaces. Studio utilities remain nested capabilities.
- Added `20260725192615_canonical_work_systems_and_navigation.sql` to hide the
  individual Studio work records from the public index, create four canonical
  system-level Work records with complete case-study content, and reduce the
  CMS navigation to the finalized six destinations.
- Added initial `portfolio.png`, `admin.png`, and `identity.png` visual slots;
  the Admin and Identity evidence images still need to be replaced with
  verified application captures before release.
- Started implementation: the public home now points to Work, About, Resume,
  and Contact instead of embedding the full experience, engineering, activity,
  and contact-form surfaces. About now owns profile, experience, education, and
  certificates; Work detail URLs are canonical under `/work/[slug]`, with
  legacy case-study, projects, Studio, and Engineering paths redirected.
- Resume now has an inline PDF viewer contract and the `/api/resume` route
  falls back to the repository PDF when the optional Google Drive export is
  unavailable. Contact remains a dedicated conversion workflow.
- Fixed the resume response body typing so both Google-exported and static
  fallback bytes use the same PDF response path.
- Updated the Portfolio security headers to allow the first-party Resume PDF
  iframe while retaining same-origin-only framing (`SAMEORIGIN` and
  `frame-ancestors 'self'`).
- Added exact compatibility redirects for legacy Studio project and
  ecommerce case-study URLs so old shared links land on the new system-level
  Work pages instead of resolving to hidden legacy records.
- Updated the content blueprint and audit roadmap to match the implemented
  canonical structure: About, Work, Writing, Resume, and Contact; four
  system-level Work records; Studio capabilities nested inside Studio; and
  engineering/case-study depth expressed inside Work detail pages and Writing.
- Removed the homepage's eager GitHub activity fetch now that Activity is no
  longer a homepage or navigation surface; the legacy renderer remains gated
  behind its explicit compatibility flag.
- Refactored the public Portfolio shell and Work routes: Home now previews
  Work/About/Contact, About owns the profile timeline and education, Work
  detail links use `/work/[slug]`, and legacy Studio/Engineering/Case Study
  destinations redirect to the canonical hierarchy. Portfolio lint and type
  checks pass after the first implementation slice.
- Logged into the private Admin and Auth surfaces using the user-provided
  credentials only for evidence verification; credentials were not stored in
  the repository or included in assets. Captured and inspected a cropped Admin
  Home editor view and a cropped Auth Connected Providers view, both excluding
  the private account identity. Replaced the temporary `admin.png` and
  `identity.png` slots with these verified captures.
- Confirmed the public local route smoke set returns 200 for Home, About, Work,
  all four system detail pages, Resume, Contact, and Writing. Confirmed legacy
  route redirects, inline PDF response headers, Portfolio type checks/lint,
  production build, root test suite (58 files / 287 tests), and `git diff
  --check`. A linked Supabase schema dump was attempted but could not run
  because Docker is unavailable in this environment; the applied migration is
  data-only and does not change schema snapshots.
- Replaced the remaining stale Portfolio Work asset with a fresh local Home
  capture so the visible navigation and hero match the canonical IA; inspected
  all three system evidence images after replacement.

## Supabase migration and schema verification — 2026-07-26

- Reopened Docker Desktop after its engine endpoint stopped responding. Docker
  is healthy again (`29.6.1`).
- Verified the intended linked Supabase project is `jayantgoyal`
  (`orwfvyditlguqvxvztkw`). The complete reviewed local migration history (60
  files) matches the remote history through
  `20260725192615_canonical_work_systems_and_navigation.sql`.
- Ran the guarded disposable-workdir migration workflow. Supabase returned
  `applied: []`, confirming there was no pending migration; the latest
  canonical Work/navigation migration is already applied remotely.
- Refreshed `jg_account`, `jg_app`, and `portfolio` schema dumps with Docker;
  each dump was schema-only, contained no top-level data loads or secrets, and
  was unchanged from the repository snapshot. The temporary dump directory and
  pooler URL were removed.

## Migration drift prevention — 2026-07-26

- Compared all 60 local migration versions with the linked remote project;
  every version matches exactly. There is no production migration-history drift
  to repair. The earlier failure came from a disposable directory containing
  only the newest file, which made valid remote history look missing locally.
- Added `scripts/supabase/migration-workflow.mjs` plus
  `pnpm db:migrations:check` and `pnpm db:migrations:apply`. The workflow always
  copies the complete migration history, refuses remote-only or mismatched
  versions, applies only pending migrations, and verifies alignment afterward.
- Added `docs/operations/supabase-migrations.md` documenting the safe workflow,
  the historical-drift cause, and why `migration repair`/`db pull` are not
  automatic fixes.
- Ran both new commands against the linked project: the check found zero
  pending migrations, and the guarded apply returned `applied: []` with local
  and remote histories identical. Formatted the workflow script with Prettier.
- Formatted the portfolio audit and content blueprint before shipping so the
  documentation diff is whitespace-clean.
- Removed the audit roadmap's four hard-break trailing spaces so the staged
  portfolio documentation passes `git diff --check`.

## Production environment verification — 2026-07-26

- Linked the Portfolio app to the Vercel project
  `jayantgoyal-portfolio` and verified the existing Resend and Supabase
  variables without reading their values.
- Added a fresh random `CONTACT_RATE_LIMIT_SECRET` to Vercel Production and
  Preview as a sensitive variable, and to Development as an encrypted
  development variable. Pulled the Development environment into the ignored
  local `.env.local`; no secret values were committed.

## Editorial UI consistency — 2026-07-26

- Captured and inspected fresh current-state screenshots for the Writing detail,
  Work index, Studio case study, and Home routes as the evidence set for the
  visual audit. No Figma or external design workflow was used.
- Rebuilt published Work detail pages around the Writing detail's reading
  experience: sticky section rail, centered long-form reading column, project
  facts rail, progress indicator, consistent footer CTA, and next-case-study
  navigation.
- Added a reusable client-side case-study renderer for all four system-level
  Work records, including active section tracking, project links, engineering
  decisions, security, tradeoffs, outcome, and next-iteration content.
- Standardized product evidence images into a single legible screenshot frame
  across Home and Work previews, made the four Work archive images eager so
  archive sections do not appear empty during capture, and shifted the Work
  archive back to the same paper editorial surface as Writing.

## Deployed light-mode evidence and About pass — 2026-07-26

- Captured the four project surfaces from their deployed URLs at a consistent
  desktop viewport: Portfolio home, Studio home/products, Admin overview, and
  Auth security/providers. Every capture uses light mode; Studio, Admin, and
  Auth retain their full expanded sidebars so the application context is part
  of the evidence.
- Replaced the four primary project image slots with the inspected deployed
  captures and added secondary Studio/Auth frames for an automatic, accessible
  screenshot gallery. The gallery uses a consistent 16:9 rectangle, preserves
  the product sidebar, and starts from an intentional home/dashboard state.
- Removed the large top-level “All writing” and “All work” links from detail
  pages so the reading shell begins with the article header and progress line.
- Rebuilt the dedicated About page around the stronger profile, experience,
  education, credentials, resume, and contact sections already used by the
  homepage, with a clear Work continuation at the end.
- Replaced all six deployed project screenshot assets after a clean recapture:
  Portfolio, Studio home/products, Admin overview, and Auth security/providers.
  The Studio, Admin, and Auth captures were verified in light mode with their
  sidebars expanded; the Admin capture was taken from the active authorized
  session with no account-menu overlay.
- Diagnosed the remaining dark-looking Admin preview as a stale browser cache
  for the old `admin.png` URL, not a dark deployed capture. Versioned all six
  curated asset filenames with explicit light-desktop names, updated the CMS
  mapping and gallery fallback, and changed the surrounding evidence frame to
  a light rectangle so the screenshot and its presentation cannot be confused
  with dark mode.
- Simplified the shared editorial page headers across About, Work, Writing,
  Case Studies, Studio, and Engineering: the active navigation item is
  highlighted, repeated eyebrow labels are removed from the body, H1 and
  description sit in a smaller left/right composition, and the first Work
  project now enters the initial viewport instead of being pushed below a
  poster-like hero.
- Removed the second About introduction (“The person behind the work” plus
  another large personal statement), so the page now has one H1/summary before
  moving directly into biography and profile facts. Reduced the shared
  editorial hero scale and spacing across About, Work, Writing, Case Studies,
  Studio, and Engineering. Writing article rows now use list-level typography,
  tighter spacing, and a wider readable title measure instead of presenting
  every article as a second hero.
- Brought Resume into the same compact page hierarchy: removed the repeated
  body eyebrow, replaced its oversized standalone hero with the shared
  left-title/right-summary composition, shortened the experience action, and
  renamed the embedded document section to the functional “PDF preview.”
- Restored the existing image-based certificate deck on the dedicated About
  page, replacing the temporary clickable text-card grid while preserving the
  certificate document and verification links. Converted the Experience and
  certificate surfaces from the dark panel to the shared light editorial
  palette, including timeline, text, controls, and metadata contrast.

## Repository dead-code cleanup — 2026-07-26

- Started a repository-wide cleanup pass covering unreachable routes,
  unreferenced components and exports, obsolete styles, unused assets, scripts,
  and configuration. Deletions will require reference evidence and will be
  validated incrementally so dynamic Next.js routes, Supabase contracts, and
  workspace package entrypoints are not removed based on static-analysis
  guesses alone.
- Removed unreachable Portfolio implementations for legacy Blog, Projects,
  Case Studies, Studio, and Engineering routes; the existing Next.js permanent
  redirects remain the sole compatibility owner. Moved the actual case-study
  implementation into canonical `/work/[slug]`, removed two unimported
  modules, eliminated the now-unused public `pageContent` adapter, and narrowed
  several internal-only exports.
- Reused the canonical `PortfolioSectionKey` type from the shared
  `@repo/portfolio-data` contract instead of retaining a second local key list
  used only for type construction.
- Removed the unconfigured legacy-home feature branch and its duplicate About,
  Education, Skills, Experience, Credentials, GitHub Activity, and Contact
  rendering paths. This also removed the unused GitHub statistics endpoint,
  contribution/statistics components, their Portfolio dependencies, and the
  obsolete `githubStats` prop.
- Removed the orphaned Portfolio stylesheet blocks left behind by those routes
  and components, including the old scrapbook Work layout, capability matrix,
  alternate experience/credential layouts, GitHub activity panel, and retired
  case-study shell. Preserved the selectors used by the current Work gallery,
  About timeline, certificate deck, Writing pages, and case-study reader.
- Kept the remaining Portfolio experience model local to its data adapter
  because no other module consumes it as a public type.
- Removed the matching orphaned tablet/mobile overrides and retired article
  back-link and text-only credential-card selectors, leaving responsive rules
  only for components that still render.
- Removed four unimported Studio animation components, their orphaned global
  animation styles, and an unused platform URL re-export. Removed the obsolete
  Auth login/register forms and actions after confirming both compatibility
  routes redirect to the unified Welcome form, plus an unused Auth browser
  Supabase re-export.
- Removed unused app-level dependencies from Studio, Auth, and Admin. Shared
  packages retain ownership of Supabase, theme, and toast dependencies where
  those libraries are actually imported. Narrowed two Auth-only helper types
  and functions from public exports to module-local declarations.
- Removed the Studio platform-wrapper test together with its deleted one-line
  re-export; hostname normalization remains covered at its canonical
  `@repo/platform` implementation instead of through a production-unused
  wrapper.
- Removed duplicated app-level ESLint plugin and Autoprefixer declarations
  because the shared ESLint package and Tailwind v4 PostCSS configuration own
  those tools. Removed two unused browser-baseline pins that had no code or
  configuration consumer.
- Narrowed Admin's internal table allowlists, authorization helpers, navigation
  source arrays, workspace loaders, route-map type, and Vercel environment
  readers so they are no longer exposed as unsupported module APIs. Removed an
  unused Writing fetch wrapper and two unused user-composition types.
- Removed unused Studio JSON-LD variants, a dead tool-category lookup, unused
  public/private app filters, and unused file-manager, activity, and typing
  model types. Narrowed component helpers and configuration/data types that are
  used only inside their defining modules instead of exposing them as public
  APIs.
- Narrowed Studio game engine constants, parser helpers, hook defaults, SEO
  path lists, and a tool helper that are implementation details used only
  inside their defining modules; removed an unused online-session status type.
- Removed uncalled Studio file-manager RPC wrappers for directory-tree, move,
  copy, restore, and file-category operations along with their unused parameter
  models and barrel exports. Removed two unused Activity Tracker date helpers.
- Removed an unconfigured Prettier plugin, an unused Wrangler CLI dependency,
  and a redundant PostCSS declaration from the shared Tailwind configuration.
  Kept the repository-local Vercel CLI and LinkedIn scripts because they are
  documented operational entrypoints, not application imports.
- Added `20260725224316_align_work_image_asset_paths.sql` to replace the four
  CMS paths that still referenced deleted screenshots with the current
  light-desktop Portfolio, Studio, Admin, and Auth assets. This keeps Admin
  previews aligned with the public Work evidence and makes the old image
  deletions safe.
- Applied `20260725224316_align_work_image_asset_paths.sql` to the verified
  `jayantgoyal` project (`orwfvyditlguqvxvztkw`) from a disposable linked
  workdir. The first one-file preflight was rejected before changes because the
  CLI required historical files; a second preflight included the canonical
  history, confirmed only this migration was pending, and applied it without
  repairing history. Verified all four updated URLs and confirmed fresh
  `jg_account`, `jg_app`, and `portfolio` schema dumps are unchanged.
- Validation restored the one reference-content result type that has a real
  cross-module consumer, removed the now-truly-unused Scratchpad recursive JSON
  type, and updated Auth's action-count contract for the unified Welcome flow.
  Replaced the Wi-Fi generator's loose Navigator casts with a typed extension
  contract so Studio returns to zero-warning lint.
- Expressed the tool-reference factory result through the already-public
  registry contract, allowing its concrete content shape to remain local
  without breaking the cross-module type check.
- Final cleanup validation passes: `pnpm check-types`, `pnpm lint`,
  `pnpm test` (57 files / 285 tests), all four production builds, architecture
  boundaries, brand-asset synchronization, service-role boundaries, and
  `git diff --check`. Repository-wide Knip output is limited to intentional
  operational/test entrypoints and the shared Next TypeScript plugin reference.
- Caught and reverted an accidental broad formatter side effect before
  handoff, then reapplied only the scoped Admin, Auth, and Studio semantic
  cleanup. This preserved all unrelated source formatting while retaining the
  reviewed dead-code and dependency removals.
- The final asset-reference check found the hidden `tech-tools` CMS record
  still targeting the deleted legacy `studio-tools.png`. Added and applied
  `20260725225648_align_tech_tools_image_asset_path.sql` to the verified
  `jayantgoyal` project, repointing it to the retained deployed
  `studio-products-light-desktop.png` evidence. The remote migration list is
  aligned, the updated record was verified through the Data API, and refreshed
  `jg_account`, `jg_app`, and `portfolio` schema dumps remain unchanged.
- Accounted for every retained public image: application favicons are governed
  by the shared brand contract, Auth and game art have direct code consumers,
  visible Work screenshots have public renderer and CMS references, hidden
  Work thumbnails remain attached to their CMS records, and certificate
  previews/documents remain attached to the five visible certificate records.
  The four replaced legacy Work screenshots are the image files removed by
  this cleanup.
