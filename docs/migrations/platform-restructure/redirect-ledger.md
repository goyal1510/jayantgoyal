# Platform Redirect Ledger

Status: In progress  
Cutover policy: keep redirects temporary until the compatibility window and traffic observation gates pass.

## Portfolio-owned routes

| Route                                                                                   | Owner     | Cutover behavior                              |
| --------------------------------------------------------------------------------------- | --------- | --------------------------------------------- |
| `/`                                                                                     | Portfolio | Serve the public Portfolio                    |
| `/blog`                                                                                 | Portfolio | Serve the public blog index                   |
| `/blog/:slug`                                                                           | Portfolio | Serve published public articles               |
| `/resume`                                                                               | Portfolio | Serve the resume landing page                 |
| `/api/contact`                                                                          | Portfolio | Keep the server-only contact delivery action  |
| `/api/github-stats`                                                                     | Portfolio | Keep the allowlisted GitHub proxy             |
| `/api/github-loc`                                                                       | Portfolio | Keep public code statistics                   |
| `/api/resume`                                                                           | Portfolio | Keep Google Drive export with static fallback |
| `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/opengraph-image`, `/llms.txt` | Portfolio | Serve Portfolio discovery metadata            |

## Portfolio compatibility redirects

These are permanent content-location redirects because the final content owner is already known.

| Historical route | Destination      |
| ---------------- | ---------------- |
| `/home`          | `/#home`         |
| `/about`         | `/#about`        |
| `/skills`        | `/#skills`       |
| `/experience`    | `/#experience`   |
| `/projects`      | `/#projects`     |
| `/certificates`  | `/#certificates` |
| `/contact`       | `/#contact`      |
| `/blogs`         | `/blog`          |

## Studio page redirects

The following families use temporary `307` redirects to the same path on `https://studio.jayantgoyal.com`. The status preserves methods and query strings while the compatibility window remains open.

- `/activity-tracker/:path*`
- `/calculator/:path*`
- `/custom-calculator/:path*`
- `/files/:path*`
- `/games/:path*`
- `/github-stats/:path*`
- `/loader-preview/:path*`
- `/messenger/:path*`
- `/tools/:path*`
- `/weather/:path*`
- `/.well-known/:path*`

## Studio account and Auth compatibility

Shared Auth/SSO remains intentionally last. Until that cutover, the existing Studio application owns these routes and receives temporary `307` redirects:

- `/welcome/:path*`
- `/login` and `/signup` → `/welcome`
- `/forgot-password/:path*`
- `/reset-password/:path*`
- `/mfa-verify/:path*`
- `/terms-conditions/:path*`
- `/auth/:path*`

`/auth/callback` query parameters are preserved by the `307`. Fresh flows initiated on Studio return directly to Studio. A PKCE flow initiated on the apex immediately before cutover may still depend on an apex-host cookie, so the apex must not move until the callback smoke test and rollback operator are both ready.

## Auth dark-launch ownership

`apps/auth` now owns these routes in source without receiving default traffic:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify`
- `/callback`
- `/mfa`
- `/account/security`
- `/account/providers`
- `/logout`
- `/error`

No Portfolio, Studio, or Admin redirect points to Auth during this local slice.
The existing Studio compatibility routes above remain authoritative until the
PLATFORM-06 cutover flag is approved. Auth accepts only relative destinations,
canonical platform origins, local ports, and explicitly configured exact
Preview origins; it does not accept wildcard return hosts.

## Studio API redirects

These families use temporary `307` redirects to the same Studio path:

- `/api/account/:path*`
- `/api/activity-tracker/:path*`
- `/api/calculator/:path*`
- `/api/files/:path*`
- `/api/games/:path*`
- `/api/messenger/:path*`
- `/api/tools/:path*`
- `/api/typing-test/:path*`

## Cutover verification matrix

- Portfolio root, blog, article, resume, contact, GitHub, sitemap, robots, Open Graph, and not-found behavior.
- Every page/API prefix above returns the expected Portfolio response or a single-hop Studio redirect without a loop.
- Query strings survive account and callback redirects.
- Studio email/password login, recovery request, recovery callback, and protected-route return destination.
- Apex and `www` canonical metadata, robots, sitemap, and TLS.
- No Admin, commerce, email, or unrelated DNS/domain assignment changes.

## Rollback

1. Reassign `jayantgoyal.com` and `www.jayantgoyal.com` to the last verified Main production deployment.
2. Restore Main as the current production domain owner in Vercel.
3. Keep `studio.jayantgoyal.com` assigned to its tested immutable deployment and use Portfolio's generated immutable Vercel URL for diagnosis; do not recreate a compatibility custom domain.
4. Leave Portfolio Production `NEXT_PUBLIC_SITE_URL` canonical at `https://jayantgoyal.com` so the next approved production build is ready for reassignment.
5. Verify root Portfolio, Studio login, recovery, and `/auth/callback` before ending rollback.
