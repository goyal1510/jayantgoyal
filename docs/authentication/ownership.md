# Authentication ownership

Auth is the normal owner of account entry and security. Studio and Admin own
their authorization policies and retain compatibility entry routes only for
controlled rollback.

## Responsibilities

| Layer               | Responsibility                                                        |
| ------------------- | --------------------------------------------------------------------- |
| Auth web client     | Entry, recovery, MFA, profile, password, providers, logout            |
| `@jayant/web-auth`  | Supabase clients, cookie/session contract, safe returns, shared rules |
| Studio proxy/routes | Studio public/protected split, terms, product authorization           |
| Admin proxy/routes  | Admin role, MFA, and privileged-operation authorization               |
| Supabase            | Identities, tokens, MFA factors, sessions, and RLS-backed account data |

The normal flow owner is Auth. `NEXT_PUBLIC_AUTH_FLOW_OWNER=legacy` preserves a
rollback route; it does not define a second long-term architecture.

The normal production session uses the shared cross-subdomain cookie contract.
The existing `platform` runtime value is compatibility vocabulary for that
rollout and is not the ecosystem name. `compatibility` and `legacy` modes exist
only for controlled migration or rollback.

## Security requirements

- Validate return paths and exact allowed origins.
- Validate mutation origins for server actions and sensitive route handlers.
- Require MFA assurance and recent sign-in where the operation demands it.
- Keep access and refresh tokens out of URLs and logs.
- Use secure, appropriately scoped cookies in production and host-only cookies
  for generated Preview deployments.
- Preserve explicit local/global logout scope.
- Reauthorize every service-role operation independently of session refresh.

Auth uses the anonymous key with RLS and does not use the service-role key.
