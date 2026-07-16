# PLATFORM-01 Manual Authentication Provider Checklist

This checklist covers provider and mutating authentication journeys that must not
run unattended against production. Use disposable personas in a stable staging
environment linked to the verified `jayantgoyal` Supabase project, or a separately
approved isolated project whose relationship is recorded in the proof ledger.

## Safety Preconditions

- [ ] Record the deployment identifiers, commit, domains, Supabase project name
      and reference, and provider callback allowlist without recording secrets.
- [ ] Confirm both staging applications use production-like HTTPS hosts and an
      explicit `NEXT_PUBLIC_SITE_URL` appropriate to each host.
- [ ] Use disposable personas created for this matrix. Do not reuse the password
      persona whose rotation is required by `RISK-006`.
- [ ] Grant an Admin/Super Admin role only to the approved disposable Admin
      persona; never elevate a personal or production account for testing.
- [ ] Keep credentials, TOTP seeds, OAuth codes/state, cookies, tokens, account
      identifiers, CAPTCHA responses, and personal data out of notes and logs.
- [ ] Disable Playwright screenshots, video, traces, storage-state output, and
      verbose network logging for credential-bearing runs.
- [ ] If a provider or CAPTCHA asks for human confirmation, the user completes it
      directly in Chrome. Automation must not inspect the browser profile,
      password manager, cookie store, or extension data.
- [ ] Confirm a rollback path that disables the staging entry point or provider
      redirect without altering production identities.

## Current Baseline Evidence

- [x] Main Google OAuth completed in the user's Chrome, including TOTP challenge,
      authenticated `/files` access, and refresh continuity.
- [x] Admin Google OAuth completed in the user's Chrome, including TOTP challenge,
      then correctly denied access at `/unauthorized` because the identity has no
      Admin/Super Admin role.
- [x] Main and Admin sessions remained host-local; cross-host SSO is not current
      behavior.
- [x] Provider cancellation returned safely to the current login experience.
- [ ] GitHub is not present in the current UI. Treat it as target coverage for the
      Auth stable-staging phase, not a preserved baseline flow.

## Stable-Staging Provider Matrix

Run each row in Chrome with the safe proof rules above. Record pass/fail, UTC
timestamp, deployment identifier, final route, and a redacted observation only.

| Journey                              | Persona                                                | Expected result                                                                                                |
| ------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Google login from Main product route | Disposable normal user with verified TOTP              | Provider returns through the approved callback, MFA completes, and the original safe product route opens.      |
| Google cancellation or denial        | Disposable normal user                                 | The browser returns to a recoverable login state without a session or redirect loop.                           |
| Google login to Admin, non-admin     | Disposable normal user                                 | Authentication succeeds, but application authorization denies Admin access.                                    |
| Google login to Admin, authorized    | Disposable Admin/Super Admin with verified TOTP        | AAL1 steps up to AAL2 before the Admin home opens.                                                             |
| GitHub login from Main product route | Disposable normal user with verified TOTP              | After the Auth phase enables GitHub, callback, MFA, and safe return match Google behavior.                     |
| GitHub cancellation or denial        | Disposable normal user                                 | The browser returns to a recoverable login state without a session or redirect loop.                           |
| GitHub login to Admin, non-admin     | Disposable normal user                                 | Authentication succeeds, but application authorization denies Admin access.                                    |
| GitHub login to Admin, authorized    | Disposable Admin/Super Admin with verified TOTP        | AAL1 steps up to AAL2 before the Admin home opens.                                                             |
| Registration and email verification  | New disposable mailbox                                 | Verification completes once, replay/expired-link handling is safe, and the intended safe route opens.          |
| Forgot and reset password            | Existing disposable normal user                        | The approved link changes only that persona's password; expired/replayed links remain recoverable.             |
| MFA enrollment                       | Disposable normal user without a factor                | Enrollment verifies a new factor, recovery information is handled privately, and the next login challenges.    |
| MFA challenge retry                  | Disposable user with verified TOTP                     | Invalid/expired codes fail safely; a fresh code completes exactly once.                                        |
| Current-session logout               | Disposable normal user                                 | The active browser session ends while separately approved sessions remain valid.                               |
| Global logout                        | Disposable normal user signed in on both staging hosts | All sessions for the identity are invalidated and both hosts require authentication after refresh.             |
| Stale provider/callback state        | Disposable normal user                                 | Old tabs, invalid state, and interrupted callbacks restart safely without accepting an external return target. |

## Completion Gate

- [ ] All current-provider rows pass against a production-like deployment.
- [ ] GitHub rows pass after the Auth phase enables and configures the provider.
- [ ] Registration, recovery, MFA enrollment/challenge, both logout scopes, stale
      state, and Admin authorization have redacted proof.
- [ ] Any failed row has an owner, rollback decision, and residual-risk entry.
- [ ] No secret, authentication value, screenshot, trace, storage-state file, or
      personal data was retained.
