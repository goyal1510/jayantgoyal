# Jayant documentation

This directory is the central, current-state knowledge base for the **Jayant**
monorepo. `jayantgoyal.com` is the primary public domain; it is not the name of
the ecosystem, a platform, or a shared application.

Use this index to move from product context to implementation detail. Code,
tests, package manifests, runtime registries, migrations, schema snapshots, and
environment examples remain authoritative where they are more precise than
prose.

## Overview

- [Ecosystem](overview/ecosystem.md): products, audiences, and operating model.
- [System map](overview/system-map.md): how products, clients, shared systems,
  data, providers, and deployments connect.
- [Terminology](overview/terminology.md): stable vocabulary used across code
  and documentation.

## Architecture

- [Repository structure](architecture/repository-structure.md)
- [Ownership boundaries](architecture/ownership-boundaries.md)
- [Domains and contracts](architecture/domains-and-contracts.md)
- [Long-term extensibility](architecture/extensibility.md)

## Products

- [Portfolio](products/portfolio/README.md)
- [Studio](products/studio/README.md)
- [Admin](products/admin/README.md)
- [Auth](products/auth/README.md)

## Clients and shared systems

- [Client strategy](clients/README.md)
- [Web clients](clients/web/README.md)
- [Authentication](shared-systems/authentication/README.md)
- [Data and Supabase](shared-systems/data/README.md)
- [Design and brand](shared-systems/design-and-brand/README.md)
- [External integrations](shared-systems/integrations/README.md)

## Engineering

- [Local development](engineering/local-development.md)
- [Code quality](engineering/code-quality.md)
- [Testing and quality gates](engineering/testing.md)
- [Documentation governance](engineering/documentation.md)

## Operations

- [Security boundaries](operations/security/README.md)
- [Reliability and observability](operations/reliability.md)
- [Vercel deployment](operations/deployment/vercel.md)

## Reference

- [Commands](reference/commands.md)
- [Applications, hosts, and ports](reference/applications-and-ports.md)
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
required pages, internal links, central placement, and index reachability.
