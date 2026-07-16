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
- Protected source clone remains clean/read-only on `main`.
- Ignored local state copied at setup: three approved environment files and six
  permitted non-secret Supabase link/version metadata files. No pooler URL,
  credential, or secret artifact was retained.
- Verified Supabase target: `jayantgoyal` (`orwfvyditlguqvxvztkw`). Known
  remote-only migration-history drift remains; no migration or history repair was
  applied.
- Binding architecture blueprint and implementation guide read completely. The
  full PLATFORM-00 through PLATFORM-12 Codex goal remains active.
- PLATFORM-00 and PLATFORM-01 are Done. PLATFORM-02 is In Progress as a
  dedicated Supabase dependency/SSR compatibility slice; later tasks remain
  Pending and dependency-gated.

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
  and post-deploy HTTPS observation remain pending.
