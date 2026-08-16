# Change placement guide

Use this guide before creating a directory, package, route, schema, or provider
adapter. It turns the ownership principles into concrete placement decisions.

## Placement matrix

| Change                              | Default location                | Move outward when                                                 |
| ----------------------------------- | ------------------------------- | ----------------------------------------------------------------- |
| Product page, API, UI, client state | `apps/<product>/<platform>`     | Never solely because it is large                                  |
| Product rule used by one client     | Owning client                   | A second implemented client needs the same framework-neutral rule |
| Product contract used by Admin      | `apps/<product>/contracts`      | It remains owned by the product, not Admin                        |
| Person/product identity             | `packages/ecosystem`            | It is framework-neutral and cross-product                         |
| Web session, metadata, URL, UI      | `packages/web`                  | Multiple web clients share a stable responsibility                |
| Provider protocol/client            | Owning client                   | Multiple products share the same stable provider boundary         |
| Lint/compiler/build convention      | `packages/tooling`              | Multiple workspaces consume it                                    |
| Product data                        | Existing owning Supabase schema | A reviewed domain boundary requires a new schema                  |
| Operational instruction             | `docs/operations`               | It has a current operator and verified procedure                  |

## Adding a product capability

1. Name the owning product and user outcome.
2. Identify whether it is public, account-owned, admin-only, or provider-driven.
3. Keep routes, UI, validation, and product rules in the current client.
4. Select an existing schema only when its ownership matches; otherwise review
   a new schema/domain boundary before writing migrations.
5. Add an integration package only if another product already consumes the
   same provider protocol.
6. Update product capabilities, routes/APIs, data ownership, environment
   reference, tests, and operational behavior.

## Adding a client platform

1. Confirm the product already exists or define its product boundary first.
2. Create only `apps/<product>/<new-platform>`.
3. Reuse product contracts that are actually platform-neutral.
4. Do not import web packages into a native client.
5. Introduce platform tooling only for the implementation being built.
6. Add commands, CI, environment, release, security, and client documentation.

## Extracting a shared package

Extraction is justified when all are true:

- at least two real consumers need the same stable responsibility;
- the public API can be named without product-specific miscellany;
- dependency direction remains from applications to packages;
- platform and secret assumptions are explicit;
- ownership and failure behavior are documented;
- contract tests can run without importing an application.

If the consumers only share appearance or coincidentally similar code, prefer
local implementations until the behavior converges.

## Adding a provider

Define the product capability before the provider. Record credentials,
server/browser exposure, API operations, timeouts, quotas/cost, failure UX,
privacy, retry/idempotency requirements, and the deployment projects that need
the variables. Keep the adapter local until cross-product reuse is real.

## Adding data

Choose the schema by domain ownership, not by which route writes the row.
Define keys, constraints, indexes, RLS, elevated operations, retention, and
storage ownership. Update a new append-only migration and all current schema
snapshots after an approved remote apply. Never infer current tables from old
migrations; the canonical snapshots are the current-state source.

## Avoid these signals

Do not create a package or product because a name may be useful later, a folder
tree looks uneven, a technology might eventually be adopted, or an external
provider offers a feature. Uneven implemented clients are expected. The goal is
clear ownership and low coupling, not symmetry.
