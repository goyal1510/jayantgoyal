# Platform URL and Environment Contract

**Date:** 2026-07-17
**Status:** Approved execution foundation
**Parent architecture:** [Platform Architecture Blueprint](./2026-07-16-platform-architecture-blueprint.md)

## Application and domain ownership

| Application | Repository location | Vercel lifecycle                                           | Production host          |
| ----------- | ------------------- | ---------------------------------------------------------- | ------------------------ |
| Portfolio   | `apps/portfolio`    | The current root project becomes Portfolio at root cutover | `jayantgoyal.com`        |
| Studio      | `apps/studio`       | New independent Vercel project                             | `studio.jayantgoyal.com` |
| Admin       | `apps/admin`        | Existing independent Vercel project                        | `admin.jayantgoyal.com`  |
| Auth        | `apps/auth`         | New independent Vercel project                             | `auth.jayantgoyal.com`   |

`www.jayantgoyal.com` redirects to the apex canonical URL. The existing e-commerce Vercel projects and domains remain outside this platform restructure.

## Environment model

| Logical environment | Vercel target            | URL model                                                                     | SSO expectation                                   |
| ------------------- | ------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------- |
| Development         | Development              | Final local ports: Portfolio `3000`, Studio `3001`, Admin `3002`, Auth `3003` | Local host-only cookies                           |
| Preview             | Preview                  | Generated, per-deployment Vercel URL                                          | Application-local checks only                     |
| Staging             | `staging` preview branch | `portfolio`, `studio`, `admin`, and `auth` below `staging.jayantgoyal.com`    | Full cross-subdomain validation after PLATFORM-04 |
| Production          | Production               | Final public hosts                                                            | Full cross-subdomain validation after PLATFORM-04 |

Staging is implemented with a persistent Git branch and branch domains, not extra Vercel projects. No wildcard DNS record is permitted; each host is created only after its Vercel project supplies the required target.

The persistent remote `staging` branch now exists. The existing Main and Admin Vercel projects have branch-specific Preview `NEXT_PUBLIC_SITE_URL` values for their approved staging hosts. The domains and DNS records remain intentionally unattached until the corresponding staging deployments are ready for validation.

## Current-project environment policy

Until the split, the current main application remains at `apps/jayantgoyal` on the root domain and Admin remains at `apps/admin`.

| Project      | Development `NEXT_PUBLIC_SITE_URL`                     | Production `NEXT_PUBLIC_SITE_URL` | Generic Preview                                            |
| ------------ | ------------------------------------------------------ | --------------------------------- | ---------------------------------------------------------- |
| Current main | `http://localhost:3000`                                | `https://jayantgoyal.com`         | Resolve the actual request/deployment origin; no fixed URL |
| Admin        | `http://localhost:3001` until the final port migration | `https://admin.jayantgoyal.com`   | Resolve the actual request/deployment origin; no fixed URL |

`NEXT_PUBLIC_SITE_URL` is public configuration and must not be treated as a secret. All sensitive values remain server-only. New Auth and Studio projects receive their own environment inventories only when their applications exist.

## Supabase Auth URL rollout

The hosted Auth configuration currently contains local-only URLs. The first configuration slice changes the hosted Site URL to `https://jayantgoyal.com` and adds the current Main/Admin callbacks, local callbacks, and narrowly scoped Vercel-preview patterns. The code must then stop placing `next` in the OAuth `redirectTo` URL and preserve the validated destination server-side.

When Auth is dark-launched, the Site URL moves to `https://auth.jayantgoyal.com`. Auth callback URLs become canonical while legacy Main, Studio, and Admin callbacks remain allowlisted for the defined compatibility window.

Do not run a blanket `supabase config push` from an ordinary worktree: the repository `supabase/config.toml` describes local development and must not overwrite hosted Auth configuration. Hosted Auth changes use a reviewed Management API patch containing only the intended fields, followed by a read-only verification.

## Cookie contract timing

The existing host-only Supabase session remains untouched through PLATFORM-03. The versioned parent-domain production and staging cookies are introduced only in PLATFORM-04 after the shared `@repo/auth` package and stable staging validation exist.
