# PLATFORM-00 Authentication and Security Inventory

This file records the baseline authentication contract without cookie values,
authorization codes, OAuth state, tokens, email addresses, passwords, MFA codes,
or personal identifiers.

## Current browser-visible contract

### Supabase session cookies

- Base name: `sb-orwfvyditlguqvxvztkw-auth-token`.
- Large sessions use Supabase chunk suffixes such as `.0` and `.1`.
- A successful production password response set the session cookie with `Path=/`,
  `Max-Age=34560000`, and `SameSite=Lax`.
- The observed response did not set `Domain`, `Secure`, or `HttpOnly`.
- Because `Domain` is absent, the baseline session is host-only. Chrome confirmed
  that a completed `www.jayantgoyal.com` Google/MFA session did not authenticate
  `admin.jayantgoyal.com`; Admin presented its own login flow.
- The binding production target is a distinct versioned cookie named
  `__Secure-jg-session-v1` with `Domain=jayantgoyal.com`, `Path=/`, `Secure=true`,
  and `SameSite=Lax`.
- PLATFORM-04 must not change the Domain of the existing cookie name because a
  browser could then send same-named host and domain cookies ambiguously. The
  approved sequence validates a legacy session on a trusted response, promotes it
  to the new platform cookie, prefers the new cookie, retains legacy reads through
  observation, then deletes the legacy cookie using its original host/path
  semantics. If safe promotion cannot be proven, use one explicit reauthentication
  event instead of copying tokens unsafely.

### Application cookies

| Name             | Current purpose                                      | Current attributes                                                                          | Owner target                                                           |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `terms_accepted` | Cached profile acceptance used by the main proxy/API | `Path=/`, `HttpOnly`, `Secure`, `SameSite=Lax`, one-year max age                            | Auth account contract; Studio may read only the approved shared signal |
| `auth_redirect`  | Recovery callback destination                        | `Path=/`, `HttpOnly`, HTTPS-dependent `Secure`, `SameSite=Lax`, one-hour max age            | Auth                                                                   |
| `recovery_mode`  | Restricts a recovery session to the reset flow       | `Path=/`, `SameSite=Lax`, one-hour max age; not currently `HttpOnly` or explicitly `Secure` | Auth                                                                   |

## Auth surfaces

| Current application | Surface                                           | Baseline purpose                                                     | Final owner/compatibility                                          |
| ------------------- | ------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Main                | `/welcome`                                        | Unified password sign-in and registration fallback plus Google OAuth | Auth `/login` and `/register`; compatibility redirect              |
| Main                | `/forgot-password`                                | Recovery email request                                               | Auth; compatibility redirect                                       |
| Main                | `/reset-password`                                 | Recovery-session password update with local/global logout option     | Auth; compatibility redirect                                       |
| Main                | `/mfa-verify`                                     | TOTP challenge when a verified factor exists                         | Auth `/mfa`; compatibility redirect                                |
| Main                | `/auth/callback`                                  | PKCE OAuth, verification, and recovery callback                      | Auth `/callback`; compatibility handler through observation window |
| Main                | `/terms-conditions`                               | Identity-related policy/acceptance content                           | Auth route, content managed by Admin                               |
| Main                | `/api/account/accept-terms`                       | Accept policy and set cached cookie                                  | Auth account API                                                   |
| Main                | `/api/account/init`                               | Profile/session bootstrap                                            | Auth account API                                                   |
| Main                | `/api/account/delete`                             | Authenticated account deletion                                       | Auth account API                                                   |
| Main                | `/api/account/mfa-cleanup`                        | Authenticated MFA cleanup                                            | Auth security API                                                  |
| Admin               | `/welcome`                                        | Password and Google sign-in followed by role/factor routing          | Auth login entry with safe Admin return; compatibility redirect    |
| Admin               | `/mfa-verify`                                     | TOTP challenge                                                       | Auth `/mfa`; compatibility redirect                                |
| Admin               | `/auth/callback`                                  | Admin-host PKCE callback                                             | Auth `/callback`; compatibility handler through observation window |
| Admin               | `/unauthorized`                                   | Role-denial state                                                    | Admin                                                              |
| Admin               | `/api/account/delete`, `/api/account/mfa-cleanup` | Duplicated account/security operations                               | Auth account/security APIs with Admin compatibility                |

The current user-facing provider list contains Google only. No GitHub provider
button exists in either app. PLATFORM-01 must therefore treat GitHub as a target
flow rather than a baseline production behavior.

## Client and proxy inventory

| Capability           | Main                             | Admin                                                | Baseline finding                                      |
| -------------------- | -------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| Browser client       | `src/lib/supabase/client.ts`     | `src/lib/supabase/client.ts`                         | Duplicated `createBrowserClient` factories            |
| Server client        | `src/lib/supabase/server.ts`     | `src/lib/supabase/server.ts`                         | Duplicated factories; both wrapped in React `cache()` |
| Proxy client         | `src/proxy.ts`                   | `src/proxy.ts`                                       | A fresh SSR client is created per proxy request       |
| Callback client      | `src/app/auth/callback/route.ts` | `src/app/auth/callback/route.ts`                     | Duplicated callback-local SSR clients                 |
| Service-role factory | `src/lib/supabase/admin.ts`      | service-role factory in `src/lib/supabase/server.ts` | Duplicated privileged factories                       |

Main proxy behavior:

- zero-cost public resources bypass Supabase;
- public pages bypass `getUser()` and use page/layout auth state;
- unauthenticated non-API product pages render an inline auth gate for SEO rather
  than redirecting at the proxy;
- protected APIs use `getUser()`, terms, recovery, MFA, and route-guard middleware;
- AAL is decoded from the unverified cookie payload only as a routing hint and
  authenticated operations still call Supabase.

Admin proxy behavior:

- `/welcome`, `/unauthorized`, and `/auth/callback` are public;
- all other pages and APIs require a Supabase user and an `admin` or
  `super_admin` profile role;
- MFA is required only when Supabase reports `aal1 -> aal2` and a verified TOTP
  factor exists;
- an Admin/Super Admin with no verified factor can therefore enter at AAL1.

## Privileged capability inventory

- Main service role: account deletion, MFA-factor cleanup, callback MFA-factor
  lookup, game-session state transitions after handler-level identity/domain
  validation, and the Wordle HMAC-seed fallback.
- Admin service role: account deletion, MFA cleanup, user administration, and
  validated Portfolio table operations.
- Admin Vercel token: deployment and environment management APIs.
- Portfolio-facing server credentials: Resend contact email, Google service
  account resume retrieval, and GitHub token for code statistics.
- No service-role value was found in client-side code or recorded in migration
  artifacts.

The Wordle seed fallback couples a game-integrity secret to the Supabase service
role. PLATFORM-05 must replace this with a Studio-owned dedicated server secret
before Studio can claim least-privilege ownership.

## Reproducible black-box auth journeys

| Journey                                                  | Result                                            | Baseline evidence                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main unauthenticated `/files`                            | Pass                                              | Route remained `200` and rendered the inline sign-in gate                                                                                                                         |
| Main password login                                      | Pass                                              | Production returned `303` to `/files?login_success=true`; cache headers prohibited storage                                                                                        |
| Main Google OAuth + MFA                                  | Pass                                              | User Chrome completed Google provider callback, reached `/mfa-verify`, completed TOTP, landed on `/`, and opened `/files` without the sign-in gate                                |
| Main recovery request                                    | Pass                                              | Production form accepted the request and reported that a reset email was sent; the mailbox link was not opened                                                                    |
| Main MFA page without a factor                           | Pass                                              | Authenticated no-factor visit returned to `/files` rather than presenting an unusable challenge                                                                                   |
| Main logout                                              | Pass with cross-host effect in the tested browser | Default `signOut()` returned Main to the inline sign-in gate; the separately authenticated Admin session also required login afterward, consistent with global sign-out semantics |
| Admin unauthenticated root                               | Pass                                              | `307` to `/welcome?redirect=%2F`                                                                                                                                                  |
| Admin password Super Admin                               | Pass with security gap                            | A dedicated baseline test persona reached protected Admin while its JWT was AAL1 and it had no verified factor                                                                    |
| Admin Google OAuth + MFA with the Chrome Google identity | Authentication pass; authorization denial         | Admin required its own host login, completed Google and TOTP, then redirected to `/unauthorized` because that identity lacks an Admin/Super Admin profile role                    |
| Provider cancellation/failure                            | Partial                                           | Browser back from the Google identifier page returned safely to `/welcome`; explicit provider-error callback coverage remains PLATFORM-01 work                                    |

## Known baseline security failures

1. **Mandatory Admin AAL2 is not enforced for factorless admins.** Current logic
   challenges only an account that already has a verified factor. PLATFORM-04/07
   must require enrollment or step-up for every Admin session.
2. **Admin return parameters are not safely constrained.** The Admin callback uses
   `new URL(next, request.url)` without rejecting absolute URLs or `//` paths;
   Admin welcome and MFA flows propagate the unvalidated return value. Treat this
   as an open-redirect family and fix it in the first shared-auth slice with
   regression tests.
3. **Recovery cookie hardening is incomplete.** `recovery_mode` is not currently
   `HttpOnly` or explicitly `Secure`.
4. **Server-client caching is duplicated and potentially request-context
   sensitive.** PLATFORM-02 must establish the approved shared factories and
   request-scoped behavior before migrations use them.
5. **Default logout scope is implicit.** Visible logout actions call `signOut()`
   without an explicit scope, while reset-password offers a local/global choice.
   PLATFORM-04 must make current-device and all-device semantics explicit.

## Credential-handling note

During the baseline session, browser tooling displayed a dedicated Admin test
persona's credential fields in diagnostic output. No credential is stored in this
repository or ledger. The persona password must be rotated before any further
password-based production Admin test. Google and MFA validation used the user's
Chrome directly and no account identifier, token, code, or cookie value was
recorded.
