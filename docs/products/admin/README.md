# Admin

Admin is Jayant's private operations product at
[admin.jayantgoyal.com](https://admin.jayantgoyal.com). The current client is
`apps/admin/web`, workspace `@jayant/admin-web`, running locally on port 3002.

## Product boundary

Admin provides privileged operational interfaces; it does not take ownership
of the domains it administers. Its current responsibilities are:

- Portfolio editorial overview and section workspaces;
- Portfolio Work, Writing, and public asset administration;
- account profile/role administration;
- Vercel deployment listing, inspection, events, and redeployment actions.

Portfolio owns its public content contract. Auth owns credentials, MFA, and
account security. Studio owns its product capabilities even though a reserved
Studio navigation domain exists with no active Admin workspace.

## Roles and access

The proxy requires a valid Supabase user, completes MFA step-up when a verified
factor exists, reads `jg_account.profiles.role`, and admits `admin` or
`super_admin`. The sidebar exposes Portfolio workspaces to both roles and
Platform operations only to `super_admin`.

Every elevated route reauthorizes its caller. Proxy admission alone is not
sufficient for service-role or Vercel-token access. `/unauthorized` and the
callback compatibility path are the only public destinations.

## Current workspaces

| Domain      | Active workspace                                                            | Roles                | Operation                              |
| ----------- | --------------------------------------------------------------------------- | -------------------- | -------------------------------------- |
| Portfolio   | Overview, Home, About, Skills, Experience, Activity, Work, Writing, Contact | admin, super_admin   | Canonical CMS editing                  |
| Accounts    | Users                                                                       | super_admin          | Profile/role inspection and assignment |
| Deployments | Deployments and detail                                                      | super_admin          | Studio/Admin Vercel operations         |
| Studio      | None                                                                        | super_admin reserved | No implemented Admin capability        |

Several older granular URLs redirect to the current section-owned workspaces;
they are compatibility paths, not additional features. See [routes and
operations](routes-and-operations.md) for the complete catalog.

## Data and provider access

Admin consumes `@jayant/portfolio-contracts` to validate the same public
columns, JSON shapes, Writing records, section presentation, and assets that
Portfolio reads. Authorized APIs operate on `portfolio.*`,
`jg_app.writing_posts`, and the `portfolio-assets` bucket.

Account administration combines `jg_account.profiles` with Supabase Auth admin
data so super admins can associate roles with real identities. Deployment
operations use server-only Vercel credentials and are currently scoped to the
Studio and Admin project IDs.

## Internal architecture

- `src/proxy.ts` owns request admission, MFA redirect, and role headers.
- `src/lib/config/nav-config.ts` owns active role-aware navigation domains.
- `src/lib/config/portfolio-route-map.ts` owns compatibility redirects.
- `src/app/api/portfolio/[table]/helpers.ts` owns Portfolio allowlists,
  validation, authorization, and revalidation.
- `src/app/api/jg-app/[table]/helpers.ts` owns Writing allowlists and validation.
- `src/lib/vercel-server.ts` is the server-only Vercel transport.

Admin uses `@jayant/web-auth`, `@jayant/web-brand`, `@jayant/web-ui`, and shared
tooling/style packages. It does not export a reusable application API.

## Environment and security

The environment contract is `apps/admin/web/.env.example`. Supabase anonymous
values support normal session/RLS behavior; the service-role key is used only
after route-specific authorization. Auth/session variables support the shared
web cookie and canonical Auth redirects. Vercel token, team, and project IDs
are super-admin server-only inputs.

Admin is non-indexable. Responses carrying identity, role, or deployment data
must remain private. Logs must not expose tokens, auth user metadata, or
deployment environment values.

## Change checklist

When adding an operation, define the domain owner, minimum role, MFA/recent-auth
requirement, explicit resource allowlist, validation, elevated credential
boundary, audit/observability need, and degraded behavior. Update navigation,
route catalog, environment ownership, tests, and owning product documentation.
