# Admin

Admin is Jayant's private operations product at
[admin.jayantgoyal.com](https://admin.jayantgoyal.com). The current client is
`apps/admin/web`, workspace `@jayantgoyal/admin-web`, running locally on port 3002.

This page describes the coordinated IAM-aware client patch. It must be deployed
with, not before, the reviewed Supabase cutover described in the central
[schema ownership plan](../../shared-systems/data/schema-ownership.md).

## Product boundary

Admin provides privileged operational interfaces; it does not take ownership
of the domains it administers. Its current responsibilities are:

- Portfolio editorial overview and section workspaces;
- Portfolio Work, Writing, and public asset administration;
- identity profile and Admin access administration;
- Vercel deployment listing, inspection, events, and redeployment actions.

Portfolio owns its public content contract. Auth owns credentials, MFA, and
account security. Studio owns its product capabilities even though a reserved
Studio navigation domain exists with no active Admin workspace.

## Roles and access

The proxy requires a valid Supabase user, completes MFA step-up when a verified
factor exists, and evaluates the live `admin.console.enter` capability through
IAM. Roles bundle capabilities; clients do not infer authorization from role
names or JWT metadata.

`admin.full_access` grants the current Admin, Portfolio, and deployment read and
mutation capabilities. `admin.viewer` grants Admin entry plus read-only users,
access, deployments, and unpublished Portfolio content. The preserved operator
accounts `goyal151002@gmail.com` and `gacbbl@gmail.com` are backfilled with
`admin.full_access`. Other identities have no Admin access unless an authorized
operator explicitly activates their Admin membership and assigns one of these
roles.

Every elevated route reauthorizes its caller. Proxy admission alone is not
sufficient for service-role or Vercel-token access. `/unauthorized` and the
callback compatibility path are the only public destinations.

## Current workspaces

| Domain     | Active workspace                                                            | Viewer                     | Full access                        |
| ---------- | --------------------------------------------------------------------------- | -------------------------- | ---------------------------------- |
| Portfolio  | Overview, Home, About, Skills, Experience, Activity, Work, Writing, Contact | Read unpublished content   | Read and mutate canonical CMS data |
| Operations | Users, deployments, and deployment detail                                   | Read users and deployments | Manage access and deployments      |
| Studio     | None                                                                        | No implemented workspace   | No implemented workspace           |

Several older granular URLs redirect to the current section-owned workspaces;
they are compatibility paths, not additional features. See [routes and
operations](routes-and-operations.md) for the complete catalog.

## Data and provider access

Admin consumes `@jayantgoyal/portfolio-contracts` to validate the same public
columns, JSON shapes, Writing records, section presentation, and assets that
Portfolio reads. Authorized APIs operate on `portfolio.*`, including
`portfolio.writing_posts`, and the `portfolio-assets` bucket.

Account administration combines `iam.profiles`, product memberships, and role
assignments with Supabase Auth admin data so full-access operators can associate
Admin access with real identities. Assignment and revocation use transactional,
service-role-only IAM functions that re-evaluate the actor's capability and
write an audit event. Deployment
operations use server-only Vercel credentials and are currently scoped to the
Studio and Admin project IDs.

The Portfolio hero editor treats public person identity as read-only shared
configuration. It edits mutable positioning and SEO-description content, then
derives the preview title from the shared person name and the selected role.
Legacy database identity columns are populated only on singleton creation for
schema compatibility and are not accepted from Admin clients.

## Internal architecture

- `src/proxy.ts` owns request admission, MFA redirect, and access-level headers.
- `src/lib/access.ts` owns the Admin capability vocabulary and caller checks.
- `src/lib/config/nav-config.ts` owns active access-aware navigation domains.
- `src/lib/config/portfolio-route-map.ts` owns compatibility redirects.
- `src/app/api/portfolio/[table]/helpers.ts` owns Portfolio allowlists,
  validation, authorization, and revalidation.
- `src/app/api/writing/[table]/helpers.ts` owns Writing allowlists and validation.
- `src/lib/vercel-server.ts` is the server-only Vercel transport.

Admin uses `@jayantgoyal/identity`, `@jayantgoyal/web-auth`,
`@jayantgoyal/web-brand`, `@jayantgoyal/web-urls`, `@jayantgoyal/web-seo`,
`@jayantgoyal/web-ui`, and shared tooling/style packages. It does not export a
reusable application API.

## Environment and security

The environment contract is `apps/admin/web/.env.example`. Supabase anonymous
values support normal session/RLS behavior; the service-role key is used only
after route-specific capability authorization. Auth/session variables support the shared
web cookie and canonical Auth redirects. Vercel token, team, and project IDs
are super-admin server-only inputs.

Admin is non-indexable and intentionally has no installable web manifest.
Responses carrying identity, role, or deployment data
must remain private. Logs must not expose tokens, auth user metadata, or
deployment environment values.

## Change checklist

When adding an operation, define the domain owner, minimum capability, MFA/recent-auth
requirement, explicit resource allowlist, validation, elevated credential
boundary, audit/observability need, and degraded behavior. Update navigation,
route catalog, environment ownership, tests, and owning product documentation.
