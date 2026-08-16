# Ownership boundaries

Code belongs at the narrowest stable ownership level:

1. Client-specific route, API, UI, and authorization code stays in its client.
2. Product-specific types and business contracts stay with the product.
3. Cross-product responsibilities become packages only when reuse is real and
   stable.

## Dependency direction

```text
ecosystem identity
       │
       ▼
web brand ──► web URLs ──► web SEO
       │             │
       └──────┬──────┘
              ▼
         web clients

product contracts ──► owning and administrative clients
integrations ────────► consuming clients
tooling ─────────────► workspace configuration
```

The following edges are forbidden:

- A reusable package importing any application client source.
- A web client importing another web client's source.
- A product-neutral ecosystem package importing web, integration, or
  product-specific contracts.
- A provider integration importing web or product-specific contracts.
- A product contract importing a web package.

`pnpm check:architecture` enforces these boundaries from directory ownership
rather than maintaining a flat hard-coded list of packages.

## Current shared packages

| Package                       | Ownership                                              |
| ----------------------------- | ------------------------------------------------------ |
| `@jayant/identity`            | Framework-neutral person and product identity          |
| `@jayant/web-brand`           | Web metadata, manifests, and asset paths               |
| `@jayant/web-urls`            | Canonical origins, host checks, and URL construction   |
| `@jayant/web-seo`             | Next.js public metadata and indexability helpers       |
| `@jayant/web-auth`            | Supabase SSR and shared web session/auth contracts     |
| `@jayant/web-ui`              | Studio/Admin/Auth React components and app shell       |
| `@jayant/portfolio-contracts` | Portfolio CMS types, validation, and presentation data |
| `@jayant/github`              | GitHub provider clients and statistics                 |
| `@jayant/tailwind-config`     | Shared web styles and PostCSS configuration            |
| `@jayant/eslint-config`       | Shared lint rules                                      |
| `@jayant/typescript-config`   | Shared strict compiler configuration                   |

Portfolio intentionally does not consume the shared application shell. Its
public editorial design remains product-owned.
