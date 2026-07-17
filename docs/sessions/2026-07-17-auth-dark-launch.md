# Standalone Auth Local Dark Launch

## Scope

- Build the complete `apps/auth` application boundary locally without changing
  Portfolio, Studio, or Admin entry routes.
- Keep UI work frozen by reusing the established authentication presentation
  primitives rather than designing a new product shell.
- Do not create/link a Vercel project, DNS record, custom domain, hosted
  environment, Supabase URL configuration, or production cutover in this slice.
- Use deterministic local tests and one final local monorepo gate. Deployed
  acceptance remains user-owned under ADR-008.

## Implementation

- Added the `auth` workspace application on port `3003` with the complete
  PLATFORM-05 initial route inventory.
- Extended shared brand/platform contracts with the reserved Auth identity and
  canonical host.
- Added exact cross-application return-target validation and local/Preview
  origin configuration without wildcards.
- Added same-origin password, registration, recovery, provider, password
  security, and logout server actions. Logout offers explicit local/global
  scope and has no GET mutation route.
- Split mutation actions into entry, recovery, account, MFA, and logout modules,
  with shared request-origin and form handling kept in a small support module.
- Added PKCE/OTP callback handling with user-safe errors, response-state
  propagation, no-store headers, and no token/code logging.
- Added MFA challenge plus password reauthentication/AAL2 step-up for sensitive
  account surfaces.
- Added account security and connected-provider ownership without copying a
  service-role client or Admin API.
- Added a strict Auth CSP, global no-store/no-index headers, robots disallow,
  and the deployment ignored-build contract.
- Recorded that existing Studio/Admin auth remains primary and that no provider
  or redirect cutover is part of this local slice.

## Local verification

- Final `pnpm test` passes 153 tests across 26 files.
- Full zero-warning lint and TypeScript checks pass all nine tasks.
- The complete Portfolio, Studio, Admin, Auth, and shared-package production
  build passes. Auth emits the complete initial route manifest and Proxy.
- Build output contains only the existing Portfolio missing-local-public-
  Supabase fallback messages and source-package output warnings.
- `git diff --check` and the final sensitive-pattern scan are recorded during
  the shipping review.
- The security review replaced the initial authenticated-only recovery check
  with a verified, short-lived HttpOnly recovery marker consumed by a
  same-origin server action. It also moved MFA mutations behind server actions,
  enforced recent sign-in/AAL2 on account surfaces, and preserved password
  bytes instead of trimming credentials. Focused Auth TypeScript, lint, and
  contract checks pass after those corrections; the expensive full gate was
  not repeated.
- After the action-module split, all 35 targeted Auth tests across five files,
  Auth TypeScript, and zero-warning Auth lint pass. The full monorepo gate was
  deliberately not repeated because this was a structure-only refactor.
- No browser, Preview, Production, Google-provider, Vercel, DNS, Cloudflare, or
  hosted Supabase validation/change was performed.

## Residual gates

- Auth Vercel project/environment creation and exact project verification.
- Generated Preview same-application flow checks performed manually by the user.
- Scoped hosted Supabase Site URL/redirect update after provider review.
- Controlled Production cross-subdomain dark launch and manual acceptance.
- Rollback identifier capture and observation before canonical cutover.
