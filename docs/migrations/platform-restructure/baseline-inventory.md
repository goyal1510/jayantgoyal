# PLATFORM-00 Baseline Inventory

## Source of truth

- Baseline commit: `8710ac83fea719c3cd35e090da3281e57a1d5344`
- Baseline branch: `origin/main`
- Source clone: `/Users/jgoyal1510/Desktop/Jayant/Developer/projects/personal/jayantgoyal`
  (clean, protected, read-only)
- Implementation worktree:
  `/Users/jgoyal1510/Desktop/Jayant/Developer/projects/worktrees/jayantgoyal/platform-restructure`
- Task branch: `codex/platform-restructure`
- Supabase project: `jayantgoyal` (`orwfvyditlguqvxvztkw`), verified through
  authenticated CLI output
- Migration history: 23 known remote-only historical records and four matching
  local/remote records; no migration or history repair was applied

## Inventory index

| Contract                                                                                              | Authoritative PLATFORM-00 artifact  | Completion state                                              |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------- |
| All pages, handlers, callbacks, privileged endpoints, navigation destinations, and final owners       | `route-inventory.md`                | Complete: 199 page/handler surfaces, no undecided route       |
| Current and target redirects                                                                          | `redirect-ledger.md`                | Baseline families recorded; execution pending later phases    |
| Vercel projects, deployments, domains, external product hosts, and rollback baseline                  | `deployment-inventory.md`           | Complete                                                      |
| Auth pages, cookie attributes, Supabase clients, proxy rules, MFA, service role, and browser journeys | `auth-inventory.md`                 | Complete for baseline; target remediation remains phase-gated |
| Browser storage keys and database table ownership                                                     | `data-and-persistence-inventory.md` | Complete: nine durable keys, one session key, 27 tables       |
| Runtime environment names, Vercel target coverage, and least-privilege target owners                  | `environment-inventory.md`          | Complete; values intentionally excluded                       |
| Public/product/Admin black-box journeys                                                               | `baseline-journeys.md`              | Complete for PLATFORM-00 scope                                |
| Known defects, security findings, and operational risks                                               | `residual-risks.md`                 | Open risks assigned to owning phases                          |
| Binding and implementation decisions                                                                  | `decision-log.md`                   | Binding blueprint accepted; no boundary-changing ADR          |
| Verification evidence and rollback notes                                                              | `proof-ledger.md`                   | PLATFORM-00 entry maintained here; later phases pending       |

## Production behavior

- The apex HTTP/HTTPS chain ultimately resolves to the public combined app on
  `www.jayantgoyal.com`; Admin is independently deployed on
  `admin.jayantgoyal.com`.
- Portfolio, About, 87 visible tool destinations, blog, weather, and selected
  utilities are public. Authenticated product pages remain crawlable and render
  an inline login gate when no session exists.
- Main and Admin use separate host-only Supabase cookie sessions. Google, password,
  recovery, TOTP, and account-management UI are duplicated between hosts.
- Main Google login with TOTP succeeds and grants product access. Admin Google
  login with TOTP authenticates independently, then performs a profile-role check;
  the tested Chrome Google identity was correctly denied at `/unauthorized`.
- A dedicated password baseline persona with a Super Admin role could access Admin
  at AAL1 when it had no verified factor. This is a known security failure, not an
  approved target behavior.
- Default visible logout uses Supabase's implicit global scope. Recovery reset
  offers local/all-device logout options.
- Production Portfolio data currently reports database-backed content. Public
  contact/resume/GitHub/weather capabilities depend on the server/public variables
  assigned in the environment inventory.

## Behavior that must be preserved

- Public root, About, Portfolio content, blog URLs, resume, contact, weather,
  tools, and external commerce destinations remain reachable until their new owner
  has passed stable-staging and production cutover gates.
- Authenticated activity tracking, calculator history, files, games, messenger,
  tool history/favorites, and typing results retain path and data compatibility.
- All nine durable browser-storage keys retain their state across the `www` to
  `studio` origin change through an explicit transfer/compatibility mechanism.
- Previously issued PKCE callback, email verification, recovery, and MFA URLs keep
  compatibility handlers for the approved observation window.
- Existing host-only sessions are not invalidated until the shared-cookie contract
  has been tested, deployed compatibly, and provided with a rollback path.
- Admin continues to deny non-admin roles throughout migration and must strengthen,
  not weaken, its final gate to current role plus AAL2.
- Every existing API remains at its old host/path until the replacement owner is
  deployed and the redirect/proxy compatibility ledger authorizes cutover.
- Apex-to-`www`, e-commerce frontend/backend, sitemap, robots, metadata, and public
  SEO behavior remain available through the migration.

## PLATFORM-00 freeze

PLATFORM-00 changed documentation only. It created no dependency, runtime, cookie,
Supabase, Vercel, DNS, deployment, or database change. Any newly discovered
production-only route, environment capability, deployment, table, cookie, or
browser-storage key reopens this inventory before its owner can be cut over.
