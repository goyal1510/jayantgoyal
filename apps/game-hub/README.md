# Game Hub

Mini-game hub (Tic Tac Toe, Rock Paper Scissors, Dare X) built with Next.js 16 and Supabase auth.

## Features
- **Tic Tac Toe:** Local PvP and vs-computer modes with move history and quick resets.
- **Rock Paper Scissors:** Fast computer rounds with running win/loss/draw tallies.
- **Dare X:** Party dares with built-in prompts, custom dare lists (import/export), player rotation, and completion tracking.
- Supabase-backed auth (email/password, guest login, profile updates, account deletion) plus a shared themed shell from `@repo/ui`.

## Run locally
From the repo root:
```bash
pnpm dev --filter ghub
```

## Environment
Create `.env.local` in `apps/game-hub` (or the repo root) with:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # required for /api/account/delete
GUEST_EMAIL_LOGIN=...           # optional, enables guest login
GUEST_PASSWORD_LOGIN=...
```

## Notes
- Game metadata lives in `src/lib/games.ts`.
- Supabase clients are in `src/lib/supabase/`; guest login is handled via `/api/guest-login`.
