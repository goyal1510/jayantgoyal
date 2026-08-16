# Auth

Auth is Jayant's account-entry and security product at
[auth.jayantgoyal.com](https://auth.jayantgoyal.com). The current client is
`apps/auth/web`, workspace `@jayant/auth-web`, running locally on port 3003.

## Product boundary

Auth is the sole interactive owner of:

- unified email/password sign-in and registration;
- Google and GitHub OAuth entry;
- email verification and callback completion;
- forgot-password and reset-password recovery;
- TOTP enrollment, challenge, verification, and removal;
- account profile and avatar management;
- password changes with reauthentication;
- connected identity inspection, linking, and unlinking;
- local-session and global-session logout.

Studio and Admin own product authorization, not credentials. Their `/welcome`,
forgot-password, and MFA paths are redirects to Auth. Narrow compatibility
callbacks may exchange already-issued links, but they must not grow into a
second authentication UI.

## Route surface

Auth has public entry/recovery routes, protected account/security routes, and
three callback aliases. The complete route and action sequence is in [flows and
security](flows-and-security.md).

| Area           | Routes                                                                             |
| -------------- | ---------------------------------------------------------------------------------- |
| Entry          | `/`, `/welcome`, `/login`, `/register`                                             |
| Recovery       | `/forgot-password`, `/reset-password`, `/verify`                                   |
| MFA            | `/mfa`, `/account/mfa`                                                             |
| Account        | `/account/security`, `/account/profile`, `/account/password`, `/account/providers` |
| Session        | `/logout`                                                                          |
| Callback/error | `/callback`, `/auth/callback`, `/callback/auth/callback`, `/error`                 |

`/login` and `/register` remain named entry surfaces, while the primary
`/welcome` action first attempts sign-in and then creates a new account when
the credentials do not identify an existing account.

## Internal architecture

- `src/app/actions/entry.ts` owns password and OAuth entry.
- `src/app/actions/recovery.ts` owns recovery and post-reset logout.
- `src/app/actions/mfa.ts` owns TOTP lifecycle.
- `src/app/actions/account.ts` owns password, profile, avatar, and providers.
- `src/app/actions/logout.ts` owns explicit sign-out scope.
- `src/lib/auth/action-support.ts` owns mutation-origin checks and return
  persistence.
- `src/lib/auth/returns.ts` owns exact allowed return origins.
- `src/lib/auth/policy.ts` owns protected routes, assurance, and recent-sign-in
  rules.
- `src/proxy.ts` applies those rules before protected pages render.

All server actions re-establish their own identity and authorization context;
the UI and proxy are not the only safety boundary.

## Shared web contract

`@jayant/web-auth` owns web-specific Supabase browser/request/server clients,
cookie selection and promotion, Auth entry URL builders, safe returns, password
rules, profile/avatar resolution, provider metadata, and logout scope. It does
not own Studio or Admin authorization.

The shared production cookie can be read by trusted Jayant subdomains. Preview
deployments do not receive a broad production-domain cookie. Details are in the
[shared session contract](../../shared-systems/authentication/cookie-and-return-contract.md).

## Data and storage

Auth uses Supabase Auth plus `jg_account.profiles` and the private
`profile-avatars` bucket. Profiles hold names, roles, terms state, and avatar
selection metadata; Supabase Auth remains authoritative for identities,
passwords, sessions, verification, and MFA factors.

Auth uses the anonymous key with RLS and must never receive or import a
service-role credential. Avatar uploads are limited to JPG, PNG, or WebP and
5 MB; profile updates and storage cleanup are coordinated by server actions.

## Security posture

- Mutation origins and return targets are validated before action.
- Account pages require a live user, not only cookie presence.
- Enrolled TOTP requires AAL2 step-up.
- Sensitive account changes require either AAL2 or a recent sign-in window.
- Password change rechecks the current password.
- Recovery mode requires a verified recovery cookie and, when enrolled, MFA.
- Tokens stay in cookies/provider exchanges, not user-visible return URLs or
  logs.
- Auth and account responses are private/no-store and non-indexable.

## Environment and change checklist

`apps/auth/web/.env.example` owns Supabase, session mode, local cookie domain,
site/application origins, and explicit Preview return origins. See the
[environment reference](../../reference/environment-variables.md).

Any auth change must test safe returns, callback errors, cookie modes, Preview
host behavior, MFA/recovery interaction, recent-sign-in behavior, logout scope,
and Studio/Admin entry integration. Update the Auth flow and shared session
documents together when the cross-product contract changes.
