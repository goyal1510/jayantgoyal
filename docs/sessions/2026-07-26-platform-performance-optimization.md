# Platform Performance Optimization

## Date and area

- Date: 2026-07-26
- Areas: Portfolio, Studio, Admin, Auth, shared packages, public APIs, Supabase

## Problem

The four-application platform needs a measured performance pass across emitted
client bundles, per-route downloads, client boundaries, API execution, database
queries, caching, and payload size. Optimizations must improve the deployed
Turbopack applications rather than only making a secondary analyzer report look
smaller.

## Current direction

- Capture reproducible bundle and route baselines before implementation.
- Use the native Turbopack graph as production evidence and the Webpack treemap
  as a visual diagnostic.
- Prioritize public Portfolio routes, shared dependencies, and high-traffic API
  patterns before isolated product routes.
- Review Supabase query shape, indexes, authorization boundaries, caching, and
  response payloads without weakening correctness or security.
- Record exact before-and-after measurements and add regression budgets only
  after representative baselines are trustworthy.

## Status

- Performance work started from `origin/main` at `053316c`.
- Captured native Turbopack baselines for all four applications. Portfolio emits
  328.7 KiB compressed across its client chunks; Studio 511.3 KiB; Admin
  371.0 KiB; and Auth 309.3 KiB. Route entry sets are tracked separately
  because whole-application totals do not represent one visitor's download.
- Identified Portfolio's first high-impact boundary issue: About and Contact
  imported small exports from the 586-line client-only homepage module, pulling
  the homepage and Framer Motion into unrelated routes.
- Split certificates, contact, pointer tracking, and reveal behavior into
  focused components. Portfolio's homepage is server-renderable again; only
  certificate controls, the contact form, navigation, galleries, cursor, and
  page-progress behavior remain client islands.
- Replaced Framer Motion reveals and hero parallax with progressive CSS reveal
  animation so unsupported or reduced-motion environments retain fully visible
  content without shipping the animation runtime.
- Re-measured Portfolio with the native Turbopack analyzer after the boundary
  split. Emitted client JavaScript fell from 328.7 KiB to 265.4 KiB compressed
  (63.3 KiB, 19.3%) and from 993.3 KiB to 858.7 KiB raw (134.6 KiB, 13.6%).
  Framer Motion, Motion DOM, and Motion Utils no longer appear in Portfolio's
  production client graph.
- Isolated Scratchpad's Prism renderer and its light/dark themes behind a
  route-local dynamic import. The collapsed feed and text entries no longer
  evaluate or download syntax-highlighting code; it loads only after a code
  entry is expanded. A detached baseline build and the optimized build, measured
  with the same clean production-build procedure, show the route's initial
  entry set falling from 451.0 KiB to 230.3 KiB gzip (220.7 KiB, 48.9%).
- Deferred jsPDF from Calculator history until the user explicitly requests a
  PDF. Browsing calculations and opening the detail sheet no longer require the
  PDF renderer, while the download action retains success/error feedback. The
  same clean-build comparison shows the history route's initial entry set
  falling from 356.1 KiB to 224.3 KiB gzip (131.8 KiB, 37.0%).
- Production database statistics showed repeated reads—not expensive execution
  plans—as the primary public Portfolio cost: singleton CMS tables had roughly
  18,000–20,000 sequential scans despite containing only one or a few rows.
  Added a 60-second cross-request cache for the editorial contract, shell,
  contact recipient, Writing list/detail, and Writing previews. React request
  caching still deduplicates calls inside one render, while the data cache
  removes repeated Supabase round trips across public requests.
- The Supabase performance advisor reported 48 `auth_rls_initplan` warnings.
  Added a reviewed migration that keeps every existing authorization predicate
  but evaluates `auth.uid()` once per statement. The same migration adds only
  three indexes supported by real application queries: authenticated
  Scratchpad chronology, Calculator history chronology, and denomination
  lookup by calculation.
- Validated the full migration against the linked production schema inside an
  explicit transaction and rolled it back. All statements compiled, all three
  indexes existed inside the transaction, and zero unwrapped `auth.uid()`
  policies remained before rollback. A fresh local Supabase replay is still
  blocked by the historical first migration expecting the removed
  `activity_tracker` schema; that pre-existing migration-history repair is
  outside this performance change.
- Applied `20260726050520_optimize_rls_and_hot_queries.sql` to verified project
  `jayantgoyal` (`orwfvyditlguqvxvztkw`) from a disposable linked workdir.
  Migration history matches before/after, all 48 `auth_rls_initplan` advisor
  warnings are cleared, and the three intended indexes are present. Refreshed
  and reviewed the canonical `jg_account`, `jg_app`, and `portfolio` schema
  snapshots; only the first two changed because Portfolio tables were not
  altered.
- Added a native Turbopack performance gate for all four applications. It
  checks whole emitted client output with measured headroom and adds focused
  gzip ceilings for Scratchpad, Calculator history, and the Personal
  Information generator so optional libraries cannot silently return to their
  initial entry sets. The gate performs a fresh Studio production build before
  regenerating analyzer data, ensuring both route manifests and analyzer
  metadata belong to the current source state.
- Reduced Scratchpad API payload and round trips: list/create/update responses
  now select the explicit public entry contract, and the common read-toggle and
  delete paths rely on one ownership-scoped mutation instead of a separate
  ownership lookup followed by a mutation. Missing and inaccessible rows both
  return the same non-enumerating 404 response.
- Collapsed Scratchpad's initial browser-side identity lookup and subsequent
  API fetch into one authenticated API request. The response now carries the
  already-verified user ID needed for the Realtime subscription; the direct
  Supabase fallback performs its own identity lookup only when that API request
  fails.
- Optimized Activity Tracker statistics without changing its response contract:
  the entry and activity reads now run in parallel, select only the columns used
  by the calculation, and aggregate completion counts and unique days in one
  pass instead of filtering every entry again for every activity. Invalid
  months now fail before reaching the database, and an omitted month defaults
  to the current month instead of a fixed historical month.
- Removed TanStack Table from the Personal Information generator. Its table is
  a fixed display without sorting, filtering, grouping, pagination, or
  virtualization, so direct rendering through the existing shared table
  primitives preserves all behavior with a smaller route dependency graph. The
  route's clean-build initial entry set fell from 389.2 KiB to 376.7 KiB gzip
  (12.5 KiB, 3.2%).
- Re-ran the native production analyzer after the completed pass and enforced
  the new budgets successfully: Portfolio 265.4/280.0 KiB, Studio
  511.3/525.0 KiB, Admin 371.0/385.0 KiB, and Auth 309.3/320.0 KiB compressed
  across emitted client assets. The focused initial-route budgets also pass:
  Scratchpad 230.3/250.0 KiB gzip, Calculator history 224.3/245.0 KiB gzip, and
  Personal Information 376.7/400.0 KiB gzip.
- Made `check:bundle-budgets` regenerate the Studio production route manifests
  and all four native Turbopack reports before evaluating limits, preventing
  stale `.next` artifacts from producing a false pass.
- Completed an authenticated localhost interaction benchmark through the
  Agent Browser CLI while Studio continued to use the linked remote Supabase
  project. The same logged-in session, warmed routes, and response-body
  completion timing were used before and after implementation.
- Fixed the protected-request identity handoff between Studio's proxy and route
  handlers. The proxy already removed forged `x-user-id` and `x-user-email`
  headers and verified the session, but it constructed the forwarded request
  before attaching the verified identity. Protected hot APIs therefore called
  Supabase Auth a second time. The proxy now forwards the verified headers
  after authentication, preserves refreshed cookies and auth cache headers,
  and the Activity Tracker, Calculator, and Scratchpad routes reuse that
  identity with a direct-auth fallback for isolated development calls.
- Added regression coverage proving that forged client identity headers are
  replaced with the authenticated identity and that route handlers skip the
  fallback Auth request when the verified proxy header is present.
- Reduced Activity Tracker write work. Activity edits now use one
  ownership-scoped update instead of a read followed by an update. Entry
  writes validate activity ownership and then use the existing
  `(activity_id, date, user_id)` uniqueness contract for one atomic upsert,
  removing the check-then-insert/update race. List responses select only their
  public contracts. Activity deletion is now a supported, ownership-scoped
  operation and cascades through the existing database relationship.
- Parallelized Activity Tracker's initial activity and entry requests. Entry
  checkboxes, activity status switches, creation dialogs, and activity deletion
  now update the interface immediately and roll back only when persistence
  fails.
- Parallelized Calculator history's calculation/count query with its available
  date query, narrowed calculation and denomination response columns, and
  skipped an empty denomination insert. Calculator form reset and history
  deletion are now optimistic; the prior history deletion path could leave the
  same page unchanged because assigning the existing page index did not trigger
  a reload.
- Made Scratchpad creation, read-state changes, and deletion optimistic while
  preserving Realtime deduplication and server reconciliation. The feed now
  exposes the existing ownership-scoped delete operation instead of requiring
  database-side cleanup.
- Warm authenticated read medians improved in the same localhost session:
  Activity list 273.2 ms to 225.6 ms (17.4%), Activity stats 180.3 ms to
  160.6 ms (10.9%), Calculator history 255.2 ms to 222.8 ms (12.7%), and
  Scratchpad 169.8 ms to 154.9 ms (8.8%).
- Five complete create/update/delete cycles produced these post-change write
  medians: Activity create 129.2 ms, status toggle 160.6 ms, entry create
  205.0 ms, entry toggle 181.9 ms, and delete 183.5 ms; Calculator create
  182.3 ms and delete 133.0 ms; Scratchpad create 130.9 ms, read toggle
  124.5 ms, and delete 117.0 ms. Representative warmed comparisons improved
  Activity create from 273.0 ms, Calculator create from 278.3 ms, Calculator
  delete from 188.1 ms, Scratchpad create from 160.9 ms, Scratchpad toggle from
  221.7 ms, and Scratchpad delete from 172.0 ms. One-time development
  compilation samples and transient remote-auth spikes were retained in the
  raw run but excluded from those warmed comparisons.
- Removed every benchmark record after the run and verified that no
  `Codex performance probe` activity, calculation, or Scratchpad entry
  remained.
- Revalidated the changed Studio surfaces through the Agent Browser CLI:
  Activity management rendered its persisted rows and delete control,
  Scratchpad loaded all persisted entries and the new delete controls, and
  Calculator history loaded its persisted rows and controls.
- Re-ran Studio verification after the interaction pass: lint passed with zero
  warnings, type generation and strict TypeScript passed, all 14 Studio test
  files and 38 tests passed, and the production build generated all 155 static
  pages successfully.
- Re-ran the fresh native bundle gate after adding the optimistic interaction
  code. All budgets still pass: Portfolio 265.4/280.0 KiB, Studio
  511.3/525.0 KiB, Admin 371.0/385.0 KiB, Auth 309.3/320.0 KiB; Scratchpad
  230.8/250.0 KiB gzip, Calculator history 224.4/245.0 KiB gzip, and Personal
  Information 376.7/400.0 KiB gzip.
- Completed repository-wide verification after the performance changes:
  `pnpm lint` passed all 11 targets, `pnpm check-types` passed all 11 targets,
  `pnpm test` passed 58 files and 288 tests, `pnpm build` completed production
  builds for Portfolio, Studio, Admin, and Auth, and `git diff --check` passed.

## Remaining measured opportunities

- Studio's whole emitted total does not fall when Prism or jsPDF becomes
  optional because Turbopack still emits those lazy chunks. The route-entry
  budgets verify the user-facing improvement by preventing those chunks from
  returning to initial navigation downloads.
- Median hot-path operations are now within the working sub-250 ms API target,
  and optimistic state removes the network wait from visible interaction
  feedback. Tail latency can still spike when the proxy's remote Auth
  verification slows down; replacing that remaining authorization boundary
  requires the planned asymmetric signing-key rollout or another server-trusted
  session strategy, not bypassing verification in route handlers.
- The production Supabase advisor still reports 65
  `multiple_permissive_policies` warnings. Most are caused by intentional
  public-read and administrator-write policy combinations on very small CMS
  tables. They require a separate authorization-policy redesign, not a
  mechanical merge, because changing them can alter which hidden content an
  administrator may read.
- Admin and Auth are already close to the shared Next.js/React application
  floor in the current graph. No route-local dependency produced a
  measurement-backed removal comparable to the three Studio routes, so this
  pass leaves their behavior unchanged and protects their current totals with
  budgets.
