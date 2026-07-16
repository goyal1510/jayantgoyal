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

## PLATFORM-01 — Authentication regression foundation (In Progress)

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
- **Remaining acceptance blocker:** A safe disposable credential environment is
  not available: the previous password persona requires rotation and stable
  staging does not yet exist. Do not mutate production accounts to fill the gap.
  PLATFORM-01 remains In Progress and PLATFORM-02 remains dependency-blocked until
  the five credential-gated journeys and required manual rows have redacted proof.
