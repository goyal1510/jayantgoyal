# 2026-04-24: Google OAuth + Remove Guest Login

## Area
Auth system - `apps/jayantgoyal`

## Problem
Replace guest/anonymous login with Google OAuth. Users should be able to login/signup with Google in addition to email/password.

## Changes

### Deleted
- `src/app/api/guest-login/route.ts` — entire guest login API
- `src/app/session-limit/` — session limit page (page.tsx + client.tsx)
- `src/app/api/account/sessions/` — sessions API route
- `src/app/signup/` — separate signup page (merged into login)
- `src/components/auth/signup-form.tsx` — signup form component (merged into login-form)

### Modified
- `src/proxy.ts` — removed anonymous user exemptions, removed `/api/guest-login` from public paths, removed session limit enforcement
- `src/app/auth/callback/route.ts` — added profile creation for first-time Google OAuth users
- `src/app/login/` → `src/app/welcome/` — route renamed from `/login` to `/welcome`
- `src/components/auth/login-form.tsx` → `src/components/auth/welcome-form.tsx` — renamed, single unified auth form: email + password + Google. Auto-detects login vs signup.
- `src/app/welcome/actions.ts` — single `authenticate` action: tries signIn first, falls back to signUp if user doesn't exist
- `src/app/welcome/page.tsx` — title "Welcome | Jayant", heading "Welcome!"
- All `/login` references updated to `/welcome` across: proxy.ts, auth/callback, reset-password-form, forgot-password-form, terms-acceptance-check, app-sidebar
- `src/components/auth/terms-dialog.tsx` — removed guest-related props
- `src/components/auth/auth-toast.tsx` — removed guest_remaining toast
- `src/components/sidebar/nav-user.tsx` — removed isGuest logic, removed entire sessions section (SessionInfo, parseUserAgent, formatIp, formatRelativeTime, fetchSessions, handleRevokeSession, handleRevokeAllOthers, sessions UI)
- `src/components/sidebar/app-sidebar.tsx` — removed isGuest from user type
- `src/app/api/account/profile/route.ts` — removed isGuest, hasVerifiedEmail, needsPassword
- `src/app/api/account/delete/route.ts` — removed anonymous user check
- `src/app/api/account/terms-status/route.ts` — removed anonymous user exemption

## Approach
- Google OAuth via client-side `supabase.auth.signInWithOAuth({ provider: "google" })`
- OAuth callback handled by existing PKCE flow in `/auth/callback`
- Profile auto-created for first-time OAuth users using Google metadata
- Terms acceptance enforced for all users (no more anonymous exemption)

## Key Decisions
- Client-side OAuth initiation (simpler than server action, Supabase handles redirect)
- Google button uses inline SVG icon (no new dependency)
- "or" divider between email/password and Google OAuth buttons

## Verification
- `pnpm check-types --filter jg` — passes
- `pnpm lint --filter jg` — passes (zero warnings)
- Grep for guest/anonymous references — clean (only "guest" in word list for games)
