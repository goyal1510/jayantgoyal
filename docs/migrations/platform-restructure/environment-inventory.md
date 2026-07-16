# Platform Restructure Environment Inventory

This inventory records names, Vercel target coverage, and capability ownership
only. It intentionally contains no values.

## Current runtime reads

### Combined main application (`apps/jayantgoyal`)

| Variable name                        | Capability                                | Approved target owner                                                                                                                        |
| ------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | Supabase project URL                      | Portfolio only if direct data access remains; Studio and Auth; Admin separately                                                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Supabase public key                       | Same consumers as public URL                                                                                                                 |
| `SUPABASE_SERVICE_ROLE_KEY`          | Privileged account/game/server operations | Split to Studio only for proven product operations and Auth only for approved account operations; never Portfolio browser/runtime by default |
| `NEXT_PUBLIC_SITE_URL`               | Canonical app URL                         | Each application owns its environment-specific value                                                                                         |
| `PORTFOLIO_DATA_SOURCE`              | Portfolio database/fallback selector      | Portfolio                                                                                                                                    |
| `RESEND_API_KEY`                     | Contact email delivery                    | Portfolio                                                                                                                                    |
| `RESEND_FROM_EMAIL`                  | Contact email sender                      | Portfolio                                                                                                                                    |
| `NEXT_PUBLIC_OPENWEATHER_API_KEY`    | Weather API                               | Studio                                                                                                                                       |
| `GITHUB_TOKEN`                       | GitHub statistics                         | Studio for product statistics; Portfolio only if the professional view retains a separately reviewed use                                     |
| `GOOGLE_RESUME_DOCUMENT_ID`          | Resume document identifier                | Portfolio                                                                                                                                    |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`       | Resume retrieval service identity         | Portfolio server only                                                                                                                        |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Resume retrieval service credential       | Portfolio server only                                                                                                                        |

### Admin (`apps/admin`)

| Variable name                   | Capability                              | Approved target owner                                         |
| ------------------------------- | --------------------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                    | Admin                                                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key                     | Admin                                                         |
| `SUPABASE_SERVICE_ROLE_KEY`     | User and managed-content administration | Admin server only                                             |
| `VERCEL_TOKEN`                  | Deployment/environment management       | Admin server only                                             |
| `VERCEL_TEAM_ID`                | Vercel scope                            | Admin server only                                             |
| `VERCEL_PROJECT_ID_JG`          | Current main project target             | Admin until deployment UI is updated to four explicit targets |
| `VERCEL_PROJECT_ID_ADMIN`       | Admin project target                    | Admin                                                         |

`NEXT_PUBLIC_SITE_URL` exists in Admin's local/Vercel configuration even though
the baseline Admin source does not currently read it. It remains a required target
capability because every extracted application needs an environment-specific
canonical URL.

## Vercel target coverage

| Project | Variable                                            | Development | Preview | Production | Finding                                                                    |
| ------- | --------------------------------------------------- | :---------: | :-----: | :--------: | -------------------------------------------------------------------------- |
| Main    | All runtime variables except `NEXT_PUBLIC_SITE_URL` |     Yes     |   Yes   |    Yes     | Coverage present                                                           |
| Main    | `NEXT_PUBLIC_SITE_URL`                              |     Yes     | **No**  |    Yes     | Preview gap; preview callbacks/canonical URLs cannot rely on this variable |
| Admin   | Supabase and Vercel management variables            |     Yes     |   Yes   |    Yes     | Coverage present                                                           |
| Admin   | `NEXT_PUBLIC_SITE_URL`                              |     Yes     | **No**  |    Yes     | Preview gap                                                                |

The main Vercel project also contains the following names that are not referenced
by the baseline `apps/jayantgoyal` source:

- `COMMERCE_EMAIL_DELIVERY_MODE`
- `COMMERCE_PAYMENT_PROVIDER`
- `COMMERCE_SUPPORT_EMAIL`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

They exist in development, preview, and production. Their values were not read.
PLATFORM-12 must remove them from the main project only after ownership by the
existing independent commerce deployments is confirmed; PLATFORM-00 does not
delete or copy them.

## Target least-privilege capability matrix

| Variable capability              |           Portfolio            |            Studio             |              Admin               |                        Auth                         | Notes                                                                        |
| -------------------------------- | :----------------------------: | :---------------------------: | :------------------------------: | :-------------------------------------------------: | ---------------------------------------------------------------------------- |
| Supabase public URL/key          |          Conditional           |              Yes              |               Yes                |                         Yes                         | Same project; Portfolio should prefer a server-rendered public data boundary |
| Supabase service role            |           Prefer no            | Proven server operations only |               Yes                |          Approved account operations only           | Never browser-exposed                                                        |
| Site URL                         |              Yes               |              Yes              |               Yes                |                         Yes                         | Environment-specific in development, stable staging, preview, and production |
| Auth application URL             |           Link only            |              Yes              |               Yes                |                        Self                         | Exact variable name introduced with its first consumer in PLATFORM-04        |
| Cookie domain/name configuration |        No write access         |           Awareness           |            Awareness             |                         Yes                         | Environment-specific shared-cookie contract                                  |
| Resend/contact email             |              Yes               |              No               | Operational only if later proven | Identity email stays in Supabase/Auth configuration | Avoid duplication                                                            |
| Resume Google service account    |              Yes               |              No               |                No                |                         No                          | Server-only Portfolio capability                                             |
| Weather API                      |               No               |              Yes              |                No                |                         No                          | Studio-owned                                                                 |
| GitHub API                       | Conditional public-profile use | Yes for current stats feature |                No                |                         No                          | Split only if both apps retain real consumers                                |
| Dedicated Wordle HMAC secret     |               No               |              Yes              |                No                |                         No                          | Must replace service-role fallback; exact name added with consumer           |
| Vercel management                |               No               |              No               |               Yes                |                         No                          | Server-only Admin capability                                                 |

## Environment rules frozen at PLATFORM-00

- New variables are added with their first real consumer, never in anticipation.
- Every variable is added to development, preview, and production at the same
  time unless the binding guide explicitly requires a narrower staging-only gate.
- `NEXT_PUBLIC_SITE_URL` is the allowed environment-specific exception; its value
  must match the actual application/environment host.
- Secrets are copied to a new project only after its least-privilege owner and
  consumer are proven.
- Preview URL/callback validation remains blocked until both current preview
  `NEXT_PUBLIC_SITE_URL` gaps are resolved in the phase that first deploys the
  corresponding application.
- Environment names and ownership are now known; values remain deliberately
  outside repository artifacts and proof notes.
