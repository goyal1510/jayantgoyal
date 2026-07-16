# Platform Restructure — Phased Implementation Guide and Checklist

**Date:** 2026-07-16
**Status:** Planning complete; implementation not started
**Architecture source:** [Platform Architecture Blueprint](./2026-07-16-platform-architecture-blueprint.md)
**Scope:** Resumable, phase-wise implementation plan for Portfolio, Studio, Admin, Auth, shared SSO, deployments, redirects, and cleanup

> This guide is a persistent execution queue. Future implementers should update task statuses, proof notes, decisions, and residual risks here or in the linked proof ledger as work progresses. A task is not Done merely because files changed.

---

## 1. How to use this guide

At the start of any implementation session:

1. Read the Architecture Blueprint.
2. Read this Operating Contract and the current task queue.
3. Refresh `origin/main` and inspect existing worktrees and open PRs.
4. Select the first Pending task whose dependencies are Done.
5. Create or enter one task-specific worktree.
6. Mark only that task In Progress.
7. Implement the smallest deployable PR slice.
8. Run the required verification matrix.
9. Complete the required review gates.
10. Write a proof note.
11. Mark the task Done only after deployment or the stated exit gate is satisfied.
12. Convert every unexpected failure into a new task, blocker, or explicit deferral.

Do not restart the architecture discussion in each session unless new evidence invalidates an approved contract.

---

## 2. Operating Contract

### 2.1 Source contract

The binding architecture contract is:

- [Platform Architecture Blueprint](./2026-07-16-platform-architecture-blueprint.md)

When implementation convenience conflicts with the Blueprint, stop and record an architecture decision rather than silently changing the boundary.

### 2.2 Current build scope

- Add `packages/auth` as narrowly shared web authentication infrastructure.
- Add `apps/auth` and deploy `auth.jayantgoyal.com`.
- Establish one shared production session across trusted subdomains.
- Preserve current authentication during migration.
- Make the current application the technical predecessor of Studio.
- Deploy `studio.jayantgoyal.com` independently.
- Build a focused Portfolio application.
- Cut the root domain to Portfolio without losing product routes.
- Expand Admin navigation and content ownership to Portfolio, Studio, and System.
- Redesign Studio discovery separately from the technical move.
- Remove legacy auth and combined-shell duplication after an observation window.

### 2.3 Deferred scope

- Passkeys
- SAML
- Public API tokens
- Full active-device/session browser
- New database schemas
- A general permission framework
- Dedicated API, docs, mobile, desktop, extension, or CLI applications
- A universal content, database, contracts, or utilities package

Deferred items may be reactivated only by a real product requirement and a separate reviewed task packet.

### 2.4 Global constraints

- Every PR must leave production deployable.
- No phase may require simultaneous irreversible changes across all deployments.
- Existing authentication remains available until Auth has passed dark-launch validation.
- Existing callbacks and recovery links receive a compatibility window.
- No refresh token, access token, authorization code, secret, or credential appears in URLs, logs, screenshots, or proof notes.
- No database redesign is bundled with an application split.
- No visual redesign is bundled with the initial technical Studio move.
- No legacy code is removed until traffic and compatibility evidence show it is safe.
- New packages require at least two current consumers.

### 2.5 Stop conditions

Stop and request a decision if any of these occurs:

- Required Vercel, DNS, provider, or Supabase access is unavailable.
- A proposed change could invalidate production sessions without a tested fallback.
- Host-only and parent-domain cookies with the same name are both present or ambiguously selected.
- Safe session promotion cannot be demonstrated.
- Authenticated responses containing `Set-Cookie` can be publicly cached.
- Admin authorization or AAL2 enforcement can be bypassed.
- A callback or recovery migration breaks previously issued links.
- A return URL can escape the platform allowlist.
- A destructive database choice is required.
- A new schema or application boundary is necessary but not approved.
- A validation failure remains unexplained after one scoped retry.
- A security risk cannot be mitigated inside the current task.

### 2.6 Proof-note location

Create the execution proof ledger when implementation begins:

```text
docs/migrations/platform-restructure/proof-ledger.md
```

Each task also updates the relevant `docs/sessions/` entry according to repository rules.

---

## 3. Status rules

| Status | Meaning |
| --- | --- |
| Pending | Scoped and ready when dependencies are satisfied |
| In Progress | Actively being implemented or verified |
| Blocked | Cannot proceed without a named decision, credential, or external change |
| Done | Implementation, verification, review gates, deployment/exit gate, and proof note are complete |
| Deferred | Explicitly outside current scope with a reactivation trigger |

Only one task should be In Progress per implementation lane.

---

## 4. Phase and task summary

| Order | Task ID | Phase | Status | Production behavior after phase |
| ---: | --- | --- | --- | --- |
| 0 | PLATFORM-00 | Baseline and contracts | Done | No behavior change |
| 1 | PLATFORM-01 | Authentication regression foundation | Done | No behavior change |
| 2 | PLATFORM-02 | Supabase dependency and SSR hardening | In Progress | Existing auth behavior preserved |
| 3 | PLATFORM-03 | Extract `packages/auth` | Pending | Existing routes and cookies preserved |
| 4 | PLATFORM-04 | Shared-cookie compatibility | Pending | Current apps understand the platform session |
| 5 | PLATFORM-05 | Auth dark launch | Pending | Existing auth remains primary; Auth is testable |
| 6 | PLATFORM-06 | Canonical Auth cutover | Pending | New login/security flows use Auth |
| 7 | PLATFORM-07 | Studio technical deployment | Pending | Existing products also run at Studio |
| 8 | PLATFORM-08 | Portfolio application | Pending | Portfolio deploys independently before root cutover |
| 9 | PLATFORM-09 | Domain and route cutover | Pending | Root is Portfolio; product routes redirect to Studio |
| 10 | PLATFORM-10 | Admin domain organization | Pending | Admin manages Portfolio, Studio, and System |
| 11 | PLATFORM-11 | Studio product experience | Pending | Public discovery precedes product workspaces |
| 12 | PLATFORM-12 | Legacy cleanup and hardening | Pending | Compatibility code removed with evidence |

The technical move and visual redesign are intentionally separate. Studio may temporarily serve the existing product shell before the new discovery experience is released.

---

## 5. Interface Contracts

### 5.1 Application URLs

| Application | Production URL | Local URL | Stable staging URL |
| --- | --- | --- | --- |
| Portfolio | `https://jayantgoyal.com` | `http://localhost:3000` | `https://portfolio.staging.jayantgoyal.com` |
| Studio | `https://studio.jayantgoyal.com` | `http://localhost:3001` | `https://studio.staging.jayantgoyal.com` |
| Admin | `https://admin.jayantgoyal.com` | `http://localhost:3002` | `https://admin.staging.jayantgoyal.com` |
| Auth | `https://auth.jayantgoyal.com` | `http://localhost:3003` | `https://auth.staging.jayantgoyal.com` |

### 5.2 Identity contract

- Canonical identity: `auth.users.id`
- Profile extension: one `jg_account.profiles` row keyed by the canonical UUID
- No application-specific user tables
- Email is display/contact data, never a relational identity key
- SAML identity linking limitations must be reviewed before SAML activation

### 5.3 Cookie contract

Production target:

```text
Name:     __Secure-jg-session-v1
Domain:   jayantgoyal.com
Path:     /
Secure:   true
SameSite: Lax
```

Staging uses a distinct name and `Domain=staging.jayantgoyal.com`. Local development omits Domain and Secure.

Cookie removal must use the same Domain and Path used when setting the cookie.

### 5.4 Auth redirect contract

Unauthenticated protected routes redirect to:

```text
https://auth.jayantgoyal.com/login?return_to=<validated destination>
```

Allowed destinations are relative paths or exact allowlisted platform origins. Auth owns login, registration, recovery, MFA, and new-flow callbacks.

### 5.5 Authorization contract

| Application | Policy owner | Required checks |
| --- | --- | --- |
| Portfolio | Portfolio | None for normal public content |
| Studio | Owning product | Valid identity only where product data requires it; product-local permissions |
| Admin | Admin | Valid identity, current database-backed role, AAL2 |
| Auth | Auth | Valid identity for account pages; recent auth/AAL2 for sensitive changes |

### 5.6 Data ownership contract

| Schema | Owner semantics | Consumers |
| --- | --- | --- |
| `auth` | Supabase identities and sessions | Auth infrastructure; validated identity in applications |
| `jg_account` | Profiles, roles, terms, account-level state | Auth, Admin, and authorized product checks |
| `portfolio` | Professional content | Portfolio reads; Admin manages |
| `jg_app` | Studio product data | Studio reads/writes by product; Admin manages approved metadata |

### 5.7 Error and retry contract

- Refresh failure: re-read current cookie and retry once before reauthentication.
- Provider cancellation: return to Auth with a user-safe retry path.
- Invalid return destination: reject and use the application default.
- Auth unavailable: preserve current application page and offer retry; existing valid sessions continue.
- Role denied: render Admin unauthorized state, not a login loop.
- AAL insufficient: redirect to Auth step-up and return to the original Admin destination.
- Product API failure: remain owned by the Studio product; do not route through Auth.

### 5.8 Persistence and offline behavior

- Existing Zustand persisted stores must retain their keys through the technical Studio move unless a product-specific migration is approved.
- Session persistence remains managed by Supabase Auth and the shared cookie adapter.
- No custom offline identity store is introduced.
- Public Portfolio pages should remain available when authentication services are unavailable.

---

## 6. PR discipline

Each task may require multiple small PRs. A preferred PR should:

- Have one behavioral purpose.
- Avoid mixing folder moves, dependency upgrades, design changes, and database changes.
- Include its own rollback path.
- Preserve compatibility with the previous deployed application version where cross-deployment ordering matters.
- Update the proof ledger and session entry.
- Pass focused checks before broad repository checks.

Recommended maximum conceptual scope:

- One dependency upgrade
- One package extraction slice
- One route family
- One deployment boundary
- One redirect family
- One application navigation domain

---

## 7. Persistent Task Queue

## Phase 0 — Baseline and contracts

Task ID: PLATFORM-00
Status: Done
Objective: Establish a verified source-of-truth inventory and freeze the migration contracts before implementation.
Dependencies: None.
Target files/surfaces: Architecture docs, route inventory, auth surface inventory, environment inventory, deployment inventory, database schema inventory.
Allowed changes: Documentation, tests that do not affect production behavior, read-only diagnostics.
Forbidden changes: Runtime behavior, dependencies, cookies, DNS, Vercel projects, Supabase configuration, database migrations.
Acceptance checks:
- API/BFF: Catalogue every current API route, auth callback, recovery route, and privileged endpoint with target owner.
- native/client: Catalogue every current page, protected route, persisted store key, and user-facing navigation destination.
- offline/retry: Record current refresh, logout, recovery, and failed-provider behavior.
- source/security scan: Record service-role usage, duplicated clients, MFA surfaces, route guards, cookie names, and caching behavior.
- black-box: Capture the current login, signup, recovery, MFA, product access, Portfolio, and Admin journeys.
Proof note required: Current commit, deployed projects/domains, environment names, route inventory location, and known baseline failures.
Stop/escalate if: The current deployed behavior or authoritative environment cannot be identified.

### Phase 0 checklist

- [x] Refresh `origin/main` and record the baseline commit.
- [x] Confirm the production Vercel project for the current main app.
- [x] Confirm the production Vercel project for Admin.
- [x] Confirm all current production domains and aliases.
- [x] Confirm the linked Supabase project without recording secrets.
- [x] Inventory current auth cookie names and attributes in a real browser.
- [x] Inventory auth pages in `apps/jayantgoyal`.
- [x] Inventory auth pages in `apps/admin`.
- [x] Inventory server, browser, and service-role Supabase clients.
- [x] Inventory current proxy route classifications.
- [x] Inventory all current routes into Portfolio, Studio, Auth, Admin, compatibility, or undecided.
- [x] Inventory persisted browser storage keys.
- [x] Inventory database tables by schema and owning feature.
- [x] Inventory current environment-variable names by application.
- [x] Record existing behavior that must be preserved.
- [x] Resolve every undecided route before PLATFORM-07.

### Phase 0 exit gate

- [x] No route, environment, deployment, auth surface, or schema ownership remains unknown.
- [x] Baseline production journeys are reproducible.
- [x] No production behavior has changed.

---

## Phase 1 — Authentication regression foundation

Task ID: PLATFORM-01
Status: Done
Objective: Add enough automated and manual regression coverage to change authentication safely.
Dependencies: PLATFORM-00 Done.
Target files/surfaces: Current authentication flows in `apps/jayantgoyal` and `apps/admin`; test tooling approved for the repository.
Allowed changes: Test framework configuration, test-only fixtures, browser tests, non-production diagnostics.
Forbidden changes: Authentication behavior, cookie contract, callback locations, production route protection.
Acceptance checks:
- API/BFF: Cover callback success/failure, session refresh, role denial, account endpoints, and logout scopes.
- native/client: Cover password login, Google/GitHub paths where safely testable, recovery, MFA challenge, Studio-product access, and Admin access.
- offline/retry: Cover expired session, failed refresh, provider cancellation, and stale browser state.
- source/security scan: Confirm test fixtures contain no real credentials or tokens.
- black-box: Run baseline journeys against a production-like environment and record pass/fail.
Proof note required: Test commands, environment, test personas, coverage boundaries, and known manual-only paths.
Stop/escalate if: Baseline auth is already failing or no safe test environment exists.

### Phase 1 checklist

- [x] Choose the smallest sustainable browser/integration test setup.
- [x] Add a public Portfolio/current-home smoke test.
- [x] Add unauthenticated protected-route redirect coverage.
- [x] Add authenticated current-app navigation coverage.
- [x] Add Admin non-admin denial coverage.
- [x] Add Admin admin-role success coverage.
- [x] Add AAL1-to-AAL2 step-up coverage.
- [x] Add current-session logout coverage.
- [x] Add global logout coverage where practical.
- [x] Add callback invalid-code behavior coverage.
- [x] Add recovery-link compatibility coverage.
- [x] Document provider flows that remain manual.

### Phase 1 exit gate

- [x] The current auth contract can fail a test before production is affected.
- [x] Manual-only provider paths have an explicit staging checklist.
- [x] No runtime auth behavior has changed.

### Phase 1 deferred/manual coverage

- [ ] Provision disposable normal-user, non-admin, and AAL2 Admin personas in an
      approved production-like environment before enabling credential-gated runs.
- [ ] Run the five credential-gated password, navigation, authorization, MFA, and
      logout journeys without retaining authentication artifacts.
- [ ] Complete the current-provider rows in the stable-staging manual checklist;
      complete GitHub rows only after the approved Auth phase enables GitHub.

---

## Phase 2 — Supabase dependency and SSR hardening

Task ID: PLATFORM-02
Status: In Progress
Objective: Upgrade and validate Supabase SSR dependencies independently before extracting shared infrastructure.
Dependencies: PLATFORM-01 Done.
Target files/surfaces: Supabase dependencies, current server/browser clients, proxy cookie handling, cache headers.
Allowed changes: One reviewed dependency upgrade and compatibility fixes required by that upgrade.
Forbidden changes: New Auth app, parent-domain cookie, callback relocation, application split.
Acceptance checks:
- API/BFF: Current callback, refresh, role, and account endpoints pass after upgrade.
- native/client: Current login, recovery, MFA, logout, and protected navigation pass.
- offline/retry: Stale-refresh and concurrent-refresh scenarios remain recoverable.
- source/security scan: Per-request clients, `getAll`/`setAll`, validation method, cookie deletion, and cache headers reviewed.
- black-box: Existing production-equivalent journeys pass with current cookie behavior.
Proof note required: Old/new versions, changelog risks, commands, browser results, and rollback version.
Stop/escalate if: The dependency upgrade changes session serialization or invalidates existing sessions without a compatibility plan.

### Phase 2 checklist

- [x] Review current Supabase SSR and client release notes.
- [x] Upgrade in a dedicated PR.
- [x] Ensure no Supabase client is shared across requests.
- [x] Verify request and response cookies are both updated.
- [x] Verify responses setting cookies are private and non-cacheable.
- [x] Verify server authorization does not trust unvalidated `getSession()` user data.
- [x] Verify cookie deletion preserves original path/domain semantics.
- [x] Run all Phase 1 checks.
- [ ] Deploy and observe before starting package extraction.

### Phase 2 rollback

- Revert only the dependency upgrade PR.
- Retain Phase 1 tests.
- Do not continue to PLATFORM-03 until the current auth behavior is stable.

---

## Phase 3 — Extract `packages/auth`

Task ID: PLATFORM-03
Status: Pending
Objective: Replace duplicated authentication infrastructure with a small shared package without changing routes, UI, or cookie behavior.
Dependencies: PLATFORM-02 Done.
Target files/surfaces: `packages/auth`, current main and Admin browser/server clients, proxy refresh helpers, claims and redirect utilities.
Allowed changes: Behavior-preserving extraction used immediately by both applications.
Forbidden changes: Auth pages in the package, callback relocation, new cookie name/domain, role-query abstraction, product permissions.
Acceptance checks:
- API/BFF: Existing callbacks and protected endpoints behave identically.
- native/client: Existing sessions, login, MFA, recovery, and logout remain valid.
- offline/retry: Existing refresh behavior and retry outcomes remain unchanged.
- source/security scan: Browser/server exports are isolated; no secret or service-role utility is exposed to browser imports.
- black-box: Current main and Admin flows pass before and after extraction.
Proof note required: Removed duplication, package consumers, unchanged interfaces, commands, and rollback path.
Stop/escalate if: The package begins absorbing application policy or UI.

### Phase 3 checklist

- [ ] Define package subpath exports for browser, server, proxy, cookies, redirects, session, permissions, and types.
- [ ] Move only duplicated browser client construction.
- [ ] Move only duplicated per-request server client construction.
- [ ] Move only duplicated refresh/cookie adapter behavior.
- [ ] Add safe relative/origin redirect validation.
- [ ] Add pure AAL and role predicates only if currently duplicated.
- [ ] Keep Admin role lookup in Admin.
- [ ] Keep route matchers in each application.
- [ ] Keep authentication UI in current applications until Auth exists.
- [ ] Remove replaced local infrastructure after both consumers pass.
- [ ] Confirm the package deletes more code than it adds conceptually.

### Phase 3 exit gate

- [ ] Main and Admin import the same auth infrastructure.
- [ ] No user-visible flow or cookie has changed.
- [ ] No application policy moved into the shared package.

---

## Phase 4 — Shared-cookie compatibility

Task ID: PLATFORM-04
Status: Pending
Objective: Introduce a versioned parent-domain session contract while preserving or safely transitioning existing sessions.
Dependencies: PLATFORM-03 Done and stable in production.
Target files/surfaces: Shared cookie policy, current main and Admin session adapters, compatibility/promotion logic, staging domains.
Allowed changes: Versioned platform cookie, dual-read or validated server-side promotion, feature flags, staging-only rollout first.
Forbidden changes: Same-name host/domain cookie ambiguity, tokens in URLs, removing legacy cookies immediately, Auth cutover.
Acceptance checks:
- API/BFF: Both current apps validate and refresh the platform cookie consistently.
- native/client: A user authenticated in one app can open the other without credential login, subject to authorization.
- offline/retry: Concurrent refresh, stale cookie, expired access token, and revoked session recover correctly.
- source/security scan: Domain, Path, Secure, SameSite, Max-Age, deletion, CSP, cache headers, and subdomain threat model reviewed.
- black-box: Cross-subdomain SSO, step-up MFA, local logout, global logout, and open-tab behavior verified on stable staging.
Proof note required: Cookie names and attributes without values, staging journeys, compatibility behavior, and residual risk.
Stop/escalate if: Legacy and platform cookies cannot be selected unambiguously or safe promotion cannot be proven.

### Phase 4 migration strategy

Use a new cookie name rather than changing the Domain attribute of the existing cookie name. Browsers may send both a host-only and domain cookie with the same name, creating ambiguous server behavior.

Preferred compatibility sequence:

1. Deploy code that understands the existing session and the new platform session.
2. On a trusted server response, validate the existing session before promoting it.
3. Write the new versioned parent-domain cookie without exposing tokens to the URL or logs.
4. Prefer the new platform session after successful promotion.
5. Retain legacy read support through the observation window.
6. Remove the legacy cookie using its original host/path semantics only after evidence shows it is safe.

If the Supabase storage format or chunking prevents safe promotion, choose one explicit reauthentication event rather than unsafe token copying.

### Phase 4 checklist

- [ ] Confirm the actual current cookie name and chunking behavior.
- [ ] Approve the versioned production and staging cookie names.
- [ ] Add environment-specific cookie configuration.
- [ ] Prove cookie deletion uses matching Domain and Path.
- [ ] Prove Studio/current main and Admin read the same session.
- [ ] Prove Admin still rejects non-admin users.
- [ ] Prove Admin still requires AAL2.
- [ ] Prove logout clears shared browser state.
- [ ] Prove access-token expiry behavior is understood.
- [ ] Test simultaneous refresh requests from two applications.
- [ ] Test local ports with host-only localhost cookies.
- [ ] Test stable staging subdomains.
- [ ] Record that arbitrary Vercel previews do not support full SSO.

### Phase 4 rollback

- Disable platform-cookie preference through the rollout flag.
- Continue reading the legacy cookie.
- Remove only the new platform cookie using its exact Domain and Path.
- Do not revoke otherwise valid Supabase sessions solely to roll back application code.

---

## Phase 5 — Auth dark launch

Task ID: PLATFORM-05
Status: Pending
Objective: Create and deploy the Auth application without making it the default production login path.
Dependencies: PLATFORM-04 Done on stable staging.
Target files/surfaces: `apps/auth`, Auth Vercel project, `auth.jayantgoyal.com`, staging Auth domain, Supabase redirect allowlist, provider callback configuration.
Allowed changes: New independently deployable Auth application and test-only/manual entry links.
Forbidden changes: Removing current auth routes, permanent production redirects, passkeys, SAML, API tokens, full session-device UI.
Acceptance checks:
- API/BFF: Callback exchange, verification, recovery, logout, and safe-return validation pass.
- native/client: Login, registration, recovery, MFA enrollment/challenge, connected provider, and account-security journeys pass.
- offline/retry: Provider cancellation, expired code, invalid callback, refresh failure, and Auth downtime produce recoverable states.
- source/security scan: CSP, CSRF, Origin validation, open redirects, service-role isolation, cache headers, and secret exposure reviewed.
- black-box: A session created on Auth is recognized by current main and Admin on stable staging.
Proof note required: Deployment identifiers, domains, provider matrix, cookie observations, security findings, and rollback path.
Stop/escalate if: Auth-created sessions are interpreted differently by another application.

### Phase 5 initial route checklist

- [ ] `/login`
- [ ] `/register`
- [ ] `/forgot-password`
- [ ] `/reset-password`
- [ ] `/verify`
- [ ] `/callback`
- [ ] `/mfa`
- [ ] `/account/security`
- [ ] `/account/providers`
- [ ] `/logout`
- [ ] Safe Auth error and retry route

### Phase 5 security checklist

- [ ] No state change through GET.
- [ ] Sensitive mutations verify Origin.
- [ ] High-risk changes require recent authentication or AAL2.
- [ ] `return_to` is relative or allowlisted.
- [ ] Provider and Supabase errors are user-safe.
- [ ] Tokens and authorization codes are absent from application logs.
- [ ] Auth responses with `Set-Cookie` are non-cacheable.
- [ ] Auth has a stricter third-party-script policy than Studio.
- [ ] Service-role access is absent unless a documented server-only operation requires it.

### Phase 5 exit gate

- [ ] Auth is independently deployable.
- [ ] Dark-launch users can complete all initial flows.
- [ ] Existing main and Admin auth remain available.

---

## Phase 6 — Canonical Auth cutover

Task ID: PLATFORM-06
Status: Pending
Objective: Make Auth the owner of new login and account-security flows while preserving legacy compatibility.
Dependencies: PLATFORM-05 Done and observed in production-like staging.
Target files/surfaces: Current login, registration, callback, recovery, MFA, account-security, and logout routes in main and Admin; navigation links; Auth return flow.
Allowed changes: Feature-flagged redirects, compatibility callbacks, navigation changes, removal of duplicated UI only after replacement is active.
Forbidden changes: Blind callback redirects, immediate legacy route deletion, product-route moves, Studio redesign.
Acceptance checks:
- API/BFF: Previously issued recovery/verification links remain valid through the compatibility window.
- native/client: Users entering from main/current Studio and Admin return to their original safe destination.
- offline/retry: Interrupted OAuth and stale login pages restart safely through Auth.
- source/security scan: Auth is the sole owner of new-flow UI; no open redirects or duplicate callback ambiguity remain.
- black-box: Login once, navigate between main/current Studio, Admin, Auth, and the public root without another credential prompt.
Proof note required: Cutover flag state, route compatibility matrix, old-link results, duplicate code removed, and residual traffic.
Stop/escalate if: An old recovery or callback URL cannot be handled safely.

### Phase 6 rollout checklist

- [ ] Add Auth links while current auth remains active.
- [ ] Enable Auth redirects for a controlled cohort/environment.
- [ ] Validate password login.
- [ ] Validate Google login.
- [ ] Validate GitHub login.
- [ ] Validate registration and email verification.
- [ ] Validate forgot/reset password.
- [ ] Validate MFA enrollment and challenge.
- [ ] Validate Admin AAL2 step-up through Auth.
- [ ] Validate current-session logout.
- [ ] Validate global logout.
- [ ] Retain legacy callback compatibility for the approved window.
- [ ] Retain legacy recovery compatibility for the approved window.
- [ ] Remove duplicated auth UI only after production evidence.

### Phase 6 rollback

- Disable redirects to Auth.
- Restore current auth entry routes without changing the Supabase identity or session.
- Keep the Auth app deployed for diagnosis.
- Do not remove the platform cookie if current apps already use it successfully.

---

## Phase 7 — Studio technical deployment

Task ID: PLATFORM-07
Status: Pending
Objective: Establish the current application as Studio’s technical lineage and deploy it independently before redesign.
Dependencies: PLATFORM-06 Done or Auth cutover explicitly stable enough for application moves.
Target files/surfaces: `apps/jayantgoyal` package/folder identity, workspace filters, Vercel Studio project, Studio domains, environment assumptions, product links.
Allowed changes: Behavior-preserving application rename/move and independent Studio deployment.
Forbidden changes: Product redesign, Portfolio root cutover, database redesign, persisted-store key changes, mass feature reorganization.
Acceptance checks:
- API/BFF: Existing product APIs behave identically on Studio.
- native/client: Existing products, navigation, uploads, realtime features, and persisted state function on Studio.
- offline/retry: Existing client persistence and recovery behavior remain readable after the host move.
- source/security scan: Hardcoded root-domain, cookie, callback, CORS, sitemap, metadata, and environment assumptions are inventoried and fixed only where necessary.
- black-box: Every classified Studio route works on the Studio deployment.
Proof note required: Deployment commit, Vercel project, domain, route matrix, persisted-state results, and rollback mapping.
Stop/escalate if: The current root application cannot remain available while Studio is introduced.

### Phase 7 recommended PR slices

- [ ] PR 1: Rename package/filter identifiers without folder move if useful.
- [ ] PR 2: Move `apps/jayantgoyal` to `apps/studio` with no behavior redesign.
- [ ] PR 3: Update workspace and deployment configuration.
- [ ] PR 4: Add Studio domain and production environment.
- [ ] PR 5: Fix only host-sensitive behavior proven by staging validation.

### Phase 7 product validation checklist

- [ ] Activity Tracker
- [ ] Calculator and history
- [ ] Custom Calculator
- [ ] Files and uploads
- [ ] Games and game sessions
- [ ] GitHub Stats
- [ ] Messenger and realtime behavior
- [ ] Developer tools and usage history
- [ ] Weather
- [ ] Terms/account initialization still required where intended
- [ ] Public metadata and robots behavior reviewed

### Phase 7 exit gate

- [ ] Studio is an independent Vercel project.
- [ ] Existing product behavior is stable on Studio.
- [ ] The root domain still serves the existing application until Portfolio is ready.

---

## Phase 8 — Portfolio application

Task ID: PLATFORM-08
Status: Pending
Objective: Build and deploy a focused Portfolio without copying Studio infrastructure.
Dependencies: PLATFORM-07 Done; Portfolio content ownership confirmed in PLATFORM-00.
Target files/surfaces: `apps/portfolio`, Portfolio Vercel project, staging domain, `portfolio` schema reads, contact and resume flows.
Allowed changes: New focused Portfolio application and selective reuse of proven presentation primitives/content access.
Forbidden changes: Studio product routes, authenticated workspace shell, service-role exposure, product navigation, broad shared content package.
Acceptance checks:
- API/BFF: Contact, resume, blog, and portfolio data paths work with least privilege.
- native/client: Home, About, Experience, Skills, Projects, Resume, Blog, and Contact are responsive and accessible.
- offline/retry: Public content has an approved fallback or failure state when Supabase/content is unavailable.
- source/security scan: No Studio product logic, protected shell, unnecessary auth refresh, or privileged key is included.
- black-box: A first-time visitor can answer “Who is Jayant?” without encountering authentication or product-dashboard UI.
Proof note required: Page matrix, SEO/canonical validation, data-source behavior, accessibility results, and deployment identifier.
Stop/escalate if: Portfolio requires copying a large Studio subsystem or a route remains unclassified.

### Phase 8 page checklist

- [ ] Home
- [ ] About
- [ ] Experience
- [ ] Skills
- [ ] Featured Projects
- [ ] Resume
- [ ] Blog index
- [ ] Blog article
- [ ] Contact
- [ ] Not-found and error states
- [ ] Sitemap
- [ ] Robots
- [ ] Open Graph and social metadata
- [ ] Structured data where appropriate

### Phase 8 lightness checklist

- [ ] No global protected layout.
- [ ] No product sidebar.
- [ ] No authentication proxy on static routes.
- [ ] No product state stores.
- [ ] No weather, files, messenger, games, tools, or activity dependencies.
- [ ] No service-role key unless a separately reviewed server-only operation proves it necessary.
- [ ] Shared UI use is limited to primitives.

### Phase 8 exit gate

- [ ] Portfolio is independently deployed on staging.
- [ ] Root-domain cutover is reversible.
- [ ] Every root route has a final owner or redirect.

---

## Phase 9 — Domain and route cutover

Task ID: PLATFORM-09
Status: Pending
Objective: Make Portfolio the root-domain application and permanently route product traffic to Studio without losing historical URLs.
Dependencies: PLATFORM-08 Done; Studio and Auth stable in production.
Target files/surfaces: Vercel domains, redirects, canonical metadata, sitemap, robots, navigation, compatibility callbacks, analytics.
Allowed changes: Reversible domain assignment, tested redirects, canonical URL updates, navigation changes.
Forbidden changes: Unclassified route deletion, blind permanent callback redirect, simultaneous Studio redesign, database changes.
Acceptance checks:
- API/BFF: Historical APIs and callbacks are preserved, versioned, or explicitly retired with evidence.
- native/client: Old bookmarks and internal links reach the correct final application without loops.
- offline/retry: Auth return destinations survive redirects and failures.
- source/security scan: Redirect allowlists, canonical URLs, callback handling, CORS, CSP, sitemap, and robots reviewed.
- black-box: Root Portfolio, Studio products, Auth round trips, and Admin access pass from historical and canonical URLs.
Proof note required: Final redirect ledger, DNS/domain changes, rollback sequence, analytics observation, and unresolved legacy traffic.
Stop/escalate if: Any path has unclear ownership or an in-flight callback cannot be handled safely.

### Phase 9 redirect checklist

Professional routes remain or map to Portfolio:

- [ ] `/`
- [ ] `/about`
- [ ] `/experience`
- [ ] `/skills`
- [ ] `/projects`
- [ ] `/resume`
- [ ] `/blog`
- [ ] `/blog/[slug]`
- [ ] `/contact`

Product routes permanently redirect to the same path on Studio when compatible:

- [ ] `/activity-tracker/**`
- [ ] `/calculator/**`
- [ ] `/custom-calculator/**`
- [ ] `/files/**`
- [ ] `/games/**`
- [ ] `/github-stats/**`
- [ ] `/messenger/**`
- [ ] `/tools/**`
- [ ] `/weather/**`

Auth routes use temporary redirects or compatibility handlers before retirement:

- [ ] `/login`
- [ ] `/signup` or `/register`
- [ ] `/forgot-password`
- [ ] `/reset-password`
- [ ] `/mfa-verify`
- [ ] `/auth/callback`
- [ ] `/welcome`

### Phase 9 cutover sequence

1. Confirm Studio, Portfolio, Auth, and Admin health.
2. Freeze unrelated domain and auth changes.
3. Deploy final redirect compatibility to the old root application.
4. Attach root production domains to Portfolio.
5. Verify certificate and canonical host behavior.
6. Run the full browser matrix.
7. Observe errors, redirect loops, callback failures, and 404s.
8. Roll back the domain assignment if a blocking failure appears.

---

## Phase 10 — Admin domain organization

Task ID: PLATFORM-10
Status: Pending
Objective: Organize Admin around Portfolio, Studio, and System while preserving current operations.
Dependencies: PLATFORM-09 Done or final content ownership stable.
Target files/surfaces: Admin navigation, route grouping, Portfolio CMS, Studio catalog management, users/access, deployments, terms/policies.
Allowed changes: Navigation reorganization, additive Studio metadata management, removal of duplicated self-service auth UI.
Forbidden changes: Editing infrastructure secrets in Admin, replacing product implementation, a generic CMS framework, new schemas without separate approval.
Acceptance checks:
- API/BFF: Existing portfolio, user, deployment, and approved Studio metadata operations retain authorization and validation.
- native/client: Admin navigation clearly groups Portfolio, Studio, and System.
- offline/retry: Failed operations report recoverable errors without partial silent state.
- source/security scan: Every mutation checks current role; privileged actions require AAL2; service-role boundaries are server-only.
- black-box: Admin and super_admin personas can perform approved operations; non-admin users cannot.
Proof note required: Navigation map, authorization matrix, mutations tested, audit gaps, and deployment result.
Stop/escalate if: Admin requires direct dependency on another application’s implementation.

### Phase 10 checklist

Portfolio:

- [ ] Profile/Hero
- [ ] About
- [ ] Experience
- [ ] Skills
- [ ] Projects
- [ ] Resume
- [ ] Blog
- [ ] Contact

Studio:

- [ ] Product catalog
- [ ] Categories/types
- [ ] Featured products
- [ ] Product metadata
- [ ] Product visibility/status
- [ ] Releases deferred until real need

System:

- [ ] Users and roles
- [ ] Deployments
- [ ] Terms and policies
- [ ] Operational settings
- [ ] Audit activity deferred or separately scoped

Security:

- [ ] Admin does not own login UI.
- [ ] Admin does not expose provider secrets.
- [ ] Admin does not display or modify user credentials.
- [ ] Self-service account security links to Auth.
- [ ] Operator-level revocation remains explicitly authorized and audited where possible.

---

## Phase 11 — Studio product experience

Task ID: PLATFORM-11
Status: Pending
Objective: Make Studio feel like an independent product brand with public discovery before authenticated workspaces.
Dependencies: PLATFORM-09 Done; technical Studio behavior stable.
Target files/surfaces: Studio marketing layout, product catalog, product detail pages, launch flow, authenticated workspace shell, feature organization.
Allowed changes: Studio UX, information architecture, selective feature-first organization, product catalog integration.
Forbidden changes: Portfolio identity content, Auth UI, Admin operations, feature framework, mass rewrite of working product domains.
Acceptance checks:
- API/BFF: Product metadata and launch requirements are represented without changing unrelated product APIs.
- native/client: Visitors can discover products without authentication and enter account-backed products through a clear launch flow.
- offline/retry: Public catalog failure and authenticated-product failure are distinct and recoverable.
- source/security scan: Public/private boundaries, metadata exposure, product route permissions, and shared-shell imports reviewed.
- black-box: Studio Home → Products → Product Detail → Launch → Auth if required → Workspace passes.
Proof note required: Information architecture, product matrix, public/auth boundaries, accessibility, performance, and deployment result.
Stop/escalate if: The redesign requires rewriting product behavior before the discovery shell can launch.

### Phase 11 navigation checklist

- [ ] Primary navigation begins with Home and Products.
- [ ] Apps, Games, Tools, AI, Experiments, and Open Source are filters/types initially.
- [ ] Search is available when catalog size justifies it.
- [ ] Featured products are intentional, not all products.
- [ ] Recently updated products use real data or are omitted.
- [ ] Authentication requirements are visible before launch.
- [ ] Product pages have a consistent Launch action.
- [ ] Related products are added only with meaningful relationships.

### Phase 11 layout checklist

- [ ] Marketing layout has no workspace sidebar.
- [ ] Product detail pages remain public where possible.
- [ ] Public product experiences do not require login unnecessarily.
- [ ] Workspace shell appears only after product launch.
- [ ] Product-specific permissions remain inside the owning feature.
- [ ] Professional writing links to Portfolio rather than duplicating content.
- [ ] Global Changelog remains deferred until a real release cadence exists.

### Phase 11 feature-organization checklist

- [ ] Files evaluated as a vertical feature.
- [ ] Messenger evaluated as a vertical feature.
- [ ] Activity Tracker evaluated as a vertical feature.
- [ ] Shared Games infrastructure evaluated before grouping all games.
- [ ] Weather and small tools remain route-local unless complexity proves otherwise.
- [ ] No feature folder is created solely for naming consistency.
- [ ] Generic `components`, `hooks`, and `lib` are reduced only when ownership becomes clearer.

---

## Phase 12 — Legacy cleanup and hardening

Task ID: PLATFORM-12
Status: Pending
Objective: Remove migration compatibility and duplication only after production evidence proves it is unused.
Dependencies: PLATFORM-10 and PLATFORM-11 Done; compatibility observation window complete.
Target files/surfaces: Legacy cookies, callbacks, login UI, redirects, combined shells, duplicate clients, obsolete environment variables, old Vercel aliases, stale DNS.
Allowed changes: Evidence-backed deletion, security hardening, documentation finalization.
Forbidden changes: Removing unexplained traffic paths, bundling unrelated refactors, deleting rollback evidence.
Acceptance checks:
- API/BFF: No valid legacy callback, recovery, or API traffic remains unexplained.
- native/client: Canonical application journeys pass with compatibility code disabled.
- offline/retry: Expired sessions, old bookmarks, and provider failures resolve safely.
- source/security scan: Dead auth code, duplicate clients, stale secrets, abandoned domains, caching, CSP, CSRF, and authorization reviewed.
- black-box: Full Portfolio → Studio → Auth → Admin journeys pass from clean and previously authenticated browsers.
Proof note required: Deleted surfaces, traffic evidence, security review, final route map, and residual risks.
Stop/escalate if: Any legacy route or cookie still receives valid unexplained traffic.

### Phase 12 checklist

- [ ] Remove legacy auth UI from Portfolio/Studio/Admin.
- [ ] Remove legacy callback handlers after the compatibility window.
- [ ] Remove legacy cookie reads and promotion logic.
- [ ] Clear legacy cookies using their original host/path attributes.
- [ ] Remove obsolete environment variables.
- [ ] Remove old Vercel aliases.
- [ ] Remove stale DNS records.
- [ ] Remove duplicated Supabase clients.
- [ ] Remove combined Portfolio/product shell code.
- [ ] Remove redirects that have completed their approved lifetime only when safe.
- [ ] Verify no new generic package was introduced without two consumers.
- [ ] Update AGENTS.md and repository commands for the final structure.
- [ ] Update diagrams, runbooks, environment docs, and deployment docs.
- [ ] Perform final dependency and dead-code review.
- [ ] Record remaining deferred work without implementing it.

### Phase 12 completion gate

- [ ] Four applications deploy independently.
- [ ] Login once works across production subdomains.
- [ ] Portfolio is public and lightweight.
- [ ] Studio provides public product discovery.
- [ ] Admin requires current role and AAL2.
- [ ] Auth owns all new identity/security UI.
- [ ] No unexplained legacy route or cookie traffic remains.
- [ ] The repository contains less duplicated auth and shell code than before migration.

---

## 8. Redirect ledger template

Populate this during PLATFORM-00 and keep it current through PLATFORM-12.

| Old host/path | Final host/path | Behavior during migration | Final behavior | Query preserved? | Owner | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `jayantgoyal.com/games/**` | `studio.jayantgoyal.com/games/**` | Existing route until Studio stable | 308 | Yes | Studio | Pending | — |
| `jayantgoyal.com/tools/**` | `studio.jayantgoyal.com/tools/**` | Existing route until Studio stable | 308 | Yes | Studio | Pending | — |
| `jayantgoyal.com/auth/callback` | `auth.jayantgoyal.com/callback` | Compatibility handler | Retire after window | Required auth params only | Auth | Pending | — |
| `admin.jayantgoyal.com/auth/callback` | `auth.jayantgoyal.com/callback` | Compatibility handler | Retire after window | Required auth params only | Auth | Pending | — |

Never place token values or real authorization codes in this ledger.

---

## 9. Environment-variable ownership template

Populate exact names during PLATFORM-00. The target principle is least privilege.

| Variable capability | Portfolio | Studio | Admin | Auth | Notes |
| --- | :---: | :---: | :---: | :---: | --- |
| Supabase public URL/key | If content needs it | Yes | Yes | Yes | Same project |
| Supabase service role | Prefer no | Only proven server need | Yes where required | Prefer no; only approved admin operation | Never browser-exposed |
| Site URL | Yes | Yes | Yes | Yes | Environment-specific |
| Auth application URL | Link only | Yes | Yes | Self | Environment-specific |
| Cookie domain/name | Optional awareness | Yes | Yes | Yes | Shared contract |
| Resend/email | Contact only if owned | Product-specific only | Operational only | Identity email normally configured in Supabase | Avoid duplication |
| Weather/GitHub APIs | No | Yes where product needs | No unless operational | No | Studio-owned |
| Vercel management | No | No | Yes | No | Server-only |

Environment changes are introduced in the same PR/phase as the first real consumer, not in anticipation.

---

## 10. Verification Matrix

### 10.1 Static and build verification

- [ ] `pnpm install` when dependencies or workspace packages change
- [ ] `pnpm lint`
- [ ] `pnpm check-types`
- [ ] Focused application build
- [ ] Full `pnpm build` before deployment-bound milestones
- [ ] Workspace package exports verified
- [ ] No unexpected tracked build artifacts

Build success does not replace type checking because repository build configuration may ignore TypeScript errors.

### 10.2 Authentication integration matrix

| Journey | Local | Stable staging | Production smoke |
| --- | :---: | :---: | :---: |
| Password login | Required | Required | Required after approved rollout |
| Google login | Manual/optional | Required | Required after approved rollout |
| GitHub login | Manual/optional | Required | Required after approved rollout |
| Registration and verification | Required | Required | Controlled smoke |
| Forgot/reset password | Required | Required | Controlled smoke |
| MFA enrollment | Required | Required | Controlled smoke |
| AAL1 → AAL2 Admin step-up | Required | Required | Required |
| Non-admin Admin denial | Required | Required | Required |
| Studio session recognized by Admin | Required | Required | Required |
| Auth session recognized by Studio | Required | Required | Required |
| Current-session logout | Required | Required | Required |
| Global logout | Required | Required | Controlled smoke |
| Expired access token refresh | Required | Required | Observe |
| Revoked session behavior | Required | Required | Observe |
| Provider cancellation | Required | Required | Not required |
| Invalid return URL rejection | Required | Required | Not required |

### 10.3 Application black-box matrix

Portfolio:

- [ ] Public navigation without cookies
- [ ] Public navigation with a valid platform cookie
- [ ] Content failure state
- [ ] Blog and resume
- [ ] Contact
- [ ] SEO, sitemap, robots, canonical metadata

Studio:

- [ ] Public Home and Products
- [ ] Public product details
- [ ] Public product launch
- [ ] Auth-required product launch
- [ ] Product return after login
- [ ] Files upload/download
- [ ] Messenger realtime
- [ ] Activity persistence
- [ ] Game sessions
- [ ] Tools and history

Admin:

- [ ] Unauthenticated redirect
- [ ] Authenticated non-admin denial
- [ ] Admin AAL1 step-up
- [ ] Admin AAL2 access
- [ ] Portfolio CRUD
- [ ] Studio metadata CRUD
- [ ] User/role operations
- [ ] Deployment operations

Auth:

- [ ] Login/register
- [ ] Recovery/verification
- [ ] OAuth callback
- [ ] MFA
- [ ] Provider management
- [ ] Security settings
- [ ] Logout and safe return

### 10.4 Security scan matrix

- [ ] Parent-domain cookie attributes
- [ ] Legacy cookie collision
- [ ] Cookie deletion correctness
- [ ] `Set-Cookie` caching
- [ ] Open redirects
- [ ] CSRF and Origin validation
- [ ] State-changing GET requests
- [ ] Token/secret logging
- [ ] Service-role browser exposure
- [ ] Per-request Supabase clients
- [ ] Server-side claim validation
- [ ] Admin role freshness
- [ ] AAL2 enforcement
- [ ] RLS for affected data paths
- [ ] CSP and third-party scripts
- [ ] Stale DNS and subdomain takeover
- [ ] CORS and callback allowlists

### 10.5 Release verification

- [ ] Intended base branch is current.
- [ ] Focused and full checks pass.
- [ ] Required review gates pass.
- [ ] Environment variables exist in the intended Vercel environments.
- [ ] Supabase redirect allowlist is correct.
- [ ] Rollback action is documented and available.
- [ ] Proof note contains no secrets.
- [ ] Production smoke test is scoped and non-destructive.
- [ ] Residual risk is documented.

---

## 11. Review Gates

### Gate A — Architecture conformance

Required before every phase closes:

- Read-only review against the Architecture Blueprint.
- Confirm no application imported another application’s source.
- Confirm no unapproved shared package or schema was introduced.
- Confirm authentication and authorization ownership remained separate.

### Gate B — Authentication security

Required before PLATFORM-04, PLATFORM-05, PLATFORM-06, and PLATFORM-12 close:

- Cookie review
- Session refresh review
- Callback/PKCE review
- Return URL/open redirect review
- CSRF/Origin review
- Cache-header review
- Secret and token handling review
- Admin role/AAL review

### Gate C — Adversarial diff review

Required before any deployment or domain cutover:

- Reviewer is read-only.
- Review compares the diff with this guide and the approved task packet.
- Blocking findings are fixed or explicitly deferred with rationale.

### Gate D — Black-box browser validation

Required for user-facing phases:

- Tester starts from the actual application URL.
- Tester uses normal browser navigation.
- Tester does not bypass middleware or seed a session through internal shortcuts.
- Result records user-visible behavior without session values or secrets.

### Gate E — Domain and SEO cutover

Required before PLATFORM-09 closes:

- Redirect ledger complete
- Canonical URLs correct
- Sitemap and robots correct
- Historical routes tested
- Callback and recovery compatibility tested
- Rollback domain sequence rehearsed

### Gate F — Deep cleanup review

Required before PLATFORM-12 closes:

- Dead-code and duplicate-code review
- Environment-variable cleanup
- Stale domain and alias review
- Final auth and authorization review
- Final architecture-boundary review
- Deferred scope recorded without speculative scaffolding

---

## 12. Proof Ledger Template

Use this entry shape for every completed task or deployable PR slice:

```markdown
## <Task ID> — <short outcome>

- Date/time:
- Branch/worktree:
- Base commit:
- Changed surfaces:
- Environment:
- Test persona:
- Commands run:
- Browser/device targets:
- User-visible result:
- Security checks:
- Deployment/preview URL:
- Artifacts:
- Rollback action:
- Residual risks:
- Follow-up task IDs:
```

Proof notes must not contain:

- Passwords
- Access or refresh tokens
- Authorization codes
- Environment-variable values
- Service-role keys
- Raw cookies
- Unredacted personal data
- Provider secrets

---

## 13. Decision Log Template

Add an entry when implementation evidence changes an architectural detail:

```markdown
## ADR-<number> — <decision>

- Date:
- Status: Proposed | Accepted | Rejected | Superseded
- Task ID:
- Context:
- Options considered:
- Decision:
- Why this is the smallest maintainable choice:
- Consequences:
- Code or abstraction deleted/avoided:
- Revisit trigger:
```

Do not use an ADR to bypass the user’s approved application responsibilities. Material boundary changes require explicit review.

---

## 14. Rollback principles

- Prefer feature flags and additive compatibility before destructive cleanup.
- Roll back one deployment or contract at a time.
- Do not revoke valid Supabase sessions just to roll back application code.
- Keep old callback/recovery compatibility until the approved window closes.
- Domain cutovers must have a documented previous Vercel project mapping.
- Database migrations, if separately approved later, must be backward-compatible during mixed deployment versions.
- Never use destructive Git cleanup as a rollback mechanism.
- A rollback is complete only when the user-visible journey and logs are stable again.

---

## 15. Long-term maintenance checklist

Review after the migration and at least annually:

- [ ] Does every application still answer one clear question?
- [ ] Is authentication invisible on public journeys?
- [ ] Are permissions still owned by the application performing the operation?
- [ ] Does every shared package still have at least two real consumers?
- [ ] Can any shared abstraction be deleted or moved back into one application?
- [ ] Are there stale subdomains, aliases, redirect URLs, or provider callbacks?
- [ ] Are service-role credentials limited to applications that need them?
- [ ] Are Auth and Supabase dependencies current and reviewed?
- [ ] Are Admin privileged operations protected by current role and AAL2?
- [ ] Does Portfolio remain lightweight and product-free?
- [ ] Does Studio still prioritize public discovery?
- [ ] Has any product earned an independent deployment lifecycle?
- [ ] Has any proposed application failed to justify one?
- [ ] Are deferred features still truly required?
- [ ] What duplicated or obsolete code can be deleted next?

---

## 16. Immediate next action when implementation is authorized

Start only with PLATFORM-00.

Do not create `apps/auth`, `apps/portfolio`, `apps/studio`, or `packages/auth` until the baseline inventory, current production journey proof, route ownership ledger, environment inventory, and auth-cookie observations are complete.

The first implementation PR should contain documentation and test foundations only. It should not change production behavior.
