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

## ADR-005 — Continue post-merge work in focused PRs

- Date: 2026-07-17
- Status: Accepted
- Task IDs: PLATFORM-07 through PLATFORM-12
- Context: The user explicitly requested that the completed application split be merged. PR #39 is now merged as commit `4703e7c83d0b92935dc8dd10a3535a2f7d51a426`, so ADR-002's single open-PR rollback surface no longer exists.
- Options considered: reopen or rewrite the merged history; continue directly on `main`; or preserve the merged boundary and use focused post-merge PRs for the remaining program work.
- Decision: preserve PR #39 and continue from current `origin/main` in focused, phase-sized PRs with reviewable commits, proof updates, and explicit rollback notes. Avoid PR-per-file churn; one coherent shared-foundation or phase slice remains the preferred unit.
- Why this is the smallest maintainable choice: it respects the accepted merge, keeps `main` history intact, and gives every remaining change a reversible review boundary.
- Consequences: ADR-002 remains the historical record for PR #39 but no longer constrains future work to its merged branch. The program goal and phase gates remain unchanged.
- Code or abstraction deleted/avoided: no history rewrite, forced push, or direct unreviewed implementation on `main`.
- Revisit trigger: the user explicitly changes the shipping strategy again.

## ADR-006 — Use exactly Development, Preview, and Production

- Date: 2026-07-17
- Status: Accepted
- Task IDs: PLATFORM-00, PLATFORM-01, PLATFORM-04, PLATFORM-05, PLATFORM-06, PLATFORM-07, PLATFORM-08, PLATFORM-09, PLATFORM-12
- Context: The four-context plan added a persistent `staging` branch, custom staging domains, branch-scoped Vercel variables, DNS records, Auth callbacks, and a second parent-cookie contract. The user explicitly rejected that operational layer and chose localhost Development, Vercel-managed Preview, and final-domain Production only.
- Options considered: keep stable staging for cross-subdomain SSO; replace it with Vercel custom environments; or use generated Preview URLs for application-local checks and reserve cross-subdomain proof for a controlled Production rollout.
- Decision: remove the persistent staging branch and every staging-only DNS, Vercel domain, environment-variable, Supabase callback, cookie, and documentation contract. Preview remains provider-managed and proves build, route, UI, and same-application auth behavior. Production is the only environment that proves parent-domain cookies and cross-subdomain SSO.
- Why this is the smallest maintainable choice: it matches the three environments actually used, removes duplicated provider state, and avoids maintaining a production-like domain and cookie topology solely for tests.
- Consequences: unrelated Vercel preview hosts cannot prove shared-cookie SSO. PLATFORM-04 through PLATFORM-06 therefore require strong local/application-local Preview coverage, an explicit production rollout flag or reversible deployment boundary, controlled test personas, immediate rollback readiness, and production observation. Current Studio/Admin Vercel preview hostname families remain narrowly allowlisted for same-application OAuth callbacks.
- Code or abstraction deleted/avoided: four stable staging hosts, one long-lived branch, six branch-only environment values, a staging cookie namespace, and a custom preview token broker.
- Revisit trigger: production auth risk cannot be reduced to an acceptable controlled rollout without a production-like environment, or Vercel introduces a materially simpler first-class cross-project Preview domain/cookie contract.

## ADR-007 — Retain the shared Studio shell on public discovery

- Date: 2026-07-17
- Status: Accepted
- Task IDs: PLATFORM-07, PLATFORM-11
- Context: The initial Phase 11 checklist proposed a separate marketing layout without a workspace sidebar. During deployed visual review, the user explicitly selected the same responsive sidebar/header behavior for Portfolio, Studio, and Admin and asked Studio to remain the reference implementation.
- Options considered: remove the shell from Studio Home and product pages; keep the entire current product workspace on the landing page; or retain the shared application shell while separating public discovery content from product workspace content.
- Decision: Studio Home, `/products`, and public product-detail pages use the same shared responsive shell as the rest of Studio. Home shows an intentional featured subset; the catalog and details disclose access before launch; product-specific data, permissions, and workspace UI remain inside the launched route.
- Why this is the smallest maintainable choice: it preserves the user-approved navigation behavior and one proven shell implementation while still creating a clear discovery-to-launch boundary.
- Consequences: the Phase 11 layout gate measures separation of discovery content from workspace content rather than absence of the shared sidebar. Shared UI remains route-agnostic; Studio continues to own inventory, breadcrumbs, access labels, and launch destinations.
- Code or abstraction deleted/avoided: no second marketing shell, duplicated responsive header, or global product-navigation policy.
- Revisit trigger: public discovery performance or usability evidence shows the shared shell materially harms visitors, or another application proves a reusable marketing-shell contract.

## ADR-008 — Freeze UI and use local automated implementation proof

- Date: 2026-07-17
- Status: Accepted
- Task IDs: PLATFORM-01 through PLATFORM-12
- Context: The application split and shared shell are usable enough to continue, while repeated browser and post-deployment checks were consuming disproportionate time and tokens. The user explicitly paused further UI refinement and asked Codex to validate implementation locally, leaving deployed acceptance to the user's manual pass.
- Options considered: continue automated browser/deployment validation after every slice; remove all validation; or use focused Vitest regression files plus one local type/lint/build gate per slice and reserve deployed checks for the user.
- Decision: freeze Portfolio, Studio, Admin, and `/products` UI unless the user reports a blocker. Codex uses focused local tests while implementing and one non-repeated local quality pass before shipping. Codex does not perform browser, Preview, Production, or observation-window validation; the user manually validates deployments and reports blockers for focused correction.
- Why this is the smallest maintainable choice: it keeps deterministic safety checks close to the code without turning every infrastructure slice into a long interactive deployment exercise.
- Consequences: a local-green slice may merge while its deployed/manual acceptance remains pending. Phase statuses and proof records must distinguish implementation completion from user-owned deployed acceptance; no phase that still requires a blueprint deployment or observation gate is marked Done solely from local proof.
- Code or abstraction deleted/avoided: no browser harness, stored browser credentials, deployment-wait loop, or repeated formatting/build cycle is added merely to satisfy Codex-side observation.
- Revisit trigger: the user reports a deployed blocker, asks Codex to resume browser validation, or a change cannot be validated meaningfully with local deterministic tests.

## ADR-009 — Versioned shared-session rollout modes

- Date: 2026-07-17
- Status: Accepted
- Task IDs: PLATFORM-01, PLATFORM-04, PLATFORM-05, PLATFORM-06, PLATFORM-12
- Context: Studio and Admin currently use Supabase's host-only `sb-<project-ref>-auth-token` storage key, including numeric chunks. The Production contract requires a new, unambiguous parent-domain name, while generated Vercel Preview hosts cannot share a cookie and HTTP localhost cannot use a `__Secure-` name without the Secure attribute.
- Options considered: change the Domain on the existing name; require every user to reauthenticate; copy unvalidated token data; or introduce an explicit versioned name with validated server-side promotion and rollback modes.
- Decision: use `legacy`, `compatibility`, and `platform` modes controlled by the public, non-sensitive `NEXT_PUBLIC_AUTH_SESSION_MODE` build input. `legacy` is the default and rollback state. `compatibility` prefers `__Secure-jg-session-v1`, validates a legacy session with `getUser()`, transfers credentials only in server memory through `setSession()`, then validates the promoted user again. `platform` removes legacy fallback in the cleanup phase. Trusted Production hosts use Domain `jayantgoyal.com`, Path `/`, Secure, and SameSite Lax. Generated Previews use the secure name host-only. Localhost uses host-only `jg-session-v1` without Secure or Domain so all local ports share it without violating cookie-prefix rules.
- Why this is the smallest maintainable choice: one shared policy drives browser, Server Component, callback, and Proxy clients; no tokens enter URLs, logs, database tables, or application policy; and one flag restores the current storage behavior.
- Consequences: when both names exist, the platform name wins and legacy state cannot resurrect an invalid platform session. Failed promotion can serve the already validated legacy client for that request, while invalid legacy state is ignored. Ordinary logout is explicitly local; global logout requires an explicit action. Cross-subdomain proof remains user-owned Production validation under ADR-008.
- Code or abstraction deleted/avoided: no same-name Domain ambiguity, preview token broker, custom session registry, real-time logout bus, or fourth environment.
- Revisit trigger: Supabase changes its SSR storage/chunk contract, a controlled rollout exposes refresh races, or a trusted application host is added or removed.

## ADR-010 — Build Auth locally before provider linking and cutover

- Date: 2026-07-17
- Status: Accepted
- Task IDs: PLATFORM-05, PLATFORM-06
- Context: PLATFORM-04's local compatibility implementation is complete, while Preview/Production acceptance remains user-owned under ADR-008. The user asked to stop UI refinement and continue setup work without Codex browser or deployed testing.
- Options considered: pause all Auth work until deployed compatibility observation; create and link an empty provider project; or build the complete independently deployable Auth boundary locally while leaving every provider, domain, redirect, and rollout flag untouched.
- Decision: add `apps/auth` at port `3003` with the approved initial routes and security controls, but do not create/link a Vercel project, attach `auth.jayantgoyal.com`, change hosted Supabase URLs, or redirect Studio/Admin. Auth uses the existing shared session modes with `legacy` as its source default. OAuth/callback GET is limited to standards-required protocol completion; logout and account mutations remain same-origin POST actions.
- Why this is the smallest maintainable choice: the final application boundary and deterministic security behavior can be reviewed now without exposing users to a partial cutover or inventing a fourth environment.
- Consequences: PLATFORM-05 becomes In Progress but cannot be Done until the user completes generated-Preview and controlled Production dark-launch acceptance. Existing Studio/Admin auth remains the rollback path and default owner.
- Code or abstraction deleted/avoided: no placeholder Vercel project, DNS record, broad Preview wildcard, service-role dependency, GET logout, duplicated session registry, or default redirect to an unverified app.
- Revisit trigger: local Auth contracts fail, shared-session Production proof contradicts the Auth assumptions, or the user authorizes the provider-linking and manual acceptance step.

## ADR-011 — Link Auth providers without changing the live auth owner

- Date: 2026-07-17
- Status: Accepted
- Task IDs: PLATFORM-05, PLATFORM-06
- Context: The reviewed Auth boundary is merged, while the user wants setup work to continue without Codex browser or post-deployment functional testing.
- Decision: create and Git-link the exact `jayantgoyal-auth` Vercel project at `apps/auth`, add only its public environment contract, assign `auth.jayantgoyal.com`, and apply a scoped hosted Supabase patch for the Auth Preview callback family, TOTP, and manual identity linking. Keep the hosted Supabase Site URL on Portfolio and leave Studio/Admin routes and `legacy` session mode unchanged.
- Consequences: provider infrastructure can be deployed and tested manually without making Auth canonical. Missing Cloudflare DNS prevents accidental Production traffic. Generated Preview and Production acceptance remain user-owned under ADR-008.
- Rollback: remove the Auth project-domain assignment and Preview callback family, disable TOTP/manual linking only if they cause a verified regression, and leave the existing Site URL and Studio/Admin auth routes untouched.
- Revisit trigger: the first Git deployment is ready, Cloudflare DNS authority is available, or manual acceptance reports a provider/session mismatch.

## ADR-012 — Separate Auth entry ownership from session migration

- Date: 2026-07-17
- Status: Accepted
- Task IDs: PLATFORM-04, PLATFORM-05, PLATFORM-06
- Context: Auth DNS can be prepared before Vercel's deployment quota resets,
  but making Auth the login owner and changing the shared-cookie mode are two
  distinct rollout risks that need independent rollback controls.
- Decision: use `NEXT_PUBLIC_AUTH_FLOW_OWNER=legacy|auth` for only the new login
  entry handoff. Keep `legacy` as the default. The shared URL builder accepts
  only canonical Auth or local port `3003`, constructs an exact absolute return
  destination from the requesting application, and rejects external paths.
  `NEXT_PUBLIC_AUTH_SESSION_MODE` continues to control cookie compatibility
  independently. Legacy callback, recovery, MFA, and logout routes remain.
- Consequences: Studio and Admin can ship the adapter without changing live
  traffic. After Auth deployment/manual acceptance and shared-session readiness,
  the owner can be enabled separately and rolled back without revoking sessions.
- Code or abstraction deleted/avoided: no coupled mega-flag, open redirect,
  immediate callback deletion, or requirement to deploy during the provider
  quota window.
- Revisit trigger: the first Auth deployment is accepted, a controlled owner
  rollout starts, or return/session behavior differs from the local contracts.
