# Security boundaries

Security ownership is explicit across browser, server, database, and provider
layers.

## Threat and control map

| Risk                           | Primary controls                                                                     | Owner                            |
| ------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------- |
| Account takeover               | Password policy, provider security, TOTP, recent sign-in, local/global logout        | Auth                             |
| Open redirect / callback abuse | Relative-path validation and exact allowed origins                                   | `@jayantgoyal/web-auth` and Auth |
| Cross-host cookie leakage      | Trusted production host list, secure domain cookie, host-only Preview/local behavior | `@jayantgoyal/web-auth`          |
| Internal header spoofing       | Strip/recreate verified request headers in product proxies                           | Studio/Admin                     |
| Privilege escalation           | Live user lookup, MFA, profile role, route-specific role check                       | Admin                            |
| Cross-account data access      | `auth.uid()` RLS, object ownership, API validation                                   | Supabase and owning product      |
| Service-role misuse            | Server-only factory, caller authorization, service-role source check                 | Studio/Admin/root tooling        |
| File/object abuse              | Private buckets, owner prefixes, signed URLs, MIME/size/path checks                  | Studio/Auth/Admin                |
| Public endpoint cost abuse     | Contact database limiter, input bounds, zero-cost allowlist, provider caching        | Owning product                   |
| Secret/supply-chain exposure   | Client/server boundary, ignored local files, frozen lockfile, overrides, diff review | Repository                       |

## Credentials

- `NEXT_PUBLIC_*` variables are browser-visible by design and must never contain
  secrets.
- Supabase service-role, Vercel, Resend, Google service-account, GitHub, and
  product seed secrets remain server-only.
- Portfolio and Auth do not use `SUPABASE_SERVICE_ROLE_KEY`.
- A client module must never import service-role code, even indirectly.
- `.env.local`, `supabase/.temp`, tokens, connection strings, and generated
  credential files must not be committed.

`pnpm check:service-role` scans web-client sources for client/server boundary
violations and prevents service-role references in Portfolio.

Credential access is least-scope by deployed project. Auth and Portfolio never
receive the service role. Admin alone receives Vercel operations credentials.
Portfolio alone receives contact/Resume delivery credentials. Studio alone
receives the Wordle seed and Weather configuration.

## Authorization

RLS is the default data boundary. Any server route that uses elevated
credentials must authenticate and authorize the caller before the privileged
query. Admin role checks, MFA, recent sign-in, object ownership, and route-level
policy remain application responsibilities even when shared auth clients are
used.

Authentication answers who the caller is. Authorization still answers which
product operation, record, role, assurance level, and current state the caller
may use. Hidden UI, a proxy header, or an authenticated cookie alone is not an
authorization decision for an elevated route.

## Session, MFA, and return safety

The shared production session is limited to trusted Jayant web hosts. Preview
and local environments use safer host/local behavior. Cookie presence is only
a fast path; protected actions verify the user with Supabase. Auth return
targets accept only relative paths or exact configured HTTP/HTTPS origins
without embedded credentials.

Users with verified TOTP factors complete AAL2 before protected product or
account actions. Sensitive account changes also require current-password or
recent-sign-in evidence as documented by Auth. Recovery mode restricts the
session until password reset is complete.

## Public endpoints

Public APIs must have an explicit cost and abuse model. Rate-limit contact and
other costly provider calls, validate payloads and origins, avoid user-derived
redirects, and keep error messages free of secrets. Studio proxy zero-cost
classification is an allowlist, not a shortcut for new APIs.

Public input is untrusted. Validate body shape, field length, enum/slug/username
format, file metadata, query parameters, and dynamic table/resource names.
Dynamic Admin table APIs use explicit allowlists. Contact HTML is escaped.
Provider/database errors are mapped to safe responses while server diagnostics
exclude credentials and unnecessary personal content.

## Data and privacy

Collect only data required by the capability. Account workspace rows are
private by default. Public Portfolio and Writing records have explicit
visibility/publication policy. Avoid logging contact contents, profile/Auth
metadata, private file paths/names, game state tied to identity, or raw provider
payloads unless a documented operational need and retention rule exists.

Deletion behavior spans Auth identity, profile rows, owned application data,
and private objects. A new user-owned table or bucket must be included in the
reviewed account-deletion contract before release.

## Upload and Storage safety

Storage policy and application validation are both required. File Manager uses
private objects and signed upload completion. Portfolio assets permit public
reads but only authorized Admin uploads of allowed asset kinds. Avatar uploads
are private, user-prefixed, MIME-limited, and size-limited. Roll back newly
uploaded objects when metadata persistence fails where practical.

## Deployment and dependencies

CI installs from the frozen lockfile and runs architecture, asset, secret
boundary, lint, type, test, and build gates. Review dependency and generated
file changes before shipping. Vercel project roots and environment variables
must match the owning client so one product does not inherit another's secrets.

## Security review checklist

For every sensitive change review trust origin, identity proof, role/ownership,
MFA/recent sign-in, RLS, elevated credential creation, input/output validation,
open redirects, cache headers, logs/PII, file/provider abuse, failure mode,
deletion/retention, and environment scope. Run the focused authorization tests
plus service-role, lint, type, test, and production build checks.
