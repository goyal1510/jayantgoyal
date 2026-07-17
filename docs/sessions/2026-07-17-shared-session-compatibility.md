# Shared Session Compatibility

## Scope

- Implement PLATFORM-04's versioned cookie configuration and rollback controls
  without changing the current login UI or moving callbacks to a new Auth app.
- Preserve current Studio/Admin authorization, MFA, recovery, terms, and route
  policy.
- Use local deterministic tests only; the user owns deployed cross-subdomain
  acceptance under ADR-008.

## Binding contract

- Production cookie name: `__Secure-jg-session-v1`.
- Production Domain: `jayantgoyal.com`; Path `/`; Secure; SameSite Lax.
- Localhost uses the versioned `jg-session-v1` counterpart without Domain or
  Secure so ports can share it.
- Generated Vercel Previews remain application-local and cannot prove
  cross-project SSO.
- Legacy read/removal support remains until a later observed cleanup gate; no
  token is copied through a URL or log.

## Planned implementation

- Confirm current Supabase cookie naming/chunking from installed source.
- Add a pure environment/request-aware cookie policy in `@repo/auth`.
- Add an explicit rollout preference/rollback switch.
- Wire browser, server, callback, and Proxy clients to one policy.
- Test production, localhost, Preview, deletion, chunking, and concurrency-safe
  response behavior locally before shipping.

## Progress

- Confirmed from installed `@supabase/ssr`/Supabase JS source that the current
  storage key is `sb-<project-ref>-auth-token`, chunks use numeric suffixes,
  and version `0.12.3` applies the configured cookie options to writes and
  removals while also clearing a host-only counterpart during domain logout.
- Added the pure `@repo/auth/cookies` contract with explicit `legacy`,
  `compatibility`, and `platform` modes. Missing or invalid configuration is
  rollback-safe and remains `legacy`.
- Added exact trusted-host scoping: only Portfolio, Studio, Admin, and reserved
  Auth production hosts receive the parent Domain; unknown subdomains and
  generated Previews remain host-only.
- Localhost uses `jg-session-v1` without Domain/Secure. Production and Preview
  use `__Secure-jg-session-v1`; this avoids creating an invalid `__Secure-`
  cookie during HTTP local development.
- Added safe environment examples with the rollout flag set to `legacy`; the
  hosted flag was later created with the same rollback-safe value.
- Request clients are now asynchronous only at their four server call sites.
  In compatibility mode they prefer any platform cookie, otherwise validate a
  legacy session with `getUser()`, transfer only its in-memory credentials via
  `setSession()`, and validate the promoted user again. A failed promotion
  keeps a validated legacy client for the current request; invalid legacy state
  is never used for authorization.
- Server Component clients receive the actual request Host so localhost,
  Preview, and trusted Production cookie attributes match the request rather
  than a fixed deployment URL.
- Added focused promotion/factory regressions for authenticated promotion,
  invalid legacy cookies, transfer failure, identity mismatch, rollback-safe
  legacy mode, platform preference, and the approved Production attributes.
- Added a shared sign-out scope helper and made normal Studio/Admin logout,
  terms rejection, and recovery cleanup explicitly local. Global sign-out is
  now used only by an explicit password-reset choice or account deletion; the
  password-reset choice defaults to the current session.
- Admin role denial no longer destroys the Supabase session, so a valid Studio
  identity survives an Admin authorization rejection.
- Replaced Studio's hand-decoded, legacy-name-only JWT fast check with shared
  mode-aware cookie-family detection. Once a session reaches the full auth
  path, AAL comes from the Supabase client instead of manually decoding a
  potentially chunked cookie.
- Added the rollout flag to Turborepo's global/build environment inputs so a
  mode change cannot reuse an incompatible cached browser bundle. Removed the
  two obsolete guest credential entries from the build environment contract.
- Added the non-sensitive rollout flag as `legacy` to Studio and Admin across
  Vercel Development, Preview, and Production. CLI creation and read-back
  confirmed one unscoped entry per project covering exactly those three
  targets; no value or secret was printed.
- The first final-suite attempt caught bracketed IPv6 localhost being treated
  as a secure host. Host normalization now removes URL-parser brackets, and the
  focused localhost policy test is rerun before the complete gate.

## Verification

- The focused IPv6/localhost policy rerun passes 23 tests.
- The corrected full suite passes 110 tests across 21 files.
- Full zero-warning lint and full TypeScript checks pass all eight tasks.
- The complete Portfolio, Studio, Admin, and shared-package build passes. The
  Portfolio build emits only its expected missing-local-public-Supabase
  fallback warnings.
- `git diff --check` passes.
- No browser, Preview, Production, Google login, or deployment observation was
  run. The Vercel rollout flag remains `legacy` for all three targets.
