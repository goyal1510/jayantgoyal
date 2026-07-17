# Shared-session Consumer Readiness

## Scope

- Audit Studio, Admin, and Auth application-side session detection after the
  shared `legacy`/`compatibility`/`platform` cookie contract merged.
- Correct only deterministic session-consumer gaps; keep UI and deployed
  behavior unchanged because every active environment remains `legacy`.
- Use focused local tests, TypeScript, and zero-warning lint only.

## Starting state

- Base: merged PR #52 at `43794e6`.
- The first standalone Auth deployment remains unavailable until Vercel's
  account-wide daily deployment limit resets.
- No Preview, Production, browser, or post-deployment testing is in scope for
  this slice.

## Audit findings and implementation

- Studio's protected layout manually recognized only the legacy Supabase cookie
  base name and first chunk. Compatibility/platform sessions therefore appeared
  signed out to the layout even though the Proxy understood them.
- Shared Server Components always selected the platform cookie whenever the
  rollout mode was not `legacy`. On the first compatibility request, the Proxy
  can validate and promote a legacy session only into the response; the Server
  Component still receives the original request cookies and therefore needs to
  read the already validated legacy family for that request.
- Studio now uses the shared mode-aware cookie detector with the actual request
  host. The shared Server Component factory selects legacy only for a
  legacy-only compatibility request, prefers platform when present, and never
  falls back in final `platform` mode. No cookie value is decoded or logged.
- Added focused factory coverage and a Studio source contract preventing the
  hard-coded cookie detector from returning.

## Verification progress

- The first focused run passed the Studio and cookie-policy files but exposed
  that the new Server Component factory tests had not supplied synthetic public
  Supabase configuration. The fixtures now provide non-secret synthetic values
  and clean them after the file; the implementation itself was not changed by
  this fixture correction.
- The corrected focused run passes 34 tests across cookie policy, request and
  Server Component selection, and Studio integration. A second focused run
  passes all 15 Admin/Auth regression contracts.
- Shared Auth, Studio, Admin, and standalone Auth TypeScript pass. Their four
  zero-warning lint tasks also pass. No formatter, build, browser, Preview, or
  Production test was run.
- The implementation guide, decision log, and proof ledger now record the
  first-request compatibility behavior and the safe Vercel owner defaults.
