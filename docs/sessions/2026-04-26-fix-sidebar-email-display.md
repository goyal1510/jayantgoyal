# 2026-04-26 — Fix sidebar email + centralize admin client

## Problem 1: Sidebar showing user@example.com
The `/api/account/init` endpoint never included `email` in its response.

## Solution
- Added `x-user-email` proxy header (zero cost, proxy already has the user object)
- API route reads from header, includes email in response

## Problem 2: Service role key duplicated across API routes
Three files created their own admin client or used raw fetch with service role headers.

## Solution
- Created `src/lib/supabase/admin.ts` with `createSupabaseAdminClient()`
- Replaced inline `createClient()` and raw fetch calls in account/delete, account/mfa-cleanup, and auth/callback
- mfa-cleanup now uses the SDK's `admin.mfa.listFactors()` / `deleteFactor()` instead of raw REST calls

## Files Changed
- `apps/jayantgoyal/src/lib/supabase/admin.ts` — new shared admin client
- `apps/jayantgoyal/src/proxy.ts` — added `x-user-email` header
- `apps/jayantgoyal/src/app/api/account/init/route.ts` — read email from proxy header
- `apps/jayantgoyal/src/app/api/account/delete/route.ts` — use shared admin client
- `apps/jayantgoyal/src/app/api/account/mfa-cleanup/route.ts` — use shared admin client + SDK methods
- `apps/jayantgoyal/src/app/auth/callback/route.ts` — use shared admin client for MFA check
- Deleted `apps/jayantgoyal/src/app/api/account/profile/route.ts` — superseded by init
- Deleted `apps/jayantgoyal/src/app/api/account/terms-status/route.ts` — superseded by init
- `apps/jayantgoyal/src/proxy.ts` — removed `/api/account/terms-status` from AUTH_PUBLIC_PATHS
- `apps/jayantgoyal/src/proxy/terms.ts` — removed dead routes from TERMS_EXEMPT_APIS
- `apps/jayantgoyal/src/proxy/mfa.ts` — removed dead routes from MFA_EXEMPT_APIS
- `apps/jayantgoyal/src/proxy/recovery.ts` — replaced `/api/account/profile` with `/api/account/init`
