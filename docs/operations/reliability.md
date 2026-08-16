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
