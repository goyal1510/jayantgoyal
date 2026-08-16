# Jayant

Product-first web applications by Jayant. `jayantgoyal.com` is the domain;
**Jayant** is the repository and product identity.

This is a Turborepo monorepo containing four independently deployed Next.js
applications and the packages they genuinely share. Every implementation in
this repository is currently a web client. There is no iOS, Android, macOS, or
Windows client yet.

## Applications

| Application | Source           | Production                                               | Local  | Responsibility                                                             |
| ----------- | ---------------- | -------------------------------------------------------- | ------ | -------------------------------------------------------------------------- |
| Portfolio   | `apps/portfolio` | [jayantgoyal.com](https://jayantgoyal.com)               | `3000` | Public profile, About, Work, Writing, Resume, and Contact                  |
| Studio      | `apps/studio`    | [studio.jayantgoyal.com](https://studio.jayantgoyal.com) | `3001` | Product discovery, public utilities, games, and private workspaces         |
| Admin       | `apps/admin`     | [admin.jayantgoyal.com](https://admin.jayantgoyal.com)   | `3002` | Portfolio CMS, user administration, and Vercel deployment operations       |
| Auth        | `apps/auth`      | [auth.jayantgoyal.com](https://auth.jayantgoyal.com)     | `3003` | Sign-in, recovery, MFA, connected providers, profile, and account security |

Studio's code-owned registries currently expose:

- 10 catalog entries, including one external E-commerce experiment.
- 87 browser-based developer tools across 11 categories.
- 9 games with solo, local, or authenticated online modes depending on the
  game.
- Account-backed Activity Tracker, Currency Calculator, File Manager, Sync
  Scratchpad, and Game Hub workspaces.

The canonical registries are
`apps/studio/src/lib/config/studio-inventory.ts`,
`apps/studio/src/lib/tools/tools.ts`, and
`apps/studio/src/lib/games/config.ts`.

## Repository Structure

```text
jayantgoyal/
├── apps/
│   ├── portfolio/          # Public professional and editorial content
│   ├── studio/             # Products, utilities, games, and workspaces
│   ├── admin/              # CMS, users, and deployment operations
│   └── auth/               # Shared account entry and security surface
├── packages/
│   ├── auth/               # Supabase session and auth contracts
│   ├── brand/              # Jayant and application identity
│   ├── github/             # GitHub API client and statistics
│   ├── platform/           # Canonical application hosts and URLs
│   ├── portfolio-data/     # Portfolio/Admin data and validation contracts
│   ├── seo/                # Shared web metadata and indexability helpers
│   ├── ui/                 # Studio/Admin/Auth React UI and app shell
│   ├── tailwind-config/    # Shared Tailwind CSS source and PostCSS config
│   ├── eslint-config/      # Shared flat ESLint configurations
│   └── typescript-config/  # Shared strict TypeScript configurations
├── scripts/                # Architecture, security, build, and DB checks
├── supabase/
│   ├── migrations/         # Ordered database changes
│   └── schemas/            # Canonical schema snapshots
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Ownership Rules

The repository follows three ownership levels:

1. Client-specific code stays in its application.
2. Product-specific data, business rules, routes, and UI stay with the product.
3. A package is shared only when multiple applications use a stable
   responsibility.

Product and platform are separate concepts. A future native client should be
added only when a real product needs it; the repository does not maintain empty
platform folders or speculative universal abstractions.

Shared-package dependency direction is intentionally small:

```text
brand ──> platform ──> seo
  │           │          │
  └────────── applications

auth, github, portfolio-data, and ui ──> consuming applications
applications -/-> other application source
shared packages -/-> application source
```

| Package                   | Responsibility                                                                              | Direct application consumers |
| ------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------- |
| `@repo/auth`              | Supabase clients, cookie/session modes, safe returns, password policy, profiles, and logout | Studio, Admin, Auth          |
| `@repo/brand`             | Person identity, application names, metadata, and synchronized asset paths                  | All four apps                |
| `@repo/github`            | GitHub API access, caching, proxying, and statistics                                        | Portfolio, Studio            |
| `@repo/platform`          | Application origins, host checks, and cross-app URL rewriting                               | Portfolio, Studio, Auth      |
| `@repo/portfolio-data`    | Portfolio CMS types, field lists, validation, presentation, and Writing contracts           | Portfolio, Admin             |
| `@repo/seo`               | Next.js metadata and public path helpers                                                    | Portfolio, Studio            |
| `@repo/ui`                | React components and shared application shell                                               | Studio, Admin, Auth          |
| `@repo/tailwind-config`   | Shared web styling and PostCSS setup                                                        | All four apps                |
| `@repo/eslint-config`     | Base, Next.js, and internal React lint rules                                                | All apps and source packages |
| `@repo/typescript-config` | Strict base, Next.js, and React-library compiler settings                                   | All apps and source packages |

Portfolio deliberately owns its editorial UI and does not consume the shared
product application shell.

## Data and Authentication

Supabase owns authentication, Postgres, Realtime, and Storage. The active
database is organized by responsibility:

| Schema       | Ownership                                                         |
| ------------ | ----------------------------------------------------------------- |
| `jg_account` | Profiles, roles, terms acceptance, and account helpers            |
| `portfolio`  | Public Portfolio CMS records and contact rate limiting            |
| `jg_app`     | Studio workspaces, games, tool usage, and Portfolio Writing posts |

Canonical schema snapshots are
`supabase/schemas/jg_account.sql`, `supabase/schemas/portfolio.sql`, and
`supabase/schemas/jg_app.sql`. Active storage buckets include `private-files`,
`portfolio-assets`, and `profile-avatars`.

Auth is the default owner of sign-in and account-security flows. Studio and
Admin keep compatibility entry routes for rollback, while the shared
`@repo/auth` package owns the cross-application session-cookie contract.
Service-role access is server-only and limited to authorized Studio/Admin
operations; Portfolio and Auth do not require a service-role credential.

## Technology

- Next.js 16, React 19, and TypeScript 5.9
- Tailwind CSS v4, Radix UI, Framer Motion, and Lucide
- Supabase Auth, Postgres, Realtime, and Storage
- Turborepo with pnpm workspaces
- Vitest, ESLint, and Prettier
- Vercel deployments with application-aware ignored-build checks

## Getting Started

Requirements:

- Node.js 22 or newer
- pnpm 10.32.1 (the version pinned in `package.json`)

```bash
git clone git@github.com:goyal1510/jayantgoyal.git
cd jayantgoyal
pnpm install

cp apps/portfolio/.env.example apps/portfolio/.env.local
cp apps/studio/.env.example apps/studio/.env.local
cp apps/admin/.env.example apps/admin/.env.local
cp apps/auth/.env.example apps/auth/.env.local
```

Each application owns its environment contract. Read its `.env.example`; do
not copy the union of every variable into every deployment.

```bash
pnpm --filter portfolio dev  # http://localhost:3000
pnpm --filter studio dev     # http://localhost:3001
pnpm --filter admin dev      # http://localhost:3002
pnpm --filter auth dev       # http://localhost:3003
pnpm dev                     # all applications
```

## Validation and Operations

| Command                     | Purpose                                                       |
| --------------------------- | ------------------------------------------------------------- |
| `pnpm build`                | Build all applications and packages through Turborepo         |
| `pnpm lint`                 | Run ESLint with zero warnings                                 |
| `pnpm check-types`          | Generate Next.js route types and run strict TypeScript checks |
| `pnpm test`                 | Run the cross-repository Vitest regression suite              |
| `pnpm check:architecture`   | Enforce application/package dependency boundaries             |
| `pnpm check:brand-assets`   | Verify shared brand assets match across apps                  |
| `pnpm check:service-role`   | Prevent client-side and Portfolio service-role usage          |
| `pnpm check:bundle-budgets` | Build and verify whole-client and route bundle budgets        |
| `pnpm db:migrations:check`  | Compare local migrations with the linked Supabase project     |
| `pnpm test:db:linked`       | Verify linked database boundaries and schema invariants       |
| `pnpm format`               | Format TypeScript and Markdown files                          |

GitHub Actions runs architecture, brand, service-role, lint, type, and test
checks on pull requests and pushes to `main`. Vercel deploys each application
independently and skips builds when a commit does not affect that application
or a shared dependency.

## Maintained Documentation

Documentation is deliberately colocated and small:

- `README.md` describes the repository and current architecture.
- `AGENTS.md` contains implementation and safety rules for coding agents.
- `apps/*/README.md` describes each deployed application's owned surface.

Feature registries, package manifests, route files, and schema snapshots remain
the detailed source of truth. The repository does not maintain a central
`docs/` tree, architecture-history ledger, session log, or completed-work QA
archive.
