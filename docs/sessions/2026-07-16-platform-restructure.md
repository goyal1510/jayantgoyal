# Platform Restructure Session

- **Date:** 2026-07-16
- **Area:** Full Jayant Goyal platform architecture and migration program
- **Scope:** Implement the approved PLATFORM-00 through PLATFORM-12 program,
  including compatibility, deployments, cutovers, observation gates, proof, and
  cleanup.

## Current State

- Dedicated worktree:
  `/Users/jgoyal1510/Desktop/Jayant/Developer/projects/worktrees/jayantgoyal/platform-restructure`
  on `codex/platform-restructure`.
- Baseline, merge base, and current `origin/main`:
  `8710ac83fea719c3cd35e090da3281e57a1d5344`.
- Current implementation head: `f03f2c3` (`docs(platform): record auth
  deployment check gate`), pushed to the existing draft PR #31.
- Protected source clone remains clean/read-only on `main`.
- Ignored local state copied at setup: three approved environment files and six
  permitted non-secret Supabase link/version metadata files. No pooler URL,
  credential, or secret artifact was retained.
- Verified Supabase target: `jayantgoyal` (`orwfvyditlguqvxvztkw`). Known
  remote-only migration-history drift remains; no migration or history repair was
  applied.
- Binding architecture blueprint and implementation guide read completely. The
  full PLATFORM-00 through PLATFORM-12 Codex goal remains active.
- PLATFORM-00 and PLATFORM-01 are Done. PLATFORM-02 remains In Progress because
  its deployed Preview observation gate is open. The approved same-PR workflow
  now contains the behavior-preserving PLATFORM-03 extraction slice; its local
  implementation checks pass, but its exit gate remains dependency-gated until
  PLATFORM-02 observation is complete.

## PLATFORM-00 Result

- Added and reviewed the baseline, route, deployment, auth, environment,
  persistence/schema, journey, redirect, decision, proof, and residual-risk
  ledgers under `docs/migrations/platform-restructure/`.
- Mechanically reconciled 199/199 current pages and route handlers: 126 Main
  pages, 20 Admin pages, 42 Main handlers, and 11 Admin handlers. The final pass
  caught and added five `/.well-known/**` handlers omitted from the initial count.
- Assigned all 27 database tables, nine durable browser-storage keys, and one
  session-only key. No owner remains undecided.
- Verified current Vercel project IDs, roots, READY production deployments,
  deployed commits, domains, apex redirects, external commerce hosts, and
  environment-name coverage without reading or recording values.
- Verified Main Google OAuth and TOTP in the user's Chrome, authenticated `/files`
  access, and refresh continuity. Verified Admin's separate host login, Google and
  TOTP completion, then correct `/unauthorized` denial for the non-admin Chrome
  identity. No role was changed.
- Recorded password, recovery, no-factor MFA, logout, provider-cancel, Portfolio,
  product, and Admin baseline journeys. Production account creation and other
  mutating cases remain intentionally assigned to disposable local/stable-staging
  personas in PLATFORM-01.
- Recorded the current host-only Supabase cookie and binding production target
  `__Secure-jg-session-v1` (`Domain=jayantgoyal.com`, `Path=/`, `Secure=true`,
  `SameSite=Lax`) with the approved new-name promotion and rollback sequence.
- Recorded security failures: factorless Admin AAL1 access, Admin open-return
  paths, recovery-cookie hardening, Wordle service-role/HMAC coupling, implicit
  logout scope, and credential-rotation requirement for the dedicated password
  persona.
- Confirmed PLATFORM-00 made documentation changes only and no production,
  dependency-manifest, cookie, DNS, Vercel, Supabase, or database change.

## Verification

- `pnpm install --frozen-lockfile` — passed; lockfile unchanged.
- `pnpm exec prettier --check ...` for all PLATFORM-00/guide/session documents —
  passed.
- `pnpm lint` — passed across the workspace.
- `pnpm check-types` — passed across the workspace.
- `git diff --check` — passed.
- Secret/auth-value pattern scan — passed.
- Source-to-ledger routes — 199/199.
- Schema tables — 27; durable/session storage keys — 9/1.
- Source clone clean and worktree base current with `origin/main` — passed.

## Decisions and Guardrails

- The architecture blueprint remains binding; no application boundary changed.
- Authentication proves global identity; each application still authorizes its own
  operations. Admin target is current role plus mandatory AAL2.
- Existing Commerce frontend/backend stay independent and appear in Studio as
  external catalog destinations.
- Moving product routes to Studio requires explicit browser-storage transfer;
  redirects alone are insufficient.
- The current Supabase cookie name must not receive a parent-domain variant. The
  distinct versioned platform cookie avoids host/domain name ambiguity.
- No production role is granted for testing. Authorized Google Admin success must
  use a disposable stable-staging persona.
- Remote Supabase changes remain blocked unless the reviewed disposable-workdir
  workflow is used and the intended migration scope is safe despite known drift.

## Next

- Selected Playwright `1.61.1` as the smallest sustainable PLATFORM-01 browser
  setup and added root scripts, a Chrome-based configuration, read-only smoke and
  endpoint tests, credential-gated journeys, RFC 6238 TOTP support, and static
  security contract checks. Credential-bearing artifacts are disabled.
- Added a secret-free stable-staging manual checklist for Google, future GitHub,
  registration, recovery, MFA, logout scopes, cancellation, and stale-state
  journeys. The recorded Chrome Google results are baseline evidence only; the
  full staging matrix remains pending.
- The automated suite loads only new `AUTH_TEST_*` names and deliberately ignores
  the legacy `TEST_USER_*` persona whose password rotation remains required.
- `pnpm test:auth:read-only` passed 15/15 locally and 15/15 against the current Main
  and Admin HTTPS deployments. The full local command passed 15 and safely skipped
  five credential-gated cases. Three expected-failure source contracts demonstrate
  detection of the open-return, factorless-Admin, and implicit-logout gaps.
- `pnpm lint` and `pnpm check-types` passed across the workspace. No runtime auth,
  cookie, callback, route-protection, account, provider, deployment, or database
  behavior changed.
- PLATFORM-01 is now Done at its approved safe boundary: all test-foundation and
  read-only gates passed, while credential-bearing tests remain explicitly
  staging-only. No production account mutation was used. PLATFORM-02 is now the
  active dependency/SSR hardening slice.
- PLATFORM-02 upgraded both apps to `@supabase/ssr` `0.12.3` and
  `@supabase/supabase-js` `2.110.7`, applied cache-control headers from the new
  `setAll` contract in proxy/callback response adapters, and added concurrent
  refresh and no-store regression checks. Local read-only auth tests pass 17/17;
  the full command passes 17 and safely skips five credential-gated cases. Lint,
  type checks, and the pre-deploy HTTPS read-only run also pass. Preview deployment
  completed for both apps from commit `5f27a53`, but Vercel Deployment Protection
  returns SSO redirects to unauthenticated shell probes. Post-deploy HTTPS
  observation remains pending until an approved authenticated Preview session is
  available. A fresh production Chrome check reached `/mfa-verify` after Google
  OAuth; the user declined to enter the one-time code, so no post-MFA claim is
  recorded. No bypass token, credential, TOTP value, cookie, or account mutation
  was used, and the live Chrome check will not be repeated.
- The user authorized the merge-and-deploy route for PLATFORM-02 instead of adding
  another test framework. The connected GitHub account could not mark draft PR #31
  ready (`MarkPullRequestReadyForReview` permission denied), so no merge or
  production deployment was attempted. The PR and branch remain unchanged; the
  existing Playwright suite is the only local auth validation path.
- After checking the official Supabase Google documentation, added a loopback-only
  fake Supabase Auth server to the existing Playwright harness rather than enabling
  a real provider without a Google client. The local Main journey clicks the real
  Google button, follows a synthetic authorize redirect, exercises the real PKCE
  callback and SSR cookie writer, and reaches `/` without contacting Google. The
  read-only suite passes 24/24; the full suite passes 24 and skips five
  credential-gated journeys. This evidence is explicitly limited to application
  integration; it does not claim Google consent/provider verification.
- Added `packages/auth` as the shared auth infrastructure boundary. Both apps now
  import the same browser/server/proxy/cookie/service-role factories while keeping
  auth UI, callback routes, route matchers, Admin role queries, and product policy
  local. Added shared safe redirect validation and pure role/AAL predicates without
  changing the current factorless-Admin behavior. `pnpm check-types`, `pnpm lint`,
  and the full local read-only auth suite pass after extraction. This is a local
  implementation slice in the same draft PR; no deployment or production claim is
  recorded until the PLATFORM-02 observation gate is satisfied.
- The PR's latest Main/Admin Vercel checks completed with success status but were
  canceled by the project's Ignored Build Step, so they did not produce a fresh
  preview artifact for the extraction commit. The preview observation blocker is
  unchanged.
- Prepared the PLATFORM-04 cookie contract without enabling runtime promotion:
  shared helpers codify the approved versioned name/attributes, distinguish the
  legacy Supabase cookie, order chunks deterministically, and require an explicit
  flag plus already-validated session before promotion. Five focused read-only
  tests pass; no live cookie was read or changed.
- Commit `4f68d82` produced Ready Main/Admin Preview deployments, but direct
  `/welcome` probes return Vercel Deployment Protection `302` responses to the
  SSO endpoint. This confirms deployment completion only; authenticated preview
  application observation remains open.
- Added the PLATFORM-05 Auth dark-launch implementation slice in the same PR.
  `apps/auth` is independently buildable and exposes login, registration,
  recovery/reset, verification, callback, MFA, account security, connected
  providers, logout, and safe callback-error/retry routes. The current Main and
  Admin login paths remain primary; no Auth Vercel project, domain, provider
  allowlist, redirect, cookie promotion, or production cutover was changed.
- Auth verification is local and non-secret: its check-types, lint, and build
  pass, and `pnpm test:auth:read-only` passes 25/25 including the route/security
  contract. Logout is an explicit same-origin POST at `/api/logout` with a 303
  redirect and no state-changing GET. The loopback provider remains the only
  local Google-compatible callback proof; real Google consent/provider and
  stable-staging cross-application SSO remain pending.
- PLATFORM-05 stays Pending despite the route checklist being implemented. Its
  deployment identifiers, domains, provider matrix, security review,
  cross-application session proof, observation window, and rollback evidence
  remain required before any dark-launch link or canonical Auth cutover.
- Added the secret-free `apps/auth/.env.example` and recorded Auth's three
  public environment names in `environment-inventory.md`; no Auth environment
  values or Vercel project were created.
- Fresh Main/Admin Vercel checks for the Auth commits completed with success
  status but were canceled by the existing Ignored Build Step, so no new Ready
  preview artifact or authenticated behavior claim exists. The earlier Ready
  `4f68d82` previews remain deployment-only evidence behind Vercel SSO
  Deployment Protection.
- PR #31 was then marked ready and merged as
  `381250549a5bd3cb05d2a8539209fe9dc4100bf4` after switching `gh` to the
  personal `goyal1510` account. A new branch `codex/platform-auth-deploy` now
  tracks `origin/main` for deployment configuration.
- Added the Vercel CLI as a repository-only root dev dependency (`vercel@56.2.1`)
  and added `.vercelignore` plus the Auth-local `.gitignore`; no global Vercel
  installation remains. Created Vercel project `jayantgoyal-auth`, linked the
  GitHub repository, set `rootDirectory=apps/auth`, and configured the build to
  filter the Auth workspace. The custom domain `auth.jayantgoyal.com` is attached
  but DNS verification is pending the Cloudflare `auth` CNAME.
- The first direct app-only deployment was a 404 probe; a corrected root probe
  reached Ready but produced no Next output because it was not a Git-root build.
  Git-connected deployment is now the required authoritative path. No production
  Auth cutover or Google provider setting has been changed.
