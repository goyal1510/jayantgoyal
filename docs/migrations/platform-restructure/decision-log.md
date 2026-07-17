# Platform Restructure Decision Log

## ADR-001 — Split applications before shared authentication

- Date: 2026-07-17
- Status: Accepted
- Task IDs: PLATFORM-07, PLATFORM-08, PLATFORM-09, PLATFORM-11
- Context: The initial sequence placed the shared Auth/SSO migration before the application split. The user explicitly reprioritized the program around the primary product goal: separate Portfolio from the existing product hub, make the product hub Studio, validate both deployments, and defer shared Auth/SSO until the application boundaries are stable.
- Options considered: complete Auth/SSO first; rename the live application immediately; or use an additive dark launch that leaves the current production root untouched until the independent applications pass validation.
- Decision: build the independent public Portfolio first at `portfolio.jayantgoyal.com`; add a public Studio inventory to the existing application and expose it at `studio.jayantgoyal.com`; validate both; move the apex domains to Portfolio; then finish the Studio rename and cleanup. Shared Auth/SSO work resumes only after this boundary and domain work is stable.
- Why this is the smallest maintainable choice: it creates the approved application boundaries without coupling them to a session migration, and it keeps the currently deployed application available as the rollback target during the cutover.
- Consequences: PLATFORM-08 can start after the content/environment baseline is recorded; PLATFORM-07 no longer depends on PLATFORM-06; PLATFORM-09 can proceed while Auth remains on the existing compatible flow. The original phase IDs retain their architectural meaning even though their execution order changes.
- Code or abstraction deleted/avoided: no temporary shared-auth package, parent-domain cookie, or duplicate Auth deployment is introduced merely to unblock the split.
- Revisit trigger: Portfolio and Studio have passed deployed validation and the apex-domain cutover is stable.

## ADR-002 — One program PR with deployable commits

- Date: 2026-07-17
- Status: Accepted
- Task IDs: PLATFORM-00 through PLATFORM-12
- Context: The user requires the complete restructure to remain reviewable and revertible as one PR instead of being distributed across many PRs.
- Options considered: one PR per phase; direct commits to `main`; or one long-lived program PR containing independently reviewable and deployable commits.
- Decision: use the single `codex/platform-planning` branch and one program PR, with small commits and explicit deployment/proof gates inside that PR.
- Why this is the smallest maintainable choice: it provides one Git rollback surface while retaining commit-level review and deployment checkpoints.
- Consequences: a completed slice is not a stopping point, and no additional implementation PR is opened unless the user changes this decision.
- Code or abstraction deleted/avoided: no temporary integration branches or PR chains.
- Revisit trigger: an external provider or repository policy makes the single-PR approach impossible.

## ADR-003 — Rename Studio before the apex cutover

- Date: 2026-07-17
- Status: Accepted
- Task IDs: PLATFORM-07, PLATFORM-09, PLATFORM-11
- Context: ADR-001 originally retained a dual Portfolio/Studio runtime until after apex cutover. The user confirmed there is no meaningful traffic or dependency requiring that compatibility layer and explicitly accepted temporary production disruption.
- Options considered: retain hostname-selected application identity until apex cutover; create a second Studio Vercel project; or rename the existing product application and Vercel project in place before moving the apex.
- Decision: physically rename `apps/jayantgoyal` and package/filter `jg` to `apps/studio` and `studio`; make Studio a single-purpose runtime on every host; rename and repoint the existing Vercel project in place; redirect Portfolio-owned legacy URLs to Portfolio; then move the apex and `www` to Portfolio.
- Why this is the smallest maintainable choice: folder, package, workspace filter, Vercel project, domain, and runtime identity now describe the same application without a temporary hostname-based product mode or duplicate deployment project.
- Consequences: the old apex may temporarily render Studio or fail between project and domain changes; that disruption is accepted. Rollback is the Git revert plus restoring the prior Vercel project root/name and aliases.
- Code or abstraction deleted/avoided: dual-surface hostname classification, duplicated Portfolio routes/data/components in Studio, and a second Studio Vercel project.
- Revisit trigger: deployed evidence shows an unclassified production dependency on the former combined runtime.

## ADR-004 — Centralize proven infrastructure without centralizing application policy

- Date: 2026-07-17
- Status: Accepted
- Task IDs: PLATFORM-00, PLATFORM-07, PLATFORM-08, PLATFORM-10, PLATFORM-11
- Context: Portfolio, Studio, and Admin independently proved the same sidebar frame, responsive header, breadcrumb renderer, theme/motion providers, loading indicators, user-menu presentation, and welcome-form controls. Keeping those copies app-local created visual drift, while the earlier attempt to centralize all sidebar configuration also centralized route meaning, authorization, and product-specific navigation that must remain independent.
- Options considered: keep every implementation duplicated; centralize the entire application shell and all navigation/configuration; or centralize only proven behavior-neutral contracts and renderers while retaining app-owned adapters.
- Decision: `@repo/brand` owns names and title templates; `@repo/platform` owns canonical application hosts and URL construction; `@repo/seo` owns reusable public metadata/path rules; and `@repo/ui` owns shared shell, breadcrumb, provider, loading, user-menu, and authentication-presentation components. Each application still owns its navigation inventory, route-to-breadcrumb meaning, Portfolio scroll behavior, Studio product/session state, Admin role gating, Supabase clients, cookies, callbacks, MFA, redirects, and authorization.
- Why this is the smallest maintainable choice: common mechanics have one implementation, but no shared package needs to know product routes, user roles, Supabase state, or application-specific behavior.
- Consequences: a visual or accessibility correction to common chrome can be applied once. Shared components accept data and callbacks; they do not fetch sessions, infer roles, or decide destinations. `packages/auth` remains deferred until the shared-session phases.
- Code or abstraction deleted/avoided: duplicated theme/motion/loading providers, duplicated sidebar/header/breadcrumb renderers, duplicated login-card controls, and the rejected global navigation-policy object.
- Revisit trigger: a second application independently proves an additional behavior-neutral pattern, or a shared component begins accumulating application-specific conditionals.
