# Environment variables

This is the exact secret-free ownership reference for all four current web
clients. The `.env.example` files remain the executable contract.

## Shared Supabase and Auth variables

| Variable                         | Clients                        | Exposure      | Purpose and missing behavior                                                                                      |
| -------------------------------- | ------------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | Portfolio, Studio, Admin, Auth | public        | Supabase project origin. Required for canonical data/auth; product-specific public fallbacks are limited.         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Portfolio, Studio, Admin, Auth | public        | RLS-bound anonymous key. It is not a service-role secret.                                                         |
| `SUPABASE_SERVICE_ROLE_KEY`      | Studio, Admin                  | secret/server | Elevated operations after independent authorization. Never used by Portfolio/Auth or client modules.              |
| `NEXT_PUBLIC_AUTH_SESSION_MODE`  | Studio, Admin, Auth            | public        | `platform`, `compatibility`, or `legacy`; defaults to shared `platform`.                                          |
| `NEXT_PUBLIC_AUTH_COOKIE_DOMAIN` | Studio, Admin, Auth            | public        | Optional validated `.localhost`/`.test` shared development domain; production domain is code-owned.               |
| `NEXT_PUBLIC_AUTH_URL`           | Studio, Admin                  | public        | Canonical/local Auth entry origin; strict resolution falls back to canonical production or recognized local Auth. |

## Application origin variables

| Variable                          | Clients                 | Exposure | Purpose                                                                                       |
| --------------------------------- | ----------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`            | Portfolio, Studio, Auth | public   | Current client's canonical origin. Auth Preview may derive its generated origin when omitted. |
| `NEXT_PUBLIC_PORTFOLIO_URL`       | Studio, Auth            | public   | Portfolio links and allowed Auth return origin.                                               |
| `NEXT_PUBLIC_STUDIO_URL`          | Portfolio, Studio, Auth | public   | Studio links/current origin and allowed Auth return origin.                                   |
| `NEXT_PUBLIC_ADMIN_URL`           | Auth                    | public   | Allowed Admin return origin.                                                                  |
| `NEXT_PUBLIC_AUTH_RETURN_ORIGINS` | Auth                    | public   | Optional comma-separated exact Preview origins; never use wildcard or secret values.          |

Canonical production and development origins are owned by
`@jayantgoyal/identity`. `@jayantgoyal/web-urls` projects that registry into
environment-aware URL helpers, while `@jayantgoyal/web-brand` supplies public
labels and descriptions. Environment overrides exist for local/Preview
routing, not to create a second production identity registry.

## Portfolio variables

| Variable                             | Exposure                      | Requirement/fallback                                                                                                |
| ------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `CONTACT_RATE_LIMIT_SECRET`          | secret/server                 | Required for `/api/contact`; missing/invalid value fails closed with unavailable.                                   |
| `GITHUB_TOKEN`                       | secret/server                 | Required for live GitHub contribution/code data; provider routes return safe unavailable state when absent/failing. |
| `RESEND_API_KEY`                     | secret/server                 | Required to deliver contact enquiries; contact UI may render without it but delivery fails safely.                  |
| `RESEND_FROM_EMAIL`                  | server configuration          | Optional sender identity; code has a Resend onboarding fallback for development.                                    |
| `GOOGLE_RESUME_DOCUMENT_ID`          | secret-adjacent server config | Optional as a complete Google export group; missing group serves checked-in/CMS fallback.                           |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`       | secret-adjacent server config | Google service identity for read-only Drive export.                                                                 |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | secret/server                 | Private signing key; escaped newlines are normalized only in server route code.                                     |

The three Google variables form one functional group. Partial configuration is
treated as unavailable and uses the static/CMS Resume fallback.

## Studio variables

| Variable                          | Exposure            | Requirement/fallback                                                                  |
| --------------------------------- | ------------------- | ------------------------------------------------------------------------------------- |
| `WORDLE_SEED_SECRET`              | secret/server       | Protects deterministic online Wordle seed selection; required for secure online play. |
| `NEXT_PUBLIC_OPENWEATHER_API_KEY` | public/provider key | Used by browser weather requests; missing/invalid value affects Weather only.         |
| `GITHUB_TOKEN`                    | secret/server       | Used by Studio GitHub API proxies; never exposed to the browser.                      |

Studio's service-role key is reserved for server-only, independently authorized
operations. User workspace CRUD should use the session client and RLS.

## Admin variables

| Variable                   | Exposure             | Requirement/fallback                                                                      |
| -------------------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| `VERCEL_TOKEN`             | secret/server        | Required for deployment API operations; never returned to the browser.                    |
| `VERCEL_TEAM_ID`           | server configuration | Optional/required according to project ownership; scopes Vercel API requests to the team. |
| `VERCEL_PROJECT_ID_STUDIO` | server configuration | Allowlisted Studio project for deployment operations.                                     |
| `VERCEL_PROJECT_ID_ADMIN`  | server configuration | Allowlisted Admin project for deployment operations.                                      |

Admin's service-role key supports Portfolio/Writing/IAM operations only after a
live capability check. Vercel variables are not environment-editing access to
arbitrary projects.

## Auth-only variables

Auth uses the shared Supabase/session variables plus `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_PORTFOLIO_URL`, `NEXT_PUBLIC_STUDIO_URL`,
`NEXT_PUBLIC_ADMIN_URL`, and `NEXT_PUBLIC_AUTH_RETURN_ORIGINS`. It intentionally
has no `SUPABASE_SERVICE_ROLE_KEY`.

## LinkedIn operator variables

| Variable                        | Exposure            | Requirement/fallback                                                                   |
| ------------------------------- | ------------------- | -------------------------------------------------------------------------------------- |
| `LINKEDIN_CLIENT_ID`            | local configuration | Required by `scripts/linkedin/auth.mjs`; stored only in the ignored LinkedIn env file. |
| `LINKEDIN_CLIENT_SECRET`        | secret/local        | Required for OAuth token exchange; never committed, printed, or passed as an argument. |
| `LINKEDIN_REDIRECT_URI`         | local configuration | Optional; defaults to `http://localhost:3333/callback`.                                |
| `NEXT_PUBLIC_SUPABASE_URL`      | public              | Reused from Admin local configuration for authenticated ledger requests.               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public              | Reused with a normal user session; RLS enforces Portfolio capabilities.                |

The tooling never accepts a service-role key. LinkedIn and Supabase tokens are
stored in separate ignored owner-only files so either provider can be renewed
without coupling the credentials.

## Rotation and incident rule

If a secret may have been exposed, rotate/revoke it at the provider first,
update only consuming environments, redeploy affected clients, and inspect logs
and Git history without printing the value. Removing a secret from the latest
commit does not remove it from history or provider validity.
