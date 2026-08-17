# Admin routes and operations

This catalog distinguishes active workspaces, compatibility redirects, public
admission paths, and privileged route handlers.

## Active page routes

| Route                   | Minimum capability       | Purpose                                         |
| ----------------------- | ------------------------ | ----------------------------------------------- |
| `/`                     | `admin.console.enter`    | Admin landing/dashboard                         |
| `/portfolio`            | `portfolio.content.read` | Portfolio CMS overview and section presentation |
| `/portfolio/home`       | `portfolio.content.read` | Hero/home editorial content                     |
| `/portfolio/about`      | `portfolio.content.read` | About and education content                     |
| `/portfolio/skills`     | `portfolio.content.read` | Skill categories and skills                     |
| `/portfolio/experience` | `portfolio.content.read` | Experience and credentials                      |
| `/portfolio/activity`   | `portfolio.content.read` | GitHub/activity presentation content            |
| `/portfolio/work`       | `portfolio.content.read` | Work records, images, and case studies          |
| `/portfolio/writing`    | `portfolio.content.read` | Writing records and publication                 |
| `/portfolio/contact`    | `portfolio.content.read` | Contact presentation and destination            |
| `/users`                | `admin.users.read`       | Identities and Admin access assignments         |
| `/deployments`          | `admin.deployments.read` | Vercel deployment list and redeploy entry       |
| `/deployments/[id]`     | `admin.deployments.read` | Deployment detail and events                    |

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

| Method and route                          | Minimum capability         | Scope                                                      |
| ----------------------------------------- | -------------------------- | ---------------------------------------------------------- |
| `GET /api/portfolio/[table]`              | `portfolio.content.read`   | Read an allowlisted Portfolio table or record              |
| `POST /api/portfolio/[table]`             | `portfolio.content.create` | Validate and create an allowlisted record                  |
| `PUT /api/portfolio/[table]`              | `portfolio.content.update` | Validate and update a record by ID                         |
| `DELETE /api/portfolio/[table]`           | `portfolio.content.delete` | Delete a record by ID                                      |
| `POST /api/portfolio/assets`              | `portfolio.content.create` | Validate and upload an allowlisted public asset kind       |
| `PUT /api/portfolio/section-presentation` | `portfolio.content.update` | Atomically save section copy and navigation through an RPC |
| `GET /api/writing/[table]`                | `portfolio.content.read`   | Read the allowlisted Writing table                         |
| `POST /api/writing/[table]`               | `portfolio.content.create` | Validate and create Writing content                        |
| `PUT /api/writing/[table]`                | `portfolio.content.update` | Validate and update Writing content                        |
| `DELETE /api/writing/[table]`             | `portfolio.content.delete` | Delete Writing content                                     |

The dynamic table segments are allowlists, not general database gateways.
Successful mutations revalidate Portfolio content or Writing paths.

## Account APIs

| Method and route             | Minimum capability         | Scope                                                                |
| ---------------------------- | -------------------------- | -------------------------------------------------------------------- |
| `GET /api/users`             | `admin.users.read`         | Combine profiles, Auth emails, memberships, and role assignments     |
| `POST /api/users`            | `admin.users.create`       | Activate Admin membership and assign an allowed role transactionally |
| `PATCH /api/users`           | `admin.users.update`       | Replace an existing Admin role transactionally                       |
| `DELETE /api/users`          | `admin.users.delete`       | Revoke Admin membership and role assignments transactionally         |
| `DELETE /api/account/delete` | authenticated current user | Delete the caller's account through the approved account flow        |

Account APIs recheck the live capability before creating a service-role client.
Assignable roles are limited to `admin.viewer` and `admin.full_access`.

## Deployment APIs

| Method and route                          | Minimum capability         | Scope                                      |
| ----------------------------------------- | -------------------------- | ------------------------------------------ |
| `GET /api/vercel/deployments`             | `admin.deployments.read`   | List deployments for configured projects   |
| `POST /api/vercel/deployments`            | `admin.deployments.update` | Trigger an approved redeployment operation |
| `GET /api/vercel/deployments/[id]`        | `admin.deployments.read`   | Inspect one deployment                     |
| `GET /api/vercel/deployments/[id]/events` | `admin.deployments.read`   | Read deployment build events               |

The configured project allowlist currently contains Studio and Admin. The
Vercel token is never returned to the browser.

## Privileged operation sequence

```text
Request
  → Admin proxy session + MFA + `admin.console.enter`
  → route handler live user lookup
  → route-specific capability check
  → allowlist and payload validation
  → service-role or Vercel client creation
  → bounded domain operation
  → safe response and relevant revalidation
```

New privileged routes must preserve every step rather than relying on proxy
headers or a hidden UI control as authorization.
