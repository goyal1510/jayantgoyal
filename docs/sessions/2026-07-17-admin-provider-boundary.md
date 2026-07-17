# Admin Provider Boundary

## Scope

- Retire the hidden browser-facing Vercel environment manager from Admin.
- Preserve deployment visibility and the existing deployment rollback/redeploy
  surface, which use server-only provider credentials.
- Keep the approved environment model limited to localhost Development,
  Vercel-managed Preview, and final-domain Production.

## Changed Surfaces

- Removed the Admin UI that listed, revealed, created, edited, and deleted
  Vercel environment values.
- Removed the matching client helpers, environment-variable types, and
  `/api/vercel/env` read/write handlers.
- Replaced `/deployments/env` with a temporary redirect to `/deployments` so an
  old bookmark cannot fall through to the dynamic deployment-detail route.
- Removed the retired route's breadcrumb classification and updated its focused
  navigation test.
- Kept `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, and the two project identifiers because
  the server-only Deployments surface still requires them. Their values remain
  provider-owned and are never rendered to the browser.

## Security Review

- Admin can no longer return provider environment values to browser code or
  mutate provider configuration through its API.
- No credential, token, environment value, cookie, or personal data was added
  to tracked files or command output.
- No Supabase schema, migration, hosted Auth setting, Vercel project setting,
  DNS record, or production data changed in this slice.
- Deployment mutations retain their existing authorization behavior; AAL2 and
  audit proof remain open PLATFORM-10 gates rather than being silently claimed.

## Rollback

- Revert this slice to restore the environment manager and API if an approved
  provider-management use case is discovered during the compatibility window.
- The temporary `/deployments/env` redirect is deliberately non-permanent so a
  rollback does not fight a browser-cached permanent redirect.

## Remaining Work

- Validation passes: repository Vitest (`12` files, `49` tests), Admin
  zero-warning ESLint, Admin TypeScript/Next route generation, and the Admin
  production build. The production route manifest retains the compatibility
  `/deployments/env` page and contains no `/api/vercel/env` handler.
- Deploy and verify the compatibility redirect after the Vercel build-rate
  window recovers.
- Separately approve the `jg_app` Studio catalog contract before exposing Studio
  operations in Admin.
- Complete AAL2 authorization proof, terms/policies ownership, rollback, and
  observation gates before PLATFORM-10 can be marked Done.
