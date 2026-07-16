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
- **Dependency:** PLATFORM-00 Done with reproducible baseline and explicit
  manual-only/mutating boundaries.
- **Allowed change boundary:** Test framework/configuration, test-only fixtures,
  browser/integration tests, and non-production diagnostics only; no runtime auth,
  cookie, callback, or route-protection behavior change.
- **Initial test requirements:** public Portfolio smoke, unauthenticated product
  gate, authenticated navigation, Admin denial and authorized success, AAL1 to
  AAL2, explicit logout scopes, callback invalid code, recovery compatibility,
  provider cancellation, expired/failed refresh, and a stable-staging manual
  provider checklist.
- **Security constraint:** No real credential, token, cookie, OAuth parameter, or
  production MFA secret may enter fixtures, logs, snapshots, screenshots, or
  repository artifacts. The previously used password persona remains unavailable
  until its password is rotated.
- **Proof pending:** Test-tool choice, implementation, failure demonstration,
  commands, production-like run, manual provider matrix, review gate, and exit gate.
