# 2026-04-30 — Google Search Console SEO Fixes

**App:** `apps/jayantgoyal`
**Area:** SEO / Google Indexing

## Problem

Google Search Console coverage report showed:
- 23 indexed / 86 not indexed
- 2 pages with redirect (game pages behind auth but in sitemap)
- 1 not found (404) — wrong slug `typing-speed-test` vs actual `typing-speed`
- 1 duplicate without user-selected canonical
- 78 discovered but not indexed (normal for new site)
- 4 crawled but not indexed
- URL inspection: `dateCreated`/`dateModified` invalid datetime format (date-only, not ISO 8601)

## Fixes Applied

### 1. Fixed dateCreated/dateModified format (`src/components/seo/json-ld.tsx`)
- `dateCreated`: `"2025-01-01"` → `"2025-01-01T00:00:00+05:30"`
- `dateModified`: `split("T")[0]` → full `toISOString()` (includes time)
- Resolves the 2 non-critical issues in URL inspection

### 2. Fixed sitemap typo (`src/app/sitemap.ts`)
- `typing-speed-test` → `typing-speed` (matches actual route folder name)
- Resolves the 404 in coverage report

### 3. Added missing tool to sitemap (`src/app/sitemap.ts`)
- Added `converters/color-converter` — existed as a route but was missing from sitemap

### 4. Moved auth from proxy to layout for all protected pages
- **`src/proxy.ts`**: 
  - Added fast-path for unauthenticated page visits (no auth cookie = skip `getUser()`)
  - Changed `isPublic` to treat all non-API routes as public so `routeGuardMiddleware` doesn't redirect
  - Sets `x-page-public: true` header for PUBLIC_PAGES so layout knows not to show AuthGate on tools/weather/etc.
- **`src/components/auth/auth-gate.tsx`**: New client component — shows "Sign in to access" CTA with Lock icon and redirect link to `/welcome?redirect=currentPath`.
- **`src/app/(protected)/layout.tsx`**: 
  - Checks auth via Supabase cookie (zero network cost, no `getUser()` call)
  - Reads `x-page-public` header from proxy to skip AuthGate on public pages
  - Renders `AuthGate` instead of children for unauthenticated users on non-public pages
  - Gates `TermsAcceptanceCheck` behind `isAuthenticated`
- **`src/app/sitemap.ts`**: Added app pages (games hub, messenger, files, calculator, activity-tracker) to sitemap.
- API routes (`/api/*`) remain fully protected.

### 5. Security fixes from review
- **`src/proxy.ts`**: Strip `x-page-public`, `x-user-id`, `x-user-email` from incoming request headers to prevent client forgery
- **`src/app/auth/callback/route.ts`**: Fixed open redirect — `next` param now validated to be a relative path (rejects `//evil.com` and `https://evil.com`)
- **`src/app/api/contact/route.ts`**: Added `escapeHtml()` to sanitize user input in HTML email template (prevents HTML injection)

### 6. Additional security hardening
- **`src/app/api/contact/route.ts`**: Added in-memory IP-based rate limiting (5 req / 15 min)
- **`src/proxy.ts`**: Terms acceptance now verified from DB for API routes when cookie is missing (fallback), re-sets httpOnly cookie on verification
- **`src/app/api/files/[id]/copy/route.ts`** and **`move/route.ts`**: Added path traversal check — rejects `..` sequences and non-absolute paths
- **`next.config.ts`**: Added `Strict-Transport-Security` (HSTS, 1 year) and `Content-Security-Policy` headers

### 7. Fixed CSP blocking external APIs (`next.config.ts`)
- Added `github-contributions-api.jogruber.de` and `api.openweathermap.org` to `connect-src`
- Added `api.qrserver.com` to `img-src`

### 8. Added `lastModified` to all sitemap entries (`src/app/sitemap.ts`)
- Uses build-time `new Date().toISOString()` for all entries
- Google actually respects this field (unlike `changeFrequency` and `priority` which are mostly ignored)

### 9. Fixed client-side navigation bypassing AuthGate
- **Root cause**: Layout is a server component — only runs on full page load, not client-side navigation. So `isPublicPage` from the server header was stale during SPA navigation.
- **Fix**: Replaced server-side conditional with `AuthGateWrapper` client component that uses `usePathname()` to check public/private on every navigation. `isAuthenticated` (from cookie) is passed as a prop since it's static for the session.
- Removed `x-page-public` header dependency from layout (no longer needed).

### Key lessons
- `NextResponse.next({ request: { headers } })` captures headers at creation time. Mutating the `Headers` object after doesn't work — must create a new `NextResponse.next()` if headers change.
- Next.js App Router layouts don't re-execute on client-side navigation — conditional rendering based on route must use client components with `usePathname()`.
