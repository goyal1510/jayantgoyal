# Package catalog

This catalog records the current responsibility, consumers, dependency
direction, and public surface of every non-application workspace. Package
manifests and export maps remain executable sources of truth.

## Product-owned contract

### `@jayant/portfolio-contracts`

- Location: `apps/portfolio/contracts`
- Owner: Portfolio
- Consumers: `@jayant/portfolio-web`, `@jayant/admin-web`
- Public exports: `.`, `./writing`, `./guards`, `./portfolio`,
  `./presentation`, `./sections`
- Responsibility: selected public/Admin columns, table and section vocabulary,
  runtime readers/validators, Work case-study shape, Writing shape, and
  transactional section-presentation contract.
- Decision: remain product-owned and shared. Admin consumption does not make it
  ecosystem-neutral. It has no web-client dependency.

## Ecosystem package

### `@jayant/identity`

- Location: `packages/ecosystem/identity`
- Consumer: `@jayant/web-brand`
- Public export: `.`
- Responsibility: framework-neutral person name, product identifiers, and
  public product naming inputs.
- Decision: remain ecosystem-shared. It is dependency-free at runtime and does
  not contain URLs, Next.js metadata, or visual assets.

## Integration package

### `@jayant/github`

- Location: `packages/integrations/github`
- Consumers: `@jayant/portfolio-web`, `@jayant/studio-web`
- Public exports: `.`, `./proxy`, `./server`
- Responsibility: typed GitHub client errors, public/proxy contracts, and
  server statistics client shared by two products.
- Decision: remain shared provider adapter. Product routes retain validation,
  caching, response presentation, and feature ownership.

## Web packages

### `@jayant/web-auth`

- Location: `packages/web/auth`
- Consumers: Studio, Admin, Auth web clients
- Public exports: `./browser`, `./cookies`, `./entry`, `./logout`,
  `./password`, `./profile`, `./redirects`, `./server`, `./service-role`,
  `./surface`
- Responsibility: Supabase SSR client construction, shared cookie modes,
  entry/return helpers, password/profile/provider primitives, logout scope,
  Auth surface vocabulary, and server-only service-role factory.
- Decision: remain web-shared. It intentionally depends on web cookies and
  Supabase SSR; it does not own product authorization or Auth page UI.

### `@jayant/web-brand`

- Location: `packages/web/brand`
- Consumers: all four web clients, `@jayant/web-seo`, `@jayant/web-urls`
- Internal dependency: `@jayant/identity`
- Public export: `.`
- Responsibility: web-facing app names, descriptions, title templates,
  manifests, metadata defaults, and synchronized asset paths.
- Decision: remain web-shared. Framework-neutral identity stays in
  `@jayant/identity`; web projection belongs here.

### `@jayant/web-urls`

- Location: `packages/web/urls`
- Consumers: Auth, Portfolio, Studio, `@jayant/web-seo`
- Internal dependency: `@jayant/web-brand`
- Public export: `.`
- Responsibility: canonical application origins, environment-aware origin
  selection, host checks, and URL construction/rewriting.
- Decision: remain web-shared. It represents web deployment origins, not
  product/platform identity in general.

### `@jayant/web-seo`

- Location: `packages/web/seo`
- Consumers: Portfolio and Studio
- Internal dependencies: `@jayant/web-brand`, `@jayant/web-urls`
- Public export: `.`
- Responsibility: Next.js metadata builders, canonical/social preview data,
  host-aware indexability, and shared path normalization.
- Decision: remain web-shared. SEO is intentionally web/Next.js-specific and
  does not need to become a universal package.

### `@jayant/web-ui`

- Location: `packages/web/ui`
- Consumers: Studio, Admin, Auth
- Public exports: application-surface CSS, route-change/sidebar utilities,
  mobile hook, and wildcard component modules.
- Responsibility: accessible application-shell components and stable UI
  primitives used across three application-style web clients.
- Decision: remain web-shared. Portfolio's editorial system stays local because
  its composition and visual responsibility differ.

### `@jayant/tailwind-config`

- Location: `packages/web/tailwind-config`
- Consumers: all four web clients
- Public exports: `.`, `./postcss`
- Responsibility: shared Tailwind CSS v4 theme foundation and PostCSS config.
- Decision: remain web-shared. Tailwind/PostCSS are web implementation choices,
  not future-native design contracts.

## Tooling packages

### `@jayant/eslint-config`

- Location: `packages/tooling/eslint-config`
- Consumers: every application, product contract, and source package
- Public exports: `./base`, `./next-js`, `./react-internal`
- Responsibility: flat ESLint policies for base TypeScript, Next.js clients,
  and internal React packages.
- Decision: remain tooling-shared. It has no application runtime role.

### `@jayant/typescript-config`

- Location: `packages/tooling/typescript-config`
- Consumers: every application, product contract, and source package
- Public surface: referenced configuration JSON files
- Responsibility: strict base, Next.js, and React-library compiler settings.
- Decision: remain tooling-shared. Client path aliases remain client-local.

## Application dependency summary

| Application             | Internal runtime packages                         |
| ----------------------- | ------------------------------------------------- |
| `@jayant/portfolio-web` | web brand, URLs, SEO; Portfolio contracts; GitHub |
| `@jayant/studio-web`    | web auth, brand, URLs, SEO, UI; GitHub            |
| `@jayant/admin-web`     | web auth, brand, UI; Portfolio contracts          |
| `@jayant/auth-web`      | web auth, brand, URLs, UI                         |

All applications also consume shared web styling and tooling configuration.
No application imports another application's source.

## Audit rules for a new or changed package

Before keeping code shared, document:

1. one cohesive responsibility and named owner;
2. current consumers and why local duplication is worse;
3. framework/platform/provider assumptions;
4. internal dependency direction;
5. public export surface and compatibility expectations;
6. secret/server/client boundary;
7. contract tests and failure semantics.

A package should be removed or moved back to a product when it has one real
consumer, accumulates unrelated helpers, imports application code, or exists
only for hypothetical reuse. `pnpm check:architecture` and
`pnpm check:dead-code` enforce part of this contract.
