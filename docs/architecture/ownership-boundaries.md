# Ownership boundaries

Code belongs at the narrowest stable ownership level:

1. Client-specific route, API, UI, and authorization code stays in its client.
2. Product-specific types and business contracts stay with the product.
3. Cross-product responsibilities become packages only when reuse is real and
   stable.

## Dependency direction

```text
                  shared identity
                 /       |       \
                v        v        v
        web brand    web URLs   web auth
                \        /
                 v      v
                  web SEO
                     |
                     v
                web clients

product contracts ──► owning and administrative clients
integrations ────────► consuming clients
tooling ─────────────► workspace configuration
```

The following edges are forbidden:

- A reusable package importing any application client source.
- A web client importing another web client's source.
- A product-neutral foundation package importing web, integration, or
  product-specific contracts.
- A provider integration importing web or product-specific contracts.
- A product contract importing a web package.

`pnpm check:architecture` enforces these boundaries from directory ownership
rather than maintaining a flat hard-coded list of packages.

## Current shared packages

| Package                            | Ownership                                              |
| ---------------------------------- | ------------------------------------------------------ |
| `@jayantgoyal/identity`            | Framework-neutral person and product identity          |
| `@jayantgoyal/web-brand`           | Web-facing labels, descriptions, and asset paths       |
| `@jayantgoyal/web-urls`            | Canonical origins, host checks, and URL construction   |
| `@jayantgoyal/web-seo`             | Next.js metadata, manifests, and indexability helpers  |
| `@jayantgoyal/web-auth`            | Supabase SSR and shared web session/auth contracts     |
| `@jayantgoyal/web-ui`              | Studio/Admin/Auth React components and app shell       |
| `@jayantgoyal/portfolio-contracts` | Portfolio CMS types, validation, and presentation data |
| `@jayantgoyal/github`              | GitHub provider clients and statistics                 |
| `@jayantgoyal/tailwind-config`     | Shared web styles and PostCSS configuration            |
| `@jayantgoyal/eslint-config`       | Shared lint rules                                      |
| `@jayantgoyal/typescript-config`   | Shared strict compiler configuration                   |

Portfolio intentionally does not consume the shared application shell. Its
public editorial design remains product-owned.
