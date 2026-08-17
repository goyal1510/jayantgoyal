# Repository inventory

This is the current source layout and authority map for the `jayantgoyal`
monorepo.

## Root inventory

| Path                     | Responsibility                                                 | Authoritative contents                                    |
| ------------------------ | -------------------------------------------------------------- | --------------------------------------------------------- |
| `apps/`                  | Product clients and product-owned contracts                    | Four web clients; Portfolio contract                      |
| `packages/foundation/`   | Framework-neutral foundation concepts                          | Person/product identity                                   |
| `packages/web/`          | Stable cross-product web contracts                             | Auth, brand, URLs, SEO, UI, Tailwind                      |
| `packages/integrations/` | Shared provider adapters                                       | GitHub                                                    |
| `packages/tooling/`      | Shared compiler/lint configuration                             | ESLint and TypeScript                                     |
| `assets/brand/`          | Canonical web icon and social-preview sources                  | Copies verified in each client                            |
| `supabase/migrations/`   | Ordered forward database changes                               | Reviewed SQL history                                      |
| `supabase/schemas/`      | Current application schema snapshots                           | `foundation`, `iam`, `iam_private`, `studio`, `portfolio` |
| `scripts/`               | Architecture, health, build, database, and provider automation | Root quality gates                                        |
| `docs/`                  | Central current-state knowledge base                           | No app-local detailed READMEs                             |
| `.github/workflows/`     | Repository CI                                                  | Quality workflow for push/PR                              |

Root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `vitest.config.ts`,
`knip.json`, and lockfile define the workspace/build/test dependency graph.

## Application workspaces

| Product   | Workspace                    | Path                 | Pages | Route handlers | Data/provider focus                              |
| --------- | ---------------------------- | -------------------- | ----: | -------------: | ------------------------------------------------ |
| Portfolio | `@jayantgoyal/portfolio-web` | `apps/portfolio/web` |     8 |              5 | Public CMS/Writing, contact, Resume, GitHub      |
| Studio    | `@jayantgoyal/studio-web`    | `apps/studio/web`    |   125 |             40 | Public utilities plus account workspaces/games   |
| Admin     | `@jayantgoyal/admin-web`     | `apps/admin/web`     |    27 |             10 | CMS, roles, deployments                          |
| Auth      | `@jayantgoyal/auth-web`      | `apps/auth/web`      |    15 |              3 | Entry, recovery, MFA, profile, providers, logout |

Counts reflect `page.tsx` and `route.ts` files. Route groups and framework
special files do not add URL segments. Product route documents explain access
and compatibility behavior.

## Product contract workspace

`@jayantgoyal/portfolio-contracts` at `apps/portfolio/contracts` is owned by
Portfolio and consumed by Portfolio web and Admin web. It exports root,
Writing, guards, Portfolio rows/select columns, presentation, and section
contracts. It has no Next.js/React runtime dependency.

## Shared package groups

| Group        | Workspaces                                                                                                                                                |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundation   | `@jayantgoyal/identity`                                                                                                                                   |
| Web          | `@jayantgoyal/web-auth`, `@jayantgoyal/web-brand`, `@jayantgoyal/web-urls`, `@jayantgoyal/web-seo`, `@jayantgoyal/web-ui`, `@jayantgoyal/tailwind-config` |
| Integrations | `@jayantgoyal/github`                                                                                                                                     |
| Tooling      | `@jayantgoyal/eslint-config`, `@jayantgoyal/typescript-config`                                                                                            |

See the [package catalog](package-catalog.md) for consumers, dependencies, and
public exports.

## Product-owned registries

Frequently changing inventories should be edited in their runtime owners:

| Inventory                       | Owner file                                                    |
| ------------------------------- | ------------------------------------------------------------- |
| Studio products                 | `apps/studio/web/src/lib/config/studio-inventory.ts`          |
| Studio surfaces/access metadata | `apps/studio/web/src/lib/config/studio-surfaces.ts`           |
| Studio navigation               | `apps/studio/web/src/lib/config/hub-config.ts`                |
| Studio games                    | `apps/studio/web/src/lib/games/config.ts`                     |
| Studio tools                    | `apps/studio/web/src/lib/tools/tools.ts` and category modules |
| Admin navigation/roles          | `apps/admin/web/src/lib/config/nav-config.ts`                 |
| Admin compatibility routes      | `apps/admin/web/src/lib/config/portfolio-route-map.ts`        |
| Auth surface routes             | `packages/web/auth/src/surface.ts`                            |
| Person, products, origins/hosts | `packages/foundation/identity`                                |
| Web brand and URL projections   | `packages/web/brand` and `packages/web/urls`                  |

## Database inventory

Current schema snapshots contain 40 application tables and 31 application
functions across `foundation`, `iam`, `iam_private`, `studio`, and `portfolio`, plus three active
Storage buckets documented in the [schema
catalog](../shared-systems/data/schema-catalog.md). Supabase has no repository
Edge Functions directory or generated database types package at present.

## Quality and automation inventory

The repository enforces architecture, identity/namespace, brand assets, SEO,
service-role boundaries, source line limits, dead code, documentation, lint,
strict types, Vitest, full builds, bundle budgets, and migration-history
checks. GitHub Actions runs the core quality set for `main` and pull requests.
Vercel independently deploys the four client roots from one repository.

LinkedIn scripts remain manual tooling under `scripts/linkedin` and are outside
the current restructure/documentation implementation scope.
