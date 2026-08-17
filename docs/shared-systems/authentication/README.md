# Authentication ownership

Auth is the sole interactive owner of account entry and security. Studio and
Admin own their authorization policies and expose only redirect aliases or
short-lived callback compatibility where an already-issued link may still land.

## Responsibilities

| Layer                   | Responsibility                                                             |
| ----------------------- | -------------------------------------------------------------------------- |
| Auth web client         | Entry, recovery, MFA, profile, password, providers, logout                 |
| `@jayantgoyal/web-auth` | Supabase clients, cookie/session contract, safe returns, shared rules      |
| Studio proxy/routes     | Studio public/protected split, terms, product authorization                |
| Admin proxy/routes      | Admin role, required assurance level, and privileged authorization         |
| Supabase Auth           | Identities, tokens, MFA factors, sessions, and authentication assurance    |
| IAM                     | Canonical profile, product entitlement, workforce, roles, and capabilities |

`/welcome`, recovery-request, and MFA aliases in Studio or Admin redirect to
Auth with an exact validated return target. They contain no local credential or
factor UI. Studio's callback and reset surface exists only so an unexpired link
issued to the old callback can finish safely; it must not originate new flows.
Admin retains only its callback exchange compatibility path.

The normal production session uses the shared cross-subdomain cookie contract.
The existing `platform` runtime value is compatibility vocabulary for that
cookie mode and is not the product suite name. `compatibility` may read and promote
an older host-only session during rollout; `legacy` is emergency rollback only.

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

One Supabase Auth user is shared across products, but authentication does not
grant product or resource access. IAM product membership and capabilities gate
protected product entry; each product then enforces ownership, membership, and
resource state through RLS or a trusted operation. Separate installed clients
may hold separate secure sessions even though they authenticate the same user.
