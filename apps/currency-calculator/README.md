# Currency Calculator

Supabase-authenticated currency breakdown tool for INR with saved calculation history.

## Features
- Build denomination breakdowns across ₹500 to ₹1, auto-summing totals and tagging entries with IST timestamps and optional notes.
- Save calculations to Supabase and review them with pagination, date filtering, search, amount filters (positive/negative), and deletion.
- Auth flows for email/password, guest login, profile updates, and account deletion (service-role protected), all using the shared `@repo/ui` shell.

## Run locally
From the repo root:
```bash
pnpm dev --filter ccal
```

## Environment
Create `.env.local` in `apps/currency-calculator` (or the repo root) with:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # required for /api/account/delete
GUEST_EMAIL_LOGIN=...           # optional, powers guest login for demos
GUEST_PASSWORD_LOGIN=...
```

## Supabase setup
- Create a `currency_calculator` schema with `calculations` (id UUID PK, note, ist_timestamp, user_id -> auth.users, created_at) and `denominations` (id UUID PK, calculation_id FK, denomination, count, bundle_count, open_count, total).
- Enable RLS and scope both tables to `auth.uid()` so users only see their own calculations.
- Update note values via `CURRENCY_DENOMINATIONS` in `src/lib/types/database.ts` if you need a different currency set.
