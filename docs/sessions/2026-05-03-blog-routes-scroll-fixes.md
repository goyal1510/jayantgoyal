# 2026-05-03 — Blog Route Rename + Scroll Fixes

## Area
Main app (`apps/jayantgoyal`)

## Changes

### Blog route rename
- Listing page moved from `/blog` to `/blogs`
- Individual posts remain at `/blog/[slug]`
- Updated: proxy, auth-gate, sitemap, breadcrumbs (visual + JSON-LD), hub-config, use-active-app

### Scroll tracking fix
- `use-scroll-tracking.ts`: replaced `el.offsetTop` with `el.getBoundingClientRect()` — `offsetTop` returned 0 for nested positioned elements

### Portfolio sidebar smooth scroll
- `sub-nav-menu-item.tsx`: replaced `router.push("/#section")` with `el.scrollIntoView({ behavior: "smooth" })` + `requestAnimationFrame` delay for mobile sidebar close animation

### Cleanup
- Removed `scripts/IGNORE-BUILD.md` (stale documentation file)

### Breadcrumb "Blog" → "Blogs"
- Both visual breadcrumb and JSON-LD breadcrumb now say "Blogs" instead of "Blog"

### Portfolio hash scroll on refresh
- Sections use `contentVisibility: "auto"` with placeholder sizes — first scroll triggers rendering of skipped sections, shifting layout
- Root causes: (1) global CSS `scroll-behavior: smooth` caused browser native hash scroll before JS loaded, (2) `contentVisibility: auto` wrappers had placeholder sizes that didn't match real sizes causing layout shifts, (3) `scrollIntoView` didn't properly account for sticky header offset
- Fix: removed global `scroll-behavior: smooth`, removed `contentVisibility: auto` wrappers (caused layout shifts), replaced all `scrollIntoView` with manual `window.scrollTo` using `getBoundingClientRect().top + window.scrollY - 80` for correct header offset
- Server-side compute for CodeStats LOC data directly in `page.tsx` (calls GitHub API via `api.server.ts`) — section renders at full height immediately, no skeleton → no layout shift. Single instant scroll on refresh. GitHub calendar gets `min-height` to prevent shift from its dynamic import.
- Created `api.server.ts` — server-side GitHub API functions calling `api.github.com` directly with `GITHUB_TOKEN`. Client-side `api.ts` still uses the `/api/github-stats` proxy. Fixed `/api/github-loc` route which was broken by the proxy refactor (relative URLs don't work server-side).
- Matched CodeStats skeleton height to final content (language bar + legend). GitHub calendar `min-height` increased to 250px.

### Command palette mobile
- Hid "Find" text and "⌘K" badge on mobile (`hidden sm:block`/`hidden sm:inline-flex`), shows search icon only

### GitHub Stats fix
- Root cause: `api.ts` called `api.github.com` directly from client — `GITHUB_TOKEN` (server-only env var) was unavailable, causing rate limit (60 req/hr)
- Fix: Created `/api/github-stats` server route to proxy GitHub API calls with token authentication
- Added `api.github.com` to CSP `connect-src` (was blocked by Content-Security-Policy)
- Added `/api/github-stats` to `ZERO_COST_PATHS` in proxy (no auth needed)
- Added `GITHUB_TOKEN` to `.env.local`

### LinkedIn post management
- `post.mjs`: now auto-logs every post to `.posts.json` (gitignored)
- New `manage.mjs`: list, delete, and edit (delete + re-post) commands
- LinkedIn API doesn't support true edits — edit = delete + re-create

## Commits
- `6ee2911` — blog routes, scroll fixes — pushed to main
