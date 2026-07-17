# Deployed Product Matrix

## Scope

- Validate the merged Portfolio, Studio, and Admin boundaries on generated
  Vercel Preview URLs and final Production domains under ADR-006.
- Cover public/responsive behavior, application-local authentication, Admin
  authorization routing where the existing signed-in browser permits it, and
  production rollback/observation evidence.
- Do not create stable Preview domains, bypass authentication, expose session
  state, or mutate production user data merely for testing.

## Working State

- Branch: `codex/deployed-product-matrix`
- Base: merged PR #41 at `6865643` on `origin/main`.
- Source clone is clean/current and remains read-only for implementation.
- Six ignored `.env*` files and safe non-secret Supabase link/version metadata
  were copied; no pooler URL or access token was copied.

## Initial Evidence

- The current final domains remain healthy after the Vercel build-rate limit:
  Portfolio and Studio return `200`; Admin performs its expected one redirect
  and then returns `200`.
- Production currently serves the prior verified `525e9d0` deployments because
  Vercel rate-limited the merged PR #41 build. The Portfolio source commit in PR
  #41 already passed an immutable Preview and only removed a dead compatibility
  hostname mapping.

## Production Browser Matrix

- Browser: the user's existing Chrome session, read-only except for navigation
  and sidebar controls. No password, token, cookie, environment value, or
  production form submission was read or transmitted.
- Desktop target: the normal Chrome viewport (`1466x780` during this run).
- Mobile target: an explicit `390x844` viewport override, reset after testing.
- Portfolio (`https://jayantgoyal.com`): returned the expected
  `Jayant Goyal | Full-Stack Developer` title and public portfolio content. The
  desktop sidebar/header transitioned from `256px`/`64px` to `48px`/`48px`; the
  mobile shell used a `64px` header and a `288px` navigation drawer. Expanded,
  collapsed, and mobile states had no horizontal overflow.
- Studio (`https://studio.jayantgoyal.com`): returned the expected
  `Studio by Jayant Goyal | Apps, Tools, and Experiments` title, the public
  product inventory, Portfolio/Blog/E-commerce handoffs, and public/personal
  grouping. The desktop sidebar/header transitioned between
  `256px`/`64px` and `48px`/`48px`; the mobile shell used a `64px` header and a
  `288px` navigation drawer with no horizontal overflow. The protected
  `/files` route remained on the requested route and rendered the expected
  application-local sign-in gate.
- Admin (`https://admin.jayantgoyal.com`): an unauthenticated root request
  redirected once to `/welcome?redirect=%2F`, where email/password and Google
  entry points rendered. The Google provider handoff reached the provider and
  the existing Chrome session returned to the authorized Admin surface without
  Codex typing or exposing credentials. The authenticated `/portfolio/hero`
  shell rendered the correct `Hero | Admin` title and Portfolio breadcrumb. Its
  desktop sidebar/header transitioned between `256px`/`64px` and
  `48px`/`48px`; the mobile shell used a `64px` header and a `288px` drawer with
  no horizontal overflow. No production content was edited or submitted.
- The three applications therefore match the shared shell contract in deployed
  Production while retaining application-owned navigation, route meaning, and
  authorization behavior.

## Preview And Remaining Gates

- The immutable Portfolio Preview for PR #41 returned `200` with the expected
  title. Vercel rate-limited the corresponding Studio and Admin builds, so a
  same-commit three-application Preview matrix remains pending; no stable
  Preview or staging domains will be created to work around that provider gate.
- Current final domains remain healthy on their previously verified deployment,
  so rollback was not triggered. A documented rollback rehearsal and the
  required observation window remain open before PLATFORM-07, PLATFORM-08, or
  PLATFORM-09 can be marked Done.
- No schema, migration, Supabase Auth configuration, Vercel setting, DNS record,
  production data, or application code changed during this evidence slice.

## Residual Risks And Next Action

- Wait for Vercel's build-rate window to recover, then obtain generated Preview
  deployments for Portfolio, Studio, and Admin from one current commit and run
  the same desktop/mobile/app-local-auth checks.
- Rehearse the provider rollback sequence without changing the three-environment
  contract, record the observation gate, and only then close the split/cutover
  phases.
- Studio catalog persistence, the legacy Admin environment-manager retirement,
  and shared Auth/SSO remain later, separately reviewed slices.
