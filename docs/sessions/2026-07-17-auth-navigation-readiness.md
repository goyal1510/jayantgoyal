# Auth Navigation Readiness

## Scope

- Complete the default-off PLATFORM-06 navigation adapters beyond login entry.
- Keep Studio/Admin Settings and Log out behavior exactly as deployed while
  `NEXT_PUBLIC_AUTH_FLOW_OWNER=legacy`.
- When the already-approved owner value becomes `auth`, route account-security
  and logout entry to standalone Auth with exact safe return context.
- Preserve all legacy account, callback, recovery, MFA, and logout code until
  deployed acceptance and the compatibility observation window complete.

## Starting state

- Base: merged PR #53 at `940678a`.
- Auth DNS and safe Vercel owner defaults exist, but the first Auth deployment
  remains unavailable during Vercel's account-wide daily deployment limit.
- UI presentation is frozen. Validation is limited to focused local contracts,
  TypeScript, and zero-warning lint.

## Implementation

- Added exact shared builders for canonical account-security and logout entry.
  They accept only the approved Auth origin and carry the current application
  URL as `return_to`, including query and fragment context.
- The shared sidebar user menu now accepts an optional app-owned Settings
  callback. Studio/Admin pass it only when the owner flag is exactly `auth`;
  otherwise the existing settings sheet and local sign-out code remain active.
- Under Auth ownership, Settings navigates to `/account/security` and Log out
  navigates to `/logout`. Both use the same centralized safe URL builders.
- Auth logout now validates and preserves `return_to` through both local and
  global POST actions, then lands on Auth login with `signed_out=true` and the
  safe application destination ready for a later sign-in. Unsafe destinations
  are discarded. GET logout and blind cross-origin redirects remain absent.
- Studio and Admin source contracts assert that both account-navigation
  adapters use the same owner resolver and centralized Settings/Log out URL
  builders, while omitting their local settings sheet only in Auth-owned mode.

## Verification progress

- The first five-file focused run passed 30 tests covering shared destination
  builders, Auth return validation/logout, the Auth source contract, and the
  existing Studio/Admin regression suites.
- The added application source assertions initially matched a single-line
  ternary and failed on the formatted multiline source. They now match the
  semantic expression across whitespace rather than depending on formatting.
- The corrected Studio/Admin pass completes all 12 tests successfully. The
  implementation guide, redirect ledger, decision log, and proof ledger now
  cover the complete default-off login/Settings/Log out ownership adapter.
- Shared Auth/UI, Studio, Admin, and standalone Auth TypeScript and zero-warning
  lint passed. Studio/Admin were rerun after the final source assertions; no
  formatter, build, browser, Preview, or Production validation was performed.
