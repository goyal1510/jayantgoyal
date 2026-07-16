# Platform Restructure Proof Ledger

This ledger records secret-free verification for PLATFORM-00 through PLATFORM-12.
A task is complete only when its implementation, acceptance checks, review gates,
deployment or stated exit gate, rollback evidence, and residual risks are recorded
here.

## PLATFORM-00 — Baseline and contracts (Done)

- **Date/time:** Completed 2026-07-16 (Asia/Kolkata).
- **Branch/worktree:** `codex/platform-restructure` at
  `/Users/jgoyal1510/Desktop/Jayant/Developer/projects/worktrees/jayantgoyal/platform-restructure`.
- **Base freshness:** `HEAD`, merge base, and `origin/main` all equal
  `8710ac83fea719c3cd35e090da3281e57a1d5344`; the protected source clone remains
  clean on `main`.
- **Changed surfaces:** Documentation only. No runtime, dependency manifest,
  lockfile, cookie, DNS, Vercel, Supabase configuration, or database change.
- **Authoritative environment:** Current READY production deployments plus the
  verified local source at the baseline commit. Stable-staging projects do not yet
  exist and are recorded as a later-phase risk.
- **Deployment proof:** Main project
  `prj_i9cXy9kUNTtLcewSSmO90d9hmYdl`, Admin project
  `prj_gUYbdmqS7F0dYFhsps2Ua0P1LZS6`, their READY deployment IDs/commits,
  verified domains, apex redirect chain, and external commerce hosts are recorded
  in `deployment-inventory.md`.
- **Supabase proof:** Authenticated CLI verified project `jayantgoyal`
  (`orwfvyditlguqvxvztkw`); linked history showed 23 known remote-only records and
  four matching records. Read-only table-list comparison matched all three
  canonical schema snapshots. No migration or history repair was applied.
- **Route proof:** A mechanical filesystem reconciliation proves 199/199
  `page.tsx`/`route.ts` surfaces are cataloged with an owner: 126 Main pages, 20
  Admin pages, 42 Main handlers, and 11 Admin handlers. No undecided route remains.
- **Data proof:** All 27 canonical tables are assigned; nine durable
  `localStorage` keys and one `sessionStorage` key are cataloged with compatibility
  owners.
- **Environment proof:** Every source-read environment name and Vercel target is
  recorded without values. Both projects lack Preview `NEXT_PUBLIC_SITE_URL`; the
  main project also has unused Commerce/Razorpay names assigned to PLATFORM-12
  review.
- **Auth/cookie proof:** Current Supabase cookie name, chunking, response
  attributes, application cookies, duplicated clients, proxy rules, service-role
  uses, caching, logout, recovery, MFA, and redirect findings are recorded in
  `auth-inventory.md`. The binding target remains
  `__Secure-jg-session-v1` on `jayantgoyal.com`.
- **Chrome black-box proof:** Main Google OAuth and TOTP completed, reached `/`,
  opened `/files`, and survived reload without a login gate. Admin required a
  separate Google/TOTP login and then correctly denied the non-admin Chrome
  identity at `/unauthorized`. No OAuth parameter, credential, cookie, token,
  account identifier, or MFA code was recorded.
- **Other black-box proof:** Public Portfolio/discovery routes, password login,
  recovery request, no-factor MFA skip, logout, Admin password role success,
  provider cancellation, and HTTP availability are recorded in
  `baseline-journeys.md` with non-mutating boundaries.
- **Known failures:** Mandatory Admin AAL2 gap, Admin open-return family, recovery
  cookie hardening, host-only session boundary, browser-storage origin migration,
  Wordle secret coupling, preview environment gaps, test-persona credential
  rotation, and all other risks are assigned in `residual-risks.md`.
- **Architecture/security review:** Binding boundaries retained; exact cookie
  contract corrected against blueprint; no secret/auth-value pattern found; no
  non-doc change found; no service-role value recorded; `git diff --check` passed.
- **Verification commands:** `pnpm install --frozen-lockfile`, focused Prettier
  write/check, `pnpm lint`, `pnpm check-types`, source-to-route count reconciliation,
  table/storage counts, source-clone/base-freshness checks, authenticated read-only
  Vercel/Supabase inventory, HTTP smoke, and real Chrome journeys. Lint and type
  checks passed across all six workspace packages/tasks.
- **User-visible result:** None; production behavior is unchanged.
- **Rollback action:** Revert the documentation-only PLATFORM-00 commit. No
  external rollback exists because no external state changed.
- **Residual risks:** `residual-risks.md`.
- **Exit gate:** All PLATFORM-00 checklist and exit-gate items pass. PLATFORM-01 is
  unblocked.

## PLATFORM-01 — Authentication regression foundation (Done)

- **Started:** 2026-07-16 (Asia/Kolkata), immediately after PLATFORM-00 exit.
- **Test setup:** Root Playwright `1.61.1` with Chrome channel, one worker, explicit
  Main/Admin ports, optional external HTTPS targets, and no screenshots, traces,
  video, or retained failure output. Playwright-owned servers terminate after the
  run; the only ignored result file is a pass/fail marker with no auth data.
- **Implemented coverage:** 20 tests across public Portfolio, anonymous product
  gate, expired/failed refresh recovery, Main/Admin invalid callbacks, invalid
  recovery links, anonymous account/privileged endpoints, deterministic RFC 6238
  TOTP, authenticated Main navigation/refresh, Admin denial/success, mandatory
  AAL1-to-AAL2 step-up, visible logout, and cross-host global logout.
- **Failure demonstration:** Three source contracts are annotated expected-fail
  for the known Admin external-return, factorless Admin AAL1, and implicit logout
  scope gaps. They currently fail their assertions as expected; fixing a gap
  without updating its contract makes the suite report an unexpected pass.
- **Local run:** `pnpm test:auth:read-only` passed 15/15 against both local apps
  using the ignored local application environment. `pnpm test:auth` passed 15 and
  safely skipped five credential-gated journeys because authenticated execution
  was not enabled.
- **Production-like run:** With external targets set to the current Main and Admin
  HTTPS deployments, `pnpm test:auth:read-only` passed 15/15. No deployment,
  account, role, provider, cookie contract, or runtime behavior was changed.
- **Manual provider evidence:** Main Google OAuth/TOTP, `/files`, and refresh
  continuity passed in the user's Chrome. Admin Google OAuth/TOTP passed before
  correct non-admin denial. The complete redacted Google/future-GitHub,
  registration, recovery, MFA, logout, cancellation, and stale-state matrix is in
  `platform-01-provider-checklist.md`.
- **Test personas:** Anonymous and deterministic fake-expired-session cases are
  active. The Chrome identity is recorded only by authorization class. No
  disposable password, non-admin, or AAL2 Admin values are stored. The legacy
  password persona is deliberately ignored and remains unavailable until rotated.
- **Coverage boundary:** Five credential-gated tests exist but are skipped unless
  `AUTH_TEST_ALLOW_AUTHENTICATED=true` and new `AUTH_TEST_*` disposable personas
  are provided. Cross-host global logout additionally requires
  `AUTH_TEST_CROSS_HOST=true` on approved stable staging. GitHub is absent from the
  baseline UI and remains target-only until the Auth phase enables it.
- **Repository gates:** `pnpm lint` and `pnpm check-types` passed across the
  workspace. Focused Prettier and `git diff --check` passed during implementation.
- **User-visible result:** None. Only test/configuration, dependency, proof, and
  session files changed.
- **Rollback action:** Revert the PLATFORM-01 test-foundation commit and remove
  Playwright from the root development dependencies. No external rollback exists.
- **Deferred/manual coverage:** A safe disposable credential environment is not
  available: the previous password persona requires rotation and stable staging
  does not yet exist. The five credential-gated tests and current-provider manual
  rows remain explicitly assigned to the approved staging environment; GitHub rows
  remain Auth-phase target coverage. Do not mutate production accounts to fill the
  gap. This does not change the Phase-01 test-foundation exit gate or permit
  production credential testing.
- **Exit gate:** Phase-01 coverage, source/security contracts, production-like
  read-only run, Chrome baseline, manual-provider checklist, and no-runtime-change
  review passed. PLATFORM-02 is unblocked for its dedicated dependency slice.

## PLATFORM-02 — Supabase dependency and SSR hardening (In Progress)

- **Started:** 2026-07-16 (Asia/Kolkata), after the PLATFORM-01 exit gate.
- **Dependency review:** Main and Admin moved together from `@supabase/ssr`
  `^0.7.0` / `@supabase/supabase-js` `^2.84.0` to `^0.12.3` / `^2.110.7`.
  The [official SSR changelog](https://github.com/supabase/ssr/blob/master/CHANGELOG.md)
  records the 0.8.1 refresh-race fix and 0.10.0 response cache-header support;
  the registry reports 0.12.3 and 2.110.7 as the current stable versions on this
  date. No prerelease or v3 client was selected.
- **Compatibility code:** All proxy and callback `setAll` adapters now apply the
  library-provided response headers alongside cookie writes. The server factories
  accept the new header argument while retaining React request-scoped caching;
  they do not create a global Supabase client. No `getSession()` authorization
  call exists in either app; server authorization continues to use `getUser()`.
  Callback branches that return a second redirect copy refreshed cookies and
  non-location response headers so the final response retains the SSR cache
  contract.
- **Cookie review:** `getAll`/`setAll` are present in every server adapter; the
  current cookie option path remains unchanged. The upgraded SSR implementation's
  host-only deletion behavior and max-age semantics were reviewed without changing
  the binding cookie contract.
- **Local verification:** `pnpm test:auth:read-only` passed 19/19 after the
  upgrade, including expired/failed refresh, concurrent expired refresh, callback
  failure, private/no-store response headers, and static cookie-writer contracts.
  The full `pnpm test:auth` command passed 19 tests and safely skipped five
  credential-gated journeys. `pnpm lint` and `pnpm check-types` also passed across
  the workspace.
- **Loopback provider verification:** The existing Playwright harness now starts
  a loopback-only fake Supabase Auth server for local runs. It implements only the
  synthetic authorize, PKCE exchange, refresh failure, user, factor-list, logout,
  and empty PostgREST responses needed by the read-only suite. The new Main Google
  journey clicks the real Google button, follows the real OAuth callback, writes
  the SSR session cookie, and reaches `/` without contacting Google or reading a
  credential. `pnpm test:auth:read-only` passed 19/19 and the full command passed
  19 with five credential-gated tests skipped. This is app-integration evidence,
  not proof of Google's own consent UI or provider configuration.
- **Current HTTPS verification:** The same read-only suite passed 17/17 against
  the current Main and Admin HTTPS deployments. This is a pre-deploy compatibility
  baseline; the upgraded worktree still requires Preview deployment and observation.
- **Security boundary:** No parent-domain cookie, callback relocation, application
  split, Supabase migration, role change, or production deployment was performed.
- **Preview deployment:** Both Vercel Preview deployments completed successfully
  for commit `5f27a53`. The Main preview is
  `https://jayantgoyal-jayantgoyal-git-co-71d26a-jayants-projects-8c2f7bf9.vercel.app`
  and the Admin preview is
  `https://jayantgoyal-admin-git-codex-pl-98283d-jayants-projects-8c2f7bf9.vercel.app`.
  Direct HTTPS probes receive Vercel Deployment Protection `302` responses to
  `vercel.com/sso-api`, so the preview application is not publicly observable from
  the current non-authenticated shell.
- **Pending gates:** Run the upgraded HTTPS black-box matrix and observe
  cookie/session behavior through an approved authenticated Preview session before
  marking PLATFORM-02 Done. The production-like pre-deploy baseline for the
  upgraded dependency slice is 19/19 local read-only passes. Rollback is the prior
  dependency manifest/lockfile plus removal of the four response-header adapters.
- **Exact access blocker:** Preview observation requires the user's Vercel-authenticated
  Chrome session or an approved non-secret Deployment Protection bypass supplied by
  the project owner. No bypass token was requested, stored, or exposed. A fresh
  production Chrome check reached the real `/mfa-verify` page after Google OAuth,
  proving the callback-to-MFA handoff without recording credentials, TOTP values,
  cookies, or account identifiers. The user declined to complete the one-time MFA
  step, so no authenticated post-MFA claim is made. Preview observation remains
  pending and the live Chrome check will not be repeated.

## PLATFORM-03 — Shared auth infrastructure extraction (implementation slice; gate pending)

- **Implementation:** Added `packages/auth` with explicit browser, server, proxy,
  cookies, redirects, session, permissions, types, and server-only admin
  subpaths. Main and Admin now consume the same browser/server/proxy/admin
  factories and cookie adapters; the apps retain their existing wrappers so
  route and UI imports do not change.
- **Commit/deployment:** Implementation is committed as `b496649` on the existing
  `codex/platform-restructure` branch and pushed to draft PR #31. The subsequent
  Main and Admin Vercel checks completed successfully but reported `Canceled by
Ignored Build Step`, so no new preview artifact for this implementation is
  available and no deployed behavior claim is made.
- **Boundary review:** The package contains no auth pages, callback routes,
  route matchers, database role query, or product permission decisions. Admin
  role lookup and both applications' route policy remain local. The service-role
  factory is only available from the explicit `@repo/auth/admin` server subpath.
- **Redirect review:** Shared `safeRedirectPath` rejects protocol-relative,
  foreign-origin, backslash, and malformed targets; Main keeps relative-only
  callback behavior and Admin now validates its callback and welcome return
  paths before constructing a redirect.
- **Verification:** `pnpm check-types`, `pnpm lint`, and the complete local
  `pnpm test:auth:read-only` suite pass (24/24). The full `pnpm test:auth`
  command passes 24 tests and safely skips five credential-gated journeys. The
  static SSR contract now checks the shared cookie adapter for Supabase response
  headers and checks both applications import the shared proxy adapter.
- **Rollback:** Revert the shared package, two app dependency entries, wrapper
  imports, proxy/callback imports, and lockfile changes as one commit; no cookie,
  route, schema, deployment, or provider setting changed in this slice.
- **Gate status:** The local extraction is ready for same-PR review, but the phase
  remains gate-pending until PLATFORM-02 receives its required deployed Preview
  observation. No deployment or production claim is made for this slice.

## PLATFORM-04 — Platform-cookie contract preflight (not enabled)

- **Baseline:** The observed Supabase cookie base name and chunking behavior are
  recorded in `auth-inventory.md`; the existing host-only cookie remains the only
  active runtime session cookie.
- **Approved target:** Added the distinct `__Secure-jg-session-v1` contract with
  `Domain=jayantgoyal.com`, `Path=/`, `Secure`, `SameSite=Lax`, and the reviewed
  max-age. The code rejects unsafe overrides and never changes the existing
  `sb-<project>-auth-token` name.
- **Deterministic helpers:** Shared cookie utilities now derive the legacy name,
  sort base/chunk suffixes, rename chunks without changing opaque values, and
  permit promotion only when the feature flag is enabled, the server has already
  validated the session, and no platform cookie exists. No helper is enabled by
  either app and no live cookie value was read, copied, logged, or changed.
- **Verification:** The five new read-only platform-cookie tests pass. The full
  workspace type-check, lint, build, and existing auth suite remain green before
  this preflight is committed.
- **Gate status:** This is preparation only. Environment-specific configuration,
  real dual-read/promotion, stable subdomain SSO, logout clearing, expiry and
  concurrent-refresh observation remain pending PLATFORM-04 staging gates.
- **Preview deployment:** Follow-up commit `4f68d82` produced Ready Vercel
  deployments `5uvYVjwbffRBHJxvJab2XRHC5RJq` (Main) and
  `3W8sS6cEQYCY3ru1YQgAHo2uprQs` (Admin). Direct `/welcome` probes receive the
  expected Vercel Deployment Protection `302` to `vercel.com/sso-api`, so these
  are deployment proofs only; no authenticated application behavior is claimed.

### PLATFORM-04 — Email/password SSO adapter implementation slice

- **Implementation:** Added a feature-flagged shared session adapter used by
  Main, Admin, and Auth server/proxy/callback clients, plus explicit same-origin
  `/api/session` bootstrap routes for browser email/password sign-in. It resolves
  only the approved production, staging, and localhost cookie contracts;
  arbitrary Vercel preview hosts remain legacy-cookie-only. The adapter prefers
  the versioned platform cookie on reads, maps Supabase legacy session chunks to
  the platform name on writes, and deletes legacy host-only chunks with their
  original path/domain semantics.
- **Rollout safety:** `PLATFORM_SESSION_ENABLED` defaults to false in every app
  example and no deployed environment was enabled. Google provider settings,
  redirects, identities, and production sessions were not changed.
- **Local proof:** Platform-cookie tests now cover host scoping, preview safety,
  platform-over-legacy precedence, chunk mapping, validated bootstrap promotion,
  and legacy deletion. The deterministic email/password journey crosses the
  local Auth, Main, and Admin apps with `PLATFORM_SESSION_ENABLED=true`; the
  bootstrap route promotes only after `getUser()` validates the legacy session,
  and no token enters a URL or log. The flag-enabled read-only suite passes
  31/31; the disabled suite passes 30 with the email SSO case safely skipped.
  Workspace type-check, lint, and build remain required before shipping this
  slice.
- **Gate status:** This is an implementation slice, not the PLATFORM-04 exit
  gate. Stable-staging email/password cross-subdomain SSO, refresh races,
  logout, expiry/revocation, Admin authorization/AAL2, cache/security review,
  observation, and rollback evidence remain pending.

## PLATFORM-05 — Auth dark-launch implementation slice (gate pending)

- **Implementation:** Added an independently deployable `apps/auth` Next.js
  application without changing the current Main or Admin login paths. The
  initial route surface includes login, registration, recovery, reset, verify,
  callback, MFA, account security, connected providers, logout, and a safe
  callback-error/retry state.
- **Security boundary:** Auth uses the shared public Supabase browser/server/
  proxy factories, authorizes protected pages with `getUser()`, keeps service-role
  construction out of the app, validates same-origin POST logout requests, uses
  `303` after logout, rejects unsafe return paths through the shared validator,
  and marks the account pages dynamic so builds never evaluate missing runtime
  environment values during static generation. No state-changing GET route was
  added.
- **Verification:** `corepack pnpm@10.24.0 --filter auth check-types`, `lint`,
  and `build` pass. The repository read-only auth suite passes 25/25, including
  the static Auth route/security contract. No credential, provider token,
  application secret, or user data was used or recorded.
- **Boundary:** This is route and source preflight only. No Auth Vercel project,
  `auth.jayantgoyal.com` domain, Supabase redirect/provider setting, parent-domain
  cookie promotion, or production redirect was changed at the time of the
  implementation commit. Real Google consent and stable-staging cross-application
  SSO remain unproved.
- **Gate status:** PLATFORM-05 remains Pending until the required deployment
  identifiers, provider matrix, stable-staging session-sharing proof, security
  review, observation window, and rollback evidence exist. Rollback is deleting
  the new app and workspace entry plus reverting its lockfile/docs commit; the
  existing Main/Admin auth paths remain untouched.
- **Current PR checks:** The follow-up Main/Admin Vercel checks for `987fc92` /
  `3c6425e` completed with success status but were canceled by the projects'
  Ignored Build Step (`745eXy5wy5BZJqHnhUJ7tuY4jfoQ` Main and
  `5gcMKthbFYVu29Uxj8YcYzpUZuHD` Admin). They did not create fresh Ready
  application artifacts; the Ready `4f68d82` deployments remain deployment-only
  evidence behind Vercel Deployment Protection.

## PLATFORM-05 — Post-merge Vercel/Auth deployment setup (DNS gate pending)

- **Merge:** PR #31 merged into `main` as `381250549a5bd3cb05d2a8539209fe9dc4100bf4`
  using the repository owner's personal GitHub identity. The former draft/permission
  blocker is resolved.
- **Vercel project:** Created and linked `jayantgoyal-auth` in the personal Vercel
  team with project ID `prj_QqKDVWIDobJMiHMvKxoZBmAYhXRT`, framework Next.js,
  `rootDirectory=apps/auth`, and repository `goyal1510/jayantgoyal`. The build
  and install commands are declared in `apps/auth/vercel.json` to return to the
  monorepo root and filter the Auth workspace. No service-role variable was added.
- **Environment names:** Configured the public Supabase URL/key for development,
  preview, and production, plus local and production Auth site URL names. Values
  are intentionally absent from repository proof. Preview site URL remains to be
  assigned after a Git-based preview deployment.
- **Deployment evidence:** Direct CLI deployments proved the project can be
  created, but the app-only and root local-upload paths returned 404. The latest
  probe `dpl_7Qwv9qbLTDYEFeKnXZrpjBuJpUr9` reached Ready while still producing no
  Next output because it was not a Git-root build; this is retained as a failed
  probe, not a production claim. The Git repository is connected; the checked-in
  `vercel.json` now uses the app-root `pnpm install --frozen-lockfile` and
  `turbo run build --filter=auth` commands (Turbo discovers the workspace without
  a forbidden parent-directory traversal), and only its cloned-repository build
  can satisfy this deployment gate.
- **Custom domain:** `auth.jayantgoyal.com` is attached to the Auth project and
  Vercel reports `configured-correctly` after the Cloudflare change. The current
  DNS answers are Cloudflare-proxied A records; the recommended unproxied CNAME
  remains `auth → 872d75b6a0b9f030.vercel-dns-017.com` if proxying is removed.
- **Gate status:** The Git-based production deployment and custom-domain probe now
  pass. PLATFORM-05 remains Pending until Auth callback/provider configuration is
  reviewed, the stable-staging cross-application session/Google matrix passes,
  and the required observation/rollback window is complete.
- **Cross-project regression fix:** The shared repository `.vercelignore` was
  removing `.git`, causing Main/Admin's existing `scripts/ignore-build.sh` to
  fail before their builds. Removing that one entry preserves the safe upload
  exclusions while allowing all Git-connected projects to run their ignore step.
- **Git preview verification:** Deployment `dpl_Ckb75v9wXrD7YYdyeDKgvmDKA3nd`
  cloned commit `b62e35a`, installed all nine workspaces, detected Next.js
  `16.1.6`, and completed `turbo run build --filter=auth`. The preview
  `/login` response is `200`. `auth.jayantgoyal.com` still returns `404` because
  its project production target has not yet been promoted from this branch.
- **Production verification:** PR #32 merged as
  `029f083b59f881a1fa80a302da97ad8c8440b93b`. Deployment
  `dpl_BbC5DvGuf983JCbQoFm2wPS9PL7K` is Ready with the Auth Next output and
  aliases `auth.jayantgoyal.com`; unauthenticated `HEAD /login` returns `200`
  from both the deployment URL and the custom domain. No Google/provider or
  cross-application session claim is made from this routing check.

### Scope decision — email/password-first SSO

- The active restructure path is email/password identity with the shared Auth
  session. Google consent, Google client/provider configuration, and provider-
  specific cutover validation are explicitly deferred as a later enhancement;
  they are not being claimed from the loopback harness or deployment probes.
- This scope decision does not waive the binding session and security work. The
  immediate gates still require versioned-cookie compatibility, stable-staging
  cross-application email/password SSO, refresh/concurrency behavior, explicit
  local/global logout, recovery, Admin AAL2, safe return paths, security review,
  observation, and rollback evidence.
- No Google provider setting, production redirect, or production identity role
  was changed. The provider checklist remains recorded for the later
  enhancement rather than being silently removed from the program.

### PLATFORM-04 — Local logout continuation

- **Implementation:** Auth logout now validates an explicit `Origin` host against
  the request `Host`, preserving same-origin protection while allowing the
  approved loopback spellings used by the local browser harness. It continues
  to use `303`, `cache-control: no-store`, and Supabase local sign-out; the
  shared cookie adapter clears both platform and legacy session names.
- **Local proof:** With `PLATFORM_SESSION_ENABLED=true`, the deterministic
  email/password journey signs in through Auth, reaches Main, is denied by
  Admin authorization, signs out through Auth, observes both cookie names
  cleared, and returns Main to its sign-in gate. The complete read-only suite
  passes 31/31 with the flag enabled. The flag-disabled suite remains legacy
  compatible and safely skips the platform-only journey.
- **Boundary:** This is local integration evidence only. Stable-staging
  cross-subdomain logout, global logout semantics, expiry/revocation, refresh
  races, and the observation/rollback window remain open PLATFORM-04 gates.

### Post-merge deployment verification — PR #36

- **Merge:** PR #36 merged as `dafa7c67189a43c92415d239afcd349ad0fbf87e`.
- **Deployments:** Main, Admin, and Auth production deployments reached Ready
  from the merge-triggered Vercel builds. Auth deployment
  `dpl_26RvEv7d1wy7X4KxMsMezzEyGfsk` aliases `auth.jayantgoyal.com`; Main and
  Admin aliases remained `www.jayantgoyal.com`/`jayantgoyal.com` and
  `admin.jayantgoyal.com` respectively.
- **HTTP probes:** Main `/` returned `200`, Auth `/login` returned `200`, and
  unauthenticated Admin `/` returned the expected `307` to `/welcome?redirect=%2F`.
  These probes prove routing and deployment health only; no production session,
  cookie, Google consent, or cross-application SSO claim is made.

### Vercel project-settings cleanup

- **Configuration:** Removed `apps/auth/vercel.json` so framework, install,
  build, and ignored-build behavior are sourced from the `jayantgoyal-auth`
  Vercel project settings rather than a repository deployment override.
- **Verified settings:** Auth remains configured as Next.js with
  `pnpm install --frozen-lockfile`, `turbo run build --filter=auth`, and
  `bash ../../scripts/ignore-build.sh apps/auth`; Main and Admin retain their
  existing project-level settings.
- **Deployment proof:** The repaired Auth production deployment
  `dpl_Htc7qMLNBawnjmj9CiodpkCrsrxc` and preview deployment
  `dpl_5rnpRYJng9kFN72yxKhvqqoBXGTo` are Ready and report the same settings.
  Historical deployments retain immutable snapshots and are not current
  domain targets.
