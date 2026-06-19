# Tools History And Favorites Audit

Date: 2026-06-18
Area: `apps/jayantgoyal` tools

## Problem

The tools area is missing user-facing history and favorites behavior. The user
also asked for a full audit of all available tools because some tools are not
working as expected.

## Plan

- Inspect the current tools route structure and data model.
- Add favorites and history behavior using the app's existing local-first
  patterns unless the current implementation points to a database-backed model.
- Build a repeatable audit path for every tool route and fix discovered
  breakages where feasible.
- Run lint, type checks, and relevant browser or scripted verification.

## Progress

- Created a dedicated worktree at
  `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/tools-history-favorites-audit`.
- Confirmed tools are registry-driven through `src/lib/tools/tools.ts`, with
  individual pages under `/tools/*`.
- Added a persisted local tools usage store for favorites and visit history.
- Added a `/tools` layout shell that records visits for every individual tool
  route and shows a per-tool favorite control.
- Reworked the `/tools` hub into a client dashboard with search, Favorites,
  History, category counts, and favorite controls on tool cards.
- Added Favorites and History quick links to the Tech Tools sidebar/flyout.
- Added an explicit All Tools sidebar/flyout entry so the `/tools` dashboard is
  reachable from the Tech Tools navigation in expanded, collapsed, and mobile
  sidebar states.
- Extracted sidebar Favorites/History quick links into `tool-quick-links.tsx`
  so the Tech Tools menu stays below the shipping checklist's large-component
  threshold.
- Pivoted favorites/history to a DB-backed model after user clarified the
  feature should use Supabase.
- Created migration `20260618103941_add_tools_usage_tracking.sql` for
  `jg_app.tool_favorites` and `jg_app.tool_history`, including user-owned RLS,
  authenticated grants, indexes, and auth-user cascading foreign keys.
- Added `/api/tools/usage` to read/update favorites and history through the
  server Supabase client.
- Marked `/api/tools/usage` as an auth-public proxy path so public tool pages
  can receive quiet JSON no-op responses instead of HTML redirects when
  visitors are logged out.
- Updated the tools usage store to sync from `/api/tools/usage` after local
  hydration and to persist favorite/history actions to Supabase for signed-in
  users while keeping anonymous local fallback behavior.
- Fixed history writes so repeat visits increment `visit_count`.
- Ensured server usage refresh runs even when the Zustand persisted store was
  already hydrated by another component.
- Explicitly revoked `anon` access in the migration because existing
  `jg_app` default privileges grant future table reads to anonymous clients.
- Updated `supabase/schemas/jg_app.sql` so the checked-in schema snapshot
  includes the tools usage tables, constraints, indexes, RLS policies, and
  grants.
- Tightened the sidebar tools quick-link type guards to use the registry `Tool`
  type directly.
- Fixed the Zustand rehydration call to handle the library typing where
  `persist.rehydrate()` can return `void`.
- Browser smoke exposed noisy anonymous sync behavior: every favorite button
  could trigger a usage fetch, and public users saw expected `401` resource
  errors. Deduped server usage loading and changed unauthenticated API sync to
  quiet `200` no-op responses while preserving local fallback.
- Fixed anonymous local fallback state so an unauthenticated empty server
  response does not overwrite locally favorited or recently visited tools.
- Cleaned tools usage store formatting during the final shipping review.

## Validation

- `pnpm --filter jg lint`
- `pnpm --filter jg check-types`
- `git diff --check`
- `pnpm build --filter jg`
- Registry audit: 87 registered tools, no duplicate paths, no missing
  `page.tsx` or `client.tsx` files.
- HTTP route sweep: `/tools` plus all 87 registered tool routes returned `200`
  with no route error markers.
- API anonymous behavior: `/api/tools/usage` returns `200` with
  `{ authenticated: false, favoriteToolIds: [], history: [] }`.
- API write guards: cross-origin `POST /api/tools/usage` returns `403`, while
  anonymous same-origin/no-origin `record-history` returns a quiet `200` no-op
  response.
- Browser smoke with local Chrome: favorited UUID Generator, visited its tool
  page, returned to `/tools`, and confirmed local fallback favorites/history
  persisted with no app console errors.
- `supabase migration list --local` could not run because no local Supabase
  Postgres instance was listening on `127.0.0.1:54322`; local Docker/Supabase
  was not started for this task.
- Remote Supabase project `orwfvyditlguqvxvztkw` was updated after CLI migration apply was blocked by existing remote-only migration history. Applied the reviewed SQL with `supabase db query --linked --file`, then marked `20260618103941` applied with `supabase migration repair --linked --status applied`.
- Remote verification confirmed `jg_app.tool_favorites` and `jg_app.tool_history` exist, both have RLS enabled, and policies are scoped to `authenticated` users.
- Remote grant verification confirmed the new tables grant to `authenticated`,
  `service_role`, and owner roles, with no direct `anon` table grant.
- Security review: added same-origin validation to `/api/tools/usage`
  state-changing methods to reduce CSRF exposure on cookie-authenticated
  favorite/history writes.
