# Package catalog

| Workspace                     | Location                             | Responsibility                                     |
| ----------------------------- | ------------------------------------ | -------------------------------------------------- |
| `@jayant/portfolio-contracts` | `apps/portfolio/contracts`           | Portfolio/Admin CMS types and runtime validation   |
| `@jayant/identity`            | `packages/ecosystem/identity`        | Framework-neutral person and product identity      |
| `@jayant/github`              | `packages/integrations/github`       | Shared GitHub provider clients and statistics      |
| `@jayant/web-auth`            | `packages/web/auth`                  | Supabase SSR, sessions, entry, profile, and logout |
| `@jayant/web-brand`           | `packages/web/brand`                 | Web names, metadata, manifests, and asset paths    |
| `@jayant/web-seo`             | `packages/web/seo`                   | Public metadata and indexability helpers           |
| `@jayant/tailwind-config`     | `packages/web/tailwind-config`       | Shared Tailwind/PostCSS styling source             |
| `@jayant/web-ui`              | `packages/web/ui`                    | Shared Studio/Admin/Auth components and shell      |
| `@jayant/web-urls`            | `packages/web/urls`                  | Origins, host checks, and URL construction         |
| `@jayant/eslint-config`       | `packages/tooling/eslint-config`     | Shared flat ESLint configuration                   |
| `@jayant/typescript-config`   | `packages/tooling/typescript-config` | Shared strict TypeScript configuration             |

Package manifests and export maps are authoritative for public modules. Add a
package only for a stable named responsibility with real consumers. Product
code that is merely large is not automatically shared code.
