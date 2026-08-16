# Studio

Studio is the product catalog and workspace at
[studio.jayantgoyal.com](https://studio.jayantgoyal.com). Its web client lives at
`apps/studio/web` and runs locally on port 3001.

## Ownership

Studio owns public product discovery, browser utilities, games, weather, GitHub
statistics, and custom calculation experiences. Authenticated workspaces
include Activity Tracker, Currency Calculator history, File Manager, Sync
Scratchpad, and online game rooms.

Canonical registries define the current surface:

- Product inventory: `src/lib/config/studio-inventory.ts`
- Public/protected surface policy: `src/lib/config/studio-surfaces.ts`
- Navigation: `src/lib/config/hub-config.ts`
- Games: `src/lib/games/config.ts`
- Developer tools: `src/lib/tools/tools.ts`

Treat those files and their tests as the source of truth instead of duplicating
counts in documentation.

## Authentication and data

`src/proxy.ts` performs the public/protected route split, session refresh, and
terms checks. `src/components/auth/auth-gate.tsx` mirrors client-side access
classification. Auth owns the normal entry/account flows; Studio retains
compatibility routes for controlled rollback.

Studio data lives primarily in `jg_app`, with account/terms state in
`jg_account`. Private files use the `private-files` bucket. Every query must
select its intended schema, handle errors, and preserve user-scoped RLS or
server-side authorization.

## Environment

The contract is `apps/studio/web/.env.example`. It includes Supabase, shared
session/Auth ownership, local application origins, Wordle seed, OpenWeather,
and GitHub variables. The service-role key is server-only and may be used only
by routes that independently authorize the caller.

When adding a public surface, reconcile metadata, sitemap, proxy public paths,
the client auth gate, zero-cost API classification, the appropriate registry,
and regression tests.
