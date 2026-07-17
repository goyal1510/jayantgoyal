# Auth Regression Coverage

## Scope

- Keep Portfolio, Studio, Admin, and `/products` UI frozen.
- Add deterministic local Vitest coverage for the current authentication
  contract before changing shared-cookie or standalone Auth behavior.
- Cover failure and policy boundaries without real credentials, provider UI,
  browser automation, Preview checks, or Production observation.

## Planned coverage

- Callback failure and safe destination behavior.
- Refreshed cookie/cache-header propagation through replacement responses.
- Unauthenticated, role-denied, MFA, recovery, and terms enforcement.
- Logout scopes and application-owned policy where it can be tested without a
  hosted user session.

## Validation contract

- Use focused local test files while implementing.
- Run one final local type/lint/build pass only if production code changes.
- The user owns deployed manual acceptance under ADR-008.

## Progress

- Added synthetic Admin regression coverage for anonymous redirects, role
  denial/success, AAL1-to-AAL2 step-up, callback failure, safe destinations,
  and refreshed response-state propagation.
- Added Studio callback coverage for invalid codes, external destinations, and
  password-recovery compatibility.
- Added Studio middleware coverage for anonymous routing, MFA, recovery, terms,
  and propagation through replacement responses.
- Added a test-only Studio source alias so the route handler can be exercised
  without changing its production imports.

## Verification

- Focused regression pass: 15 tests across the three new files.
- Full local suite: 77 tests across 18 files.
- Admin and Studio typechecks pass after Next.js route-type generation.
- Targeted zero-warning ESLint passes for all three new test files.
- `git diff --check` passes.
- No production source, dependency, database, provider, environment, UI, or
  deployed application was changed or tested in this slice.
