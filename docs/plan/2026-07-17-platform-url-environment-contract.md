# Platform URL and Environment Contract

**Date:** 2026-07-17
**Status:** Approved execution foundation
**Parent architecture:** [Platform Architecture Blueprint](./2026-07-16-platform-architecture-blueprint.md)

## Application and domain ownership

| Application | Repository location                | Vercel lifecycle                                                            | Production host          |
| ----------- | ---------------------------------- | --------------------------------------------------------------------------- | ------------------------ |
| Portfolio   | `apps/portfolio`                   | New independent project; dark-launch on `portfolio` before root cutover     | `jayantgoyal.com`        |
| Studio      | `apps/jayantgoyal` → `apps/studio` | The existing Main project becomes Studio after the reversible root cutover | `studio.jayantgoyal.com` |
| Admin       | `apps/admin`                       | Existing independent Vercel project                                         | `admin.jayantgoyal.com`  |
| Auth        | `apps/auth`                        | New independent project created only in the Auth phase                       | `auth.jayantgoyal.com`   |

`www.jayantgoyal.com` redirects to the apex canonical URL. The existing e-commerce Vercel projects and domains remain outside this platform restructure.

## Environment model

| Logical environment | Vercel target            | URL model                                                                     | SSO expectation                                   |
| ------------------- | ------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------- |
| Development         | Development              | Final local ports: Portfolio `3000`, Studio `3001`, Admin `3002`, Auth `3003` | Local host-only cookies                           |
| Preview             | Preview                  | Generated, per-deployment Vercel URL                                          | Application-local checks only                     |
| Staging             | `staging` preview branch | `portfolio`, `studio`, `admin`, and `auth` below `staging.jayantgoyal.com`    | Full cross-subdomain validation after PLATFORM-04 |
| Production          | Production               | Final public hosts                                                            | Full cross-subdomain validation after PLATFORM-04 |

Staging is implemented with a persistent Git branch and branch domains, not extra Vercel projects. No wildcard DNS record is permitted; each host is created only after its Vercel project supplies the required target.

The persistent remote `staging` branch now exists and tracks the current program commit. Portfolio, Main/Studio, and Admin have branch-specific Preview `NEXT_PUBLIC_SITE_URL` values for their approved staging hosts. Portfolio and Studio branch domains and exact DNS records are attached; tested immutable deployments back them until Vercel permits a fresh `staging` branch build. Auth staging remains deferred to the Auth phase.

## Current-project environment policy

During compatibility, the current Main application remains at `apps/jayantgoyal` on the root domain while also serving Studio. Portfolio is independently deployed at `portfolio.jayantgoyal.com`, and Admin remains at `apps/admin`.

| Project       | Development `NEXT_PUBLIC_SITE_URL` | Current Production `NEXT_PUBLIC_SITE_URL` | `staging` Preview value                     | Generic Preview                                            |
| ------------- | ---------------------------------- | ----------------------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| Portfolio     | `http://localhost:3000`            | `https://portfolio.jayantgoyal.com`       | `https://portfolio.staging.jayantgoyal.com` | Resolve the actual request/deployment origin; no fixed URL |
| Main / Studio | `http://localhost:3001`            | `https://jayantgoyal.com` until cutover   | `https://studio.staging.jayantgoyal.com`    | Resolve the actual request/deployment origin; no fixed URL |
| Admin         | `http://localhost:3002`            | `https://admin.jayantgoyal.com`           | `https://admin.staging.jayantgoyal.com`     | Resolve the actual request/deployment origin; no fixed URL |

`NEXT_PUBLIC_SITE_URL` is public configuration and must not be treated as a secret. All sensitive values remain server-only. The Portfolio environment inventory exists without a service-role key; Auth receives its own inventory only when that application exists.

Studio uses `NEXT_PUBLIC_PORTFOLIO_URL` for links that cross the application boundary. Its Development value is `http://localhost:3000`, the `staging` Preview value is `https://portfolio.staging.jayantgoyal.com`, and generic Preview/Production use `https://jayantgoyal.com`. This keeps ephemeral Studio previews on the stable public Portfolio while giving the persistent staging branch a matched staging destination.

## Supabase Auth URL rollout

The hosted Auth configuration currently contains local-only URLs. The first configuration slice changes the hosted Site URL to `https://jayantgoyal.com` and adds the current Main/Admin callbacks, local callbacks, and narrowly scoped Vercel-preview patterns. The code must then stop placing `next` in the OAuth `redirectTo` URL and preserve the validated destination server-side.

When Auth is dark-launched, the Site URL moves to `https://auth.jayantgoyal.com`. Auth callback URLs become canonical while legacy Main, Studio, and Admin callbacks remain allowlisted for the defined compatibility window.

Do not run a blanket `supabase config push` from an ordinary worktree: the repository `supabase/config.toml` describes local development and must not overwrite hosted Auth configuration. Hosted Auth changes use a reviewed Management API patch containing only the intended fields, followed by a read-only verification.

## Cookie contract timing

The existing host-only Supabase session remains untouched through PLATFORM-03. The versioned parent-domain production and staging cookies are introduced only in PLATFORM-04 after the shared `@repo/auth` package and stable staging validation exist.
