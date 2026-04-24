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

### Admin App (`apps/admin`)
- `src/lib/types.ts` — removed `isGuest` from `AuthUser` interface
- `src/app/(admin)/layout.tsx` — removed `isGuest: false` from authUser
- `src/components/sidebar/app-sidebar.tsx` — removed `isGuest` from NavUser prop
- `src/components/sidebar/nav-user.tsx` — removed `isGuest` from user type, removed `canOpenSettings` guard, removed locked settings + "Create your account" menu items, removed guest checks in save/delete, renamed `/login` to `/welcome`
- `src/app/login/` → `src/app/welcome/` — renamed route, heading changed to "Welcome!"
- `src/proxy.ts` — all `/login` refs → `/welcome`
- `src/app/auth/callback/route.ts` — `/login` → `/welcome`
- `src/app/unauthorized/page.tsx` — `/login` → `/welcome`
- `src/app/(admin)/layout.tsx`, `users/page.tsx`, `deployments/*.tsx` — all redirects `/login` → `/welcome`

### MFA Enforcement at Proxy Level (both apps)
- `src/proxy.ts` — refactored into middleware chain pattern with sub-proxies:
  - `src/proxy/types.ts` — ProxyContext and ProxyMiddleware types
  - `src/proxy/runner.ts` — sequential middleware runner
  - `src/proxy/mfa.ts` — MFA enforcement (blocks pages + APIs at AAL1)
  - `src/proxy/recovery.ts` — recovery mode lockdown (pages + APIs)
  - `src/proxy/terms.ts` — terms acceptance enforcement
  - `src/proxy/route-guard.ts` — auth redirects
- `src/proxy.ts` — now a thin orchestrator that builds context and runs the chain:
  1. Unauthenticated users handled first (redirect to /welcome)
  2. MFA enforcement blocks pages AND APIs (only essential APIs allowed at AAL1)
  3. Recovery mode blocks APIs too (only profile/mfa-cleanup allowed)
  4. Terms enforcement unchanged
  5. Welcome page redirect last
- `src/app/mfa-verify/page.tsx` — new dedicated MFA verification page
- `src/app/welcome/actions.ts` — removed MFA check (proxy handles it now)
- `src/components/auth/welcome-form.tsx` — removed mfaStep state and MfaVerifyStep usage
- `src/components/auth/reset-password-form.tsx` — removed client-side MFA check (proxy enforces it before page loads)
- Admin app: added `mfa-verify-step.tsx` component, `mfa-verify/page.tsx`, proxy AAL check

### Database Cleanup
- Saved email function reference to `docs/references/resend-email-from-postgres.md`
- Dropped `jg_account.guest_login_limits` table
- Dropped `delete_anonymous_users_complete()` function
- Unscheduled `cleanup-anonymous-users-nightly` cron job

### LOC Refactor (target: all files under 300 lines)
**Sidebar**: nav-user.tsx 461→115, app-sidebar.tsx 398→171 (extracted account-settings-sheet, useActiveApp, useScrollTracking)
**Portfolio**: client.tsx 1004→84 (extracted 9 section components into components/portfolio/sections/)
**Games**: DareX 951→266, MemoryMatch 515→274, Wordle 514→267, ConnectFour 510→248, TypingSpeedTest 499→253, TicTacToe 375→218 (extracted hooks + sub-components)
**File Manager**: file-list 929→165, upload-dialog 511→249, file-viewer 345→230, copy/move dialogs ~320→~207, database.ts 396→17 barrel (split into db-files, db-directories, format-utils)
**Admin CRUD**: all 11 files refactored under 300 (extracted dialog components, table components, shared confirm dialog, API helpers)
**Other**: nav-apps 667→134, weather-dashboard 536→211, calculations-history 716→254, floating-doodles 339→73, camera-recorder 350→152, portfolio/database 392→26
**Remaining over 300**: tools.ts (779, pure data), database.types.ts (434, auto-generated), portfolio-data.ts (400, static content), terms-content.tsx (326, static content), use-dare-x.ts (488, cohesive hook), dare-x-sheets.tsx (439, 3 sheets), account-settings-sheet.tsx (319, single form), use-connect-four.ts (303, game AI) — all data/config or genuinely cohesive units

## Verification
- `pnpm check-types --filter jg` — passes
- `pnpm lint --filter jg` — passes (zero warnings)
- Grep for guest/anonymous references — clean (only "guest" in word list for games)
