# QWEN.md - Project Context

## Project Overview

**Jayant Goyal** is a full-stack developer portfolio and productivity hub built as a Turborepo monorepo. The platform combines a personal portfolio with practical tools, games, and utilities.

### Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 16, React 19, TypeScript 5.9 |
| **Styling** | Tailwind CSS v4, Radix UI, CVA variants |
| **Backend** | Supabase (Auth, Database, Realtime, Storage) |
| **Monorepo** | Turborepo, pnpm workspaces |
| **State** | Zustand (persisted stores) |
| **UI/UX** | Framer Motion, Lucide Icons, Sonner toasts |
| **Email** | Resend API |

### Monorepo Structure

```
jayantgoyal/
├── apps/
│   ├── jayantgoyal/        # Main portfolio & tools app
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

### Main App (`apps/jayantgoyal`)

**Features:**
- **Portfolio** - Hero, About, Skills, Experience, Projects, Certificates, Contact
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
- `/` - Portfolio landing page
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

# Run main app only
pnpm dev --filter jg

# Run admin app only
pnpm dev --filter admin
```

### Build

```bash
# Build all apps
pnpm build

# Build specific app
pnpm build --filter jg
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
# Start main app
pnpm start --filter jg

# Start admin app
pnpm start --filter admin
```

## Environment Variables

Configure in `.env.local` files. Variables declared in `turbo.json` globalEnv:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Guest Login
GUEST_EMAIL_LOGIN=
GUEST_PASSWORD_LOGIN=

# External APIs
NEXT_PUBLIC_OPENWEATHER_API_KEY=
GITHUB_TOKEN=

# Site Config
NEXT_PUBLIC_SITE_URL=

# Portfolio Data Source
PORTFOLIO_DATA_SOURCE=database  # or "system"
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

**Main app proxy:**
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

### Portfolio Data System

**Multi-tenant by hostname** - different hosts show different portfolio profiles.

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

**Schemas:** `jg_account`, `portfolio`, `activity_tracker`, `currency_calculator`, `fmanager`, `messenger`, `public`

**Key tables:**
- `jg_account.profiles` - User profiles (name, role, terms acceptance)
- `portfolio.hero`, `portfolio.about`, `portfolio.skills`, etc. - Portfolio content

**Schema management:**
- Source of truth: `supabase/schema/<schema>/schema.sql`
- Migrations: `supabase/migrations/YYYYMMDD_NNN_description.sql`

**Refresh schema dump:**
```bash
supabase db dump --schema <schema_name> > supabase/schema/<schema_name>/schema.sql
```

## Development Conventions

### Code Style

- **Import alias:** `@/*` → `src/*`
- **Class merging:** `cn()` helper from `@repo/ui/lib/utils`
- **Component variants:** CVA (`class-variance-authority`)
- **Dark mode:** `next-themes` with class strategy

### Component Structure

```tsx
import { cn } from "@repo/ui/lib/utils"
import { cva } from "class-variance-authority"

const variants = cva("base-class", {
  variants: {
    variant: { default: "...", secondary: "..." },
    size: { sm: "...", lg: "..." }
  }
})

export function Component({ variant, size, className }) {
  return <div className={cn(variants({ variant, size, className }))} />
}
```

### Testing

No test framework configured. Quality assurance via:
- Strict TypeScript (`pnpm check-types`)
- ESLint with zero warnings (`pnpm lint`)
- Manual testing

### Git Workflow

- **Main branch:** `main`
- **Commit style:** Conventional commits preferred
- **PR process:** Direct commits for solo development

## Key Files

| File | Purpose |
|------|---------|
| `turbo.json` | Turborepo pipeline configuration |
| `pnpm-workspace.yaml` | Workspace package definitions |
| `apps/*/src/proxy.ts` | Auth middleware/proxy |
| `apps/*/src/app/layout.tsx` | Root layouts |
| `packages/ui/src/components/*` | Shared UI components |
| `supabase/schema/*/schema.sql` | Database schema dumps |

## Common Tasks

### Add New Feature

1. Create route in `apps/jayantgoyal/src/app/`
2. Add API endpoint in `apps/jayantgoyal/src/app/api/`
3. Create components in `apps/jayantgoyal/src/components/`
4. Update Supabase schema if needed
5. Run `pnpm lint` and `pnpm check-types`

### Add Shared Component

1. Create in `packages/ui/src/components/`
2. Export in `packages/ui/src/index.ts` (or use wildcard)
3. Import in apps as `@repo/ui/component`
4. Run `pnpm build` to verify

### Database Changes

1. Write migration in `supabase/migrations/`
2. Apply in Supabase SQL editor
3. Re-dump schema: `supabase db dump --schema <name>`
4. Update TypeScript types if needed

### Deploy

Main app deploys to Vercel automatically on push to `main`. Ensure:
- Environment variables set in Vercel dashboard
- Build command: `pnpm build --filter jg`
- Output directory: `apps/jayantgoyal/.next`

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
