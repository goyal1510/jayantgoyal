# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (all apps)
pnpm dev

# Development (main app only — filter name is "jg")
pnpm dev --filter jg

# Build all
pnpm build

# Lint (strict: zero warnings allowed)
pnpm lint

# Type check
pnpm check-types

# Format
pnpm format
```

Both apps use `next dev --webpack` (not Turbopack). No test framework is configured.

Type checking in both apps runs `next typegen && tsc --noEmit`.

## Architecture

**Turborepo monorepo** with pnpm workspaces (pnpm 10.24+, Node 18+).

### Apps

- **`apps/jayantgoyal`** — Main Next.js 16 app (React 19). Personal hub with portfolio, games, dev tools, activity tracker, calculator, weather, file manager, messenger, contact form.
- **`apps/admin`** — Admin panel (Next.js 16, React 19). Manages portfolio data.

### Shared Packages

- **`@repo/ui`** — Component library. Exports CSS via `@repo/ui/styles.css` and components via `@repo/ui/button`, `@repo/ui/card`, etc. Built with Tailwind CLI (styles) + tsc (components) into `dist/`. Uses `class-variance-authority` for variants and `cn()` (clsx + tailwind-merge) for class composition.
- **`@repo/tailwind-config`** — Tailwind CSS v4 config with custom theme variables (`--color-blue-1000`, `--color-purple-1000`, `--color-red-1000`).
- **`@repo/eslint-config`** — Flat ESLint configs (base, next-js, react). Both apps import `nextJsConfig` from `@repo/eslint-config/next-js`.
- **`@repo/typescript-config`** — Strict TypeScript configs (base, nextjs, react-library). Apps extend `nextjs.json`.

Workspace deps use `"workspace:*"` in package.json.

### Routing (Main App)

- **`(protected)/`** — Layout group with sidebar + breadcrumb header. All routes under here require auth.
  - `/` (portfolio), `/games/*`, `/tools/*`, `/activity-tracker`, `/calculator`, `/custom-calculator`, `/weather`, `/files`, `/messenger`, `/contact`
- **Public routes** — `/login`, `/signup`, `/auth/callback`, `/terms-conditions`
- **`/`** — Portfolio landing page (served directly, no redirect)

### Auth (Supabase)

Two client factories:
- `src/lib/supabase/client.ts` — Browser client via `@supabase/ssr`
- `src/lib/supabase/server.ts` — Server client, wrapped in React `cache()` for request-level memoization

Auth flows: email/password, magic link, PKCE OAuth, guest login (`POST /api/guest-login`). Auth callback at `/auth/callback` handles both `code` (PKCE) and `token_hash` (magic link) exchanges.

### Page Pattern

Server component page exports metadata, renders a client component:
```
page.tsx (server) → client.tsx ('use client')
```

### Portfolio Data System

Multi-tenant by hostname — different hosts can show different portfolio profiles. Data fetched server-side via `getPortfolioDataFromHeaders()`, falls back to hardcoded data if DB is unavailable. Distributed to client via React Context (`PortfolioDataProvider` / `usePortfolioData()`). Icons stored as string keys in the database, resolved at runtime.

### State Management

Zustand stores with `persist` middleware for localStorage. Manual hydration (`skipHydration: true`) to avoid SSR mismatch.

### API Routes

Located at `src/app/api/`. Pattern: validate input, use Supabase server client, return JSON. Key routes: `/contact` (Resend email), `/guest-login`, `/calculator/*`, `/activity-tracker/*`, `/messenger/*`, `/files/*`, `/account/*`.

## Environment Variables

Declared in `turbo.json` globalEnv:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
RESEND_API_KEY
RESEND_FROM_EMAIL
GUEST_EMAIL_LOGIN
GUEST_PASSWORD_LOGIN
NEXT_PUBLIC_OPENWEATHER_API_KEY
```

## Conventions

- **Import alias**: `@/*` maps to `src/*` in both apps
- **Styling**: Tailwind CSS v4 utility-first, dark mode via `next-themes` (class strategy), custom colors via CSS variables
- **Component variants**: `class-variance-authority` (CVA)
- **Class merging**: `cn()` helper (clsx + tailwind-merge)
- **UI primitives**: Radix UI headless components with custom styling
- **Icons**: Lucide React
- **Toasts**: Sonner
- **Animations**: Framer Motion
- **Drag & drop**: React DnD
- Main app has `typescript: { ignoreBuildErrors: true }` in next.config — type errors won't block builds but `pnpm check-types` still catches them
