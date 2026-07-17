# Platform URL and Environment Contract

**Date:** 2026-07-17
**Status:** Approved execution foundation; revised by ADR-006
**Parent architecture:** [Platform Architecture Blueprint](./2026-07-16-platform-architecture-blueprint.md)

## Application and domain ownership

| Application | Repository location | Vercel lifecycle                                                         | Production host          |
| ----------- | ------------------- | ------------------------------------------------------------------------ | ------------------------ |
| Portfolio   | `apps/portfolio`    | Independent project; apex cutover completed after dark-launch validation | `jayantgoyal.com`        |
| Studio      | `apps/studio`       | Existing product project renamed and repointed to Studio immediately     | `studio.jayantgoyal.com` |
| Admin       | `apps/admin`        | Existing independent Vercel project                                      | `admin.jayantgoyal.com`  |
| Auth        | `apps/auth`         | Local dark-launch app exists; Vercel project/domain remain unlinked      | `auth.jayantgoyal.com`   |

`www.jayantgoyal.com` redirects to the apex canonical URL. The existing e-commerce Vercel projects and domains remain outside this platform restructure.

## Environment model

| Logical environment | Vercel target | URL model                                                                     | SSO expectation                                           |
| ------------------- | ------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| Development         | Development   | Final local ports: Portfolio `3000`, Studio `3001`, Admin `3002`, Auth `3003` | Local host-only cookies                                   |
| Preview             | Preview       | Generated, per-deployment Vercel URL                                          | Application-local auth and product checks only            |
| Production          | Production    | Final public hosts                                                            | Full cross-subdomain validation after PLATFORM-04 rollout |

There is no persistent preview branch, stable preview hostname, or fourth environment layer. Preview URLs remain provider-managed. Because unrelated Vercel preview hosts cannot share a parent cookie, Preview proves each application and its same-origin auth behavior; controlled Production proves cross-subdomain SSO.

## Current-project environment policy

Studio is a single-purpose application at `apps/studio`; it no longer renders Portfolio based on hostname. The existing Vercel product project was renamed and repointed to Studio, then `jayantgoyal.com` and `www.jayantgoyal.com` moved to Portfolio. Portfolio remains available on its dark-launch subdomain during compatibility, and Admin remains at `apps/admin`.

| Project   | Development `NEXT_PUBLIC_SITE_URL` | Preview                                                    | Production `NEXT_PUBLIC_SITE_URL` |
| --------- | ---------------------------------- | ---------------------------------------------------------- | --------------------------------- |
| Portfolio | `http://localhost:3000`            | Resolve the actual request/deployment origin; no fixed URL | `https://jayantgoyal.com`         |
| Studio    | `http://localhost:3001`            | Resolve the actual request/deployment origin; no fixed URL | `https://studio.jayantgoyal.com`  |
| Admin     | Not configured                     | Resolve the actual browser origin                          | Not configured                    |
| Auth      | `http://localhost:3003`            | Generated origin after provider linking                    | `https://auth.jayantgoyal.com`    |

`NEXT_PUBLIC_SITE_URL` is public configuration and must not be treated as a secret. All sensitive values remain server-only. Portfolio and Auth environment inventories intentionally omit a service-role key. Auth's source inventory exists now; hosted values are not created until the reviewed provider-linking step.

Auth additionally consumes exact public cross-application origins and an
optional comma-separated `NEXT_PUBLIC_AUTH_RETURN_ORIGINS` list for generated
Preview destinations. Every entry is parsed as an exact origin; wildcard and
lookalike hosts are rejected. The local inventory maps Portfolio `3000`, Studio
`3001`, Admin `3002`, and Auth `3003`.

Admin does not consume `NEXT_PUBLIC_SITE_URL`: its browser OAuth callback uses
`window.location.origin`, and canonical application identity comes from the
shared brand/platform contract. The unused Admin Development and Production
entries were therefore removed rather than adding a meaningless Preview entry.

Studio uses `NEXT_PUBLIC_PORTFOLIO_URL` for links that cross the application boundary. Development uses `http://localhost:3000`; Preview and Production use `https://jayantgoyal.com`. This keeps ephemeral Studio previews linked to the stable public Portfolio without introducing a custom preview domain.

Studio uses `NEXT_PUBLIC_STUDIO_URL` for its own canonical metadata and discovery surfaces. Development uses `http://localhost:3001`; Preview and Production use `https://studio.jayantgoyal.com`. Runtime request-origin checks are limited to preview indexability and callbacks; application identity never changes by host.

## Supabase Auth URL rollout

The hosted Auth Site URL is `https://jayantgoyal.com`. Its allowlist contains the production platform origins, local ports, and narrowly scoped current Studio/Admin Vercel preview hostname families. Obsolete pre-rename and staging callback families are not retained. The code must still stop placing `next` in the OAuth `redirectTo` URL and preserve the validated destination server-side before the compatibility wildcards can be narrowed further.

When Auth is dark-launched, the Site URL moves to `https://auth.jayantgoyal.com`. Auth callback URLs become canonical while legacy Main, Studio, and Admin callbacks remain allowlisted for the defined compatibility window.

Do not run a blanket `supabase config push` from an ordinary worktree: the repository `supabase/config.toml` describes local development and must not overwrite hosted Auth configuration. Hosted Auth changes use a reviewed Management API patch containing only the intended fields, followed by a read-only verification.

## Cookie contract timing

The existing host-only Supabase session remains untouched through PLATFORM-03. The versioned parent-domain production cookie is introduced only in PLATFORM-04 after the shared `@repo/auth` package and application-local Preview checks pass. Cross-subdomain behavior then uses a controlled, reversible Production rollout because Vercel preview hosts cannot prove the parent-domain cookie contract.

`NEXT_PUBLIC_AUTH_SESSION_MODE` is the non-sensitive build-time rollout control
for Studio, Admin, and later Auth:

| Value           | Behavior                                                                  |
| --------------- | ------------------------------------------------------------------------- |
| `legacy`        | Current Supabase cookie behavior; default and immediate rollback          |
| `compatibility` | Prefer the versioned cookie and promote a server-validated legacy session |
| `platform`      | Versioned cookie only after the compatibility observation gate            |

Studio and Admin currently define one unscoped Vercel variable covering
Development, Preview, and Production, set to `legacy`. Preview cookies remain
host-only. Production receives the parent Domain only after the explicit mode
switch; localhost uses an unprefixed host-only name without Secure so ports
`3001` through `3003` can share it without violating `__Secure-` prefix rules.
