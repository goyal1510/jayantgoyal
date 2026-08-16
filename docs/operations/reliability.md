# Reliability and observability

Reliability currently comes from explicit error handling, Supabase policy,
provider isolation, regression tests, CI, and independent Vercel deployments.
There is no centralized observability platform or formal SLO system in the
repository today.

## Current expectations

- Surface database and provider failures; do not silently replace canonical
  data with stale duplicated content.
- Keep public APIs bounded by validation, rate limits or a documented zero-cost
  classification, and safe error responses.
- Use cache and revalidation intentionally for public provider data.
- Keep authentication and privileged responses private/no-store.
- Build and deploy each web client independently while validating shared
  package changes against all consumers.
- After shipping, verify GitHub Actions, affected Vercel deployments, and
  representative production routes.

## Adding observability

When monitoring is introduced, define product-owned signals before selecting a
vendor: availability, latency, error rate, provider failures, auth failures,
and cost/abuse indicators. Logs must exclude tokens, secrets, passwords, raw
session data, and unnecessary personal information. Alerts need an owner and a
runbook; dashboards without an operating response are not a reliability
system.

Future Sentry, analytics, or uptime-provider adapters should follow the shared
integration rules and remain configurable per deployed client.

## Failure-domain matrix

| Failure                       | Likely impact                      | Expected behavior                            | Operator check                                     |
| ----------------------------- | ---------------------------------- | -------------------------------------------- | -------------------------------------------------- |
| One Vercel client deployment  | One product                        | Other products remain available              | Project deployment/log and canonical smoke         |
| Shared package regression     | Multiple consumers                 | CI/build should fail before deploy           | Dependency consumers and all affected projects     |
| Supabase outage/configuration | Auth/data features across products | Safe error/unavailable; no insecure fallback | Supabase status, client config, safe public routes |
| Auth cookie/return regression | Auth, Studio, Admin                | Reject unsafe return; require sign-in again  | Cookie mode, host, callback and allowed origins    |
| Portfolio CMS query failure   | Public Portfolio pages             | Surface error, no stale duplicate content    | Schema/RLS/query and required singleton records    |
| GitHub failure                | Portfolio/Studio statistics        | Cached/unavailable provider state            | Token scope/quota and route response               |
| Resend failure                | Portfolio contact delivery         | Safe delivery failure after rate limit       | Provider status/config without logging enquiry     |
| OpenWeather failure           | Studio Weather                     | Weather-only error                           | Browser key/quota/provider response                |
| Google Drive failure          | Resume live export                 | Static/CMS fallback                          | Service account scope/document access              |
| Vercel API failure            | Admin deployment operations        | Admin-only operation error                   | Token/team/project allowlist                       |

## Minimum operational signals

Until centralized observability exists, the minimum evidence is GitHub Actions,
Vercel build/runtime logs, safe application responses, Supabase/provider
dashboards, and manual canonical-route smoke tests. This is a limitation: it
does not provide continuous availability/error-rate measurement or guaranteed
alerting.

When adding logs, prefer a stable request/operation identifier, product,
capability, safe error class, provider status, and duration. Exclude raw
payloads by default. Contact enquiry text, profile metadata, file names/paths,
session data, Auth codes, tokens, and secrets require explicit necessity and
redaction.

## Reliability change checklist

For a new network/data operation define timeout, retry and idempotency rules;
user-visible degraded state; cache/staleness behavior; cost/abuse limit;
operator diagnostic signal; rollback; and the products affected by a shared
failure. Add a runbook before adding an alert.
