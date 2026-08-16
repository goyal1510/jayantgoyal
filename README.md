# Jayant

Jayant is a product-first monorepo for Jayant's portfolio, products, and
supporting operations. `jayantgoyal.com` is the primary domain; it is not the
name of a platform or product.

The repository currently contains four independently deployed web clients:

| Product   | Client               | Local | Production                                               |
| --------- | -------------------- | ----- | -------------------------------------------------------- |
| Portfolio | `apps/portfolio/web` | 3000  | [jayantgoyal.com](https://jayantgoyal.com)               |
| Studio    | `apps/studio/web`    | 3001  | [studio.jayantgoyal.com](https://studio.jayantgoyal.com) |
| Admin     | `apps/admin/web`     | 3002  | [admin.jayantgoyal.com](https://admin.jayantgoyal.com)   |
| Auth      | `apps/auth/web`      | 3003  | [auth.jayantgoyal.com](https://auth.jayantgoyal.com)     |

## Repository map

```text
apps/
├── portfolio/
│   ├── web/            # Public Portfolio client
│   └── contracts/      # Portfolio/Admin data contracts
├── studio/web/         # Products, tools, games, and private workspaces
├── admin/web/          # CMS, account, and deployment operations
└── auth/web/           # Shared entry and account-security experience

packages/
├── ecosystem/identity/ # Product-neutral Jayant identity
├── integrations/github/
├── web/                # Auth, brand, URLs, SEO, UI, and Tailwind contracts
└── tooling/            # ESLint and TypeScript configuration

assets/brand/web/       # Canonical web favicon assets
docs/                   # Canonical current-state documentation
scripts/                # Repository checks and operational helpers
supabase/               # Migrations, schema snapshots, and local config
```

There are no placeholder mobile, desktop, commerce, advertising, or sales
implementations. A real client or capability is added inside the owning product
when it exists, while remaining in this monorepo.

## Start locally

Requirements: Node.js 22+ and pnpm 10.32.1.

```bash
pnpm install
cp apps/portfolio/web/.env.example apps/portfolio/web/.env.local
cp apps/studio/web/.env.example apps/studio/web/.env.local
cp apps/admin/web/.env.example apps/admin/web/.env.local
cp apps/auth/web/.env.example apps/auth/web/.env.local
pnpm dev
```

Run one client with its workspace name, for example:

```bash
pnpm --filter @jayant/studio-web dev
```

## Quality checks

```bash
pnpm check:architecture
pnpm check:brand-assets
pnpm check:service-role
pnpm check:source-health
pnpm check:dead-code
pnpm check:docs
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

## Documentation

[Documentation index](docs/README.md) is the source of truth for the ecosystem,
architecture, products, clients, shared systems, engineering, operations, and
reference material. Documentation describes the current system only; this
repository does not maintain session entries, progress logs, completed-plan
archives, or an architecture history ledger.
