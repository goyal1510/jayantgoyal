# jayantgoyal

`jayantgoyal` is the product-first monorepo for products built by Jayant. The
repository name matches the `jayantgoyal.com` domain; it is a technical
namespace, not Jayant's expanded personal name or an umbrella product brand.

The repository currently contains four independently deployed web clients:

| Product   | Client               | Local | Production                                               |
| --------- | -------------------- | ----- | -------------------------------------------------------- |
| Portfolio | `apps/portfolio/web` | 3000  | [jayantgoyal.com](https://jayantgoyal.com)               |
| Studio    | `apps/studio/web`    | 3001  | [studio.jayantgoyal.com](https://studio.jayantgoyal.com) |
| Admin     | `apps/admin/web`     | 3002  | [admin.jayantgoyal.com](https://admin.jayantgoyal.com)   |
| Auth      | `apps/auth/web`      | 3003  | [auth.jayantgoyal.com](https://auth.jayantgoyal.com)     |

Shaamil is an approved mobile-first communication product definition. It has
no implemented client, workspace, schema, bucket, host, or deployment yet. See
the [Shaamil product boundary](docs/products/shaamil/README.md) and [database
schema ownership contract](docs/shared-systems/data/schema-ownership.md).
The approved prerequisite is to normalize the existing Supabase project around
`iam`, `studio`, `portfolio`, and private `foundation` ownership before adding
Shaamil backend objects.

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
├── foundation/identity/ # Person, technical namespace, products, hosts
├── integrations/github/
├── web/                # Auth, brand, URLs, SEO, UI, and Tailwind contracts
└── tooling/            # ESLint and TypeScript configuration

assets/brand/
├── web/                # Canonical web favicon assets
└── social/             # Canonical product social previews
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
pnpm --filter @jayantgoyal/studio-web dev
```

## Quality checks

```bash
pnpm check:architecture
pnpm check:brand-assets
pnpm check:identity
pnpm check:seo
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

[Documentation index](docs/README.md) is the source of truth for the repository,
architecture, products, clients, shared systems, engineering, operations, and
reference material. Documentation describes the current system only; this
repository does not maintain session entries, progress logs, completed-plan
archives, or an architecture history ledger.

Useful starting points:

- [Architecture principles](docs/architecture/principles.md)
- [Naming contract](docs/shared-systems/design-and-brand/naming-contract.md)
- [Runtime topology](docs/architecture/runtime-topology.md)
- [Repository inventory](docs/reference/repository-inventory.md)
- [Database schema catalog](docs/shared-systems/data/schema-catalog.md)
- [Environment variables](docs/reference/environment-variables.md)
- [Operational runbooks](docs/operations/runbooks.md)
