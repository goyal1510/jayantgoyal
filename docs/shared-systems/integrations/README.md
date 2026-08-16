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

## Provider contracts

### Supabase

Supabase is the only cross-product backend provider. The four clients use its
Auth and/or Postgres APIs; Studio and Auth also use Realtime/Storage-backed
capabilities, and Admin uses authorized Storage/service-role operations. Client
code selects explicit schemas. The project reference, migration workflow, RLS,
and schema snapshots are documented in the [data
guide](../data/README.md).

### GitHub

Portfolio and Studio share `@jayantgoyal/github` for typed server-side statistics.
Each product owns its route validation, response shape, cache policy, and UI.
`GITHUB_TOKEN` stays server-only. Public usernames are pattern-validated and
provider failures return bounded unavailable responses instead of leaking raw
GitHub errors.

### Resend

Portfolio contact delivery is server-only. The contact API enforces its
database rate limit before parsing/delivering input, validates length-bounded
fields, loads the recipient from canonical Portfolio data, and escapes HTML.
Missing configuration or provider failure affects contact delivery only.

### Google Drive export

Portfolio's Resume route uses a service-account assertion with Drive read-only
scope to export one configured document as PDF. The private key stays
server-only. The checked-in Resume PDF and a non-recursive CMS destination are
the defined fallback path.

### OpenWeather

Studio Weather calls OpenWeather from the browser using
`NEXT_PUBLIC_OPENWEATHER_API_KEY`; the key is intentionally public/provider
scoped. Location permission is optional. Missing permission or provider
failure must not affect other Studio tools.

### Vercel

Git integration deploys four client projects from `main`. Separately, Admin
uses a server-only Vercel token/team/project allowlist to inspect or trigger
Studio/Admin deployments for super admins. Deployment API responses must not
include environment secrets or the bearer token.

## Integration checklist

For each provider operation define:

- owning product and user-visible outcome;
- exact clients and Vercel projects receiving configuration;
- browser-visible versus server-only credential class;
- provider scopes and resource allowlist;
- input validation, timeouts, cache/retry/idempotency behavior;
- quota, financial cost, and abuse protection;
- personal data sent, retained, or logged;
- safe user-facing failure and operator diagnostic signal;
- credential rotation and removal procedure.

Do not place product policy into a provider package. For example, GitHub can
fetch statistics, but Portfolio and Studio decide which usernames, cache
duration, response, and presentation their features support.

Future Stripe, CRM, analytics, advertising, or sales tooling follows the same
rule: first define the product capability and authorization boundary, then add
the provider adapter. A provider name must not become the domain model.
