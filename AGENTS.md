# AGENTS.md

Repository operating contract for coding agents working on **Jayant**.
`jayantgoyal.com` is the domain, not the product or platform name.

Read `README.md` for the current public architecture and each
`apps/*/README.md` for application ownership. Code, manifests, registries,
tests, environment examples, and schema snapshots are authoritative when prose
disagrees.

## Current State

- Four independently deployed Next.js web applications: Portfolio, Studio,
  Admin, and Auth.
- No mobile or desktop implementation exists.
- pnpm workspaces and Turborepo coordinate apps and source packages.
- Supabase provides Auth, Postgres, Realtime, and Storage.
- Vercel deploys each application independently from `main`.

Do not create platform folders, native implementations, or shared packages for
hypothetical future clients.

## Commands

Requirements: Node.js 22+ and pnpm 10.32.1.

```bash
pnpm install
pnpm dev
pnpm --filter portfolio dev  # port 3000
pnpm --filter studio dev     # port 3001
pnpm --filter admin dev      # port 3002
pnpm --filter auth dev       # port 3003

pnpm build
pnpm lint
pnpm check-types
pnpm test
pnpm format

pnpm check:architecture
pnpm check:brand-assets
pnpm check:service-role
pnpm check:bundle-budgets
pnpm db:migrations:check
pnpm test:db:linked
```

Build configuration is not a substitute for type checking. Always run
`pnpm check-types` for TypeScript changes.

## Ownership

### Applications

| App       | Owns                                                          | Primary routes                                                                                                                                             |
| --------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portfolio | Public professional/editorial content and public integrations | `/`, `/about`, `/work`, `/work/[slug]`, `/writing`, `/writing/[slug]`, `/resume`, `/contact`                                                               |
| Studio    | Product discovery, utilities, games, and private workspaces   | `/`, `/products`, `/tools`, `/weather`, `/github-stats`, `/custom-calculator`, `/games`, `/activity-tracker/*`, `/calculator/*`, `/files/*`, `/scratchpad` |
| Admin     | Portfolio CMS, users, and deployment operations               | `/portfolio/*`, `/users`, `/deployments/*`                                                                                                                 |
| Auth      | Shared sign-in and account-security experience                | `/welcome`, `/forgot-password`, `/reset-password`, `/verify`, `/mfa`, `/account/*`, `/logout`, `/callback`                                                 |

Application-specific routes, UI, API handlers, authorization, and business
rules remain inside their owning app.

### Shared Packages

| Package                   | Stable responsibility                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| `@repo/auth`              | Supabase clients, session cookies, auth entry URLs, safe returns, password/profile/logout contracts |
| `@repo/brand`             | Jayant identity, app names, metadata, and shared asset paths                                        |
| `@repo/github`            | GitHub API client, proxy client, caching, and statistics                                            |
| `@repo/platform`          | Canonical hosts, origins, URLs, and cross-app URL rewriting                                         |
| `@repo/portfolio-data`    | Portfolio/Admin data types, field contracts, validation, Writing, and section ownership             |
| `@repo/seo`               | Shared web metadata and indexability helpers                                                        |
| `@repo/ui`                | Studio/Admin/Auth React components and application shell                                            |
| `@repo/tailwind-config`   | Shared Tailwind CSS and PostCSS configuration                                                       |
| `@repo/eslint-config`     | Base, Next.js, and internal React flat configs                                                      |
| `@repo/typescript-config` | Strict base, Next.js, and React-library configs                                                     |

Dependency direction:

- Shared packages must never import application source.
- Applications may depend on packages, never on another application's source.
- `@repo/platform` depends only on `@repo/brand`.
- `@repo/seo` depends only on `@repo/brand` and `@repo/platform`.
- Keep product logic local until at least two products have genuine stable
  reuse.
- Web-specific packages are valid when their ownership is explicit.
- Portfolio owns its editorial component system and must not import
  `@repo/ui/application-shell` or `@repo/ui/application-surface.css`.

Run `pnpm check:architecture` after changing dependency boundaries.

## Application Conventions

### Next.js

- Next.js 16 request middleware lives in `src/proxy.ts`, not
  `middleware.ts`.
- Pages may remain server components and delegate interactions to colocated
  client components; do not force the pattern when a page has no client state.
- Use the `@/*` alias for application-local `src/*` imports.
- Check and surface every Supabase error.
- Never expose a service-role credential to a client module.
- Do not use `next/image` for unsupported external URLs; use a normal `<img>`
  when the host cannot be safely configured.

### Studio registries

Studio navigation and documentation must derive from these sources:

- Products: `apps/studio/src/lib/config/studio-inventory.ts`
- Surfaces/access: `apps/studio/src/lib/config/studio-surfaces.ts`
- Games: `apps/studio/src/lib/games/config.ts`
- Tools: `apps/studio/src/lib/tools/tools.ts`
- Sidebar navigation: `apps/studio/src/lib/config/hub-config.ts`

When adding a public Studio route:

1. Add route metadata.
2. Add the route to `apps/studio/src/app/sitemap.ts` when indexable.
3. Reconcile `PUBLIC_PAGES` in `apps/studio/src/proxy.ts`.
4. Reconcile `PUBLIC_PREFIXES`/`PUBLIC_EXACT` in
   `apps/studio/src/components/auth/auth-gate.tsx`.
5. Add zero-cost API paths only when they truly require no session lookup.
6. Update the appropriate registry and its tests.

### Portfolio

- Portfolio content is database-backed; do not add duplicated static content
  fallbacks.
- `getEditorialPortfolioData()` and `getPortfolioShellData()` load the public
  CMS contract.
- `@repo/portfolio-data` is the shared runtime/type boundary between Portfolio
  reads and Admin writes.
- Writing is stored in `jg_app.writing_posts` but rendered by Portfolio and
  edited by Admin.
- Public Portfolio routes require canonical metadata, Open Graph/Twitter data,
  sitemap coverage, and indexability checks.
- Portfolio has no Supabase service-role environment variable.

### Admin

- `(admin)` routes require an authenticated `admin` or `super_admin` profile.
- Portfolio workspaces are `home`, `about`, `skills`, `experience`, `activity`,
  `work`, `writing`, and `contact`.
- Older granular CMS URLs intentionally redirect through
  `portfolio-route-map.ts`; do not document them as active workspaces.
- Service-role routes must perform their own user/role authorization before
  bypassing RLS.
- Only `super_admin` may access user/deployment administration.

### Auth

- Auth is the default owner of entry, recovery, MFA, provider linking, profile,
  password, and logout flows.
- `NEXT_PUBLIC_AUTH_FLOW_OWNER=legacy` is rollback behavior, not the normal
  architecture.
- `NEXT_PUBLIC_AUTH_SESSION_MODE=platform` is the normal cross-subdomain
  session mode; compatibility/legacy modes exist for controlled rollback.
- Validate mutation origins, return targets, MFA step-up, and recent sign-in
  requirements. Never place auth tokens in URLs or logs.
- Auth uses only the Supabase anonymous key and RLS; it has no service-role
  credential.

## Supabase

The canonical linked project is `jayantgoyal`
(`orwfvyditlguqvxvztkw`). Verify both values before any linked remote operation.

### Active ownership

- `jg_account`: profiles, roles, terms acceptance, account helpers.
- `portfolio`: public CMS data and contact rate limiting.
- `jg_app`: Activity Tracker, Currency Calculator, File Manager, Game Hub,
  Scratchpad, tool usage, and Writing.
- Storage: `private-files`, `portfolio-assets`, and `profile-avatars`.

Always select the intended schema explicitly. Standard new UUID keys use
`jg_app.uuid_v7()` where the schema contract calls for it; standard timestamp
triggers use `jg_app.update_updated_at()`.

### Source of truth

- Ordered changes: `supabase/migrations/*.sql`
- Canonical snapshots: `supabase/schemas/jg_account.sql`,
  `supabase/schemas/jg_app.sql`, and `supabase/schemas/portfolio.sql`
- Safe history check: `pnpm db:migrations:check`
- Linked invariant check: `pnpm test:db:linked`

Never repair migration history automatically. Any unexplained local/remote
drift blocks migration apply.

Remote migration apply must follow the global
`supabase-remote-migration-apply` rule/skill and run from its clean disposable
minimal workdir. Do not apply from the source clone or an ordinary worktree.

After a successful remote migration, dump and review all three canonical schema
snapshots from the verified project, confirm they contain schema only, and
commit the refreshed snapshots with the migration. Never retain
`supabase/.temp/pooler-url`, database passwords, access tokens, or connection
strings.

## Environment Contracts

Each app owns `.env.example`; add variables only to consuming applications and
deployment targets.

- Portfolio: public Supabase connection, contact rate limiting, GitHub, Resend,
  and Google Resume export.
- Studio: Supabase, service role, Wordle seed, Auth routing/session, Weather,
  and GitHub.
- Admin: Supabase, service role, Auth routing/session, and Vercel management.
- Auth: Supabase anonymous connection, session/cookie configuration, app
  origins, and allowed return origins.

Never commit `.env.local` files or print secret values.

## Validation

GitHub Actions runs these required checks on pull requests and pushes to
`main`:

1. `pnpm check:architecture`
2. `pnpm check:brand-assets`
3. `pnpm check:service-role`
4. `pnpm lint`
5. `pnpm check-types`
6. `pnpm test`

For application-facing changes, also build the affected app. Run the full
`pnpm build` when shared package or root configuration changes can affect
multiple apps. Bundle-sensitive changes should run
`pnpm check:bundle-budgets`.

Tests use root Vitest coverage across apps and source packages; Studio also has
an app-local Vitest configuration. Add focused regression tests for changed
behavior.

## Documentation Policy

Maintained documentation is limited to:

- Root `README.md`
- Root `AGENTS.md` and `AGENTS.local.md`
- One `README.md` per deployed application

Do not recreate a central `docs/` folder, architecture/history ledger,
completed-work QA file, or personal-repository session entry unless the user
explicitly requests it. Feature registries, manifests, routes, tests, and
schema snapshots are the detailed source of truth.

## Git

- Default branch: `main`
- Direct commits are the normal solo-development workflow when requested.
- Follow the global source-clone protection, worktree, account-routing,
  base-freshness, and shipping rules.
- Personal remote: `git@github-p:goyal1510/jayantgoyal.git`
- Personal identity: `Jayant <goyal151002@gmail.com>`
- Never add `Co-Authored-By` lines.
