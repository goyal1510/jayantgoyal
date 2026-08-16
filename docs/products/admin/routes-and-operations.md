# Admin routes and operations

This catalog distinguishes active workspaces, compatibility redirects, public
admission paths, and privileged route handlers.

## Active page routes

| Route                   | Role               | Purpose                                         |
| ----------------------- | ------------------ | ----------------------------------------------- |
| `/`                     | admin, super_admin | Admin landing/dashboard                         |
| `/portfolio`            | admin, super_admin | Portfolio CMS overview and section presentation |
| `/portfolio/home`       | admin, super_admin | Hero/home editorial content                     |
| `/portfolio/about`      | admin, super_admin | About and education content                     |
| `/portfolio/skills`     | admin, super_admin | Skill categories and skills                     |
| `/portfolio/experience` | admin, super_admin | Experience and credentials                      |
| `/portfolio/activity`   | admin, super_admin | GitHub/activity presentation content            |
| `/portfolio/work`       | admin, super_admin | Work records, images, and case studies          |
| `/portfolio/writing`    | admin, super_admin | Writing records and publication                 |
| `/portfolio/contact`    | admin, super_admin | Contact presentation and destination            |
| `/users`                | super_admin        | Account profiles and role assignment            |
| `/deployments`          | super_admin        | Vercel deployment list and redeploy entry       |
| `/deployments/[id]`     | super_admin        | Deployment detail and events                    |

`/deployments/env` exists as a page route but is not an active navigation
destination or an environment-secret editor. Do not expose Vercel environment
values through this route.

## Compatibility page routes

| Existing URL              | Canonical destination   |
| ------------------------- | ----------------------- |
| `/portfolio/hero`         | `/portfolio/home`       |
| `/portfolio/projects`     | `/portfolio/work`       |
| `/portfolio/github`       | `/portfolio/activity`   |
| `/portfolio/education`    | `/portfolio/about`      |
| `/portfolio/certificates` | `/portfolio/experience` |
| `/portfolio/blog`         | `/portfolio/writing`    |
| `/blog`                   | `/portfolio/writing`    |
| `/writing`                | `/portfolio/writing`    |
| `/portfolio/section-copy` | `/portfolio`            |
| `/portfolio/navigation`   | `/portfolio`            |

The redirect map is centralized in `src/lib/config/portfolio-route-map.ts` so
page redirects, active navigation, and breadcrumbs share one interpretation.

## Admission and compatibility routes

| Route            | Behavior                                                 |
| ---------------- | -------------------------------------------------------- |
| `/welcome`       | Redirect alias to Auth with a validated return target    |
| `/mfa-verify`    | Redirect alias to Auth MFA                               |
| `/auth/callback` | Compatibility code exchange for already-issued callbacks |
| `/unauthorized`  | Public explanation for an authenticated non-admin user   |

## Portfolio and Writing APIs

| Method and route                          | Minimum role | Scope                                                      |
| ----------------------------------------- | ------------ | ---------------------------------------------------------- |
| `GET /api/portfolio/[table]`              | admin        | Read an allowlisted Portfolio table or record              |
| `POST /api/portfolio/[table]`             | admin        | Validate and create an allowlisted record                  |
| `PUT /api/portfolio/[table]`              | admin        | Validate and update a record by ID                         |
| `DELETE /api/portfolio/[table]`           | admin        | Delete a record by ID                                      |
| `POST /api/portfolio/assets`              | admin        | Validate and upload an allowlisted public asset kind       |
| `PUT /api/portfolio/section-presentation` | admin        | Atomically save section copy and navigation through an RPC |
| `GET /api/jg-app/[table]`                 | admin        | Read the allowlisted Writing table                         |
| `POST /api/jg-app/[table]`                | admin        | Validate and create Writing content                        |
| `PUT /api/jg-app/[table]`                 | admin        | Validate and update Writing content                        |
| `DELETE /api/jg-app/[table]`              | admin        | Delete Writing content                                     |

The dynamic table segments are allowlists, not general database gateways.
Successful mutations revalidate Portfolio content or Writing paths.

## Account APIs

| Method and route             | Minimum role               | Scope                                                           |
| ---------------------------- | -------------------------- | --------------------------------------------------------------- |
| `GET /api/users`             | super_admin                | Combine profiles with Supabase Auth emails and unassigned users |
| `POST /api/users`            | super_admin                | Validate identity and assign an allowed role                    |
| `DELETE /api/account/delete` | authenticated current user | Delete the caller's account through the approved account flow   |

Account APIs recheck the live user and role before creating a service-role
client. Roles are limited to `user`, `admin`, and `super_admin`.

## Deployment APIs

| Method and route                          | Minimum role | Scope                                      |
| ----------------------------------------- | ------------ | ------------------------------------------ |
| `GET /api/vercel/deployments`             | super_admin  | List deployments for configured projects   |
| `POST /api/vercel/deployments`            | super_admin  | Trigger an approved redeployment operation |
| `GET /api/vercel/deployments/[id]`        | super_admin  | Inspect one deployment                     |
| `GET /api/vercel/deployments/[id]/events` | super_admin  | Read deployment build events               |

The configured project allowlist currently contains Studio and Admin. The
Vercel token is never returned to the browser.

## Privileged operation sequence

```text
Request
  → Admin proxy session + MFA + role admission
  → route handler live user lookup
  → route-specific role check
  → allowlist and payload validation
  → service-role or Vercel client creation
  → bounded domain operation
  → safe response and relevant revalidation
```

New privileged routes must preserve every step rather than relying on proxy
headers or a hidden UI control as authorization.
