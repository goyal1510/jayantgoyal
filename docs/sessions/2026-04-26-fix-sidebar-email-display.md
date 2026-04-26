# 2026-04-26 — Fix sidebar email display

## Problem
The sidebar user dropdown showed "user@example.com" instead of the actual user's email because the `/api/account/init` endpoint never included the `email` field in its response.

## Solution
- Proxy already calls `getUser()` — added `x-user-email` header in `proxy.ts` (zero extra cost)
- API route (`/api/account/init`) reads email from the proxy header instead of making a redundant `getUser()` call
- Falls back to `getUser()` only when called directly without proxy (dev mode)

## Files Changed
- `apps/jayantgoyal/src/proxy.ts` — set `x-user-email` header from the existing `user` object
- `apps/jayantgoyal/src/app/api/account/init/route.ts` — read `x-user-email` header, include `email` in response
