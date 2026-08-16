# Security boundaries

Security ownership is explicit across browser, server, database, and provider
layers.

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

## Authorization

RLS is the default data boundary. Any server route that uses elevated
credentials must authenticate and authorize the caller before the privileged
query. Admin role checks, MFA, recent sign-in, object ownership, and route-level
policy remain application responsibilities even when shared auth clients are
used.

## Public endpoints

Public APIs must have an explicit cost and abuse model. Rate-limit contact and
other costly provider calls, validate payloads and origins, avoid user-derived
redirects, and keep error messages free of secrets. Studio proxy zero-cost
classification is an allowlist, not a shortcut for new APIs.

## Deployment and dependencies

CI installs from the frozen lockfile and runs architecture, asset, secret
boundary, lint, type, test, and build gates. Review dependency and generated
file changes before shipping. Vercel project roots and environment variables
must match the owning client so one product does not inherit another's secrets.
