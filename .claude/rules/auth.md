# Auth Rules

## Middleware
- Next.js 16 uses `src/proxy.ts` (NOT `middleware.ts`).
- Proxy sets `x-auth-status` and `x-terms-accepted` headers.
- Public routes are explicitly listed in the proxy — everything else requires auth.

## Auth Flows
- Email/password, magic link, PKCE OAuth, anonymous guest login.
- Guest login via `POST /api/guest-login` with IP-based rate limiting.
- MFA with TOTP is supported — check AAL level after login.

## Post-Auth Toasts
- Use query param pattern for toasts after redirects (e.g. `?login_success=true`, `?signed_out=true`).
- `AuthToast` component in protected layout handles all auth-related toast params.
- Always clean up query params from URL after showing toast.
