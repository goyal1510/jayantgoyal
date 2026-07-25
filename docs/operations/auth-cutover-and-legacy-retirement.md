# Auth cutover and legacy retirement

Status: release-gated
Owner: Jayant
Applies to: Studio, Admin, Auth, shared `@repo/auth`, hosted Supabase Auth

## Current source state

The standalone Auth application owns sign-in, registration, recovery,
verification, MFA, provider management, account security, and logout. Shared
session and entry contracts live in `@repo/auth`.

Source defaults now select:

- `NEXT_PUBLIC_AUTH_SESSION_MODE=platform`
- `NEXT_PUBLIC_AUTH_FLOW_OWNER=auth`
- `NEXT_PUBLIC_AUTH_URL=https://auth.jayantgoyal.com` in production

`legacy` remains an explicit rollback value. It is not the source default and
does not restore the removed Studio/Admin account-settings UI. In rollback
mode, Studio/Admin can retain their local login entry while the deployed Auth
application remains the owner of account security.

The source is ready for cutover, but production is not considered cut over
until the environment, provider, and black-box gates below are recorded.

## Ownership after cutover

| Flow                            | Canonical owner              | Compatibility retained during observation           |
| ------------------------------- | ---------------------------- | --------------------------------------------------- |
| Sign in and registration        | Auth                         | Studio/Admin welcome entry may be re-enabled        |
| Google and GitHub callback      | Auth                         | Existing callback allowlist entries                 |
| Email verification and recovery | Auth                         | Previously issued legacy links                      |
| MFA enrollment and challenge    | Auth                         | No duplicate local UI                               |
| Account security and providers  | Auth                         | No duplicate local UI                               |
| Current/global logout           | Auth                         | Product applications keep safe return handling      |
| Session recognition             | `@repo/auth` platform cookie | Compatibility reader only when rollback requires it |
| Authorization                   | Each product application     | No change; Admin retains role and AAL policy        |

## Production cutover gate

Do not enable or declare the cutover complete until all of these are true:

1. `auth.jayantgoyal.com` resolves to the intended ready Auth deployment with a
   valid certificate.
2. Production variables for Studio, Admin, and Auth have been read back and
   match the approved matrix:

   | Application | Session mode | Flow owner | Auth URL                       |
   | ----------- | ------------ | ---------- | ------------------------------ |
   | Studio      | `platform`   | `auth`     | `https://auth.jayantgoyal.com` |
   | Admin       | `platform`   | `auth`     | `https://auth.jayantgoyal.com` |
   | Auth        | `platform`   | n/a        | self                           |

3. Hosted Supabase Auth uses the intended Site URL and includes only the
   required production, localhost, and current preview callback origins.
4. A controlled test account passes:
   password sign-in, Google sign-in, GitHub sign-in, registration, verification,
   forgot/reset password, MFA enrollment/challenge, Admin AAL2 step-up,
   current-session logout, and global logout.
5. One sign-in is recognized by Studio, Admin, and Auth without a credential
   prompt. Admin must still deny a non-admin account.
6. Every `return_to` test returns to the exact safe product destination;
   protocol-relative, lookalike, credential-bearing, and unapproved preview
   origins remain blocked.
7. The previous deployment identifiers and the environment-variable rollback
   commands are captured before the switch.
8. Auth, callback, recovery, and session errors are observed for at least 48
   hours with no unresolved severity-one failure or sustained regression.

The 48-hour window is an operational observation period, not a delay before
starting. Deployment, acceptance, and monitoring begin on the same day.

## Rollout sequence

1. Deploy Auth and verify its generated deployment before changing product
   entry traffic.
2. Verify hosted provider and redirect configuration read-only.
3. Set Studio and Admin session mode to `platform`; deploy and verify existing
   signed-in sessions and cross-application recognition.
4. Set Studio and Admin flow owner to `auth`; deploy one application at a time,
   starting with Studio.
5. Run the complete controlled-account matrix.
6. Begin the 48-hour observation window and record failures, affected flow,
   deployment, and rollback decision.
7. Close the cutover gate only when every check has evidence.

## Immediate rollback

Rollback changes traffic ownership; it does not delete identities, sessions,
or the Auth deployment.

1. Set `NEXT_PUBLIC_AUTH_FLOW_OWNER=legacy` for the affected product and
   redeploy.
2. If the platform cookie itself is implicated, change session mode first to
   `compatibility`; use `legacy` only when compatibility cannot restore access.
3. Keep Auth online for existing recovery links and diagnosis.
4. Do not remove the platform cookie or hosted callback entries during an
   incident.
5. Confirm Studio login, Admin login, safe return destinations, and Admin role
   enforcement after rollback.

## Legacy retirement

Retirement happens in bounded stages so old links and existing sessions are
not broken.

### Stage 1 — Observation

- Keep legacy entry and callback compatibility.
- Do not add features to legacy routes.
- Measure requests by route and outcome without logging tokens or
  authorization codes.
- Fix canonical Auth; do not fork behavior back into product applications.

### Stage 2 — Stop legacy entry traffic

After the production gate and 48-hour observation pass:

- Keep Auth as the only linked sign-in/account surface.
- Change legacy product entry routes to safe compatibility redirects.
- Retain old verification, recovery, and callback handling for the longer of
  seven days or the configured token lifetime plus 24 hours.

### Stage 3 — Remove compatibility code

Remove a legacy path only when:

- its compatibility window has elapsed;
- seven consecutive days show no successful user flow that depends on it;
- recovery, verification, OAuth, MFA, and both logout scopes pass through Auth;
- a rollback deployment remains available;
- tests and the route ledger are updated in the same change.

Remove in this order:

1. Legacy sign-in/register presentation.
2. Legacy recovery and verification presentation.
3. Legacy callback adapters after issued-link expiry.
4. Legacy cookie promotion/reader code after all deployed applications use
   `platform`.
5. Legacy environment variables and allowlist origins after the final traffic
   check.

## Evidence record

For the release task, record:

- Auth, Studio, and Admin deployment IDs;
- exact non-secret flag values;
- hosted Site URL and allowed-origin diff;
- controlled test account ID after the account is deleted;
- pass/fail for every flow in the cutover gate;
- observation start/end and error counts;
- rollback rehearsal result;
- legacy endpoints still receiving traffic;
- the scheduled date for the next retirement stage.
