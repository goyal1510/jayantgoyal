# Admin Portfolio Editorial Redesign

- Date: 2026-07-19
- Areas: Admin, Portfolio, Supabase
- Goal: replace the detached Section Copy and Navigation management concepts with a section-owned CMS model, then redesign the Portfolio Admin as a polished editorial workspace that mirrors the public Portfolio's information order and language.
- Started from current deployed `origin/main` in the protected `codex/admin-portfolio-editorial-redesign` worktree branch.
- The first pass will capture and audit the current Admin Portfolio flow, map every section setting and content editor, and establish a zero-loss migration path before implementation.
- Initial direction: consolidate section copy, visibility, and navigation metadata into one canonical section record; edit that record inside the relevant Hero, About, Skills, Education, Experience, Activity, Work, Credentials, Writing, Contact, Blog, Article, or Resume workspace instead of exposing generic Section Copy and Navigation screens.
- Captured the authenticated production Admin Hero, Section Copy, Navigation, and Projects screens. The audit confirmed that a single public change is split across three unrelated destinations and that the 13-section copy screen is too long to operate as a coherent editing workflow.
- Captured the authenticated production Studio shell in light and dark modes and reviewed its sidebar, header, account, theme, typography, and responsive shell implementation. Studio is now the source of truth for the Admin frame: grouped navigation, warm light palette, neutral dark palette, compact sticky header, top-right theme and account controls, collapsible sidebar behavior, and a quiet utility-only sidebar footer.
- Revised target navigation: Portfolio Overview, Home, About, Skills, Experience, Activity, Work, Writing, and Contact. Education will live within About; credentials within Experience; blog, article, and writing presentation within Writing. Legacy routes will redirect to the owning workspace.
- Completed a broader Studio/Admin shared UI audit in `docs/architecture/studio-admin-shared-ui-audit.md`. The audit keeps Portfolio explicitly isolated and recommends extending the existing `@repo/ui` application shell instead of creating a new package.
- The source comparison found 10 byte-identical Admin/Studio files totaling 1,023 lines. Of those, 891 lines are duplicated Account Settings/MFA code that should be retired through the Auth cutover rather than promoted into shared UI.
- Shared candidates are the configurable shell, recursive navigation presentation, top bar, theme and user menus, command-menu presentation, workspace/page composition, loading/error/empty/confirmation states, common CRUD affordances, and generic Studio-owned UI primitives. Navigation data, permissions, route mapping, search indexes, database logic, feature UI, and all Portfolio presentation remain application-owned.
- Implementation order is now shared foundation first, Admin as the first adopter during its redesign, Studio convergence second, and Auth account-code cleanup only after parity validation.
- Extended the shared-component audit to Portfolio using fresh production captures of the Portfolio home, Studio home, and Admin Hero editor plus a source/dependency comparison. Portfolio has no byte-identical TS/TSX/CSS source component shared with Studio or Admin, confirming that its public visual system is already independent.
- Portfolio's valid shared boundary is non-visual: a canonical Admin/Portfolio CMS row and write contract, the shared brand/platform/SEO packages, and a shared Portfolio/Studio GitHub data engine. Portfolio navigation, project/credential/writing presentation, contact UI, motion, typography, and CSS remain local.
- Found three GitHub statistics implementations plus duplicated Studio/Portfolio API routes totaling roughly 1,170 lines around the same user/repository/language behavior. The target is a React-free `@repo/github` engine with separate Studio and Portfolio views.
- Found six identical favicon/PWA files copied into each of Portfolio, Studio, and Admin (18 files total), plus repeated metadata arrays. `@repo/brand` should become the canonical asset/metadata source with a static sync check for independently deployed apps.
- Portfolio imports `@repo/ui` only for generic error and 404 buttons and declares unused `next-themes`, `sonner`, and `simple-icons` dependencies. The cleanup should introduce local editorial fallback states, remove those unused dependencies, and leave the public Portfolio appearance otherwise unchanged.
- Created the execution-ready phase plan in `docs/plan/2026-07-19-shared-platform-admin-redesign-implementation-plan.md`. It separates the work into baseline, canonical Portfolio contracts, shared Studio/Admin UI, Admin shell/IA, section-owned workspaces, editorial interaction quality, Studio convergence, GitHub consolidation, cleanup, and validation/release phases with explicit gates and checklists.
- Finalized the database/UI boundary for the plan: retain the already audited and hardened `section_content` and `nav_items` tables, but remove them as standalone Admin concepts. Each section-owned workspace will load and save its relevant section copy/navigation records alongside the primary content. No table merge or new generic `sections` table is planned.
- Release sequence is deliberately incremental: Release 1 establishes contracts and the Admin shell without changing CMS behavior; Release 2 delivers the editorial CMS and round-trip verification; Release 3 converges Studio and performs GitHub/Auth/brand/Portfolio cleanup.
- Baseline validation completed before implementation: the worktree branch is aligned with `origin/main`, `pnpm lint` passed, `pnpm check-types` passed, and `pnpm test` passed with 35 files and 198 tests.
- Added the first behavior-preserving implementation slice: `packages/portfolio-data` now owns canonical Portfolio section keys, workspace routing, CMS row/write types, select-column contracts, blog types, and defensive JSON guards. Added focused guard tests and included the package in the root Vitest include list. No database migration or Portfolio visual change was made in this slice.
- Registered `@repo/portfolio-data` in the workspace lockfile and added its package lint configuration. Admin Portfolio types now alias the shared CMS records while retaining Admin-only account and deployment types. Portfolio editorial and Blog queries now consume shared row types, JSON guards, and select-column constants; the public editorial view models remain Portfolio-owned.
- Added the explicit workspace dependency to both `apps/admin` and `apps/portfolio`; the first post-adoption check exposed that omission before any UI work, so the package remains a real dependency rather than an unresolved source import.
- After provisioning the workspace links, lint and the full test suite are green again. The remaining type-check failure is isolated to Supabase's dynamic select result inference; the query boundary now uses one explicit `castData` helper so the shared row contracts remain visible and all assertions are intentional.
- Tightened the legacy navigation editor's empty form default to a valid canonical section key (`about`) after the shared contract correctly rejected the old empty-string sentinel. This editor only updates existing navigation rows, so the default is never persisted as a new record.
- Started the shared application foundation: `@repo/ui/application-shell` now exposes an `ApplicationShell` frame that owns SidebarProvider/SidebarInset composition without owning app navigation or permissions. Admin adopted it for the first pass; its navigation is now editorial and workspace-based (Overview, About, Skills, Experience, Activity, Work, Writing, Contact), while Section Copy and Navigation remain reachable only as redirecting legacy routes. Added the first Activity integration workspace and canonical Work/Writing/Home route adapters.
- Added the first Admin overview surface: it summarizes CMS readiness, points to section-owned workspaces, documents the derived GitHub activity boundary, and provides a live Portfolio handoff. Legacy project/blog/hero paths still resolve to the right workspace context for active navigation and breadcrumbs.
- Updated the Admin navigation regression test to assert the new Writing workspace contract while preserving the `/blog` legacy alias behavior.
- The overview's identity summary now crosses Supabase's dynamic select boundary through the shared Hero public-row contract, keeping the page type-safe without coupling the shared package to a client.
- Added the section-owned presentation panel and server loader. Hero, About, Skills, Experience, Work, and Contact now edit their `section_content` copy and any matching `nav_items` record in the same workspace as the primary content. This removes the need to visit the retired global copy/navigation destinations.
- Writing now uses the same section-owned presentation panel above the Blog list, so the public Writing framing and its article records are edited together.
- Folded Education into the About workspace and Certificates into Experience. Their legacy routes remain available for bookmarked links, but the primary Admin IA now follows the public story instead of exposing a flat table inventory.
- Studio now consumes the same shared `ApplicationShell` frame as Admin. Its existing sidebar, top bar, auth gate, command palette, and spacing remain app-owned; only the provider/inset composition moved behind the shared contract.
- Added exhaustive registry coverage to the shared package tests: all 11 active Portfolio tables are unique, every section key has an owning workspace, and every workspace route is represented.
- Kept the registry test imports module-local (`sections` and `portfolio`) to avoid introducing a package-index cycle into the guard test.
- Corrected the registry test import split so `PORTFOLIO_TABLES` comes only from `portfolio.ts`; the package test is back to a valid compile boundary.
- Final Admin production build passed after the section-owned workspace wiring. Agent-browser validation reached the protected Admin welcome/auth boundary at `http://localhost:3002/portfolio`; an authenticated session is not available in this environment, so the private editor interaction itself remains a credential-gated manual check.
- Activity now loads its canonical GitHub username from the Hero record and owns its `section_content.activity`/`nav_items.activity` presentation panel, without inventing repository or contribution counts.
- Re-ran the Admin production build after Activity integration; it passed with all new workspace routes present. The local Admin dev server was stopped after the agent-browser auth-boundary check.
- Replaced the Admin API helper's duplicate Portfolio table union with `PortfolioTable` from `@repo/portfolio-data`; form call sites remain behavior-compatible while the endpoint surface now follows the canonical registry.
- Promoted Home, Work, and Writing to real canonical workspace routes. Hero, Projects, and Blog are now explicit legacy redirects, so the sidebar destinations no longer bounce through a second database-table route.
- Added shared blog publication-state rules (draft/hidden/published plus timestamp-based public eligibility), visible save feedback and refresh behavior to section presentation panels, and a dedicated Activity source editor that validates and persists the canonical Hero GitHub username.
- Added full, non-cropped project screenshot previews and missing-alt warnings in the Work editor, replaced Work/Writing browser confirmations with the shared accessible confirmation dialog, and introduced reusable `ApplicationTopbar`, `StatusBadge`, `VisibilityBadge`, and `ConfirmationDialog` primitives in `@repo/ui`.
- Replaced browser confirmation prompts in the About education, Experience, and credentials collection editors with the same accessible confirmation flow; destructive CMS actions no longer depend on `window.confirm` in the primary editorial workspaces.
- Extended the confirmation flow to category and skill deletion, including the guard that prevents removing non-empty skill categories.
- Replaced the remaining Admin browser confirmation for removing user access with the shared accessible confirmation dialog; all current Admin destructive flows now use the same interaction contract.
- Corrected the Admin section-workspace loader to include row identifiers and timestamps for `section_content` and `nav_items`; section-owned saves now update the existing CMS rows instead of silently falling back to create behavior, and the panel shows the last persisted update time.
- Added a canonical CMS blog select contract, switched the Writing workspace off `select("*")`, and added direct public preview links for posts that satisfy the shared published/visible/timestamp rule.
- Expanded the Admin overview into a CMS health surface: it now reports hidden presentation/navigation records, draft/hidden writing, and missing project screenshot descriptions from live database rows instead of only showing coarse area counts.
- Moved Admin account controls from the sidebar footer into the shared Studio-style top-right shell: `ApplicationUserMenu` owns neutral presentation while Admin retains auth, settings, and logout ownership.
- Fixed the shared top-right user-menu lint gate after the first shell validation pass; no behavior change.
- Re-ran the local Admin browser smoke check with `agent-browser`: `/portfolio` correctly reaches the protected `/welcome?redirect=%2Fportfolio` boundary, and no authenticated Admin session is available in this environment for private editor interaction.
- Corrected the new Admin top-right account control to retain the existing Sheet root around account settings, preserving the Studio interaction contract rather than rendering orphaned Sheet content.
- Final validation for this implementation slice is green: `pnpm check-types`, `pnpm lint`, `pnpm test` (36 files / 203 tests), `pnpm build --filter admin`, `pnpm build --filter portfolio`, `pnpm build --filter studio`, and `git diff --check`; Admin browser smoke remains correctly auth-gated under `agent-browser`.
- Tightened the shared publication rule so a post is labeled Published only when its visibility flag, publication flag, and publication timestamp all agree; invalid legacy rows remain Draft until the CMS repairs them.
- Added an explicit accessible label to the compact shared account trigger so the top-right control remains understandable in the mobile/collapsed shell.
- Replaced the Admin Portfolio and Blog mutation helpers' arbitrary generic `Partial<T>` payloads with table-keyed canonical write inputs and record responses; all current editors now infer their payload contract from the table they mutate.
- Added an Admin command palette using the same shared command primitives and keyboard contract as Studio, while keeping Admin's role-filtered destination index local.
- Added canonical full-row Admin select contracts and replaced the canonical Home/About/Skills/Experience/Work/Contact loaders' `select("*")` calls; generated IDs/timestamps now cross the boundary intentionally for editor state and last-updated feedback.
- Added direct public section links to every section-owned presentation panel, using the actual Portfolio anchors and public blog/resume routes.
- Routed those public links through `@repo/brand`'s canonical Portfolio origin rather than duplicating the domain in Admin UI code.
- Expanded the live CMS health overview to report missing project images, alt text, links, and summaries, plus the latest section update timestamps; it no longer relies on coarse area counts alone.
- Added an explicit typed cast for overview section/navigation health rows, keeping runtime Supabase selects behind the same intentional boundary as the workspace loaders.
- Added one explicit `castPortfolioRecord` boundary for Supabase dynamic select inference in Admin workspace loaders, keeping the editor props strongly typed without pretending the client can infer schema-specific rows from runtime table names.
- Removed the now-unused public-select import from the Admin workspace loader after switching it fully to the CMS select contract.
- Extended `@repo/ui/application-shell` with a recursive `ApplicationNavigationTree` that supports the current flat Admin/Studio adapters and future nested navigation without moving route ownership or permissions into the shared package.
- Promoted Studio onto the shared `ApplicationTopbar` while injecting its existing mobile-only sidebar control through a slot; Studio keeps its custom collapse behavior without retaining a duplicate top-bar frame.
- Fixed the shared navigation tree's breadcrumb icon import after its first type-check pass; no behavioral change.
- Added the React-free `@repo/github` package with shared GitHub response types, pagination, case-insensitive caching, token-safe requests, typed rate-limit/not-found errors, active-repository filtering, language/LOC aggregation, and focused client/compute tests. Portfolio and Studio are now the next migration targets while their contribution-map, profile, chart, table, and editorial presentation components remain app-owned.
- Corrected the new package's test matcher typing and added its explicit Node type dependency for the server-only environment boundary.
- Cleared the package lint warning from an unused test-only error import; the shared package now passes its type and lint gates.
- Migrated Portfolio's server-rendered GitHub LOC stats and its one-hour `/api/github-loc` fallback to `@repo/github/server`, switched UI contracts to the shared types, and removed the unused Portfolio GitHub proxy plus duplicate local fetch/compute/type files. Portfolio's contribution calendar and editorial stats presentation remain local.
- Migrated Studio's GitHub dashboard data layer and both API routes to the shared client/server engine, kept Studio's profile/cards/charts/table components local, and removed the duplicated Studio `lib/github-stats` implementation. The shared proxy route now owns path validation and server token handling.
- Preserved Portfolio's previous outage behavior by keeping server-rendered GitHub failures non-fatal (the editorial section receives `null` and renders its existing unavailable state), while the fallback API still returns an explicit error response.
- Phase 7's shared GitHub engine checklist is complete: 205 tests pass, both migrated app builds pass, and the route shapes remain unchanged.
- Added shared `WorkspaceHeader`, `ThemeMenu`, `PageToolbar`, `EmptyState`, and `ApplicationErrorState` primitives to `@repo/ui`; Admin and Studio now use one accessible light/dark/system menu and Studio's feature workspaces use the shared header presentation. Removed the duplicate Studio workspace header and app-local theme toggles.
- Completed the Studio header migration across Activity Tracker and Custom Calculator routes and fixed the final GitHub dashboard closing tag; no feature route retains the removed local workspace-header import.
- Added the public-syntax Markdown preview to the Admin Writing editor using the same `react-markdown`/GFM renderer family as Portfolio, so authors can inspect headings, links, lists, code, tables, and images before publishing.
- Kept Portfolio visually independent by replacing its two generic error/404 Button usages with a local editorial button, removing its unused `@repo/ui`, `next-themes`, and `simple-icons` dependencies, and dropping the UI package from its Next transpilation list.
- Removed the final unused Portfolio `sonner` dependency after the import audit confirmed no public surface uses it.
- Added `@repo/brand` asset-path constants and a deterministic `pnpm check:brand-assets` hash check. Portfolio remains the canonical source copy for the six shared favicon/PWA files; Studio and Admin are verified deploy-time copies so independent app builds cannot drift silently.
- Added the shared tooltip-backed `IconAction` primitive; the next migration applies it to the highest-traffic Admin editorial collection actions so icon-only controls have accessible names and hover guidance.
- Replaced Contact's free-text social icon field with the canonical shared icon option list, added URL/label semantics, and gave social removal an accessible tooltip action. Public social rendering still resolves the same stored keys.
- Corrected Contact's new `IconAction` to use the shared self-closing action contract; no change to the public field shape.
- Added the explicit `PortfolioBlogUpdateInput` contract for partial blog updates and moved legacy Education/Certificates loaders off `select("*")` onto the canonical Admin column contracts with surfaced query errors.
- Tightened Activity to the canonical Hero Admin select contract and added a field-level Contact validation guard for incomplete social links before any mutation is sent.
- Extended tooltip-backed `IconAction` coverage to the About education and Experience timeline collection rows so their visibility, edit, and delete controls follow the same accessible interaction contract.
- Wired the canonical `@repo/brand` favicon/PWA paths into the remaining Studio and Portfolio manifests plus Studio JSON-LD so metadata no longer repeats asset literals; the hash check still guards each deployed copy.
- Completed release-level validation after the latest shared-shell, Markdown-preview, brand, and CMS contract changes: fresh Portfolio, Studio, and Admin production builds pass; `pnpm check:brand-assets`, `pnpm lint`, `pnpm check-types`, `pnpm test` (37 files / 205 tests), and `git diff --check` pass. Agent-browser confirmed the public Portfolio home/blog detail/mobile navigation, the Studio home shell, and the expected unauthenticated Admin `/welcome?redirect=%2Fportfolio` boundary. No database migration was introduced or applied for this application/UI consolidation slice; canonical migration and schema snapshot files remain present.
- Re-ran `pnpm install --offline` across all 15 workspace projects after the final dependency changes; the lockfile is synchronized and the install completes without network access.
- Tightened the Admin Portfolio API boundary with runtime validation from `@repo/portfolio-data`: create and update payload types are now distinct, generated/unknown fields and empty updates are rejected, required CMS fields are checked before the service-role write, and API reads use the canonical full-row select registry instead of `select("*")`. Added focused guard coverage for these failures.
- Applied the same canonical runtime boundary to Writing: blog create/update payloads now reject generated or unknown fields, invalid slugs, empty updates, and publish states without content/timestamps; the Admin `jg_app` route uses the canonical CMS select contract for reads and mutation responses.
- Deduplicated the blog publish validation message so an empty new post reports one actionable content error instead of repeating the same missing field under two database constraints.
- Updated the focused Portfolio-data guard expectation to match the deduplicated publish error contract.
- Added a dedicated canonical public Blog detail select contract and removed the last Portfolio blog `select("*")`; list and article queries now each request only the fields their public view models consume.
- Added separate shared public Blog list/detail row types so Portfolio no longer casts a list response to the full CMS row shape; publication flags stay server-side query predicates while article content is required only for detail pages.
- Converged Studio's top-right user-menu presentation onto the shared `@repo/ui/application-user-menu`; Studio still owns its account sheet, legacy/auth owner switch, user loading, and sign-out behavior, but Admin and Studio now present the same account control.
- Added `@repo/ui/application-surface.css` as the shared Studio/Admin light/dark surface token layer with common sidebar variables and focus treatment. Admin and Studio now import it through their own global CSS while Portfolio remains outside the product-app surface boundary.
- Added a single Admin-owned Portfolio public revalidation contract and invoked it after successful Portfolio and Blog writes. Mutation responses now use canonical full-row selects, and dynamic Blog detail pages are invalidated by pattern so CMS edits do not depend on a manual deployment or client-only refresh.
- Added `pnpm check:architecture`, a repository boundary check that prevents shared packages from importing application source and prevents the independent Portfolio app from importing the Studio/Admin shell or surface stylesheet.
- Recorded the verified contract and stylesheet gates in the implementation checklist: role/API ownership remains Admin-owned, shared surface tokens are imported only by Studio/Admin, Portfolio stays independent, and successful CMS writes revalidate the affected public routes.
- Final validation after the public Blog list/detail split and CMS revalidation changes is green: Portfolio production build, Admin production build, Studio production build, `pnpm check-types`, `pnpm lint`, `pnpm test` (38 files / 207 tests), `pnpm check:brand-assets`, `pnpm check:architecture`, and `git diff --check` all pass. Agent-browser verified Portfolio home, Blog detail, mobile navigation open/close behavior, and the expected unauthenticated Admin welcome boundary; no production CMS write or migration was attempted.
- Added dirty-state protection and field-level save guards to the shared Admin section presentation panel. Long editorial forms now warn before browser unload, require an eyebrow and navigation label where applicable, and announce saved/error states accessibly before any cross-record mutation begins.
- Extended the React-free Portfolio contract with canonical public-URL validation for resume, project, credential, Blog cover, and nested social-link writes. Malformed `javascript:` or non-web values now fail before the Admin service-role boundary, with focused guard coverage.
- Kept the new Blog validator import at the package module boundary so the shared contract remains lint-clean and dependency direction stays explicit.
- Added compensating rollback to the section presentation save flow: if the navigation write fails after copy succeeds, an existing copy is restored or a newly-created copy is removed, and any rollback failure is surfaced explicitly instead of presenting a false success.
- Added one Admin-owned Portfolio workspace header configuration using the shared `WorkspaceHeader`; Home, About, Skills, Experience, Activity, Work, Writing, and Contact now explain their public outcome before showing editors.
- Moved Studio's generic Checkbox, Context Menu, Progress, Scroll Area, and Table primitives into `@repo/ui`, added their Radix dependencies, migrated all consumers, and removed the duplicate Studio copies. Studio-specific animation primitives remain local.
- Aligned Admin with Studio's shared surface typography by loading Manrope and IBM Plex Mono through the Admin root layout and assigning those semantic roles in the shared product stylesheet.
- Tightened public-path validation to reject protocol-relative `//host` values, keeping same-site asset paths safe from accidental external host resolution.
- Documented the Contact workspace's operational boundary in the editor: public form delivery remains server-side through Resend, while Admin edits only the displayed contact details and social links.
- Added semantic write guards for GitHub usernames, project slugs, contact email, and non-negative integer display order; focused tests now cover these bypass-resistant CMS invariants.
- Kept required-field errors distinct from semantic format errors so an empty create payload returns one actionable message per missing field.
- Removed unused Studio-only logo slider and flip-text animation CSS from Admin; feature animation styles now remain with Studio instead of leaking into the shared Admin stylesheet.
- Updated the plan checklist for the verified CMS parity and shared primitive work; remaining unchecked items are now limited to authenticated/production gates, deeper Studio navigation convergence, and explicitly deferred Auth/atomic-ordering work.
- Completed the final agent-browser Studio shell smoke pass: at a 390px viewport the shared shell rendered without horizontal overflow, exposed an accessible Open sidebar control, opened the mobile navigation dialog, retained the Home destination, and kept the light/dark/system theme menu functional. The test reset the viewport and finalized the browser session; the local Studio server was stopped. Account initialization still logs the expected missing-Supabase-environment error in this credential-free local run.
- Marked the Home workspace field coverage and canonical public URL/image validation checklist items complete after auditing `hero-form.tsx`, the shared Portfolio write guards, and their focused tests. Authenticated CMS round trips, Admin private mobile states, atomic reorder, and production deployment remain intentionally open gates.
- Added and tested a Studio-owned adapter from the existing hub configuration into the shared recursive navigation contract. It preserves the active product, nested destination, external-link semantics, and current Studio route ownership without changing the richer `NavApps`/TechTools presentation yet.
- Updated the implementation plan status from Proposed to In progress so the checklist reflects the actual staged build rather than a future-only design document.
- Removed the now-unused direct Radix primitive dependencies from Studio after confirming every consumer imports the shared `@repo/ui` components; the primitives and their runtime dependencies now have one package owner.
- Final post-adapter validation is green: `pnpm install --offline`, repository-wide `pnpm check-types`, `pnpm lint`, `pnpm test` (39 files / 209 tests), `pnpm check:architecture`, `pnpm check:brand-assets`, and `git diff --check` all pass.
- Added typed Admin workspace loaders for Home, About, Skills, Experience, Activity, Work, Writing, and Contact. Each loader fetches its owning content records and section presentation/navigation together, applies canonical select contracts, preserves public ordering, and surfaces query failures before rendering. The section pages now consume these loaders instead of duplicating Supabase queries.
- Added a reusable Admin unsaved-change guard and wired it into the long Home, About, and Contact singleton forms alongside the existing section-presentation guard. Successful saves reset each form's snapshot so the browser warning only appears for edits that could actually be lost.
- Renamed the Admin operational navigation group from “System” to “Platform” so the shell matches the approved Portfolio / Studio / Platform information architecture while retaining the existing role and route ownership.
- Replaced the section presentation panel’s two generic table writes with a typed `/api/portfolio/section-presentation` action. The shared `@repo/portfolio-data` contract now validates copy/navigation together, the Admin route returns field errors, revalidates public content, and compensatingly rolls back the copy when the navigation write fails; no schema or migration change was required.
- Tightened the new section-presentation route’s Supabase row boundary with canonical Portfolio record casts after the Admin type check identified dynamic-select inference as the only issue; the focused contract tests still pass.
- Added the final saved-copy cast for the compensating delete path; the focused Admin type check is now clean for the new route.
- Revalidated the complete repository after the typed save action: `pnpm check-types`, `pnpm lint`, `pnpm test` (39 files / 210 tests), Portfolio and Studio production builds, `pnpm check:architecture`, `pnpm check:brand-assets`, and `git diff --check` all pass. `agent-browser` confirmed `/portfolio/home` remains protected by the existing Admin welcome boundary; the local Admin server and browser session were stopped/finalized afterward.
- Normalized formatting for the new Portfolio presentation contract/action, section panel, guard tests, and implementation checklist; this was mechanical only and did not change the behavior or schema.
- Extracted the shared command-palette presentation into `@repo/ui/application-command-palette`. Admin and Studio now provide only app-owned search groups while the shared component owns Cmd/Ctrl+K, trigger styling, dialog semantics, keyboard selection, route navigation, external-link handling, and mobile-sidebar closing.
- Agent-browser verified the Admin auth boundary at `/portfolio`: unauthenticated requests redirect to `/welcome?redirect=%2Fportfolio`; the public sign-in surface renders at desktop and 390px mobile widths with two inputs, Sign In/Google actions, and no horizontal overflow. No authenticated CMS session was available, so private workspace interaction remains a gated manual check.
- Completed the shared command-palette browser pass against the Studio dev server: desktop rendered at the expected shell width, and at 390px the sidebar exposed an accessible Open sidebar control, opened the mobile navigation dialog without horizontal overflow, and the shared Search Studio trigger opened the app-owned Studio, Products, Workspaces, and Game Hub groups. The shared Choose theme control opened one keyboard-addressable menu with Light, Dark, and System choices while preserving a 390px scroll width. The browser viewport was reset and the session finalized.
- Re-ran the repository validation for this slice: `pnpm check-types`, `pnpm lint`, `pnpm test` (39 files / 210 tests), `pnpm --filter admin build`, `pnpm --filter portfolio build`, `pnpm --filter studio build`, and `git diff --check` pass. The temporary Studio server was stopped after browser validation; its credential-free local run still logs the expected missing Supabase environment warning for `/api/account/init`. Authenticated Admin workspaces, collapsed tooltip behavior, and release/reference parity remain open gates.
- Moved Studio's command-palette index into a dedicated app-owned configuration module and added focused tests for its Studio/Products/Workspaces/Game Hub/Tech Tools coverage and explicit external destinations. The shared `@repo/ui` palette remains presentation-only.
- The first lint pass after that extraction caught one unused shared-group type import in the thin Studio adapter; removed it before the final validation rerun.
- Final validation after the command-index extraction is green: repository `pnpm lint`, `pnpm check-types`, `pnpm test` (40 files / 212 tests), `pnpm --filter studio build`, and `git diff --check` all pass.
- Moved the identical branded CircularLoader implementation into `@repo/ui/circular-loader`. Admin's root loading boundary and Studio's root, Welcome, and Loader Preview routes now import the shared component; the two app-local copies were removed without changing the animation or layout contract.
- Validation after the loader consolidation is green: repository lint, typecheck, and tests (40 files / 212 tests), Admin production build, Studio production build, and `git diff --check` all pass. The first Admin build attempt hit a transient Google Fonts fetch failure; the immediate retry succeeded without source changes.
- Extracted the duplicated Admin/Studio full-page and global error presentation into `@repo/ui/application-error-screen`. The four Next.js error boundaries are now thin app-owned wrappers that inject only their reset/home behavior; Portfolio remains outside the shared product surface.
- Completed the Admin browser smoke check after the shared loader/error changes: `/portfolio` still redirects unauthenticated users to `/welcome?redirect=%2Fportfolio`; the 390px sign-in surface exposes two inputs and the expected Sign In/Google actions with a 390px document width. The browser session was finalized and the temporary Admin server stopped.
- Final validation after the shared error extraction is green: repository lint, typecheck, tests (40 files / 212 tests), Admin production build, Studio production build, and `git diff --check` pass.
- Audited the section-owned workspace parity and replaced the legacy standalone Hero, Projects, Education, Certificates, Blog, Section Copy, and Navigation page implementations with compatibility redirects to Home, Work, About, Experience, Writing, or the Portfolio overview. Existing bookmarked URLs remain valid while normal editing has one canonical workspace owner.
- Centralized Admin's legacy Portfolio URL ownership in a typed compatibility
  route map. Root and 404 links now land on the canonical Portfolio overview,
  every retired editor redirects through the same map, and navigation context
  resolves legacy Education/Certificates/Blog paths to their owning workspace.
  Added focused tests so future workspace renames cannot leave redirects and
  active-route highlighting out of sync.
- Corrected the Portfolio overview to represent all eight canonical editing
  workspaces, including Home and Activity. The readiness summary now derives
  Home from the hero record and Activity from the configured GitHub username,
  so the overview no longer undercounts the CMS or implies that live activity
  is an independent hardcoded content area.
- Validated this route/overview slice with repository checks: `pnpm check-types`,
  `pnpm lint`, `pnpm test` (40 files / 214 tests), `pnpm check:architecture`,
  `pnpm check:brand-assets`, all three Portfolio/Admin/Studio production builds,
  and `git diff --check` pass. Agent-browser confirmed the Admin route still
  resolves through the existing unauthenticated `/welcome?redirect=%2Fportfolio`
  boundary at the local server; authenticated workspace interaction remains a
  deliberate follow-up gate because no test account was available. The local
  server and browser session were stopped/finalized afterward.
- Removed the orphaned standalone Navigation and Section Copy editor
  implementations after import analysis confirmed that the section-owned
  workspaces no longer render them. Their compatibility page routes remain as
  redirects, and the normalized `nav_items`/`section_content` records are
  still edited through the owning workspace panels.
- Updated the implementation checklist to record that Section Copy and
  Navigation are no longer required for ordinary editing; compatibility routes
  remain intentionally available for old bookmarks.
- Re-ran the repository test suite after deleting those orphaned editors:
  40 test files and 214 tests pass, with `git diff --check` clean.
- Added a shared `prefers-reduced-motion` policy to the Studio/Admin product
  surface stylesheet. It disables long transitions and animations while
  preserving the Portfolio app's independent CSS and motion behavior.
- Validation after the shared motion policy remains green: repository lint,
  typecheck, tests (40 files / 214 tests), Admin and Studio production builds,
  and `git diff --check` all pass.
- Added `pnpm check:service-role`, a repository boundary check that rejects
  service-role credential access from client modules and from Portfolio. The
  current Admin/Studio server ownership passes the new guard.
- The full follow-up validation passes: `pnpm check:service-role`, repository
  lint, typecheck, tests (40 files / 214 tests), and `git diff --check`.
- Agent-browser smoke-tested the current Studio shell at desktop and 390px:
  the shared navigation rendered, the mobile Open sidebar control opened the
  Sidebar dialog, and the document stayed at 390px without horizontal
  overflow. The local credential-free run still logs the expected missing
  Supabase environment warning from `/api/account/init`; the server and
  browser session were stopped/finalized afterward.
- Closed the remaining CMS ownership gap: About now loads/edits both About and
  Education presentation rows, Experience owns Experience and Credentials,
  and Writing owns Writing, Blog-list, and Article-detail presentation. The
  normalized records remain separate in Supabase, but every row now has one
  visible Admin owner and no detached editor is required.
- The secondary-presentation slice passes Admin typecheck, lint, focused route
  tests, production build, and `git diff --check`.
- Extended the same ownership coverage to Resume: Home now loads and edits the
  `section_content.resume` row beside the hero and resume source fields. All
  13 canonical `section_content` keys now have an owning Admin workspace.
- Revalidated the complete secondary/Resume ownership slice: Admin typecheck,
  lint, full tests (40 files / 214 tests), production build, and `git diff --check`
  pass.
- The ownership matrix now covers both normalized presentation tables: every
  `section_content` key and every public `nav_items` section has one canonical
  Admin owner, with legacy URLs retained only as compatibility redirects.
- Extended the shared Portfolio contract regression test to assert all 13
  section-content keys and all public navigation keys remain represented by the
  canonical ownership registry.
- Final validation after the ownership-contract assertion is green: 40 test
  files / 214 tests, architecture boundaries, brand assets, service-role
  boundaries, and `git diff --check` all pass.
- Standardized the Skills workspace's remaining icon-only category and skill
  actions on `IconAction`, added explicit expand/collapse labels, and replaced
  bespoke hidden text with the shared `VisibilityBadge`.
- Extended the same presentation contract to Education, Experience, Projects,
  Certificates, and Writing states. Published, draft, hidden, and visible
  statuses now use the shared badge primitives instead of per-screen markup.
- Revalidated the shared-status slice: Admin typecheck, lint, full tests (40
  files / 214 tests), production build, and `git diff --check` pass.
- Recorded the existing Auth entry integration in the checklist: Admin and
  Studio route account security and logout through `@repo/auth` when Auth owns
  the flow, while preserving legacy local settings until parity validation.
- Built the Auth application successfully and agent-browser verified its login
  surface at desktop and 390px with email/password, Google, recovery, and
  registration actions present without horizontal overflow. The security and
  logout routes correctly resolve to the Auth configuration error in this
  credential-free environment rather than silently rendering a broken private
  screen; authenticated parity remains gated on configured Supabase access.
- Reconciled the implementation checklist with the completed architecture
  boundaries: Portfolio remains outside the Studio/Admin surface, shared
  packages stay app-free, Admin/Portfolio use the React-free contract, GitHub
  uses one shared engine, and remote migration work remains governed by the
  reviewed migration workflow. No source behavior changed in this documentation
  update.
- Centralized server-only Supabase service-role client construction in
  `@repo/auth/service-role`. Admin Portfolio, account, and user routes plus
  Studio game/auth/account routes now use the shared factory; app-owned
  authorization and route behavior remain unchanged. The Admin MFA cleanup now
  uses the typed Supabase Auth admin API instead of duplicating raw REST
  credential handling. `@repo/auth` typecheck/lint, Admin and Studio
  typecheck/lint/builds, Auth build, 41 test files/216 tests, architecture,
  brand-asset, service-role, and diff checks all pass.
- Standardized remaining Admin platform and editorial icon actions on the
  tooltip-backed `IconAction` contract, including user removal, deployment
  redeploy/rollback, and repeated About/Experience form rows. External
  deployment links now expose explicit accessible names. `IconAction` now
  merges caller classes so alignment utilities remain effective; validation is
  pending for this small UI-only slice; the first lint pass identified and
  removed one now-unused Button import from the user table.
- The icon-action slice is validated: Admin/Studio typecheck and lint pass,
  the full suite remains 41 files/216 tests, the Admin production build passes,
  and architecture, service-role, brand-asset, and diff checks remain green.
- Final repository validation after the shared service-role and icon-action
  changes is green: Portfolio production build, repository lint and typecheck,
  41 test files/216 tests, service-role/architecture/brand checks, and
  `git diff --check` all pass. Portfolio remains outside the product surface;
  no migration, production write, commit, push, or deployment was performed.
- Audited the Studio shell for superseded local frames after the shared
  ApplicationShell/ApplicationTopbar convergence. `StudioApplicationHeader`
  had zero consumers (all protected routes use the shared top bar), so the
  orphaned file was removed; Studio's app-owned sidebar navigation, nested
  flyouts, Terms utility, and topbar account adapter remain intact.
- Refactored Studio's sidebar to consume `ApplicationSidebarFrame` directly,
  adding narrow header/content/footer styling slots so its grouped navigation
  and Terms utility retain their existing presentation. Admin and Studio now
  share the complete frame and collapse/expand behavior, while navigation and
  permissions remain app-owned.
- Preserved the caller-provided Studio `collapsible` mode while moving the
  frame ownership into the shared component; the focused lint pass caught this
  forwarding omission before validation continued.
- Browser validation showed that a hover-only collapsed-brand overlay made the
  expand affordance unreliable for keyboard and automated interaction. The
  shared collapsed control is now always visible and pointer-active, so the
  collapsed icon is unambiguously the expand button in both Studio and Admin.
- The responsive browser pass also exposed a hydration mismatch caused by the
  sidebar reading `window.innerWidth` directly during render in addition to the
  hydration-safe `useIsMobile` snapshot. Removed that second render-time branch;
  mobile mode now comes from the subscribed hook after hydration, while the
  click handler still reads the live media query for immediate toggles.
- Re-ran the in-app browser audit after the responsive fix: desktop collapse,
  always-visible collapsed-brand expand, and restore all work; mobile exposes
  only the outside Toggle Sidebar control, opens the Studio navigation sheet,
  and preserves Discover/Terms content. Browser console errors were empty at
  both viewport sizes; the credential-free `/api/account/init` 500 remains the
  expected local environment warning.
- Final repository validation after the shared-frame/responsive fix is green:
  repository type-check and lint, 49 test files/251 tests, architecture,
  brand-asset, service-role, Studio/Admin production builds, and diff checks.
  The slice was committed as `82d1b1f` and pushed directly to `main`; Vercel
  reports Admin, Studio, Portfolio, and Auth deployments pending for that
  commit.
- Tightened `pnpm check:service-role` so client modules are also rejected when
  they import the shared `@repo/auth/service-role` entry directly. This keeps
  the new central factory server-only by policy, not only by convention.
- Reconciled the release-milestone checklist with verified implementation:
  canonical contracts, shared shell, Admin shell adoption, section-owned CMS,
  overview health signals, GitHub consolidation, brand cleanup, Portfolio
  fallback/dependency cleanup, content ownership, and architectural boundaries
  are now marked complete. Auth cutover, authenticated CMS round trips,
  browser/accessibility parity, production release, and public visual
  regression proof remain intentionally open.
- Agent-browser smoke-tested the Admin auth boundary after the latest changes:
  `/portfolio` resolves to the existing `/welcome` sign-in surface, and at a
  390px viewport the email/password fields and Sign In action render with no
  horizontal overflow. The viewport was reset, browser tabs finalized, and
  the temporary Admin server stopped. Private hamburger/sidebar behavior still
  needs a configured authenticated session.
- Performed a read-only audit against the linked Supabase project
  `orwfvyditlguqvxvztkw`: all 12 active content tables respond with the
  canonical columns, 13 `section_content` keys and six public `nav_items` are
  present, and the current content counts are Hero/About/Contact singletons,
  3 education rows, 4 experience rows, 5 skill categories, 30 skills, 9
  projects, 5 certificates, and 3 published visible Blog posts. The linked
  migration check reports 34 matching local/remote entries; no migration or
  content write was performed.
- The same read-only audit confirms the live Hero row currently supplies
  `name = Jayant Goyal`, `display_name = Jayant`, `role = Full-stack product
  engineer`, and `github_username = goyal1510`; those values are database-backed
  rather than portfolio-only literals.
- Added missing programmatic label associations to repeated About personal
  fields, Project technology input, and Experience accomplishment inputs. This
  improves keyboard and screen-reader navigation without changing stored data
  or form behavior; each repeated accomplishment now has its own visually hidden
  label.
- The form-label slice passes Admin typecheck, Admin lint, the full 41-file/216
  test suite, the Admin production build, and `git diff --check`.
- Added the shared `@repo/ui/form-message` live-region primitive and applied it
  to the section presentation editor. Required eyebrow/navigation failures now
  attach to the exact field through `aria-invalid`/`aria-describedby`, while
  save failures remain visible inline as well as in the toast. The Blog dialog
  now uses the shared tooltip-backed `IconAction` for slug generation and gives
  each tag-removal control an explicit accessible name. Validation is pending
  for this accessibility slice.
- Validated the form-feedback slice with Admin typecheck/lint, the full 41-file
  / 216-test suite, the Admin production build, and `git diff --check`; all
  passed. This closes the slice without changing stored content or making any
  remote writes.
- Extended the inline feedback contract to the Hero, Contact, and Blog editors:
  server/save failures now remain visible in an announced inline region, and
  incomplete social links identify the affected row and fields. The first
  follow-up typecheck caught a JSX self-closing error while converting the Blog
  slug action to `IconAction`; the malformed closing tag was corrected before
  rerunning validation.
- The expanded feedback slice is green: Admin typecheck/lint, the full 41-file
  / 216-test suite, Admin production build, and `git diff --check` all pass.
- Used the in-app browser against the local Admin server to confirm the auth
  boundary still resolves `/portfolio` to the Welcome sign-in screen. At a
  390px viewport the Email/Password fields and Sign In/Google actions remain
  present with no horizontal overflow (`scrollWidth === clientWidth`); no
  authenticated CMS data was submitted.
- Final slice checks are clean: `pnpm check:service-role`,
  `pnpm check:architecture`, `pnpm check:brand-assets`, and `git diff --check`
  all pass. The worktree remains intentionally uncommitted and no migration,
  production CMS write, deployment, or push was performed.
- Began the collection-editor accessibility pass. Education, Experience, Work,
  and Credentials list owners now clear and pass save errors into their dialogs,
  where `FormMessage` renders an announced inline error while retaining the
  existing toast and mutation behavior. Validation is pending for this slice.
- The first collection-editor typecheck caught two missing destructures for the
  new optional dialog error prop in Project and Certificate dialogs; both were
  corrected before continuing validation.
- Extended the same dialog feedback contract to Skills category and Skill
  editors. Their owning manager now resets and passes separate announced error
  states without changing the existing category/skill mutations.
- Extended inline feedback to the About singleton and Activity source forms,
  and added programmatic labels for repeated About story/principle fields. The
  Activity form now keeps invalid GitHub usernames and missing Home-record
  errors attached to the action area instead of only in a toast.
- Added `apps/admin/src/lib/portfolio-api.test.ts`, covering the typed read,
  create, update, delete, and section-presentation adapters. The assertions
  verify canonical table/id routing and serialized payloads without contacting
  Supabase.
- The first typecheck of the adapter test caught an overly narrow `as const`
  inference for the mutable project tag array; the test fixture now matches the
  canonical writable input type.
- The first full test run caught a test-fixture issue: a single consumed
  `Response` object was being reused across three mocked fetches. The adapter
  test now returns a fresh response for each mutation, matching browser fetch
  semantics.
- Collection-editor validation is green: Admin typecheck/lint, the full 42-file
  / 219-test suite, the Admin production build, and `git diff --check` all pass.
- Full repository release checks are also green after the CMS pass: global
  `pnpm check-types`, `pnpm lint`, `pnpm test` (42 files / 219 tests), Portfolio,
  Studio, and Auth production builds, service-role, architecture, brand-asset,
  and diff checks all pass. Authenticated round trips and production writes
  remain intentionally unperformed.
- Read-only in-app browser validation against the local Portfolio server passed:
  the home page rendered the database-backed `Jayant` identity, About,
  Education, Skills, Experience, Activity, nine project images, and three
  published writing entries with no horizontal overflow. At 390px, the mobile
  navigation opened with six ordered destinations and closed via its labelled
  control; the viewport was reset and tabs finalized afterward.
- Static label audit found the Blog tag-entry input was the only collection
  field without an associated label; it now has `id="blog-tag-input"` and an
  explicit `htmlFor` association. Group labels for repeated Experience bullets
  remain paired with their own visually hidden field labels.
- The final label fix passes Admin typecheck/lint and `git diff --check`.
- In-app browser validation of the shared Studio surface passed at its public
  boundary: `/` rendered the shared sidebar, breadcrumb, search, theme trigger,
  sign-in link, and product navigation; the theme menu exposed Light, Dark, and
  System options. The public Studio route stayed within the viewport. The
  local Studio runtime also logged its expected missing Supabase environment
  error for an account-init request; no authenticated route was claimed.
- Final post-label checks remain green: 42 test files / 219 tests, diff check,
  service-role boundaries, architecture boundaries, and brand-asset
  synchronization all pass.
- Added a React-free canonical Auth surface registry in `@repo/auth/surface`.
  It is now the single route contract for login, registration, recovery,
  callback, MFA, account security, providers, and logout; Auth's route
  ownership test consumes that registry, while the shared entry builders use
  it for login, security, and logout destinations. This is a contract-only
  slice: no rollout flag changed, no duplicated Studio/Admin account UI was
  deleted, and no authenticated or production write was attempted.
- The Auth surface slice passes `@repo/auth` typecheck and its focused 21-test
  suite (including entry and Auth route ownership coverage).
- Centralized the password policy in `@repo/auth/password`. Auth's server
  actions, Studio's reset form, and both legacy Studio/Admin account sheets
  now use the same validation and status logic; this removes a subtle policy
  drift where Studio reset only checked length. Auth ownership and account
  deletion remain gated, so the duplicate account sheets are intentionally
  still present.
- Repository validation after the Auth contract/password slice is green:
  global typecheck, lint, 44 test files/223 tests, Portfolio/Admin/Studio/Auth
  production builds, service-role/architecture/brand checks, and
  `git diff --check` all pass. No rollout flag, migration, production write,
  commit, push, or deployment was performed.
- Tightened the Auth surface helper so an unknown route identifier throws
  instead of silently falling back to `/`; the focused Auth contract tests
  remain green.
- Per the requested ownership decision, removed the legacy Studio/Admin
  account-settings sheets, MFA enrollment/disable dialogs, MFA cleanup
  endpoints, and account-delete endpoints. Both product user menus now route
  settings and sign-out directly to the standalone Auth application with no
  legacy branch.
- Added Auth-owned profile editing alongside its existing password, MFA,
  provider, logout, and recovery flows. Account deletion remains on the
  existing server-owned product endpoints because the repository contract
  intentionally keeps service-role credentials out of Auth; the legacy delete
  endpoints are not reachable from the new product UI and will be removed only
  after an approved Auth-owned deletion operation exists. The shared platform
  session mode and Auth owner now default to `platform` and `auth`; explicit
  legacy values remain available only as emergency rollback configuration.
- Added a local-development Auth-origin fallback so a product running on
  localhost links to the local Auth app when no explicit Auth URL is present;
  production still resolves to the canonical Auth origin.
- Updated the shared UI audit and implementation checklist to reflect the
  actual cutover: duplicated account settings are gone from Studio/Admin,
  Auth owns the shared account surface, and only the server-owned account
  deletion endpoints remain deferred behind the service-role boundary.
- Corrected the deletion boundary after review: Auth remains service-role-free,
  so the existing server-owned Admin/Studio account-delete compatibility
  endpoints were restored. No new settings UI calls them; they remain a
  tracked removal gate until an approved self-delete backend can be owned by
  Auth without importing service-role credentials.
- Browser-checked the local cutover with the in-app agent browser: opening
  `http://localhost:3002/portfolio` and `/welcome?redirect=/portfolio/work`
  redirected to the local Auth login at `http://localhost:3003/login` with a
  validated encoded return path. The local server emitted only the expected
  stale-session `Invalid Refresh Token` diagnostic for the unauthenticated
  Admin request.
- Final validation after the cutover is green: global `pnpm check-types`,
  `pnpm lint`, and `pnpm test` (45 files / 233 tests); Admin, Studio, and Auth
  production builds; service-role, architecture, brand-asset, and diff checks.
  Builds expose no legacy MFA cleanup route or account-settings UI route; the
  local MFA verification page remains only as the documented login
  compatibility boundary.
- Removed the now-unused Admin/Studio `NavUser` adapters and the shared
  `SidebarUserMenu` component. The top-bar `ApplicationUserMenu` is now the
  only account-menu presentation path, and both Auth cutover tests assert the
  old adapters are absent.
- Corrected the implementation plan wording so the account-delete endpoints
  are accurately recorded as deferred compatibility routes rather than as
  deleted legacy UI. This keeps the documented cleanup gate aligned with the
  no-service-role Auth architecture.
- Re-ran the public Portfolio smoke test with the in-app browser at the local
  database-backed runtime. The home page rendered the canonical `Jayant`
  identity, ordered About/Skills/Experience/Activity/Work/Writing navigation,
  education, capabilities, and public copy. At a 390px viewport the page had
  no horizontal overflow (`scrollWidth === 390`); the labelled mobile menu
  opened with six section links and closed successfully. The temporary
  viewport and browser tab were reset and finalized.
- Focused Auth cutover tests (14 tests), global typecheck, global lint, and
  diff checks remain green after deleting the superseded sidebar account-menu
  implementation.
- The post-cleanup full suite is green again: 45 test files / 233 tests,
  service-role boundaries, architecture boundaries, brand-asset synchronization,
  and `git diff --check` all pass.
- Added route-level coverage for the cross-table section-presentation mutation:
  malformed payloads stop before authorization, existing copy/navigation rows
  update in the Portfolio schema, hero copy can be created without a fake nav
  row, and a navigation failure restores the prior copy without revalidating a
  partial success. The new four-test contract passes Admin typecheck/lint and
  the focused Vitest run.
- Audited Admin workspace grids for narrow viewports and changed the Education
  and Experience dialog pairs from always-two-column layouts to
  `md`-and-up two-column layouts. The fields now stack on mobile, matching the
  shared responsive form contract.
- Post-responsive validation is green: the full suite now covers 46 test files
  and 237 tests, and Admin typecheck, lint, and `git diff --check` pass.
- Made the shared sidebar rail keyboard-accessible: it now participates in the
  tab order, toggles on Enter/Space, preserves consumer key handlers, and shows
  a visible focus ring. This closes the shared-shell gap where the rail was
  mouse-only while preserving its resize and collapsed-click behavior.
- Updated the shared theme menu to use Radix's `onSelect` contract, ensuring
  Light/Dark/System choices work from keyboard activation as well as pointer
  input.
- Added Admin-side contract coverage for the shared rail, theme/account menu
  selection path, and collapsed navigation tooltips; the package boundary stays
  React/UI-only while the consuming app owns the test harness.
- Rebuilt Admin and Studio successfully after the shared interaction changes.
  A fresh in-app browser attempt against the local Admin server was blocked by
  the browser environment's localhost connection policy; the prior successful
  Portfolio and Studio mobile smoke passes remain recorded above, while an
  authenticated Admin browser pass is still an explicit release gate.
- Updated the implementation checklist to mark the shared keyboard menu and
  collapsed-tooltip contracts complete; authenticated responsive browser
  validation remains separate and intentionally open.
- Added CMS workspace-loader contract tests covering Home, About/Education,
  Skills, Work, and Writing joins, plus an explicit failure case proving a
  database read error is surfaced instead of being masked by fallback data.
- Added narrow Vitest aliases for the Admin workspace's server-only helper
  imports; the existing Studio `@/` test alias remains unchanged.
- Tightened the shared presentation validator so only the six public navigation
  sections can write `nav_items`; non-navigable contexts such as Home, Resume,
  Education, Credentials, Blog, and Article must send `navigation: null`.
- Fixed the Admin Blog route's CMS cache contract: reads no longer invalidate
  Portfolio pages, while successful Blog updates now revalidate the public
  index and dynamic article pages. Added tests for read behavior, publish
  validation, and update revalidation.
- Corrected the implementation plan's shell wording so it no longer implies
  that a legacy local settings UI remains; only the server-owned account-delete
  compatibility routes are still deferred.
- Renamed the Admin command-palette description from “platform settings” to
  “platform tools” so the visible Admin vocabulary no longer advertises the
  retired legacy settings concept.
- Full validation after the CMS cache/validator changes is green: repository
  typecheck, lint, 49 test files / 247 tests, Portfolio and Auth builds, the
  architecture/service-role/brand checks, and `git diff --check` all pass.
- Re-smoke-tested the local Portfolio home in the in-app browser after the
  CMS changes. The DB-backed page rendered the Jayant identity, ordered public
  navigation, About/Skills/Experience/Activity/Work/Writing content, GitHub
  activity, credentials, projects, and writing; the browser tab was finalized
  and the local server stopped afterward.
- Rebuilt Admin and Studio after the final Blog/validator changes; both
  production builds completed successfully.
- Reconciled the platform proof ledger with the cleanup: `legacy` is now
  documented as an emergency route-ownership rollback value, not as a promise
  that the deleted local settings sheet still exists.
- Updated the Admin README and redirect ledger to describe the current
  section-owned workspaces and shared Auth account surface. The retired local
  settings sheets are no longer documented as active; only the explicitly
  deferred server-owned account-delete compatibility routes remain.
- Expanded the CMS workspace-loader contract to cover the remaining owning
  workspaces: Experience with credentials, Activity with the hero GitHub
  source, and Contact with its contact record. The loader test now exercises
  every canonical workspace family instead of leaving those joins unverified.
- Added a route reachability contract for Admin: every canonical Portfolio
  workspace and every preserved compatibility destination must have a concrete
  App Router page, preventing navigation config from drifting away from the
  filesystem.
- Expanded the generic Portfolio CMS route contract to cover successful
  singleton reads, updates, deletes, ID scoping, and public revalidation. The
  mutation path is now tested beyond project creation and malformed payloads.
- Re-ran the in-app browser boundary checks against local Admin/Auth servers.
  Admin `/portfolio` redirected unauthenticated visitors to Auth with a safe
  `return_to`, and Auth `/account/security` redirected back to its login page
  when no session was present. No credentials or CMS data were entered; an
  authenticated Admin mutation pass remains unverified because this browser
  session has no signed-in admin account.
- Rechecked the legacy-settings cleanup after the latest request: neither Admin
  nor Studio contains the retired local settings sheet, local MFA settings panel,
  or MFA cleanup route. The only remaining shared account menu is the new
  cross-application control, and its Settings action routes to Auth's canonical
  account-security surface. Clarified the component and environment contract
  comments so `NEXT_PUBLIC_AUTH_FLOW_OWNER` cannot be mistaken for a local
  settings implementation.
- Confirmed the worktree still contains the current `origin/main` commit
  (`ffcd8ce89a9f3c980bb3b5bd06de11983f2b4b62`) and passed the ancestry check.
  In-app browser checks verified the live CMS-backed Portfolio home and Blog
  detail, plus Auth's safe-return security boundary and the unauthenticated
  Admin `/portfolio` redirect. An authenticated Admin mutation pass and full
  private mobile matrix remain open because this session has no signed-in admin
  credentials and the browser binding did not expose viewport control.
- Normalized the two plan metadata lines that carried trailing whitespace; the
  staged documentation now passes `git diff --check` with the implementation
  changes included.
- Re-ran the complete automated release checks after the cleanup: 49 test files
  and 251 tests pass; repository typecheck, lint, architecture, service-role,
  brand-asset, diff, and all four Portfolio/Admin/Studio/Auth production builds
  pass. The work was split into four reviewed commits and pushed directly to
  `main` at `4de1f1b03d726274031c3cd04b2c3f0213d06a97`; no migration or
  production CMS write was performed.
- Updated the release checklist to reflect the four-phase commit review,
  current-base freshness check, final validation, and direct push to `main`.
  Vercel deployment confirmation, production smoke tests, and authenticated
  CMS round-trip validation remain intentionally open rather than being marked
  complete without credentials or a deployment result.
- Browser validation exposed a Studio-only mobile shell defect: the custom
  top-bar control was hidden when the React mobile flag lagged the responsive
  viewport. The control now remains CSS-visible below the medium breakpoint
  and chooses the mobile sheet from the live media query before toggling the
  desktop sidebar; this preserves desktop behavior while making the hamburger
  deterministic on narrow screens.
- The shared mobile hook now uses `useSyncExternalStore` with a viewport
  snapshot and media-query subscription instead of effect-only state. This
  removes the stale desktop/mobile branch that prevented the Radix Sheet from
  opening at narrow widths and gives Studio and Admin one deterministic
  responsive contract.
- The sidebar provider also checks the live viewport when toggling and allows
  the mobile sheet branch to render while its mobile-open state is active. This
  covers a stale first render during navigation or viewport emulation while
  preserving the existing desktop cookie state.
- The sidebar render branch now includes a synchronous viewport guard as a
  final hydration-safe fallback. This prevents a narrow viewport from ever
  falling through to the desktop-only branch when the browser reports its
  width before a media-query subscription settles.
- The Studio hamburger now exposes its controlled mobile-sheet state through
  `aria-expanded`. This keeps the trigger accessible and gives browser QA a
  direct assertion that the click reached the shared sidebar provider before
  checking the Radix sheet portal.
- Corrected the shell direction after review: Studio and Admin now both use
  the shared `SidebarTrigger` in the application header. The Studio-specific
  top-bar control (which looked like a hamburger and duplicated the shared
  sheet trigger) was removed; Studio keeps only its in-sidebar collapse and
  collapsed-brand expand affordances. This keeps the product shells aligned
  while Portfolio retains its own independent mobile navigation.
- Refined the shared shell to match Studio's original interaction model: both
  Admin and Studio now use the same shared in-sidebar collapse button and
  collapsed-brand expand affordance on desktop, while the shared header
  trigger is visible only on mobile to open the left sheet. The Studio-local
  copies were removed so there is one implementation and no app-specific
  hamburger variant.
- Kept the dormant Studio header wrapper on the same mobile-only trigger
  contract as the live shared topbar, so any future caller cannot reintroduce
  a desktop duplicate control accidentally.
- Corrected Studio's brand wrapper to use the shared expand-control hover group.
  This preserves the original collapsed-rail affordance after moving the
  collapse/expand implementation into `@repo/ui`.
- Browser recheck after the shared-control move: Studio desktop renders the
  collapse control with the header trigger CSS-hidden; at 390px the shared
  header trigger is visible, the desktop sidebar is not rendered, and the
  desktop collapse affordance has a zero-sized hidden box. Admin's protected
  route correctly redirected to the Auth login boundary in the credential-free
  local run, so authenticated Admin interaction remains unverified here.
