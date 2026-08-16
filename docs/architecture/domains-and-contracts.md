# Domains and contracts

The repository is product-first, but products still collaborate through
explicit domain boundaries. A contract moves outward only when another owner
actually consumes it.

## Current domains

| Domain             | Primary owner | Shared boundary                                          |
| ------------------ | ------------- | -------------------------------------------------------- |
| Professional story | Portfolio     | `@jayant/portfolio-contracts` shared with Admin          |
| Writing            | Portfolio     | Published data read by Portfolio, administered by Admin  |
| Product catalog    | Studio        | Studio runtime registries                                |
| Personal workspace | Studio        | `jg_app` tables, RLS, Storage, and client APIs           |
| Account identity   | Auth          | `@jayant/web-auth`, Supabase Auth, `jg_account`          |
| Administration     | Admin         | Role-gated APIs over owned product/account/provider data |
| Public identity    | Ecosystem     | `@jayant/identity` and web-brand projections             |

## Contract placement

- Keep route-local types and helpers in the owning web client.
- Keep product contracts under `apps/<product>/contracts` when another client
  or administrative product consumes them. Portfolio is the current example.
- Put framework-neutral ecosystem concepts under `packages/ecosystem`.
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

Database schema ownership is explicit: `portfolio` serves professional CMS
data, `jg_account` serves profiles and account policy, and `jg_app` serves
Studio and Writing capabilities. Migrations are append-only change contracts;
schema snapshots describe current structure. Runtime validation remains
necessary at every browser, server, provider, and database boundary.

Before introducing a new domain such as billing or advertising, identify the
owning product, public operations, authorization model, schema, provider
adapter, and administrative surface. Create code only when that capability is
being implemented.
