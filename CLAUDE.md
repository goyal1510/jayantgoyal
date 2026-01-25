# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Run all apps in parallel
pnpm dev

# Run a specific app (use filter name from package.json "name" field)
pnpm dev --filter portfolio      # Portfolio (port 3000)
pnpm dev --filter ghub           # Game Hub
pnpm dev --filter ccal           # Currency Calculator
pnpm dev --filter customcal      # Custom Drag-Drop Calculator
pnpm dev --filter atrack         # Activity Tracker
pnpm dev --filter tech           # Tech Tools (99+ utilities)
pnpm dev --filter weather        # Weather Dashboard
pnpm dev --filter smanager       # Supabase Manager
pnpm dev --filter fmanager       # File Manager
pnpm dev --filter smess          # Sync Messenger

# Build all apps (Turborepo handles dependency order)
pnpm build

# Lint all apps (strict: --max-warnings 0)
pnpm lint

# Type check all apps
pnpm check-types

# Format code with Prettier
pnpm format
```

### UI Package Development

```bash
# Watch styles (Tailwind CSS)
pnpm --filter @repo/ui dev:styles

# Watch components (TypeScript)
pnpm --filter @repo/ui dev:components
```

## Architecture Overview

**Turborepo monorepo** with **pnpm workspaces** containing 10 Next.js 16 applications and 4 shared packages.

### Workspace Structure

- `apps/*` - Next.js applications (each with its own Supabase integration where needed)
- `packages/ui` - React 19 + Tailwind v4 shared component library
- `packages/tailwind-config` - Shared Tailwind/PostCSS configuration
- `packages/eslint-config` - Flat ESLint configs (base, Next.js, React)
- `packages/typescript-config` - Shared strict TypeScript configs

### Tech Stack

- **Next.js 16** with App Router
- **React 19** / **TypeScript 5.9**
- **Tailwind CSS v4** with `@repo/tailwind-config`
- **Supabase** - Auth (email/password), PostgreSQL database, real-time subscriptions, storage
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icons
- **Sonner** - Toast notifications
- **Framer Motion** - Animations

### App Directory Pattern

All Next.js apps follow this structure:

```
src/
├── app/
│   ├── layout.tsx, page.tsx
│   ├── api/                    # API routes
│   ├── (protected)/            # Auth-guarded route group
│   └── login/, signup/
├── components/
│   └── ui/                     # @repo/ui re-exports or local components
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   └── server.ts           # Server Supabase client (SSR)
│   ├── db/                     # Database query functions
│   └── types/
└── hooks/
```

### Key Patterns

**Path alias:** All apps use `@/*` → `./src/*`

**Supabase clients:**
- `createSupabaseServerClient()` for server-side (service role available)
- Browser client for client-side (respects RLS policies)

**CSS utilities:**
```typescript
import { cn } from "@/lib/utils"
// cn() uses clsx + tailwind-merge for intelligent class merging
```

**Workspace dependencies:**
```json
{
  "@repo/ui": "workspace:*",
  "@repo/eslint-config": "workspace:*",
  "@repo/tailwind-config": "workspace:*",
  "@repo/typescript-config": "workspace:*"
}
```

**UI package imports:**
```typescript
import "@repo/ui/styles.css"           // In global styles
import { Button, Card } from "@repo/ui" // Components
```

## Environment Variables

Declared in `turbo.json` globalEnv:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side admin operations)
- `GUEST_EMAIL_LOGIN` / `GUEST_PASSWORD_LOGIN` (optional demo accounts)
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` (optional email service)
- `NEXT_PUBLIC_SITE_URL`

Store in `.env.local` (not committed).

## Commit Conventions

Prefix commits with scope: `ui:`, `api:`, `docs:`, `feat:`, `fix:`

Example: `ui: add copy/move dialogs and directory picker`
