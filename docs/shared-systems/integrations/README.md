# External integrations

External providers are adapters, not product owners. Product code decides when
and why an integration is used; provider packages isolate a stable protocol
only when multiple products share it.

| Provider    | Current consumers        | Purpose                                      |
| ----------- | ------------------------ | -------------------------------------------- |
| Supabase    | All products             | Auth, Postgres, Realtime, Storage            |
| GitHub      | Portfolio and Studio     | Contribution and repository statistics       |
| Resend      | Portfolio                | Contact email delivery                       |
| Google      | Portfolio                | Resume document export                       |
| OpenWeather | Studio                   | Weather data                                 |
| Vercel      | Admin and deployment ops | Deployments and independent web-client hosts |

`packages/integrations/github` is the current shared provider package. Other
adapters remain in their owning client until cross-product reuse is stable.

Every integration needs server/client credential classification, timeouts and
error handling, an abuse/cost model, least-privilege permissions, and a defined
degraded experience. Provider secrets never move into `NEXT_PUBLIC_*` values.

Future Stripe, CRM, analytics, advertising, or sales tooling follows the same
rule: first define the product capability and authorization boundary, then add
the provider adapter. A provider name must not become the domain model.
