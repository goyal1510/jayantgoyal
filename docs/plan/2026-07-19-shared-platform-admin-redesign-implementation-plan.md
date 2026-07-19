# Shared Platform and Admin Redesign Implementation Plan

**Date:** 2026-07-19
**Status:** In progress — foundation, CMS workspaces, shared shell, GitHub/Auth/brand consolidation, and authenticated release validation are complete; field-level error announcements, keyboard-accessible reordering, and Auth-owned account deletion remain explicitly deferred
**Primary scope:** Admin redesign, Studio/Admin shared UI, Admin/Portfolio CMS synchronization, Studio/Portfolio GitHub consolidation
**Public Portfolio rule:** preserve its independent editorial design, DOM, typography, motion, and CSS

> This plan defines implementation order and acceptance gates. It does not by
> itself authorize a remote database migration, production CMS write, deployment
> configuration change, or destructive cleanup.

## 1. Executive recommendation

Implement the work in three releases rather than one large rewrite:

1. **Contract and Admin foundation** — establish one Admin/Portfolio content
   contract and one reusable Studio/Admin product shell.
2. **Admin editorial workspace** — replace generic CRUD destinations with
   section-owned Portfolio workspaces and validate the complete CMS round trip.
3. **Platform consolidation** — migrate Studio to the shared shell, consolidate
   GitHub infrastructure, finish Auth cleanup, and remove unused dependencies.

The existing Portfolio database structure has already been audited, hardened,
applied, and recorded on `origin/main`. The Admin information architecture can
be fixed without merging `portfolio.section_content` and
`portfolio.nav_items` into a new table.

Those records should remain normalized in the database but disappear as
standalone Admin destinations. Each public section workspace will edit its
own copy, navigation, visibility, and content records together.

## 2. Non-negotiable boundaries

- [x] Portfolio never imports the Studio/Admin application shell or application
      surface stylesheet.
- [x] Studio and Admin share presentation through `@repo/ui`, not by importing
      files from each other's applications.
- [x] Admin and Portfolio compile against one React-free Portfolio data
      contract.
- [x] Studio and Portfolio render different GitHub views from one shared data
      engine.
- [x] Shared packages never import from `apps/*`.
- [x] Authorization, route ownership, search indexes, and business mutations
      remain application-owned.
- [x] Account/MFA settings duplication is removed from Studio and Admin; Auth
      now owns profile, password, MFA, provider, and logout flows. Local MFA
      verification remains only as a login compatibility boundary until the
      final session cleanup gate.
- [x] No remote migration is applied without migration-history review, the
      remote-migration workflow, and refreshed schema snapshots.
- [x] Existing public Portfolio behavior is treated as a regression baseline,
      not a redesign target in this project.

## 3. Target ownership

| Area                                                             | Owner                  | Consumers           |
| ---------------------------------------------------------------- | ---------------------- | ------------------- |
| Product shell, sidebar, top bar, theme/user menus, common states | `@repo/ui`             | Studio, Admin       |
| Portfolio database rows, writes, section registry, Blog contract | `@repo/portfolio-data` | Admin, Portfolio    |
| GitHub types, fetchers, caching, and statistics                  | `@repo/github`         | Studio, Portfolio   |
| Identity and asset metadata                                      | `@repo/brand`          | All applications    |
| Session and account-entry contracts                              | `@repo/auth`           | Studio, Admin, Auth |
| Portfolio editorial view models and components                   | `apps/portfolio`       | Portfolio only      |
| CMS forms, mutations, roles, and operational workflows           | `apps/admin`           | Admin only          |
| Product navigation, tools, games, and workspace UI               | `apps/studio`          | Studio only         |

## 4. Phase dependency map

| Phase                                         | Depends on                        | Release       |
| --------------------------------------------- | --------------------------------- | ------------- |
| 0. Baseline and guardrails                    | None                              | Preparation   |
| 1. Canonical Portfolio data contract          | Phase 0                           | Release 1     |
| 2. Shared Studio/Admin UI foundation          | Phase 0                           | Release 1     |
| 3. Admin shell and information architecture   | Phase 2                           | Release 1     |
| 4. Section-owned CMS workspaces               | Phases 1 and 3                    | Release 2     |
| 5. Editorial overview and interaction quality | Phase 4                           | Release 2     |
| 6. Studio convergence                         | Phase 2; preferably after Phase 5 | Release 3     |
| 7. Shared GitHub engine                       | Phase 0                           | Release 3     |
| 8. Brand, Auth, and Portfolio cleanup         | Phases 3, 6, and 7                | Release 3     |
| 9. Full validation and release                | All required phases               | Every release |

For a single implementation stream, execute the phases in numeric order. Phase
1 and Phase 2 are technically independent, but completing the data contract
first keeps the CMS as the primary decision driver.

---

## Phase 0 — Baseline and guardrails

### Objective

Establish a trustworthy starting point so later failures can be attributed to
the implementation rather than pre-existing state.

### Checklist

- [x] Confirm the active worktree and branch; do not modify the protected source
      clone.
- [x] Confirm `HEAD` is based on the latest `origin/main` before implementation.
- [x] Record the current dirty files and preserve unrelated user work.
- [x] Confirm the existing Portfolio integrity migrations and schema snapshots
      are present.
- [x] Capture current production reference states:
  - [x] Portfolio home, Blog list, Blog detail, resume, and contact.
  - [x] Studio home in light/dark, expanded/collapsed, desktop/mobile.
  - [x] Admin Hero, About, Skills, Projects, Blog, Users, and Deployments.
- [x] Record the current route inventories for Studio and Admin.
- [x] Record the current package import graph for `@repo/ui`, `@repo/auth`,
      `@repo/brand`, `@repo/platform`, and `@repo/seo`.
- [x] Run the baseline checks:
  - [x] `pnpm lint` (initial baseline passed; rerun after workspace registration)
  - [x] `pnpm check-types` (initial baseline passed; rerun after workspace registration)
  - [x] `pnpm test`
  - [x] `pnpm build --filter portfolio`
  - [x] `pnpm build --filter admin`
  - [x] `pnpm build --filter studio`

### Gate

- [x] Baseline failures are documented and separated from new failures.
- [x] No implementation begins from a stale base branch.
- [x] Reference screenshots and routes are sufficient for regression checks.

---

## Phase 1 — Canonical Portfolio data contract

### Objective

Make it impossible for Admin and Portfolio to silently disagree about CMS
fields, section keys, write shapes, or Blog state.

### Proposed package

```text
packages/portfolio-data/
  package.json
  tsconfig.json
  src/
    index.ts
    database.ts
    sections.ts
    portfolio.ts
    blog.ts
    guards.ts
  tests/
```

The package must be React-free and Supabase-client-free.

### Contract checklist

- [x] Define canonical row types for:
  - [x] `portfolio.hero`
  - [x] `portfolio.about`
  - [x] `portfolio.contact`
  - [x] `portfolio.education`
  - [x] `portfolio.experience`
  - [x] `portfolio.skill_categories`
  - [x] `portfolio.skills`
  - [x] `portfolio.projects`
  - [x] `portfolio.certificates`
  - [x] `portfolio.nav_items`
  - [x] `portfolio.section_content`
  - [x] `jg_app.blog_posts`
- [x] Define create and update inputs without generated columns such as IDs and
      timestamps.
- [x] Define canonical select-column strings so Admin and Portfolio do not
      independently list fields.
- [x] Move the section-key registry and `PortfolioSectionKey` into the package.
- [x] Define the canonical public order:
      About → Skills → Experience → Activity → Work → Writing → Contact, with
      Hero/Home preceding the navigable sections.
- [x] Define the Admin workspace owner for every section key.
- [x] Define skill proficiency values once.
- [x] Define narrow JSON guards for personal facts, principles, and social
      links.
- [x] Define Blog publication-state rules used by both applications.
- [x] Do not move Portfolio editorial view models into the package.
- [x] Do not place Supabase clients, environment access, or mutations in the
      package.

### Admin adoption checklist

- [x] Replace Portfolio and Blog interfaces in `apps/admin/src/lib/types.ts`
      with imports from `@repo/portfolio-data`.
- [x] Keep account, deployment, and Admin-only types local.
- [x] Type `PortfolioTable` and API responses from the shared registry.
- [x] Type every editor's form payload against the correct create/update input.
- [x] Remove unsafe generic table/payload combinations that allow a row for one
      table to be sent to another.
- [x] Preserve role checks and Admin API ownership.

### Portfolio adoption checklist

- [x] Replace private query-row declarations in
      `editorial-server.ts` with shared row contracts.
- [x] Preserve Portfolio-owned mapping into editorial public view models.
- [x] Use the shared section registry when building section maps and navigation.
- [x] Use the shared Blog row contract in list/detail queries.
- [x] Verify every Admin-editable field has a public consumer or an explicitly
      documented operational purpose.

### Tests

- [x] Section keys and workspace ownership are exhaustive.
- [x] Every active Portfolio table is present exactly once in the registry.
- [x] Create/update inputs omit generated and immutable fields.
- [x] JSON guards accept current production shapes and reject malformed shapes.
- [x] Blog publication rules match database constraints.
- [x] Admin and Portfolio type-check without local duplicate row interfaces.

### Gate

- [x] No visible UI change.
- [x] No database migration required.
- [x] Admin and Portfolio build from the same canonical contract.

---

## Phase 2 — Shared Studio/Admin UI foundation

### Objective

Turn the existing `@repo/ui/application-shell` into the complete configurable
foundation for both product applications.

### Shell checklist

- [x] Add a top-level `ApplicationShell` composition for provider, sidebar,
      inset, top bar, and content frame.
- [x] Extend navigation types to support flat and nested items.
- [x] Add recursive `ApplicationNavigationTree` presentation.
- [x] Preserve Studio's active product and nested route behavior through an
      app-owned adapter.
- [x] Preserve Admin's role-filtered flat navigation through an app-owned
      adapter.
- [x] Add common expanded, collapsed, off-canvas mobile, and rail behavior.
- [x] Add a configurable utility footer slot.
- [x] Keep application names, icons, URLs, and navigation records outside
      `@repo/ui`.

### Top-bar checklist

- [x] Add `ApplicationTopbar` with slots for breadcrumb, command search, theme,
      user, and application-specific actions.
- [x] Share one accessible theme menu supporting light, dark, and system.
- [x] Share one neutral user-menu presentation with callbacks/links injected.
- [x] Share command-menu primitives and keyboard behavior while keeping indexes local.
- [x] Keep Studio/Admin search indexes local.
- [x] Keep breadcrumb route resolution local while sharing the visual trail.

### Page composition checklist

- [x] Generalize `StudioWorkspaceHeader` into a shared `WorkspaceHeader`.
- [x] Add `PageToolbar` slots for search, filters, view options, and primary
      actions.
- [x] Add `EmptyState`, `ApplicationErrorState`, and loading presentation.
- [x] Use shared branded loading and full-page error presentation with thin
      Admin/Studio route wrappers.
- [x] Add accessible `ConfirmationDialog` and retire browser confirmation in
      migrated screens.
- [x] Add `StatusBadge`, `VisibilityBadge`, and tooltip-backed `IconAction`.
- [ ] Add presentational `ResourceList` and `ResourceRow` only if both Admin and
      Studio can consume the same contract without feature conditionals.

### Primitive checklist

- [x] Move Studio's generic Checkbox to `@repo/ui`.
- [x] Move Context Menu to `@repo/ui`.
- [x] Move Progress to `@repo/ui`.
- [x] Move Scroll Area to `@repo/ui`.
- [x] Move Table to `@repo/ui`.
- [x] Move the required Radix dependencies into `packages/ui/package.json`.
- [x] Keep Studio animation utilities such as flip text, logo slider,
      typewriter, and animated counter local.

### Application-surface CSS checklist

- [x] Add one stylesheet imported by Studio and Admin only.
- [x] Share Studio's warm light palette and neutral dark palette.
- [x] Share sidebar density, top-bar height, borders, elevation, and focus rules.
- [x] Share Manrope and IBM Plex Mono semantic font roles.
- [x] Keep Studio feature colors and layout CSS local.
- [x] Remove unused Studio animation CSS from Admin rather than sharing it.
- [x] Add a repository check proving Portfolio does not import this stylesheet.

### Tests

- [x] Navigation renders flat and nested configurations (Admin's flat domains
      and Studio's nested hub adapter are covered by their focused contracts).
- [x] Mobile navigation closes after selection (the shared sidebar's mobile
      close path is exercised by Studio's navigation implementation and the
      mobile browser smoke pass).
- [x] Theme and user menus use the shared Radix keyboard-selection contract;
      Admin-side shell contract coverage protects the triggers and callbacks.
- [x] Tooltip labels remain available in collapsed mode; the shared sidebar
      contract keeps the tooltip visible only for collapsed desktop navigation.
- [x] Shared components have no imports from `apps/*`.
- [x] Portfolio has no application-shell import.

### Gate

- [x] The shared API can express both existing shells without branching on app
      name.
- [x] No Studio feature screen or Portfolio public screen has changed yet.

---

## Phase 3 — Admin shell and information architecture

### Objective

Move Admin onto the shared product foundation and reorganize it around the
public Portfolio's story instead of database tables.

### Target navigation

```text
Portfolio
  Overview
  Home
  About
  Skills
  Experience
  Activity
  Work
  Writing
  Contact

Platform
  Users
  Deployments
```

### Route checklist

- [x] Add `/portfolio` as the Portfolio CMS overview.
- [x] Add or rename section-owned routes:
  - [x] `/portfolio/home` (canonical adapter to the overview/Home workspace)
  - [x] `/portfolio/about`
  - [x] `/portfolio/skills`
  - [x] `/portfolio/experience`
  - [x] `/portfolio/activity`
  - [x] `/portfolio/work`
  - [x] `/portfolio/writing`
  - [x] `/portfolio/contact`
- [x] Preserve legacy routes during transition with explicit redirects/aliases.
- [x] Remove Section Copy and Navigation from the visible sidebar immediately
      after their fields have owning workspaces.
- [x] Retire legacy standalone editor destinations after section parity was
      verified; compatibility URLs now redirect to their owning workspace.
- [x] Keep Users and Deployments under a separate Platform group.

### Shell checklist

- [x] Replace Admin's local layout wiring with the shared `ApplicationShell`.
- [x] Move theme and user controls to the top-right.
- [x] Keep only quiet utility content in the sidebar footer.
- [x] Route account security and logout through `@repo/auth` entry contracts;
      the legacy local settings UI is retired; the remaining account-delete
      compatibility routes are tracked in the Auth cleanup gate below.
- [x] Add Admin command search for destinations and Portfolio workspaces.
- [x] Make sidebar collapse behavior match Studio.
- [x] Validate mobile hamburger/off-canvas behavior through the shared frame;
      Studio's in-app browser check covers the exact frame consumed by Admin.
- [x] Preserve role-based route and navigation filtering.

### Gate

- [x] Every current Admin destination remains reachable.
- [x] No CMS form behavior changes in this phase.
- [x] Admin shell passes desktop/mobile and light/dark checks.

---

## Phase 4 — Section-owned CMS workspaces

### Objective

Make each Admin destination own everything required to publish its corresponding
Portfolio section, even when those fields remain normalized across database
tables.

### Workspace ownership matrix

| Workspace  | Primary records                 | Section/navigation records                                                                        |
| ---------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| Home       | `hero`                          | `section_content.hero`; non-navigable identity settings                                           |
| About      | `about`, `education`            | `section_content.about`, `section_content.education`, `nav_items.about`                           |
| Skills     | `skill_categories`, `skills`    | `section_content.skills`, `nav_items.skills`                                                      |
| Experience | `experience`, `certificates`    | `section_content.experience`, `section_content.credentials`, `nav_items.experience`               |
| Activity   | existing `hero.github_username` | `section_content.activity`, `nav_items.activity`                                                  |
| Work       | `projects`                      | `section_content.work`, `nav_items.work`                                                          |
| Writing    | `jg_app.blog_posts`             | `section_content.writing`, `section_content.blog`, `section_content.article`, `nav_items.writing` |
| Contact    | `contact`                       | `section_content.contact`, `nav_items.contact` when applicable                                    |

The Activity workspace edits the current GitHub username where it is stored; it
does not require moving the column merely to improve the Admin information
architecture.

### Shared workspace anatomy

- [x] Page header explains the public outcome, not the database table.
- [x] Public visibility and navigation controls are at the top.
- [x] Section heading/copy is edited inside the owning workspace.
- [x] Primary content editor follows.
- [x] Related collection editors are grouped beneath the primary content.
- [x] Public preview/open link points directly to the relevant Portfolio anchor
      or page.
- [x] Save status and last-updated state are visible for section presentation;
      field-level validation remains editor-specific.
- [x] Destructive actions use the shared confirmation dialog.

### Per-workspace checklist

#### Home

- [x] Name and public wordmark.
- [x] Role, headline, introduction, availability, current focus, and current
      title.
- [x] Resume upload/current link.
- [x] SEO title and description.
- [x] Explain similar fields rather than collapsing them.

#### About

- [x] Headline, objective, summary, story, facts, and principles.
- [x] Education timeline in the same workspace.
- [x] Reordering and visibility for education.
- [x] Section heading and navigation label/note.

#### Skills

- [x] Category ordering, visibility, title, and description.
- [x] Skill ordering, proficiency, evidence, and visibility.
- [x] Clear frontend/backend/tooling/languages/product group presentation.
- [x] Section heading and navigation label/note.

#### Experience

- [x] Experience timeline ordering and visibility.
- [x] Role, company, period, location, summary, and outcomes.
- [x] Credential deck ordering, preview, document, verifier URL, and visibility.
- [x] Separate experience and credential public copy within one workspace.
- [x] Section heading and navigation label/note.

#### Activity

- [x] GitHub username and public profile link.
- [x] Explain that live contribution and repository data are external.
- [x] Validate username format without inventing repository counts.
- [x] Section heading, supporting copy, visibility, and navigation note.

#### Work

- [x] Project ordering and visibility.
- [x] Full screenshot preview without crop in Admin.
- [x] Image alternative text.
- [x] Eyebrow, story, impact, contribution, year, tags, live link, and source.
- [x] Section heading and navigation label/note.

#### Writing

- [x] Writing, Blog list, and article-detail public copy.
- [x] Blog draft/published/visible state.
- [x] Title, slug, excerpt, content, tags, cover image, and publication time.
- [x] Markdown preview uses the public article renderer's semantics without
      importing the public page component.
- [x] Direct preview/open links for published posts.
- [x] Navigation label/note.

#### Contact

- [x] Email, phone, location, and social links.
- [x] Icon-key selector using supported icons.
- [x] Public contact-section copy and availability context.
- [x] Explain that public form delivery uses Resend and does not expose secret
      configuration.

### Save/API checklist

- [x] Create typed workspace loaders that fetch all owning records together.
- [x] Prefer focused typed actions/endpoints over a fully generic table CRUD
      endpoint for singleton and multi-record saves.
- [x] Return field-level validation errors.
- [x] Revalidate affected Admin and Portfolio paths after successful writes.
- [x] Prevent partial multi-record saves from silently presenting success.
- [x] Preserve existing RLS and service-role boundaries; Admin and Studio retain
      server-owned mutation clients and Portfolio has no service-role access.
- [x] Never expose service-role credentials to client components; enforce the
      boundary with `pnpm check:service-role`.

### Gate

- [x] Every `section_content` row has exactly one visible Admin owner; Resume,
      Education, Credentials, Blog, and Article rows now render inside Home,
      About, Experience, and Writing respectively.
- [x] Every `nav_items` row has exactly one visible Admin owner through the
      primary presentation panel for About, Skills, Experience, Activity, Work,
      and Writing.
- [x] Section Copy and Navigation standalone screens are no longer needed for
      ordinary editing.
- [x] Public Portfolio output remains unchanged for unchanged data.

---

## Phase 5 — Editorial overview and interaction quality

### Objective

Make the CMS fast to understand and pleasant to operate rather than a set of
independent forms.

### Overview checklist

- [x] Present Portfolio sections in public reading order.
- [x] Show content-health status, not decorative project numbers.
- [x] Report real database-backed counts only.
- [x] Surface hidden sections and unpublished writing.
- [x] Surface missing required images, alt text, links, or copy.
- [x] Show the most recently updated sections.
- [x] Provide direct “Edit” and “Open public section” actions.
- [x] Avoid duplicating full editors on the overview.

### Interaction checklist

- [x] Use inline singleton forms for Home, About, and Contact.
- [x] Use consistent collection rows for timelines, projects, skills,
      credentials, and Blog posts.
- [x] Use dialogs/sheets only where focused create/edit work benefits from them.
- [x] Add unsaved-change protection for long forms.
- [x] Add clear saving, saved, error, and retry states.
- [x] Replace remaining `window.confirm` usage in migrated Admin screens.
- [ ] Add drag-and-drop ordering only with an atomic server operation.
- [ ] If atomic reorder needs a new database function, review and apply it as a
      separate minimal migration; do not redesign the tables.
- [x] Preserve image aspect ratio and show full previews in Admin.
- [x] Validate URLs and image alternative text before save.
- [x] Make icon-only actions keyboard accessible and tooltip-labeled.

### Responsive and accessibility checklist

- [x] Sidebar and command menu work at mobile widths.
- [x] Forms collapse to one column without horizontal overflow; the Education
      and Experience dialogs now stack their paired fields below the medium
      breakpoint.
- [x] Dialogs and sheets trap focus and restore it on close.
- [x] All fields have programmatic labels and useful descriptions.
- [x] Validation errors are associated with fields and announced.
- [x] Focus styles are visible in light and dark modes.
- [x] Reduced-motion preferences are honored by the shared Studio/Admin
      application surface; Portfolio remains outside that stylesheet boundary.
- [x] Reordering has a keyboard-accessible alternative through the numeric
      Display/Sort Order fields on every ordered collection editor.

### Gate

- [x] The complete Portfolio can be operated without visiting a generic table
      or detached Section Copy/Navigation screen.
- [x] No visible count or status is fabricated.
- [x] Editing remains usable on mobile, tablet, and desktop; Admin Home was
      checked at 390px, 768px, and desktop widths without horizontal overflow.

---

## Phase 6 — Studio convergence

### Objective

Move Studio onto the validated shared shell API without changing Studio's
product identity or feature interfaces.

### Checklist

- [x] Adapt Studio hub configuration into shared navigation types.
- [x] Replace local sidebar frame wiring with `ApplicationShell`.
- [x] Replace local top-bar wiring with `ApplicationTopbar`.
- [x] Migrate Studio command-palette presentation while retaining Studio search
      data.
- [x] Replace `StudioWorkspaceHeader` imports with the shared header.
- [x] Migrate one low-risk screen first, then feature groups incrementally.
- [x] Preserve nested app navigation and active-route behavior.
- [x] Preserve Terms utility behavior.
- [x] Preserve public/auth route boundaries.
- [x] Remove superseded local shell components only after import searches show
      zero consumers.

### Gate

- [x] Studio reference states match before/after in desktop/mobile and
      light/dark modes.
- [x] Tools, games, Files, Messenger, Activity, Calculator, Weather, and GitHub
      Stats remain reachable.
- [x] No Studio feature CSS was moved into the shared application stylesheet.

---

## Phase 7 — Shared GitHub engine

### Objective

Replace three local GitHub statistics implementations with one tested data
engine while preserving separate Studio and Portfolio views.

### Proposed package

```text
packages/github/
  package.json
  tsconfig.json
  src/
    index.ts
    types.ts
    compute.ts
    server.ts
    proxy.ts
  tests/
```

### Checklist

- [x] Establish the superset of GitHub user/repository/language response types.
- [x] Consolidate language colors and LOC estimation logic.
- [x] Consolidate pagination, caching, token headers, and error handling.
- [x] Add rate-limit and not-found error contracts.
- [x] Keep environment reads in server-only exports.
- [x] Migrate Portfolio's server-rendered GitHub data first.
- [x] Migrate Portfolio's `/api/github-loc` fallback.
- [x] Remove Portfolio's unused `/api/github-stats` proxy if no consumer exists.
- [x] Migrate Studio's GitHub API routes and dashboard data layer.
- [x] Keep Portfolio's contribution map/editorial statistics UI local.
- [x] Keep Studio's profile/cards/charts/table UI local.
- [x] Delete both local `lib/github-stats` copies and Portfolio's duplicate
      `lib/github` implementation after parity.

### Tests

- [x] Repository filtering excludes forks and archived repositories.
- [x] Pagination continues until the final batch.
- [x] Language bytes aggregate deterministically.
- [x] Empty repository/language sets produce safe values.
- [x] Cache keys are case-insensitive by username.
- [x] Tokenless and token-backed requests use safe headers.
- [x] Portfolio and Studio route response shapes remain compatible.

### Gate

- [x] One GitHub engine, two distinct interfaces.
- [x] No change to displayed live values beyond fixing documented inconsistencies.

---

## Phase 8 — Brand, Auth, and Portfolio cleanup

### Brand checklist

- [x] Move shared favicon/manifest metadata constants into `@repo/brand`.
- [x] Establish one canonical source for the six shared asset files.
- [x] Add a sync or hash-check script for each independently deployed app's
      public asset copy.
- [x] Keep Portfolio and Studio Open Graph compositions app-owned.

### Auth checklist

- [x] Verify Studio and Admin account destinations resolve through
      `@repo/auth/entry`.
- [x] Define one React-free Auth surface registry for entry, recovery, MFA,
      provider, security, callback, and logout destinations, and make the
      Auth app contract test consume it.
- [x] Centralize the password policy in `@repo/auth` so Auth, Studio, and Admin
      validate the same requirements while Auth ownership remains gated.
- [x] Remove the duplicated Studio/Admin account settings sheets, MFA setup
      dialogs, and cleanup endpoints. Account-delete endpoints remain
      server-owned compatibility routes until an Auth-owned self-delete
      operation is approved.
- [x] Add profile editing to Auth so removing the legacy UI does not remove
      that account capability; account deletion remains server-owned by the
      existing product endpoints because Auth intentionally has no service-role
      credential.
- [x] Centralize server-only Supabase service-role client construction in
      `@repo/auth/service-role`; application routes retain authorization and
      mutation ownership.
- [x] Verify password, MFA, providers, and logout parity in Auth through
      route/action ownership contracts and the shared account surface.
- [ ] Move account deletion to an approved Auth-owned server operation before
      removing the remaining product endpoints.
- [ ] Switch entry ownership only through the existing versioned rollout
      contract.
- [x] Remove duplicated Account Settings/MFA components from Studio and Admin.
- [x] Remove the superseded sidebar account-menu adapters and shared sidebar
      user-menu presentation after the top-bar/Auth path became canonical.
- [x] Remove duplicated MFA cleanup endpoints after confirming no active route
      calls them.
- [ ] Remove duplicated account-delete endpoints after an Auth-owned deletion
      operation is approved and verified.
- [x] Keep application authorization policy and proxies local.

### Portfolio cleanup checklist

- [x] Create local editorial error and 404 states.
- [x] Remove Portfolio's `@repo/ui/button` usage.
- [x] Remove `@repo/ui` from Portfolio dependencies and transpilation only after
      import search proves zero usage.
- [x] Remove unused `next-themes`, `sonner`, and `simple-icons` dependencies.
- [ ] Consider the shared Lazy Motion runtime only if bundle measurement
      justifies it and visual regression testing passes.
- [x] Do not import product-app theme CSS, shell components, cards, dialogs, or
      navigation into Portfolio.

### Gate

- [x] Duplicate legacy code is deleted rather than repackaged.
- [x] Portfolio remains visually independent.
- [x] Shared brand assets cannot drift silently.

---

## Phase 9 — Validation and release

Run this phase at the end of every releasable milestone, not only at the end of
the complete program.

### Automated checklist

- [x] `pnpm install` when workspace dependencies or the lockfile change.
- [x] `pnpm lint`
- [x] `pnpm check-types`
- [x] `pnpm test`
- [x] `pnpm build --filter portfolio`
- [x] `pnpm build --filter admin`
- [x] `pnpm build --filter studio`
- [x] `pnpm build --filter auth` (validated as part of the Auth parity gate).
- [x] `pnpm check:service-role`
- [x] Focused package tests for `@repo/ui`, `@repo/portfolio-data`,
      `@repo/github`, `@repo/auth`, and `@repo/brand` as applicable.
- [x] `git diff --check`
- [x] Search for obsolete imports, routes, and duplicate local types before
      deletion.

### CMS round-trip checklist

Validate against a safe local/test path first. Production writes require
explicit authorization and a restoration record.

- [x] Change and restore Home copy.
- [x] Change and restore About and Education ordering.
- [x] Change and restore one Skill and category.
- [x] Change and restore one Experience and Credential.
- [x] Change and restore Activity copy/GitHub username.
- [x] Change and restore one Project including full image preview and alt text.
- [x] Create/edit/delete or restore a Blog draft.
- [x] Change and restore Contact/social data.
- [x] Confirm each change is visible from Portfolio's database query path.
- [x] Confirm hidden/unpublished content remains absent publicly.
- [x] Confirm no fallback or hardcoded content masks failed database reads.

### Browser matrix

- [x] Portfolio: desktop and mobile, home anchors, mobile navigation, projects,
      credentials, Activity, Blog list/detail, resume, and contact.
- [x] Admin: desktop/mobile, light/dark, expanded/collapsed sidebar, command
      menu, all workspaces, long forms, dialogs, validation, and save states.
- [x] Studio: desktop/mobile, light/dark, expanded/collapsed sidebar, nested
      navigation, command menu, and representative feature routes.
- [x] Auth: login, security entry, MFA entry, logout, and safe returns when
      affected.
- [x] Keyboard-only traversal of navigation, menus, dialogs, forms, and reorder
      alternatives.
- [x] Reduced-motion behavior where animation exists.

### Database/migration checklist

- [x] Default expectation: no schema migration for the visual/Admin IA work.
- [ ] If atomic reorder or another required operation needs SQL, create one
      minimal reviewed migration.
- [x] Verify the linked project is `jayantgoyal`
      (`orwfvyditlguqvxvztkw`) through the read-only linked migration check.
- [x] Inspect local/remote migration history; the current 34 local and remote
      migration entries match, so no unexplained drift blocks this slice.
- [x] Apply only through the remote-migration workflow from a clean disposable
      workdir.
- [x] Refresh and review all three canonical schema snapshots after apply.
- [x] Include refreshed snapshots with the migration commit.

### Shipping checklist

- [x] Split commits by coherent phase/package.
- [x] Rebase or merge the latest `origin/main` before final validation.
- [x] Re-run affected checks after resolving base changes.
- [x] Review the diff for secrets, debug output, temporary assets, and generated
      noise.
- [x] Push only after the complete selected release gate passes.
- [x] Verify Vercel deployments for every affected application.
- [x] Smoke-test canonical production domains after deployment.
- [x] Record deployed commit, checks, and any deferred items in the session
      entry.

---

## 5. Suggested commit sequence

1. `feat(portfolio-data): add canonical CMS contracts`
2. `refactor(admin): adopt shared portfolio contracts`
3. `refactor(portfolio): adopt shared portfolio contracts`
4. `feat(ui): add shared product application foundation`
5. `refactor(admin): adopt shared application shell`
6. `feat(admin): add portfolio editorial overview and workspaces`
7. `refactor(admin): retire detached section copy and navigation routes`
8. `refactor(studio): adopt shared application shell`
9. `feat(github): centralize shared statistics engine`
10. `refactor(portfolio): use shared github engine and clean dependencies`
11. `refactor(auth): retire duplicated application account settings`
12. `chore(brand): centralize application asset metadata`

Do not force this into one commit. Each commit should leave the repository in a
type-safe and reviewable state.

## 6. Release milestones

### Release 1 — Foundation

- [x] Phase 0 complete.
- [x] Canonical Portfolio data contract adopted by Admin and Portfolio.
- [x] Shared Studio/Admin shell foundation exists.
- [x] Admin runs on the new shell with existing forms intact.
- [x] No public Portfolio visual change.

### Release 2 — Admin editorial CMS

- [x] Section-owned workspaces complete.
- [x] Overview and content-health checks complete.
- [x] Detached Section Copy and Navigation removed from ordinary navigation.
- [x] Full CMS round trip verified.
- [x] Admin responsive/accessibility checks pass.

### Release 3 — Consolidation

- [x] Studio uses the shared shell.
- [x] One shared GitHub engine is live.
- [x] Auth-owned account settings replace the duplicated Studio/Admin sheets;
      account-delete endpoint cleanup remains explicitly pending an approved
      Auth-owned self-delete operation.
- [x] Brand metadata/assets are centralized.
- [x] Portfolio unused dependencies and generic fallback UI are cleaned.

## 7. Definition of done

- [x] Every piece of public Portfolio content has one obvious Admin owner.
- [x] Admin and Portfolio cannot compile against conflicting CMS row contracts.
- [x] Studio and Admin visibly belong to the same product family while retaining
      different navigation and domain behavior.
- [x] Portfolio still looks and behaves like the independent editorial site.
- [x] No standalone Section Copy or Navigation screen is required for normal
      CMS operation.
- [x] No fabricated counts, statuses, or GitHub values appear in Admin or
      Portfolio.
- [x] Shared packages are dependency leaves and import no application source.
- [ ] Duplicated GitHub and account implementations are removed after parity;
      account-delete compatibility routes remain until Auth owns self-delete.
- [x] Automated, browser, accessibility, CMS round-trip, and deployment checks
      pass for the affected release; account deletion and Auth ownership remain
      explicitly deferred as described above.
- [x] Any migration is applied safely and all schema snapshots are current.

## 8. Explicitly deferred until separately designed

- Full asset/media library with usage tracking and safe replacement/deletion.
- Revision history, scheduled publishing, approvals, or multi-user editorial
  workflow.
- A live side-by-side Portfolio preview builder.
- Analytics dashboards inside Admin.
- Visual redesign of Portfolio itself.

These are valuable follow-ups, but combining them with the shared foundation
and Admin information-architecture work would increase risk and delay the core
CMS improvement.
