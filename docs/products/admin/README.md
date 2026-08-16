# Admin

Admin is the private operations product at
[admin.jayantgoyal.com](https://admin.jayantgoyal.com). Its web client lives at
`apps/admin/web`, runs locally on port 3002, and requires an `admin` or
`super_admin` account.

## Workspaces

Admin owns Portfolio overview and editorial workspaces for Home, About, Skills,
Experience, Activity, Work, Writing, and Contact. It also owns user/role
administration and Vercel deployment operations for authorized super admins.

Older granular Portfolio URLs are compatibility redirects defined by
`src/lib/config/portfolio-route-map.ts`; they are not separate active
workspaces.

## Authorization and data

`src/proxy.ts` authenticates requests, requires the appropriate MFA assurance,
loads the `jg_account.profiles` role, and rejects unauthorized users. Auth owns
the MFA interface and returns the stepped-up session to Admin. Protected layouts
and server routes recheck the relevant authorization boundary.

Admin edits the same Portfolio and Writing contracts consumed publicly:

- Portfolio tables and section presentation through `/api/portfolio/*`.
- `jg_app.writing_posts` through the Writing workspace.
- Public media in `portfolio-assets`.
- Account profiles and roles through `/api/users`.
- Vercel deployment operations through `/api/vercel/deployments/*`.

`@jayant/portfolio-contracts` defines the shared runtime/type boundary.

## Environment and security

The contract is `apps/admin/web/.env.example`. Supabase and shared Auth/session
variables are required. Vercel token, team, and project IDs enable deployment
operations. All service-role and Vercel credentials are server-only. Every
service-role route must authorize the caller before bypassing RLS, and only
super admins may perform user or deployment administration.

Admin remains non-indexable.
