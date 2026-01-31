# URL Shortener App — Implementation Plan

**Date:** 2026-01-31
**Feature:** URL Shortener app at `apps/url-shortener` (deployed to `url.jayantgoyal.com`)

## Summary

New self-contained Next.js 16 app in the monorepo. Public redirects with click tracking + protected admin UI for CRUD management. Follows existing patterns from `apps/admin`.

---

## 1. Dependencies

```bash
pnpm install   # workspace auto-resolves url-shortener
```

Key deps (trimmed from admin — no tanstack-table, fewer radix packages):
- `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-slot`, `@radix-ui/react-switch`
- `@supabase/ssr`, `@supabase/supabase-js`
- `class-variance-authority`, `clsx`, `tailwind-merge`
- `lucide-react`, `next-themes`, `sonner`

## 2. Supabase SQL migration

Creates `url_shortener` schema with two tables, a trigger, an RPC function, RLS policies, and role grants.

| Object | Purpose |
|--------|---------|
| `url_shortener.short_urls` | Stores slug, target URL, title, click count, active flag, timestamps |
| `url_shortener.click_events` | Per-click log with user-agent and referer |
| `url_shortener.update_updated_at()` | Trigger function to auto-set `updated_at` |
| `url_shortener.increment_clicks()` | Atomic click counter RPC |
| RLS policies | Full access for service role; read for anon/authenticated |
| GRANT statements | Schema/table/function access for `service_role`, `authenticated`, `anon` |

## 3. New files created

All paths under `apps/url-shortener/`.

### Config files

| File | Purpose |
|------|---------|
| `package.json` | name `url-shortener`, port 3002, trimmed deps |
| `next.config.ts` | `transpilePackages: ["@repo/ui"]` |
| `tsconfig.json` | Extends `@repo/typescript-config/nextjs.json`, `@/*` paths |
| `eslint.config.js` | Imports `nextJsConfig` from `@repo/eslint-config/next-js` |
| `postcss.config.js` | `@tailwindcss/postcss` + `autoprefixer` |
| `.env.local` | Supabase URL, anon key, service role key |
| `supabase-migration.sql` | Full SQL migration for Supabase SQL editor |

### Library layer (`src/lib/`)

| File | Purpose |
|------|---------|
| `supabase/server.ts` | `createSupabaseServerClient()` (cached) + `createSupabaseAdminClient()` |
| `supabase/client.ts` | `createSupabaseBrowserClient()` |
| `utils.ts` | `cn()` helper (clsx + tailwind-merge) |
| `types.ts` | `ShortUrl`, `ClickEvent`, `AuthUser`, `UserRole` interfaces |
| `api-helpers.ts` | `checkAdminAccess()`, `getAdminClient()`, response helpers |
| `urls-api.ts` | Client-side fetch helpers: `fetchUrls`, `createUrl`, `updateUrl`, `deleteUrl` |

### UI components (`src/components/`)

| File | Purpose |
|------|---------|
| `ui/button.tsx` | Button with CVA variants (copied from admin) |
| `ui/input.tsx` | Input component |
| `ui/label.tsx` | Radix label |
| `ui/card.tsx` | Card, CardHeader, CardTitle, CardContent, etc. |
| `ui/badge.tsx` | Badge with variants |
| `ui/dialog.tsx` | Radix dialog with overlay, header, footer |
| `ui/switch.tsx` | Radix switch toggle |
| `ui/dropdown-menu.tsx` | Radix dropdown menu |
| `ui/sonner.tsx` | Themed Sonner toaster |
| `ui/skeleton.tsx` | Loading skeleton |
| `theme-provider.tsx` | next-themes ThemeProvider wrapper |
| `theme/theme-toggle.tsx` | Light/Dark/System dropdown toggle |

### App routes (`src/app/`)

| File | Purpose |
|------|---------|
| `globals.css` | shadcn CSS vars, Tailwind v4 @theme inline, dark mode |
| `layout.tsx` | Root layout: ThemeProvider + Toaster, Inter font |
| `page.tsx` | `redirect("/admin")` |
| `not-found.tsx` | Fallback 404 page |
| `not-found/page.tsx` | Explicit `/not-found` route page |
| `[slug]/route.ts` | **Core**: slug lookup → click tracking (fire-and-forget) → 307 redirect |
| `login/page.tsx` | Email/password sign-in, admin role check, redirects to `/admin` |
| `auth/callback/route.ts` | PKCE code exchange |
| `api/urls/route.ts` | GET (list all) + POST (create with slug validation) |
| `api/urls/[id]/route.ts` | PUT (update) + DELETE (cascade to click_events) |
| `admin/layout.tsx` | Auth guard, header with title + email + theme toggle |
| `admin/page.tsx` | Server-side fetch, passes to UrlsManager |
| `admin/urls-manager.tsx` | Client CRUD: list, create/edit dialog, inline toggle, copy, delete |

## 4. Architecture & data flow

```
Public visitor hits url.jayantgoyal.com/{slug}
  └→ [slug]/route.ts (GET)
       ├─ Lookup slug in url_shortener.short_urls (service role)
       ├─ If not found/inactive → redirect to /not-found
       ├─ Fire-and-forget: increment_clicks RPC + insert click_event
       └─ 307 redirect to target_url

Admin visits url.jayantgoyal.com/admin
  └→ admin/layout.tsx (server)
       ├─ Auth guard: check user + admin role from portfolio.profile
       └→ admin/page.tsx (server)
            ├─ Fetch all URLs with service role client
            └→ UrlsManager (client)
                 ├─ URL list with badges, copy, toggle, edit, delete
                 └─ Create/Edit dialog → POST/PUT to /api/urls
```

## 5. Key patterns followed

- Config files copied/adapted from `apps/admin`
- Supabase server/client factory pattern (cached server client)
- Auth guard in layout (server component) checking `portfolio.profile` role
- API routes: validate → auth check → service role client → return JSON
- Slug validation: lowercase alphanumeric + hyphens, reserved slug blocklist
- Unique constraint handling (PostgreSQL error code `23505`)
- Fire-and-forget click tracking (non-blocking)
- 307 temporary redirect (allows target URL updates without cache issues)
- shadcn/ui components with CVA + cn() pattern
- Dark mode via next-themes (class strategy)
