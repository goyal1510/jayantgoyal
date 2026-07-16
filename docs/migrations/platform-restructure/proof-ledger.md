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
- **Local verification:** `pnpm test:auth:read-only` passed 17/17 after the
  upgrade, including expired/failed refresh, concurrent expired refresh, callback
  failure, private/no-store response headers, and static cookie-writer contracts.
  The full `pnpm test:auth` command passed 17 tests and safely skipped five
  credential-gated journeys. `pnpm lint` and `pnpm check-types` also passed across
  the workspace.
- **Current HTTPS verification:** The same read-only suite passed 17/17 against
  the current Main and Admin HTTPS deployments. This is a pre-deploy compatibility
  baseline; the upgraded worktree still requires Preview deployment and observation.
- **Security boundary:** No parent-domain cookie, callback relocation, application
  split, Supabase migration, role change, or production deployment was performed.
- **Pending gates:** Run the full Phase-01 suite against the upgraded code, deploy
  the dedicated slice to production-like Preview, run the HTTPS black-box matrix,
  and observe cookie/session behavior before marking PLATFORM-02 Done or starting
  PLATFORM-03. Rollback is the prior dependency manifest/lockfile plus removal of
  the four response-header adapters.
