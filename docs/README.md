# jayantgoyal documentation

This directory is the central, current-state knowledge base for the
`jayantgoyal` monorepo. Jayant is the public person identity; the repository and
domain slug are technical identifiers, not an umbrella product or expanded
personal name.

Use this index to move from product context to implementation detail. Code,
tests, package manifests, runtime registries, migrations, schema snapshots, and
environment examples remain authoritative where they are more precise than
prose.

## Reading paths

- New to the repository: read [Product suite](overview/product-suite.md), [System
  map](overview/system-map.md), [Architecture
  principles](architecture/principles.md), then the owning product.
- Placing or restructuring code: read [Repository
  structure](architecture/repository-structure.md), [Ownership
  boundaries](architecture/ownership-boundaries.md), and the [Change placement
  guide](architecture/change-placement-guide.md).
- Changing a product: start with its README, then its route/capability/flow page
  and the relevant shared-system contract.
- Changing Auth or data: read the [shared cookie/return
  contract](shared-systems/authentication/cookie-and-return-contract.md),
  [Supabase guide](shared-systems/data/README.md), [schema
  catalog](shared-systems/data/schema-catalog.md), and [security
  boundaries](operations/security/README.md).
- Running or shipping the system: use [Local
  development](engineering/local-development.md), [Quality
  gates](engineering/testing.md), [Vercel
  deployment](operations/deployment/vercel.md), and [Operational
  runbooks](operations/runbooks.md).
- Looking for an exact fact: use the Reference section; its route/workspace,
  environment, package, host, technology, and ownership catalogs are kept
  current by documentation checks where possible.

## Overview

- [Product suite](overview/product-suite.md): products, audiences, and operating model.
- [System map](overview/system-map.md): how products, clients, shared systems,
  data, providers, and deployments connect.
- [Terminology](overview/terminology.md): stable vocabulary used across code
  and documentation.

## Architecture

- [Architecture principles](architecture/principles.md)
- [Repository structure](architecture/repository-structure.md)
- [Runtime topology](architecture/runtime-topology.md)
- [Ownership boundaries](architecture/ownership-boundaries.md)
- [Domains and contracts](architecture/domains-and-contracts.md)
- [Change placement guide](architecture/change-placement-guide.md)
- [Long-term extensibility](architecture/extensibility.md)

## Products

- [Portfolio](products/portfolio/README.md)
- [Studio](products/studio/README.md)
- [Admin](products/admin/README.md)
- [Auth](products/auth/README.md)
- [Shaamil](products/shaamil/README.md) — defined product; no implemented client
  or runtime yet
  - [Platform and client architecture](products/shaamil/platform-and-client-architecture.md)
  - [Domain, data, and messaging architecture](products/shaamil/domain-data-and-messaging.md)
  - [Security, reliability, testing, and delivery](products/shaamil/security-reliability-and-delivery.md)

Implemented product pages link to their route, capability, runtime-flow, data,
and operational detail. A defined product page must distinguish accepted
ownership and extension rules from runtime behavior and must not invent clients
or capabilities that do not exist.

## Clients and shared systems

- [Client strategy](clients/README.md)
- [Web clients](clients/web/README.md)
- [Authentication](shared-systems/authentication/README.md)
- [Shared web session and returns](shared-systems/authentication/cookie-and-return-contract.md)
- [Data and Supabase](shared-systems/data/README.md)
- [Database schema catalog](shared-systems/data/schema-catalog.md)
- [Database schema ownership and evolution](shared-systems/data/schema-ownership.md)
- [Design and brand](shared-systems/design-and-brand/README.md)
- [Naming contract](shared-systems/design-and-brand/naming-contract.md)
- [External integrations](shared-systems/integrations/README.md)

## Engineering

- [Local development](engineering/local-development.md)
- [Configuration model](engineering/configuration.md)
- [Code quality](engineering/code-quality.md)
- [Testing and quality gates](engineering/testing.md)
- [Documentation governance](engineering/documentation.md)

## Operations

- [Security boundaries](operations/security/README.md)
- [Reliability and observability](operations/reliability.md)
- [Vercel deployment](operations/deployment/vercel.md)
- [Operational runbooks](operations/runbooks.md)
- [LinkedIn publishing operations](operations/linkedin-publishing.md)

## Reference

- [Commands](reference/commands.md)
- [Applications, hosts, and ports](reference/applications-and-ports.md)
- [Repository inventory](reference/repository-inventory.md)
- [Environment variables](reference/environment-variables.md)
- [Package catalog](reference/package-catalog.md)
- [Technology catalog](reference/technology-catalog.md)
- [Ownership matrix](reference/ownership-matrix.md)

## Documentation policy

Documentation explains what exists, why it is owned where it is, and how to
operate it safely. It does not preserve a chronological narrative. Do not add
session entries, status logs, completed plans, architecture-history ledgers, or
QA evidence archives. Git retains change history; durable behavior belongs in
the relevant page and executable contracts belong beside the code.

Every structural, behavioral, operational, or ownership change must update the
smallest relevant page in the same change. Run `pnpm check:docs` to validate
required pages, internal links, central placement, index reachability, and
coverage of current routes, workspaces, environment contracts, and schema
tables.
