# Auth

Auth is the shared account-entry and security product at
[auth.jayantgoyal.com](https://auth.jayantgoyal.com). Its web client lives at
`apps/auth/web` and runs locally on port 3003.

## Ownership

Auth owns normal sign-in/register entry, password recovery, verification,
authenticator MFA, profile and avatar management, password changes, connected
providers, and local/global logout.

Primary routes include `/welcome`, `/forgot-password`, `/reset-password`,
`/verify`, `/mfa`, `/account/*`, `/logout`, and `/callback`. Studio and Admin
entry routes remain compatibility surfaces, not equal owners.

`src/proxy.ts` protects account routes, validates sessions, requires MFA
step-up where appropriate, and requires recent sign-in for sensitive changes.
Server actions validate mutation origins and safe return targets.

## Shared contract

`@jayant/web-auth` owns Supabase browser/request/server clients, the shared
cross-subdomain cookie contract, safe return validation, Auth entry URLs,
password/profile/provider contracts, and sign-out scopes. Runtime values named
`platform` are retained as session-rollout compatibility vocabulary; they mean
the shared web session, not a product called “JayantGoyal Platform.”

## Data and environment

Auth uses the Supabase anonymous key and RLS for Supabase Auth,
`jg_account.profiles`, and the private `profile-avatars` bucket. It must not use
a service-role credential.

The environment contract is `apps/auth/web/.env.example`: Supabase URL/key,
session/cookie mode, Auth site URL, other application origins, and exact Preview
return origins. Hosted Preview may omit `NEXT_PUBLIC_SITE_URL` so request
headers identify the generated deployment origin.

Auth responses are private/no-store and account routes are non-indexable. Never
put auth tokens in URLs or logs.
