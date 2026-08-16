# Auth

Shared sign-in, recovery, and account-security application for Jayant's web
applications.

- Production: [auth.jayantgoyal.com](https://auth.jayantgoyal.com)
- Package/filter: `auth`
- Local port: `3003`
- Access: public entry/recovery plus authenticated account surfaces

## Routes

| Route                 | Purpose                                             |
| --------------------- | --------------------------------------------------- |
| `/`, `/welcome`       | Canonical sign-in entry and return-target handling  |
| `/login`, `/register` | Compatibility redirects into the canonical entry    |
| `/forgot-password`    | Recovery email request                              |
| `/reset-password`     | Password reset with recovery/MFA checks             |
| `/verify`             | Email verification guidance                         |
| `/callback`           | PKCE/OAuth callback and safe destination resolution |
| `/mfa`                | Authenticator challenge                             |
| `/account/security`   | Account-security overview                           |
| `/account/profile`    | Profile name and avatar settings                    |
| `/account/password`   | Password change                                     |
| `/account/mfa`        | Authenticator enrollment and removal                |
| `/account/providers`  | Google/GitHub identity linking and unlinking        |
| `/logout`             | Explicit local or global sign-out                   |

## Ownership and Policy

Auth is the default owner of sign-in, recovery, MFA, connected providers,
profile, password, and logout flows. Studio and Admin retain compatibility
entry routes only for controlled rollback through
`NEXT_PUBLIC_AUTH_FLOW_OWNER=legacy`.

`src/proxy.ts` protects account routes, validates sessions, requires MFA
step-up where appropriate, and requires recent sign-in for sensitive account
changes. Server actions validate mutation origins and safe return targets.

The shared `@repo/auth` package owns framework-neutral and shared Supabase
contracts:

- Cross-subdomain platform session cookies and rollback modes.
- Browser, request, and server-component Supabase clients.
- Safe return paths/origins and Auth entry URL construction.
- Password policy, profile/avatar resolution, provider identity mapping, and
  sign-out scopes.

## Data and Storage

Auth uses the Supabase anonymous key and RLS:

- Supabase Auth for password, Google, GitHub, recovery, PKCE, and TOTP MFA.
- `jg_account.profiles` for profile names and avatar ownership.
- `profile-avatars` for private user-owned uploads served by signed URLs.

Auth does not use `SUPABASE_SERVICE_ROLE_KEY`.

## Environment

Use `.env.example` as the contract:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_AUTH_SESSION_MODE`
- `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN`
- `NEXT_PUBLIC_SITE_URL`
- Portfolio, Studio, and Admin origins
- Exact allowed Preview return origins

Hosted Preview may omit `NEXT_PUBLIC_SITE_URL` so request headers remain the
source of truth for the generated deployment origin.

## Development

```bash
pnpm --filter auth dev
pnpm --filter auth lint
pnpm --filter auth check-types
pnpm --filter auth build
pnpm test
```

Auth responses are private/no-store and account routes are non-indexable. Keep
tokens out of URLs and logs, and preserve the CSP, origin checks, return-target
allowlist, MFA, and recent-sign-in protections when changing flows.
