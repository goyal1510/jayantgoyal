# Jayant documentation

This directory is the canonical current-state documentation for the Jayant
monorepo. Update the relevant page whenever implementation, ownership,
operations, or deployment behavior changes.

## Start here

- [Ecosystem overview](ecosystem/overview.md)
- [Repository structure](architecture/repository-structure.md)
- [Ownership boundaries](architecture/ownership-boundaries.md)
- [Long-term extensibility](architecture/extensibility.md)

## Products

- [Portfolio](products/portfolio.md)
- [Studio](products/studio.md)
- [Admin](products/admin.md)
- [Auth](products/auth.md)

## Platform and operations

- [Web platform](platforms/web.md)
- [Authentication ownership](authentication/ownership.md)
- [Supabase](database/supabase.md)
- [Security boundaries](security/boundaries.md)
- [Local development](development/local-development.md)
- [Quality gates](testing/quality-gates.md)
- [Vercel deployment](deployment/vercel.md)

## Documentation policy

These pages explain what exists now and the rules that keep it extensible. They
do not record a chronological history. Do not add session entries, status logs,
completed plans, decision ledgers, or QA archives. Git already retains change
history; current behavior belongs here, and executable details belong in code,
tests, manifests, registries, migrations, and schema snapshots.
