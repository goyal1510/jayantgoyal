# Auth flows and security

This page describes every Auth route and the security transitions behind the
user-visible flows.

## Route catalog

| Route                     | Access                           | Responsibility                                       |
| ------------------------- | -------------------------------- | ---------------------------------------------------- |
| `/`                       | public                           | Redirect/entry selection for Auth                    |
| `/welcome`                | public                           | Primary password and provider entry with `return_to` |
| `/login`                  | public                           | Named sign-in surface                                |
| `/register`               | public                           | Named registration surface                           |
| `/forgot-password`        | public                           | Recovery email request                               |
| `/reset-password`         | recovery session                 | New password after callback verification             |
| `/verify`                 | public                           | Verification guidance/status                         |
| `/mfa`                    | authenticated AAL1               | TOTP challenge and return continuation               |
| `/account/security`       | authenticated, stepped up        | Security summary and account entry                   |
| `/account/profile`        | authenticated, stepped up        | Names and avatar                                     |
| `/account/password`       | authenticated, stepped up        | Password change with current password                |
| `/account/providers`      | authenticated, stepped up        | Linked identities                                    |
| `/account/mfa`            | authenticated, recent/stepped up | TOTP enrollment and removal                          |
| `/logout`                 | authenticated                    | Explicit local or global sign-out                    |
| `/error`                  | public                           | Safe mapped Auth error display                       |
| `/callback`               | public callback                  | Canonical PKCE/OAuth/recovery exchange               |
| `/auth/callback`          | public callback                  | Compatibility alias to canonical handler             |
| `/callback/auth/callback` | public callback                  | Nested compatibility alias                           |

## Password entry and registration

```text
Validated form origin + return target
  → signInWithPassword
     ├─ success + verified TOTP → /mfa → return target
     ├─ success without TOTP ───────────→ return target
     └─ failure → signUp
          ├─ session returned ──────────→ return target
          └─ verification required ─────→ remember target + email guidance
```

The unified action intentionally avoids revealing whether an email already
exists. Password validation requires at least eight characters, an uppercase
letter, a number, and a symbol.

## OAuth entry

Google and GitHub entry validate the request origin, normalize the requested
return target against the exact application-origin allowlist, store it in an
HTTP-only return cookie, and request a Supabase OAuth URL whose callback is
Auth-owned. Provider errors redirect to a safe error code rather than exposing
the upstream message.

## Callback exchange

The callback validates the code/error state, exchanges the PKCE code through
Supabase, synchronizes appropriate identity/profile metadata, restores the
remembered safe return, and establishes the selected shared web cookie mode.
Recovery callbacks mark the recovery session so normal product routes cannot
be used before password reset completes.

Callback aliases re-export or forward to the same implementation. They are
compatibility URLs, not separate flows.

## MFA challenge

After password/OAuth entry, a user with a verified TOTP factor remains at AAL1
until `/mfa` creates a challenge and verifies a six-digit code. The verified
session reaches AAL2 and returns to the validated target. Product proxies also
detect an enrolled factor at AAL1 and redirect to this Auth-owned flow.

## MFA enrollment and removal

Enrollment requires a recent sign-in, removes stale unverified TOTP factors,
creates one new factor, and returns QR/secret data only for the active setup
view. Verification challenges the exact factor before it becomes effective.
Cancellation can remove only the current unverified factor.

Disabling an authenticator requires a fresh six-digit challenge against the
verified factor before unenrollment. The route does not trust a factor ID
submitted by the browser without matching it to the current account.

## Password recovery

```text
/forgot-password
  → generic success response
  → Supabase recovery email to /callback
  → verified recovery cookie/session
  → MFA challenge when a factor is enrolled
  → /reset-password password policy + confirmation
  → clear recovery/return cookies
  → local or global sign-out
  → /welcome?message=password_changed
```

Recovery messages do not disclose account existence. Recovery mode limits the
session to reset/MFA and essential operations until the password is changed.

## Profile and avatar

Profile name changes require an authenticated, stepped-up session and enforce
80-character name limits. Avatar upload accepts only the shared MIME allowlist
and size limit, writes a new user-owned path to `profile-avatars`, updates the
profile, and removes the previous object. If the profile update fails, the new
object is removed to avoid an orphan.

Removing an avatar clears upload metadata and then removes the old private
object. Display resolution can fall back through uploaded, provider, and
initial-based presentation without changing identity ownership.

## Password and providers

Password change requires AAL2 when MFA is enrolled and reauthenticates the
current password before updating it. Provider linking/unlinking requires a
stepped-up or recent session, validates the current identity set, and uses the
canonical callback. It must not remove the last usable sign-in method.

## Logout scope

`local` signs out the current session. `global` asks Supabase to revoke all
sessions for the account. Both clear the shared browser session state and
return to a validated Auth login URL. Product code should link to Auth logout
rather than constructing a second logout implementation.

## Security invariants

- Only HTTP/HTTPS exact allowed origins may receive cross-host returns.
- Relative returns must remain on the validated synthetic/request origin.
- Username/password material, codes, tokens, and provider URLs are not logged.
- Cookie presence is a fast-path optimization, never final identity proof.
- AAL2 and recent sign-in are separate concepts and are applied intentionally.
- Auth never imports or creates a Supabase service-role client.
