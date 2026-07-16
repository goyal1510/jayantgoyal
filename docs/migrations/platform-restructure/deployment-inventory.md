# PLATFORM-00 Deployment and Domain Inventory

Read-only inventory captured on 2026-07-16 (Asia/Kolkata). Project, deployment,
domain, and environment metadata were read through the authenticated Vercel API;
no project, domain, alias, deployment, or environment setting was changed.

## Current repository applications

| Current application                | Vercel project            | Project ID                         | Root directory     | Latest READY production deployment | Deployed commit                            | Production domains                       |
| ---------------------------------- | ------------------------- | ---------------------------------- | ------------------ | ---------------------------------- | ------------------------------------------ | ---------------------------------------- |
| Combined Portfolio and product app | `jayantgoyal-jayantgoyal` | `prj_i9cXy9kUNTtLcewSSmO90d9hmYdl` | `apps/jayantgoyal` | `dpl_A4mr2hGnHHvgDyoar4fzwdSSNDfG` | `5f1be9881364fc907772edebd1e08c7e840c9759` | `jayantgoyal.com`, `www.jayantgoyal.com` |
| Admin                              | `jayantgoyal-admin`       | `prj_gUYbdmqS7F0dYFhsps2Ua0P1LZS6` | `apps/admin`       | `dpl_E5ZJve3MKCtwrkQ6czBzfC8iAfkV` | `12b27a3fea1a08cb703987886d7e3454d41b2518` | `admin.jayantgoyal.com`                  |

Both custom-domain assignments are verified. The apex domain is configured to
redirect to `www.jayantgoyal.com`. The active READY deployments predate the
PLATFORM-00 baseline commit. After the Main deployment commit, no file under its
`apps/jayantgoyal` runtime root changed. After the Admin deployment commit, no file
under `apps/admin` changed; later repository changes include Main SEO/tool metadata,
documentation, repository metadata, and schema snapshots that do not alter the
Admin project root. More recent production deployment attempts at the baseline
commit were canceled, so the READY deployment IDs above remain the black-box
runtime baseline.

## Current independent external product deployments

| Domain                       | Current role                 | Repository restructure treatment                                                     | Baseline HTTP result |
| ---------------------------- | ---------------------------- | ------------------------------------------------------------------------------------ | -------------------- |
| `ecommerce.jayantgoyal.com`  | Existing e-commerce frontend | Retain as an external Studio catalog destination; not a fifth app in this repository | `200`                |
| `becommerce.jayantgoyal.com` | Existing e-commerce backend  | Retain as external product infrastructure                                            | `200`                |

## Baseline redirect and availability chain

| Request                                                             | Baseline result                                       |
| ------------------------------------------------------------------- | ----------------------------------------------------- |
| `http://jayantgoyal.com/`                                           | `301` to HTTPS apex                                   |
| `https://jayantgoyal.com/`                                          | `307` to `https://www.jayantgoyal.com/`               |
| `https://www.jayantgoyal.com/`                                      | `200`                                                 |
| Main `/about`, `/tools`, `/blogs`, `/weather`, `/files`, `/welcome` | `200`                                                 |
| `https://admin.jayantgoyal.com/`                                    | `307` to `/welcome?redirect=%2F` when unauthenticated |
| `https://admin.jayantgoyal.com/welcome`                             | `200`                                                 |

## Target deployment boundaries

| Target application | Approved production host                 | Current project/domain state at PLATFORM-00      | Creation/cutover phase |
| ------------------ | ---------------------------------------- | ------------------------------------------------ | ---------------------- |
| Portfolio          | `www.jayantgoyal.com` with apex redirect | Existing combined main project owns both domains | PLATFORM-08/09         |
| Studio             | `studio.jayantgoyal.com`                 | No Vercel project or domain assignment yet       | PLATFORM-05/06         |
| Admin              | `admin.jayantgoyal.com`                  | Existing Admin project and domain                | PLATFORM-07            |
| Auth               | `auth.jayantgoyal.com`                   | No Vercel project or domain assignment yet       | PLATFORM-04/09         |

Stable-staging domains and projects do not yet exist. They must be created only in
the phase that first requires them and must not receive production DNS until the
corresponding release gate and rollback plan pass.

## Rollback baseline

- Main rollback target: the current READY deployment
  `dpl_A4mr2hGnHHvgDyoar4fzwdSSNDfG` plus the current apex-to-`www` domain mapping.
- Admin rollback target: the current READY deployment
  `dpl_E5ZJve3MKCtwrkQ6czBzfC8iAfkV` plus the existing Admin domain mapping.
- No PLATFORM-00 action requires rollback because this phase makes no deployment,
  alias, domain, or runtime change.
