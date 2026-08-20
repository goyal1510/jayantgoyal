# Domains and contracts

The repository is product-first, but products still collaborate through
explicit domain boundaries. A contract moves outward only when another owner
actually consumes it.

## Current domains

| Domain              | Primary owner     | Shared boundary                                                               |
| ------------------- | ----------------- | ----------------------------------------------------------------------------- |
| Professional story  | Portfolio         | `@jayantgoyal/portfolio-contracts` shared with Admin                          |
| Writing             | Portfolio         | Published data read by Portfolio, administered by Admin                       |
| Product catalog     | Studio            | Studio runtime registries                                                     |
| Personal workspace  | Studio            | `studio` tables, capability-aware RLS, Storage, and client APIs               |
| Authentication      | Auth              | `@jayantgoyal/web-auth`, Supabase Auth, and `iam.profiles` access             |
| Identity and access | Cross-product IAM | Approved `iam` profile, entitlement, workforce, role, and capability boundary |
| Administration      | Admin             | Capability-gated APIs over owned product/IAM/provider data                    |
| Public identity     | Foundation        | `@jayantgoyal/identity` and web-brand projections                             |

## Contract placement

- Keep route-local types and helpers in the owning web client.
- Keep product contracts under `apps/<product>/contracts` when another client
  or administrative product consumes them. Portfolio is the current example.
- Put framework-neutral foundation concepts under `packages/foundation`.
- Put intentionally web-specific session, metadata, URL, component, and style
  contracts under `packages/web`.
- Put provider protocols under `packages/integrations` only after stable reuse
  exists across products.
- Put compiler and lint configuration under `packages/tooling`.

Do not make a shared package a miscellaneous folder. A package needs one named
owner, a documented public surface, and consumers that justify its existence.
Applications may depend on packages; packages must not depend on application
source.

## Data contracts

The deployed schema model gives each domain an explicit owner: `portfolio` serves
professional CMS and Writing data, `iam` serves canonical profiles and access
policy, and `studio` serves Studio capabilities. Ownership and safe evolution
rules are defined in [Database schema ownership and
evolution](../shared-systems/data/schema-ownership.md).

IAM replaces the single global account role with product
entitlements and scoped role/capability assignments. Products retain their own
resource-level attributes and RLS; IAM does not absorb Studio resources.

Migrations are append-only change contracts; schema snapshots describe current
structure. Runtime validation remains necessary at every client, server,
provider, and database boundary.

Before introducing a new domain such as billing or advertising, identify the
owning product, public operations, authorization model, schema, provider
adapter, and administrative surface. Create code only when that capability is
being implemented.
