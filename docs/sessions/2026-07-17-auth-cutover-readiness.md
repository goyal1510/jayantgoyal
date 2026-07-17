# Auth Cutover Readiness

## Scope

- Finish provider setup that does not depend on a new Vercel deployment.
- Prepare the canonical Auth entry cutover behind a default-off rollback switch.
- Preserve current Studio and Admin login, callback, recovery, MFA, and logout
  behavior until the standalone Auth deployment and manual acceptance are done.

## Current state

- Cloudflare now has a DNS-only `A` record for `auth.jayantgoyal.com` pointing
  to Vercel at `76.76.21.21`; public DNS resolves to that address.
- Wrangler is authenticated to the correct Cloudflare account, but its OAuth
  grant exposes `zone:read` and Wrangler 4 has no DNS-record mutation command.
  The record was therefore created through the authenticated Cloudflare UI.
- Vercel still blocks creation of the first Auth deployment on the account-wide
  daily deployment/build limit. No deployed Auth behavior was tested.

## Implementation

- Added `@repo/auth/entry` as the shared exact Auth-entry URL contract and
  `NEXT_PUBLIC_AUTH_FLOW_OWNER` as the `legacy`/`auth` owner flag.
- `legacy` remains the default and immediate rollback state. The configured
  Auth origin accepts only canonical Production Auth or local port `3003`;
  invalid and lookalike origins fall back to canonical Auth.
- Studio and Admin now hand their existing `/welcome` entry to Auth only when
  the flag is explicitly `auth`, preserving an exact validated application
  return path. Callback, recovery, MFA, logout, and duplicated UI remain in
  place for the compatibility window.
- Added focused shared, Studio, and Admin Vitest coverage. UI presentation and
  active provider settings are unchanged.

## Verification

- The focused three-file Vitest pass completed 14 tests successfully.
- Zero-warning lint passed for Auth, Studio, and Admin. The first TypeScript
  pass identified a nullable optional-origin annotation; the contract was
  corrected and all three TypeScript tasks then passed.
- Provider, redirect, environment, decision, implementation-guide, and proof
  records now distinguish completed DNS/readiness work from the still-missing
  first Vercel deployment and user-owned deployed acceptance.
