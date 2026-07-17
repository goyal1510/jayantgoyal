# Auth Foundation

## Scope

- Freeze Portfolio, Studio, Admin, and Studio product-discovery UI.
- Use local automated tests and one final local quality pass; deployed browser
  acceptance is performed manually by the user.
- Upgrade the current Supabase SSR/client dependencies before changing the
  cookie contract.
- Extract only duplicated, application-neutral client construction, auth cookie
  response handling, and safe return-path validation into `@repo/auth`.

## Boundaries

- No Auth application, parent-domain cookie, callback relocation, login-page
  redesign, provider change, database migration, or hosted Supabase change.
- Admin owns role lookup and AAL2 enforcement. Studio owns product permissions,
  terms, profile initialization, and product return destinations.
- Test fixtures contain synthetic names and values only.

## Progress

- Compared the installed Supabase versions with current stable releases and
  reviewed the current official SSR guidance.
- Began the upgrade from `@supabase/ssr` `0.7.0` to `0.12.3` and
  `@supabase/supabase-js` `2.84.0` to `2.110.7`.
- Added the initial `@repo/auth` package with safe return-path validation and a
  response writer that preserves the cache headers supplied during auth cookie
  refresh.
- Replaced the duplicated Studio/Admin browser and Server Component client
  constructors with shared factories while leaving privileged clients local.
- Studio and Admin Proxies now share the request client that applies refreshed
  cookies and Supabase's required private/no-cache response headers.
- Both callbacks now use the same request client and safe return-path policy,
  closing Admin's previous absolute-URL callback destination.
- Welcome and MFA continuation paths now use the same validator in both apps,
  preventing a later client-side step from reintroducing an external redirect.
- Replacement callback redirects now retain both refreshed cookies and the
  private/no-cache response headers without overwriting their new destination.
- Studio middleware and Admin Proxy denial/MFA redirects now carry the same
  refreshed auth response state instead of losing it when returning a newly
  constructed response.

## Verification

- Focused `@repo/auth` tests pass, including safe redirect normalization,
  refreshed-cookie/header writes, and cache-header propagation when a callback
  replaces its final redirect response: 10 tests across two files.
- The repository test suite passed 61 tests across 15 files before the final
  cache-header regression assertion was added. Zero-warning lint passed all
  eight tasks.
- The first full type pass identified the new package's missing Node type
  declaration. After declaring it directly, all eight typecheck tasks passed.
- The full monorepo build passed for Portfolio, Studio, Admin, and the shared
  packages. Portfolio emitted only its expected missing-local-environment
  fallback warnings.
- After the final cache-header correction, targeted Auth, Studio, and Admin
  typechecks and zero-warning lint passed. The expensive full suite was not
  repeated.
- The final production-dependency audit reports no known vulnerabilities, and
  `git diff --check` passes.
- Per the user's validation direction, Codex performed no browser, Preview, or
  Production checks. Deployed acceptance belongs to the user's manual pass and
  any reported blocker will be handled in a focused follow-up.
