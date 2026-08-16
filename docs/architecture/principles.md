# Architecture principles

These principles are the durable design contract for the `jayantgoyal` monorepo. They
describe how the current repository should evolve; they are not a record of
past architecture work.

## Product is independent from platform

A product represents an audience, problem space, data contract, and lifecycle.
A platform is one client implementation of that product. Portfolio, Studio,
Admin, and Auth are products. Web is their only current client platform.

The current convention is `apps/<product>/<platform>`. A future client is added
only to the product that needs it. Adding `apps/studio/ios` would not require an
empty iOS directory for Portfolio, Admin, or Auth, and it would not require
renaming or moving `apps/studio/web`.

## Code is local by default

New behavior starts at its narrowest real owner:

1. Route, component, browser behavior, and platform integration stay in the
   client.
2. Business rules shared by clients of one product stay beside that product.
3. A stable responsibility used by more than one product may become an
   foundation, web, integration, or tooling package.

Code size, visual similarity, or possible future reuse is not enough to create
a shared package. Extraction requires named ownership, real consumers, a
cohesive public surface, and tests for the shared contract.

## Platform-specific code stays platform-specific

Next.js routes, React components, browser APIs, Tailwind styles, Radix
primitives, cookies, web metadata, and SEO are valid web code. They do not need
to be disguised as universal abstractions. Web-shared behavior belongs under
`packages/web`; a future native client can use a native implementation while
sharing only genuinely framework-neutral product contracts.

## Existing behavior is preserved deliberately

Restructuring changes ownership and discoverability, not product behavior by
default. A move must preserve routes, data semantics, authorization, metadata,
environment inputs, build behavior, and deployment roots. A behavioral change
requires its own reason, tests, and product documentation.

## Backend and identity are client-independent boundaries

Supabase Auth and the `jg_account`, `jg_app`, and `portfolio` schemas serve
product capabilities rather than a single UI technology. Clients still own
their platform-specific session handling and product authorization. Database
tables are not automatically cross-product APIs; their schema and product owner
must remain explicit.

## Dependencies have one direction

Applications may consume product contracts and shared packages. Product
contracts may consume framework-neutral tooling, but not client code. Shared
packages must not import applications. Provider packages must not own product
policy. The executable constraints are enforced by `pnpm check:architecture`.

## Security is checked at every privileged boundary

Authentication establishes identity; it does not grant every product action.
Each client owns authorization for its routes and data. RLS is the default
database boundary. Any service-role or provider-token path must authenticate,
authorize, validate, and limit the requested operation before elevated access.

## Architecture evolves through evidence

Create or split a package when current consumers prove the boundary. Add a
platform when an implementation is funded and owned. Add an integration when a
product capability selects a provider. Add an operational system when someone
will own its signals and response. Do not create empty directories, generic
services, or placeholder contracts to predict the future.

## The monorepo remains the repository boundary

Products, clients, product contracts, shared packages, database sources,
scripts, and central documentation stay in this repository. An independently
deployed product or a different client technology does not require a separate
repository. A repository split would require a stronger operational boundary
than the current product-first workspace model provides.

## Documentation is current-state architecture

Documentation explains present behavior, ownership, extension rules, and safe
operation. Git holds chronology. Do not add session logs, progress trackers,
completed plans, architecture-history ledgers, or archived test evidence. When
code changes, update the smallest authoritative current-state page and keep
inventories verifiable against executable sources.

## Decision test

Before placing or moving code, answer:

1. Which product capability owns the behavior?
2. Which implemented clients consume it today?
3. Does it depend on a platform, framework, provider, or secret?
4. Which data and authorization boundary does it cross?
5. What breaks if one consumer changes independently?
6. Can the dependency direction be enforced and tested?

If these answers are unclear, keep the code local and clarify ownership before
extracting it.
