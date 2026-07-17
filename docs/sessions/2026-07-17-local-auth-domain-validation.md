# Local Cross-Application Auth Validation

## Scope

- Validate Auth, Studio, and Admin together without waiting for a Vercel
  deployment.
- Use reserved `.localhost` hostnames so the browser exercises a real
  parent-domain session cookie without DNS changes, local certificates, or
  administrator access.
- Keep Production host trust unchanged and never map the live `.com` domains to
  loopback.

## Implementation

- Added an opt-in `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` contract that accepts only a
  syntactically valid parent ending in `.test` or `.localhost`.
- Limited the local Auth-origin exception to the exact
  `auth.<configured-domain>` origin. `.localhost` requires HTTP port `3003`;
  `.test` requires HTTPS without a non-default port.
- Uses the unprefixed, non-Secure local cookie for `.localhost`, shared only
  under the configured localhost parent. This validates cross-subdomain SSO but
  intentionally does not claim to validate Production TLS cookie attributes.
- Declared each exact configured Auth, Studio, and Admin localhost hostname
  through Next.js `allowedDevOrigins`. Without the Auth entry, Next development
  mode rejects Server Action form submissions before they reach Supabase;
  without the application entries, it blocks their hot-reload resources.
- Preserved the browser-facing `Host`/`X-Forwarded-Host` when Next development
  normalizes `request.url` to `localhost`. Auth return targets now keep the
  exact Studio or Admin localhost subdomain instead of falling back to the
  internal development origin.
- Kept canonical Production hosts on the existing `jayantgoyal.com` cookie
  contract and kept generated Preview hosts secure and host-only.
- Documented the optional variable in Auth, Studio, and Admin environment
  examples. Vercel environments must leave it unset.
- Declared the variable in the Turborepo build environment contract.
- Linked the existing Auth, Studio, and Admin Vercel projects only to pull their
  ignored Development environment files; discarded Vercel CLI's redundant
  app-level ignore-file edits.

## Verification

- Focused cookie, entry, and Auth-origin validation passes 42 tests across
  three files. Studio/Admin proxy regression validation passes another 12
  tests across two files.
- Shared Auth TypeScript and zero-warning lint pass.
- Auth, Studio, and Admin application TypeScript checks pass.
- Final focused validation passes all 54 selected tests. Filtered Turborepo
  TypeScript and zero-warning lint checks pass for Auth, Studio, Admin, and
  their shared-package dependencies.
- Combined production builds pass for Auth, Studio, and Admin.
- First Chrome submission reproduced a Next.js HTTP 500 before Supabase. Server
  logs identified the missing allowed development origin.
- Chrome email/password sign-in through Auth redirected to Studio `/files`.
- The same shared session opened Admin `/users` without another sign-in and
  opened Auth account security from the Admin return context.
- Auth local-session sign-out returned to Auth login. Studio then rendered its
  signed-out gate and Admin redirected back to Auth, confirming the session was
  removed across all three applications.
- The logout pass exposed the normalized-localhost return target described
  above. Focused regression coverage passes, direct local HTTP checks preserve
  both exact subdomains, and final Chrome validation reached Auth with
  `return_to=http://admin.jayantgoyal.localhost:3002/users`.
- Removed the temporary machine-level Caddy and mkcert installations after the
  reserved `.localhost` approach made them unnecessary.
