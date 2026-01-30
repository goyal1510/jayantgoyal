# GitHub Stats Dashboard — Implementation Plan

**Date:** 2026-01-30
**Feature:** GitHub Stats Dashboard at `/github-stats`

## Summary

Add a public, searchable GitHub Stats Dashboard at `/github-stats`. Users enter any GitHub username and see profile info, contribution calendar, language distribution (pie chart), top repos (bar chart), summary stats, and a sortable repo table. Uses the public GitHub API (no token) with client-side caching, and `recharts` for charts. Default view loads the owner's profile (`goyal1510`).

---

## 1. Dependencies

```bash
pnpm add recharts react-github-calendar --filter jg
```

## 2. New files created

All paths under `apps/jayantgoyal/src/`.

### Library layer (`lib/github-stats/`)

| File | Purpose |
|------|---------|
| `types.ts` | TypeScript interfaces: `GitHubUser`, `GitHubRepo`, `GitHubStats`, `LanguageDistribution` |
| `api.ts` | Fetch functions with in-memory 5-min cache: `fetchGitHubUser()`, `fetchGitHubRepos()` |
| `compute.ts` | Pure functions: `computeStats()`, `computeLanguageDistribution()`, `getTopReposByStars()` with language color map |

### Components (`components/github-stats/`)

| File | Purpose |
|------|---------|
| `github-stats-dashboard.tsx` | Main `'use client'` component — search bar, state management, orchestrates sub-components. Loads `goyal1510` by default on mount. |
| `profile-card.tsx` | User avatar, name, bio, location, followers/following, repo count |
| `stats-cards.tsx` | Grid of 6 summary cards (total stars, forks, repos, most used language, avg stars, account age) |
| `contribution-calendar.tsx` | Wraps `react-github-calendar` (dynamic import, SSR disabled) with year selector |
| `language-pie-chart.tsx` | Recharts `PieChart` showing language distribution across repos |
| `top-repos-bar-chart.tsx` | Recharts `BarChart` showing top 10 repos by stars |
| `repository-table.tsx` | Sortable table of all repos (name, description, language, stars, forks, updated) |

### Route page

| File | Purpose |
|------|---------|
| `app/(protected)/github-stats/page.tsx` | Server component exporting metadata, renders `<GitHubStatsDashboard />` |

## 3. Files modified

| File | Change |
|------|--------|
| `lib/config/hub-config.ts` | Added `Github` icon import + new `github-stats` entry to `HUB_APPS` |
| `components/sidebar/dynamic-breadcrumb.tsx` | Added `/github-stats` pathname case |
| `components/sidebar/app-sidebar.tsx` | Added `/github-stats` pathname case in `activeAppId` useMemo block |
| `next.config.ts` | Added `avatars.githubusercontent.com` to `images.remotePatterns` |

## 4. Architecture & data flow

```
page.tsx (server, metadata)
  └→ GitHubStatsDashboard ('use client')
       ├─ Search input + Button
       ├─ Error banner (conditional)
       ├─ Loading skeletons (conditional)
       └─ Data sections (when user loaded):
            ├─ ProfileCard          ← props: { user }
            ├─ StatsCards           ← props: { stats } (useMemo from repos)
            ├─ ContributionCalendar ← props: { username }
            ├─ LanguagePieChart     ← props: { data } (useMemo from repos)
            ├─ TopReposBarChart     ← props: { repos } (useMemo from repos)
            └─ RepositoryTable      ← props: { repos }
```

- **Fetching**: Client-side `Promise.all([fetchGitHubUser, fetchGitHubRepos])` on search or mount
- **Caching**: In-memory `Map` with 5-min TTL (keyed by lowercase username)
- **Default**: Loads `goyal1510` profile on mount via `useEffect`
- **No API routes needed** — direct calls to `api.github.com`

## 5. Key patterns followed

- Server → Client page split (like `weather/page.tsx`)
- `dynamic(() => import('react-github-calendar'), { ssr: false })` (from `portfolio/github-calendar.tsx`)
- Error banner with red styling (from `weather-dashboard.tsx`)
- Loading skeletons using `Skeleton` component
- Framer Motion fade-in animations on cards
- Radix UI primitives (Card, Input, Button, Table, Badge, Skeleton)
- `cn()` for class composition, Lucide React for icons
