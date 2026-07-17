# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

**JG** is a full-stack developer portfolio and productivity hub by Jayant, built as a Turborepo monorepo. The platform combines a personal portfolio with practical tools, games, and utilities.

### Tech Stack

| Category      | Technologies                                 |
| ------------- | -------------------------------------------- |
| **Framework** | Next.js 16, React 19, TypeScript 5.9         |
| **Styling**   | Tailwind CSS v4, Radix UI, CVA variants      |
| **Backend**   | Supabase (Auth, Database, Realtime, Storage) |
| **Monorepo**  | Turborepo, pnpm workspaces                   |
| **State**     | Zustand (persisted stores)                   |
| **UI/UX**     | Framer Motion, Lucide Icons, Sonner toasts   |
| **Email**     | Resend API                                   |

### Monorepo Structure

```
jayantgoyal/
├── apps/
│   ├── portfolio/          # Public portfolio, blog, resume, contact
│   ├── studio/             # Product discovery, tools, games, workspaces
│   └── admin/              # Admin panel for content management
│
├── packages/
│   ├── ui/                 # Shared component library (@repo/ui)
│   ├── tailwind-config/    # Shared Tailwind config
│   ├── eslint-config/      # Flat ESLint configs
│   └── typescript-config/  # TypeScript base configs
│
├── supabase/
│   ├── schema/             # DB schema dumps (ground truth)
│   └── migrations/         # Migration files
│
├── docs/                   # Documentation
├── turbo.json              # Turborepo pipeline config
└── pnpm-workspace.yaml     # Workspace configuration
```

## Apps

### Studio App (`apps/studio`)

**Features:**

- **Product Inventory** - Public discovery and launch paths
- **Messenger** - Real-time chat with Supabase Realtime
- **File Manager** - Cloud storage with folders, upload, soft delete
- **Activity Tracker** - Daily tracking with analytics dashboard
- **Weather** - City search, geolocation, 5-day forecast
- **Games Hub** - 5 games (Tic Tac Toe, Connect Four, Memory Match, RPS, Dare X)
- **Dev Tools** - 99+ utilities (UUID, hash, converters, formatters)
- **Calculator** - Cash denomination with history persistence
- **Custom Calculator** - Drag & drop calculator builder

**Key Routes:**

- `(protected)/` - Authenticated routes with sidebar layout
- `/` - Studio product inventory
- `/games/*` - Game routes
- `/tools/*` - Developer tools
- `/activity-tracker/*` - Activity tracking
- `/files/*` - File manager
- `/messenger` - Real-time messaging
- `/calculator/*` - Calculator tools
- `/weather` - Weather app
- `/login`, `/signup`, `/auth/callback` - Auth routes

### Admin App (`apps/admin`)

**Purpose:** Content management system for portfolio data

**Features:**

- Portfolio data CRUD (hero, about, skills, experience, projects, certificates)
- User management
- Role-based access control (admin, super_admin)

**Key Routes:**

- `/portfolio/*` - Portfolio content management
- `/users` - User management

## Shared Packages

### `@repo/ui`

Component library exporting:

- **Components:** Button, Card, Dialog, Input, Select, etc.
- **Hooks:** `use-mobile`
- **Utils:** `cn()` (class merger), CVA variants

**Exports pattern:**

```json
{
  "./lib/utils": "./src/lib/utils.ts",
  "./hooks/use-mobile": "./src/hooks/use-mobile.ts",
  "./*": "./src/components/*.tsx"
}
```

### `@repo/brand`

Dependency-free source of truth for public identity, app names, canonical
domains, default metadata, title templates, and manifest labels. Portfolio,
Studio, and Admin must consume these constants instead of introducing new
branding literals.

### `@repo/tailwind-config`

Tailwind CSS v4 config with custom theme variables:

- `--color-blue-1000`
- `--color-purple-1000`
- `--color-red-1000`

### `@repo/eslint-config`

Flat ESLint configurations:

- `base` - Base config
- `next-js` - Next.js specific rules
- `react` - React specific rules

### `@repo/typescript-config`

TypeScript configurations:

- `base` - Base strict config
- `nextjs` - Next.js project config
- `react-library` - React library config

## Building and Running

### Prerequisites

- **Node.js:** 18+
- **pnpm:** 10.24+

### Installation

```bash
# Clone repository
git clone https://github.com/goyal1510/jayantgoyal.git
cd jayantgoyal

# Install dependencies
pnpm install
```

### Development

```bash
# Run all apps
pnpm dev

# Run Studio only
pnpm dev --filter studio

# Run admin app only
pnpm dev --filter admin
```

### Build

```bash
# Build all apps
pnpm build

# Build specific app
pnpm build --filter studio
pnpm build --filter admin
```

### Linting & Type Checking

```bash
# Lint (zero warnings allowed)
pnpm lint

# Type check
pnpm check-types

# Format code
pnpm format
```

### Start Production

```bash
# Start Studio
pnpm start --filter studio

# Start admin app
pnpm start --filter admin
```

## Environment Variables

Configure in `.env.local` files per app. See `.env.example` in each app for the full list.

Most secret/provider values are shared across Vercel targets, but application URL variables are environment-specific. Development uses local ports, Preview uses Vercel-generated deployment origins, and Production uses each application's canonical host. There is no persistent staging branch, staging domain, or branch-scoped environment layer. Add every new variable only to the applications and targets that consume it.

**Vercel CLI setup** — the deployed apps are linked. To sync envs locally:

```bash
cd apps/portfolio && vercel env pull .env.local
cd apps/studio && vercel env pull .env.local
cd apps/admin && vercel env pull .env.local
```

### Studio App (`apps/studio/.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_PORTFOLIO_URL=http://localhost:3000
NEXT_PUBLIC_STUDIO_URL=http://localhost:3001

# External APIs
NEXT_PUBLIC_OPENWEATHER_API_KEY=     # Weather app
GITHUB_TOKEN=                        # GitHub Stats
```

### Portfolio App (`apps/portfolio/.env.local`)

Portfolio owns public content, Blog, Resume, Contact, and its public API
integration variables. It intentionally has no Supabase service-role key.

### Admin App (`apps/admin/.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vercel (deployment management)
VERCEL_TOKEN=
VERCEL_TEAM_ID=
VERCEL_PROJECT_ID_STUDIO=
VERCEL_PROJECT_ID_ADMIN=
```

## Architecture Patterns

### Page Pattern

Server components wrap client components:

```tsx
// page.tsx (server component)
export default function Page() {
  return <ClientComponent />
}

// client.tsx ('use client')
'use client'
export default function ClientComponent() { ... }
```

### Auth System

**Supabase SSR** with `@supabase/ssr`:

- **Browser client:** `src/lib/supabase/client.ts`
- **Server client:** `src/lib/supabase/server.ts` (wrapped in React `cache()`)

**Auth flows:**

- Email/password
- Magic link
- PKCE OAuth
- Guest login (`POST /api/guest-login`)

### Middleware (Proxy)

Next.js 16 uses `src/proxy.ts` instead of `middleware.ts`:

**Studio app proxy:**

- Checks Supabase auth
- Enforces public/protected route split
- Redirects unauthenticated users to `/login`
- Sets `x-auth-status` / `x-terms-accepted` headers

**Admin app proxy:**

- Checks Supabase auth
- Verifies admin/super_admin role via `jg_account.profiles`
- Redirects unauthorized to `/unauthorized`
- Sets `x-auth-status` / `x-user-role` headers

### State Management

Zustand stores with `persist` middleware:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set) => ({ ... }),
    { name: 'store-name', skipHydration: true }
  )
)
```

**Manual hydration** required to avoid SSR mismatch.

### Portfolio Data System (`apps/portfolio`)

Portfolio content is loaded inside the dedicated Portfolio application and is
not part of the Studio application shell.

**Data flow:**

1. Server fetches via `getPortfolioDataFromHeaders()`
2. Falls back to hardcoded data if DB unavailable
3. Distributed via React Context (`PortfolioDataProvider`)
4. Client accesses via `usePortfolioData()` hook

**Icons:** Stored as string keys in DB, resolved at runtime via `getIconComponent()`

### Loading System

Unified loading with `<PageSpinner />` component:

- **`(protected)/loading.tsx`** - Suspense boundary for server navigation
- **`RouteChangeProvider`** - Client-side navigation detection
- **Page components** - Use `<PageSpinner />` for data fetch loading

### Database Schema

**Schemas:** `jg_account`, `portfolio`, `jg_app` (activity tracker, calculator, file manager, game hub, messenger, blog)

## Development Conventions

### Code Style

- **Import alias:** `@/*` → `src/*`
- **Class merging:** `cn()` helper from `@repo/ui/lib/utils`
- **Component variants:** CVA (`class-variance-authority`)
- **Dark mode:** `next-themes` with class strategy

### Component Structure

```tsx
import { cn } from "@repo/ui/lib/utils";
import { cva } from "class-variance-authority";

const variants = cva("base-class", {
  variants: {
    variant: { default: "...", secondary: "..." },
    size: { sm: "...", lg: "..." },
  },
});

export function Component({ variant, size, className }) {
  return <div className={cn(variants({ variant, size, className }))} />;
}
```

### Testing

Focused platform regression tests use Vitest (`pnpm test`). Quality assurance also includes:

- Strict TypeScript (`pnpm check-types`)
- ESLint with zero warnings (`pnpm lint`)
- Manual testing

### Git Workflow

- **Main branch:** `main`
- **Commit style:** Conventional commits preferred
- **PR process:** Direct commits for solo development

## Key Files

| File                           | Purpose                          |
| ------------------------------ | -------------------------------- |
| `turbo.json`                   | Turborepo pipeline configuration |
| `pnpm-workspace.yaml`          | Workspace package definitions    |
| `apps/*/src/proxy.ts`          | Auth middleware/proxy            |
| `apps/*/src/app/layout.tsx`    | Root layouts                     |
| `packages/ui/src/components/*` | Shared UI components             |

## Common Tasks

### Add New Feature

1. Create route in `apps/studio/src/app/`
2. Add API endpoint in `apps/studio/src/app/api/`
3. Create components in `apps/studio/src/components/`
4. Update Supabase schema if needed
5. **SEO & discoverability (mandatory):**
   - Export `metadata` (title, description) in every `page.tsx`
   - Add Open Graph tags (`openGraph: { title, description, images }`)
   - Update breadcrumb in `dynamic-breadcrumb.tsx` (visual) AND `dynamic-breadcrumb-jsonld.tsx` (structured data)
   - Add route to `sitemap.ts` with `lastModified`, `changeFrequency`, `priority`
   - If public: add path to `PUBLIC_PAGES` in `proxy.ts` AND `PUBLIC_PREFIXES` in `auth-gate.tsx`
   - If public: add zero-cost path for any new API routes in `proxy.ts` (`ZERO_COST_PATHS`)
6. **Sidebar integration:**
   - Add app config in `hub-config.ts` (id, name, icon, url, navItems)
   - Add route prefix to `ROUTE_MAP` in `use-active-app.ts`
7. Run `pnpm lint` and `pnpm check-types`

### Blog & LinkedIn Workflow

1. **Create blog post** — insert into `jg_app.blog_posts` via Supabase REST API:
   ```bash
   curl -X POST "https://orwfvyditlguqvxvztkw.supabase.co/rest/v1/blog_posts" \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Content-Profile: jg_app" \
     -H "Content-Type: application/json" \
     -H "Prefer: return=representation" \
     -d '{ "title": "...", "slug": "...", "excerpt": "...", "content": "markdown...", "tags": [...], "is_published": true, "is_visible": true, "published_at": "..." }'
   ```
2. **Post to LinkedIn:**
   ```bash
   node scripts/linkedin/post.mjs "Post text" --url https://www.jayantgoyal.com/blog/<slug>
   # Or auto-generate from blog:
   node scripts/linkedin/post.mjs --blog <slug>
   ```
3. **Manage LinkedIn posts:**
   ```bash
   node scripts/linkedin/manage.mjs list          # View all tracked posts
   node scripts/linkedin/manage.mjs delete <index> # Delete a post
   ```
4. LinkedIn token expires **2026-07-01**. Re-auth: `node scripts/linkedin/auth.mjs`

### Add Shared Component

1. Create in `packages/ui/src/components/`
2. Export in `packages/ui/src/index.ts` (or use wildcard)
3. Import in apps as `@repo/ui/component`
4. Run `pnpm build` to verify

### Deploy

Studio deploys independently to Vercel. Ensure:

- Environment variables set in Vercel dashboard
- Build command: `pnpm build --filter studio`
- Output directory: `apps/studio/.next`

## Troubleshooting

### Build Errors

```bash
# Check types
pnpm check-types

# Check lint
pnpm lint

# Clear cache and rebuild
rm -rf .turbo node_modules/.cache
pnpm build
```

### Auth Issues

- Verify Supabase URL and keys in `.env.local`
- Check `src/proxy.ts` for route protection logic
- Review `jg_account.profiles` for user roles

### Monorepo Issues

```bash
# Clean install
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install

# Check workspace links
pnpm ls --recursive
```

## Resources

- **Portfolio:** [jayantgoyal.com](https://jayantgoyal.com)
- **Admin:** [admin.jayantgoyal.com](https://admin.jayantgoyal.com)
- **GitHub:** [goyal1510/jayantgoyal](https://github.com/goyal1510/jayantgoyal)

```bash
pnpm dev --filter studio          # Run Studio only
pnpm dev --filter admin       # Run admin app only
pnpm dev                      # Run all apps
pnpm build --filter studio        # Build Studio
pnpm lint                     # ESLint (zero warnings enforced: --max-warnings 0)
pnpm check-types              # TypeScript check (runs next typegen && tsc --noEmit)
pnpm test                     # Focused Vitest regression tests
pnpm format                   # Prettier (ts, tsx, md files)
```

Build ignores TS errors (`typescript.ignoreBuildErrors: true`); always run `pnpm check-types` separately.

## Architecture

**Turborepo monorepo** with pnpm workspaces. Next.js 16, React 19, TypeScript 5.9 (strict), Tailwind CSS v4.

### Apps

- **`apps/portfolio`** (filter name: `portfolio`) — Public professional content
- **`apps/studio`** (filter name: `studio`) — Product discovery and workspaces
- **`apps/admin`** (filter name: `admin`) — Portfolio content management, role-gated (admin/super_admin)

### Shared Packages

- **`@repo/ui`** — shadcn/ui-based component library. Import as `@repo/ui/button`, `@repo/ui/lib/utils`, `@repo/ui/hooks/use-mobile`
- **`@repo/tailwind-config`** — Shared Tailwind styles
- **`@repo/eslint-config`** — Flat ESLint configs (base, next-js, react)
- **`@repo/typescript-config`** — Strict TS base configs

### Page Pattern

Server component `page.tsx` exports `metadata` and renders a client component from `client.tsx`:

```tsx
// page.tsx (server)
export const metadata: Metadata = { title: "..." }
export default function Page() { return <ClientComponent /> }

// client.tsx
'use client'
export default function ClientComponent() { ... }
```

### Route Groups

- **`(protected)/`** — Requires Supabase auth. Has sidebar layout, `RouteChangeProvider` for navigation spinners, `<PageSpinner />` loading boundary.
- **`(admin)/`** (admin app) — Requires admin/super_admin role from `jg_account.profiles`.

### Auth & Middleware

Supabase Auth via `@supabase/ssr`. Supports email/password, magic link, PKCE OAuth, and anonymous guest login.

- **Browser client:** `src/lib/supabase/client.ts` → `createBrowserClient()`
- **Server client:** `src/lib/supabase/server.ts` → `createServerClient()` (wrapped in React `cache()`)
- **Middleware:** `src/proxy.ts` (Next.js 16 naming, NOT `middleware.ts`). Sets `x-auth-status` and `x-terms-accepted` headers. Enforces public/protected route split and terms acceptance.

### Database

**Schemas:** `jg_account`, `portfolio`, `jg_app` (activity tracker, calculator, file manager, game hub, messenger, blog)

Database conventions:

- Use `jg_app.uuid_v7()` as the default for new UUID primary keys.
- Use `jg_app.update_updated_at()` for standard `updated_at` triggers.
- Always select the intended schema explicitly for Supabase queries.
- Never expose or use the Supabase service-role key in client-side code.
- Check and handle the error returned by every Supabase query.

### Supabase Safety

- The canonical remote project for this repository is `jayantgoyal`
  (`orwfvyditlguqvxvztkw`). Verify both the project name and reference before any
  linked remote operation.
- Linking is machine-local state under `supabase/.temp/`; never commit that
  directory or copy it between clones or worktrees.
- Treat `supabase/.temp/pooler-url` as ephemeral. Never retain or copy it, and
  never place database passwords, access tokens, connection strings, or service
  role keys in repository files or instructions.
- Before any remote migration apply, run `supabase migration list --linked` and
  inspect local/remote history. Any unexplained drift blocks a blanket
  `supabase migration up`.
- This repository currently has known historical drift: the remote project has
  older migration records that are absent from `supabase/migrations`. Treat that
  state as unresolved; do not repair migration history, pull schemas, or create
  replacement historical migrations without explicit review and approval.
- Never apply remote migrations from the main source clone or an ordinary dirty
  worktree. Use the global `supabase-remote-migration-apply` skill, which creates
  a clean disposable minimal workdir containing only canonical config and the
  reviewed migration files.
- A disposable workdir reduces accidental migration scope; it does not make an
  unsafe migration safe. Review the SQL and target project independently.
- After every successfully applied migration, refresh all three canonical
  schema snapshots from the verified linked `jayantgoyal` project before the
  task is considered complete:

  ```bash
  tmpdir="$(mktemp -d)"
  supabase db dump --linked --schema jg_account --file "$tmpdir/jg_account.sql"
  supabase db dump --linked --schema jg_app --file "$tmpdir/jg_app.sql"
  supabase db dump --linked --schema portfolio --file "$tmpdir/portfolio.sql"
  perl -0pi -e 's/\n+\z/\n/' "$tmpdir"/*.sql
  ```

  Review each generated diff, confirm the dumps contain schema only (no data or
  secrets), then replace `supabase/schemas/jg_account.sql`,
  `supabase/schemas/jg_app.sql`, and `supabase/schemas/portfolio.sql` with the
  reviewed outputs. Include the refreshed schema snapshots in the same
  migration commit or PR. Remove any regenerated `supabase/.temp/pooler-url`.
  If the refresh or verification fails, report the migration task as incomplete;
  do not silently leave stale schema snapshots.

### Portfolio Data System

Multi-source: `PORTFOLIO_DATA_SOURCE=database` fetches from Supabase; otherwise uses hardcoded data from `jayant-portfolio-data.ts`. Served via `PortfolioDataProvider` context, consumed with `usePortfolioData()`. Icons stored as string keys, resolved via `getIconComponent()` from `ICON_MAP`.

### State Management

- **Zustand** with `persist` middleware and `skipHydration: true` — manual hydration required to avoid SSR mismatch
- **React Context** for portfolio data distribution
- **Local `useState`** for most page-level state

## Conventions

- **Import alias:** `@/*` → `src/*`
- **Class merging:** `cn()` from `@repo/ui/lib/utils` (clsx + tailwind-merge)
- **Component variants:** CVA (`class-variance-authority`)
- **Dark mode:** `next-themes` with `attribute="class"`. Use `mounted` state guard with `useTheme()` to prevent hydration mismatch.
- **Animations:** Framer Motion via `LazyMotionProvider` + `m` component (lazy-loaded)
- **Toasts:** `sonner` — use `toast.success()` / `toast.error()` in client code
- **Client API calls:** Plain `fetch()` to `/api/...` route handlers
- **Loading UI:** All protected pages use `<PageSpinner />`. `RouteChangeProvider` handles navigation transitions.
- **Do NOT use `next/image` `<Image>` for external URLs** — Next.js 16 removed the `url` param from image proxy. Use plain `<img>` instead.

## Environment Variables

See `.env.example` in each app for the full list. Key vars per app documented in the "Environment Variables" section above.

**GUEST_EMAIL_LOGIN / GUEST_PASSWORD_LOGIN** — legacy, no longer used. Guest login uses Supabase Anonymous Sign-In.

## Deployment

Vercel, auto-deploy on push to `main`. Build: `pnpm build --filter studio`. Admin app is a separate Vercel project.
