# Runtime topology

Jayant is one source repository with four independently deployed Next.js web
clients. Supabase is the shared identity and data service. External providers
are reached by the product that owns the user-facing capability.

## Deployment topology

```text
GitHub repository (main)
  ├─ Portfolio web ── jayantgoyal.com
  ├─ Studio web ───── studio.jayantgoyal.com
  ├─ Admin web ────── admin.jayantgoyal.com
  └─ Auth web ─────── auth.jayantgoyal.com

All four clients
  ├─ consume selected workspace packages
  └─ connect to one verified Supabase project
       ├─ Supabase Auth
       ├─ iam + iam_private
       ├─ studio
       ├─ portfolio
       ├─ foundation (private helpers)
       └─ Storage buckets
```

This diagram is the coordinated post-cutover topology. The hosted schemas and
deployed clients retain their predecessor contracts until the reviewed
migrations and clients are released together.

Vercel projects have separate root directories and environment sets. A shared
package change can affect multiple deployments even when only one product
source directory changed.

## Public Portfolio request

```text
Browser
  → Portfolio server component
  → anonymous Supabase server client
  → portfolio tables, including portfolio.writing_posts
  → Portfolio contract validation and editorial mapping
  → server-rendered public page
```

Portfolio uses RLS-readable canonical CMS data. Core loader failures are
surfaced; no duplicated static editorial dataset silently replaces the
database. Contact, Resume export, and GitHub statistics use route handlers
because they require validation, secrets, or provider access.

## Studio public request

```text
Browser
  → Studio proxy public classification
  → protected-group layout and client AuthGate classification
  → public catalog/tool/weather/GitHub/custom-calculator page
```

Public Studio pages avoid a full Supabase identity lookup when possible. Public
does not mean every API is anonymous: APIs have their own zero-cost,
auth-aware-public, or protected policy. Tool catalog and product catalog pages
are derived from Studio-owned registries.

## Studio account request

```text
Browser with shared session cookie
  → Studio proxy
     → Supabase getUser
     → live Studio product membership
     → MFA, recovery-mode, and versioned terms middleware
  → account workspace or API
  → capability- and owner-scoped studio query / RPC / Storage operation
  → response or Realtime update
```

Activity Tracker, Currency Calculator history, File Manager, Sync Scratchpad,
tool favorites/history, typing results, and online game rooms are account-backed.
RLS and explicit user checks prevent one account from operating on another
account's records.

## Authentication and cross-product return

```text
Studio/Admin protected URL
  → product proxy builds Auth-owned entry URL
  → Auth validates return origin and path
  → Supabase password/OAuth/recovery/MFA operation
  → shared production session cookie
  → exact validated product return target
```

Auth owns credentials, recovery, MFA UI, connected identities, profile, and
normal logout. Studio and Admin keep redirect aliases and narrow callback
compatibility only. The shared cookie is scoped to trusted production hosts;
Preview and local hosts use safer host/local behavior.

## Admin privileged request

```text
Browser
  → Admin proxy authenticates session
  → MFA assurance check
  → iam.has_capability('admin.console.enter')
  → Admin page or route handler
  → route-specific product.resource.action capability
  → RLS query or server-only service-role/provider call
```

Admin access does not transfer product ownership. Portfolio remains the owner
of its content contract; Admin is the privileged editor. `admin.viewer` is
read-only. `admin.full_access` includes the current access-management,
Portfolio mutation, and deployment operations.

## Data ownership and access modes

| Boundary                        | Primary owner     | Typical access                                |
| ------------------------------- | ----------------- | --------------------------------------------- |
| Supabase identities and factors | Auth              | Supabase Auth APIs with user session          |
| `iam.profiles` and access data  | Cross-product IAM | Self/read policies; trusted access mutations  |
| `portfolio.*`                   | Portfolio         | Public reads; capability-authorized writes    |
| `portfolio.writing_posts`       | Portfolio         | Published reads; capability-authorized writes |
| `studio.*` tables               | Studio            | Capability- and owner-scoped RLS/APIs         |
| `portfolio-assets`              | Portfolio         | Public reads; Admin-authorized writes         |
| `studio-files`                  | Studio            | Private capability- and owner-scoped access   |
| `profile-avatars`               | Auth              | Private owner-only access and signed display  |

See the [schema catalog](../shared-systems/data/schema-catalog.md) for current
tables and the [integration guide](../shared-systems/integrations/README.md)
for provider paths.

## Trust boundaries

- Browser-visible values are untrusted even when produced by the application.
- Proxy headers are stripped and recreated before downstream code trusts them.
- Session presence is only a fast-path hint; sensitive operations call
  Supabase and authorize the current user.
- Service-role clients and provider tokens stay in server-only modules.
- Return URLs cross product hosts only through exact origin allowlists and safe
  relative-path validation.
- Database schema snapshots describe current remote structure; migrations
  describe reviewed forward changes.

## Failure boundaries

The four web clients deploy independently, so one deployment can fail without
removing all products. Supabase or shared-session failures can affect several
products. Provider failures should degrade only the owning feature: GitHub
statistics, contact delivery, Resume export, weather, or deployment operations.
Canonical content and authorization failures are surfaced rather than silently
converted into successful but incorrect behavior.
