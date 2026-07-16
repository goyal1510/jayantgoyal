# PLATFORM-00 Baseline Journey Matrix

Evidence was captured against the current READY production deployments on
2026-07-16. Tests used public routes, a dedicated password test persona, and the
user's existing Chrome Google session. Credential values, cookies, tokens,
authorization parameters, MFA codes, and personal identifiers are excluded.

## Public Portfolio and discovery

| Journey            | Reproduction                                        | Result                                     | Known baseline issue                                                                                                     |
| ------------------ | --------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Apex navigation    | Open HTTP apex, HTTPS apex, then `www`              | `301` to HTTPS, `307` to `www`, then `200` | Redirect family must remain until Portfolio cutover                                                                      |
| Portfolio home     | Open `https://www.jayantgoyal.com/` unauthenticated | Public content and navigation render       | Combined Portfolio/product shell is heavier than final target                                                            |
| About              | Open `/about`                                       | `200`, public professional content         | Final Portfolio keeps this path                                                                                          |
| Tool discovery     | Open `/tools` and a representative tool             | `200`, public discovery and tool UI        | Browser showed 87 current tool destinations while copy claims `99+`; inventory uses filesystem routes as source of truth |
| Blog index/article | Open `/blogs`, then a published article             | Both render publicly                       | Index lacks a visible H1; article rendered duplicate H1 elements                                                         |
| Weather            | Open `/weather`                                     | `200`, public weather UI                   | State key `recentCities` is origin-local and needs Studio transfer                                                       |
| External commerce  | Open frontend/backend subdomains                    | Both returned `200`                        | Remain independent external deployments                                                                                  |

## Main authentication and product access

| Journey                           | Reproduction                                            | Result                                                                                         | Preservation/target note                                                                |
| --------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Unauthenticated protected product | Open `/files` in a signed-out browser                   | `200` with inline sign-in gate rather than proxy redirect                                      | Preserve until Studio/Auth replacement is stable                                        |
| Password login                    | Submit the dedicated test persona on `/welcome`         | `303` to `/files?login_success=true`; no-store cache headers                                   | Credential must be rotated before reuse; values not retained                            |
| Google login                      | In user Chrome, choose Continue with Google             | Provider callback succeeded and routed to `/mfa-verify`                                        | Auth must preserve PKCE/provider semantics                                              |
| Google MFA                        | Complete TOTP directly in Chrome                        | Landed on `/`; `/files` opened without a login gate                                            | Final Auth owns MFA and safe return routing                                             |
| Authenticated refresh             | Open `/files`, then reload                              | Before and after reload remained `/files` with no login gate                                   | Shared-cookie migration must retain refresh continuity                                  |
| Provider cancellation             | Start Google, then navigate back before completion      | Returned safely to `/welcome`                                                                  | PLATFORM-01 adds explicit provider-error/cancel assertions                              |
| Signup contract                   | Submit unknown credentials on the unified form          | Not executed in production because the form falls back from sign-in to creating a real account | PLATFORM-01 must use a local/staging disposable persona and cover verification callback |
| Recovery request                  | Submit the dedicated recovery address                   | UI confirmed reset email request                                                               | Email link was not opened; PLATFORM-01/staging covers callback and reset completion     |
| MFA no-factor behavior            | Open `/mfa-verify` with authenticated no-factor persona | Returned to `/files`                                                                           | Baseline skip behavior is intentional for Main, but not sufficient for Admin target     |
| Logout                            | Use visible Main logout                                 | Returned to inline sign-in gate; separately authenticated Admin also required login afterward  | Final UI must expose current-device versus all-device scope explicitly                  |

## Admin authentication and authorization

| Journey                         | Reproduction                                        | Result                                                                                          | Known baseline issue                                                                             |
| ------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Unauthenticated Admin root      | Open `https://admin.jayantgoyal.com/`               | `307` to `/welcome?redirect=%2F`                                                                | Expected                                                                                         |
| Password Super Admin            | Sign in with the dedicated Admin test persona       | Protected Admin opened                                                                          | Persona entered at AAL1 when it had no verified factor; final Admin must require AAL2/enrollment |
| Main-to-Admin SSO               | Complete Main Google/TOTP, then open Admin root     | Admin still routed to `/welcome`                                                                | Confirms current host-only session; target SSO is not baseline behavior                          |
| Admin Google login              | Start Google from Admin welcome                     | Provider callback succeeded and routed to Admin `/mfa-verify`                                   | Duplicated host-specific flow moves to Auth                                                      |
| Admin Google MFA and role check | Complete TOTP directly in Chrome                    | Authentication completed, then role guard sent the tested non-admin identity to `/unauthorized` | Correct denial; no role was changed                                                              |
| Admin non-admin denial          | Use a valid identity without Admin/Super Admin role | `/unauthorized` with Sign Out action                                                            | Must remain enforced through every migration slice                                               |

## API and operational baseline

| Surface                                                                 | Baseline result                                                            |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Public contact, resume, GitHub stats, metadata                          | Classified as zero-cost/public handlers; owner recorded in route inventory |
| Authenticated activity, calculator, files, games, messenger, tool usage | Handler/method/access/service-role ownership recorded for every route      |
| Admin users, Portfolio, Studio-data, deployment, environment APIs       | Admin proxy plus handler-level validation; privileged capability recorded  |
| Supabase schemas                                                        | Remote table lists match all three canonical snapshots                     |
| Migration history                                                       | Known remote-only drift confirmed; no apply or repair                      |

## Reproduction boundaries

- Account creation, verification-link consumption, password mutation, account
  deletion, MFA enrollment/removal, file upload/deletion, Admin writes, Vercel
  writes, database writes, and DNS changes were deliberately not performed in
  PLATFORM-00.
- PLATFORM-01 must provide disposable local/stable-staging personas for the
  mutating auth cases before those cases become automated release gates.
- The current Chrome Google identity proves successful provider authentication,
  TOTP, Main product access, and Admin role denial. It does not prove Admin
  role-success through Google because that identity is not an Admin/Super Admin.
- The dedicated password persona proves baseline Admin role-success, but its
  password must be rotated before further production use.
