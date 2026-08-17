# Shared web session and return contract

This contract explains how one Supabase identity session is safely consumed by
Auth, Studio, and Admin web clients. It is web-specific; a future native client
would use its platform's secure session storage and callback mechanisms.

## Owners

| Concern                                      | Owner                                           |
| -------------------------------------------- | ----------------------------------------------- |
| Credential, OAuth, recovery, MFA, account UI | Auth web client                                 |
| Supabase SSR client and cookie mechanics     | `@jayantgoyal/web-auth`                         |
| Allowed cross-product returns                | Auth web client plus shared safe-return helpers |
| Studio public/protected/terms policy         | Studio web client                               |
| Admin role and privileged policy             | Admin web client                                |
| Identity, token, and factor issuance         | Supabase Auth                                   |

## Session modes

`NEXT_PUBLIC_AUTH_SESSION_MODE` accepts:

| Mode            | Read/write behavior                                     | Use                              |
| --------------- | ------------------------------------------------------- | -------------------------------- |
| `platform`      | Shared Jayant web cookie only                           | Normal/default production mode   |
| `compatibility` | Prefer shared cookie; promote an existing legacy cookie | Temporary rollout bridge         |
| `legacy`        | Supabase host-specific cookie only                      | Emergency rollback compatibility |

The word `platform` is retained in this runtime enum for cookie rollout
compatibility. It is not the product suite or product name.

## Cookie behavior

Production trusted hosts use `__Secure-jg-session-v1`, secure, same-site lax,
path `/`, and domain `jayantgoyal.com`. Trusted hosts are the Portfolio root and
www host plus Studio, Admin, and Auth subdomains.

Plain localhost uses `jg-session-v1` as a non-secure host-only cookie. A
validated `.localhost` or `.test` development domain may use an explicitly
configured local domain. Generated Preview hosts do not receive the broad
production-domain attribute.

Supabase may split a large session value into numbered cookie chunks. Cookie
family detection recognizes only the base name or numeric suffixes.

## Request-client behavior

1. Resolve the configured session mode and request hostname.
2. Select legacy, shared, or promotion source.
3. Create the Supabase SSR request client with readable request cookies and
   writable response cookies.
4. In compatibility mode, promote a valid legacy session into the shared
   cookie contract.
5. Copy session cookies and private/no-store cache headers to redirects or
   downstream responses.
6. Call `getUser()` before trusting identity for protected behavior.

## Entry URL behavior

Studio and Admin use `buildAuthLoginUrl`, `buildAuthForgotPasswordUrl`, and
`buildAuthMfaUrl`. These helpers reconstruct the externally visible request
origin from trusted proxy headers, resolve the canonical Auth origin, validate
the relative product path, and send Auth a full product return URL.

Canonical production Auth is `https://auth.jayantgoyal.com`. Local loopback
uses port 3003. A custom local shared-cookie domain is accepted only when it
matches strict `.localhost` or `.test` validation.

## Return validation

Auth accepts:

- relative paths on its current origin;
- canonical Portfolio, Studio, Admin, and Auth origins;
- the four loopback ports on `localhost` and `127.0.0.1`;
- explicit comma-separated Preview origins from
  `NEXT_PUBLIC_AUTH_RETURN_ORIGINS`.

Only `http:` and `https:` URLs without embedded credentials are accepted.
Exact origins are required; suffix matching is not used. An invalid target
falls back to an Auth-owned safe path.

## Product authorization after entry

A shared session proves the same user reached another host; it does not prove
the user may perform that product action. Studio still checks current product
membership, recovery mode, MFA, versioned terms, capability, and user
ownership. Admin still checks MFA, Admin membership, and the route-specific
`product.resource.action` capability. Every elevated API obtains a live user
and rechecks its required capability.

## Cache and logging rules

Responses that refresh, promote, challenge, recover, or expose account state
must preserve private/no-store cache headers. Do not log session cookie values,
access/refresh tokens, OAuth codes, TOTP codes, recovery state, or full
provider callback URLs.

## Changing the contract

A cookie-name, domain, mode, return-origin, or callback change affects Auth,
Studio, Admin, Preview deployments, and local development. Update unit tests in
`packages/web/auth`, product proxy/action tests, all relevant environment
contracts, this page, and the deployment guide. Rollout and rollback must be
possible without accepting arbitrary return origins or weakening product
authorization.
