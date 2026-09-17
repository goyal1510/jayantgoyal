# Package catalog

This catalog records the current responsibility, consumers, dependency
direction, and public surface of every non-application workspace. Package
manifests and export maps remain executable sources of truth.

## Product-owned contract

### `@jayantgoyal/portfolio-contracts`

- Location: `apps/portfolio/contracts`
- Owner: Portfolio
- Consumers: `@jayantgoyal/portfolio-web`, `@jayantgoyal/admin-web`
- Public exports: `.`, `./writing`, `./guards`, `./portfolio`,
  `./presentation`, `./sections`
- Responsibility: selected public/Admin columns, table and section vocabulary,
  runtime readers/validators, Work case-study shape, Writing shape, and
  transactional section-presentation contract.
- Decision: remain product-owned and shared. Admin consumption does not make it
  product-neutral. It has no web-client dependency.

## Foundation package

### `@jayantgoyal/identity`

- Location: `packages/foundation/identity`
- Consumers: `@jayantgoyal/web-brand`, `@jayantgoyal/web-urls`,
  `@jayantgoyal/web-auth`
- Public export: `.`
- Responsibility: framework-neutral person identity, technical namespace,
  product identifiers/names, canonical hosts/origins, and development origins.
- Decision: remain shared and dependency-free. It contains no Next.js metadata
  or visual assets; web projections remain downstream.

## Integration package

### `@jayantgoyal/github`

- Location: `packages/integrations/github`
- Consumers: `@jayantgoyal/portfolio-web`, `@jayantgoyal/studio-web`
- Public exports: `.`, `./proxy`, `./server`
- Responsibility: typed GitHub client errors, public/proxy contracts, and
  server statistics client shared by two products.
- Decision: remain shared provider adapter. Product routes retain validation,
  caching, response presentation, and feature ownership.

## Web packages

### `@jayantgoyal/web-auth`

- Location: `packages/web/auth`
- Consumers: Studio, Admin, Auth web clients
- Public exports: `./browser`, `./cookies`, `./entry`, `./logout`,
  `./password`, `./profile`, `./redirects`, `./server`, `./service-role`,
  `./surface`
- Responsibility: Supabase SSR client construction, shared cookie modes,
  entry/return helpers, password/profile/provider primitives, logout scope,
  Auth surface vocabulary, and server-only service-role factory.
- Internal dependency: `@jayantgoyal/identity` for trusted production hosts,
  cookie-domain policy, and the canonical Auth origin.
- Decision: remain web-shared. It intentionally depends on web cookies and
  Supabase SSR; it does not own product authorization or Auth page UI.

### `@jayantgoyal/web-brand`

- Location: `packages/web/brand`
- Consumers: all four web clients and `@jayantgoyal/web-seo`
- Internal dependency: `@jayantgoyal/identity`
- Public export: `.`
- Responsibility: web-facing app names, descriptions, title templates,
  public labels, canonical asset paths, and social-preview descriptors.
- Decision: remain web-shared. Framework-neutral identity stays in
  `@jayantgoyal/identity`; web projection belongs here.

### `@jayantgoyal/web-urls`

- Location: `packages/web/urls`
- Consumers: Auth, Portfolio, Studio, Admin, `@jayantgoyal/web-seo`
- Internal dependency: `@jayantgoyal/identity`
- Public export: `.`
- Responsibility: canonical application origins, environment-aware origin
  selection, host checks, and URL construction/rewriting.
- Decision: remain web-shared. It represents web deployment origins, not
  product/platform identity in general.

### `@jayantgoyal/web-seo`

- Location: `packages/web/seo`
- Consumers: Portfolio, Studio, Admin, and Auth
- Internal dependencies: `@jayantgoyal/web-brand`, `@jayantgoyal/web-urls`
- Public export: `.`
- Responsibility: Next.js root/page/article metadata builders, web manifests,
  canonical/social preview data, host-aware indexability, and shared path
  normalization.
- Decision: remain web-shared. SEO is intentionally web/Next.js-specific and
  does not need to become a universal package.

### `@jayantgoyal/web-ui`

- Location: `packages/web/ui`
- Consumers: Studio, Admin, Auth
- Public exports: application-surface CSS, route-change/sidebar utilities,
  mobile hook, and wildcard component modules.
- Responsibility: accessible application-shell components and stable UI
  primitives used across three application-style web clients.
- Decision: remain web-shared. Portfolio's editorial system stays local because
  its composition and visual responsibility differ.

### `@jayantgoyal/tailwind-config`

- Location: `packages/web/tailwind-config`
- Consumers: all four web clients
- Public exports: `.`, `./postcss`
- Responsibility: shared Tailwind CSS v4 theme foundation and PostCSS config.
- Decision: remain web-shared. Tailwind/PostCSS are web implementation choices,
  not future-native design contracts.

## Tooling packages

### `@jayantgoyal/eslint-config`

- Location: `packages/tooling/eslint-config`
- Consumers: every application, product contract, and source package
- Public exports: `./base`, `./next-js`, `./react-internal`
- Responsibility: flat ESLint policies for base TypeScript, Next.js clients,
  and internal React packages.
- Decision: remain tooling-shared. It has no application runtime role.

### `@jayantgoyal/typescript-config`

- Location: `packages/tooling/typescript-config`
- Consumers: every application, product contract, and source package
- Public surface: referenced configuration JSON files
- Responsibility: strict base, Next.js, and React-library compiler settings.
- Decision: remain tooling-shared. Client path aliases remain client-local.

## Application dependency summary

| Application                  | Internal runtime packages                                     |
| ---------------------------- | ------------------------------------------------------------- |
| `@jayantgoyal/portfolio-web` | web brand, URLs, SEO; Portfolio contracts; GitHub             |
| `@jayantgoyal/studio-web`    | web auth, brand, URLs, SEO, UI; GitHub                        |
| `@jayantgoyal/admin-web`     | identity; web auth, brand, URLs, SEO, UI; Portfolio contracts |
| `@jayantgoyal/auth-web`      | web auth, brand, URLs, SEO, UI                                |

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
