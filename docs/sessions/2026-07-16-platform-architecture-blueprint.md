# Platform Architecture Blueprint

- Date: 2026-07-16
- Area: Repository-wide architecture and long-term migration planning
- Objective: Create a durable architecture plan and phased implementation checklist for separating Portfolio, Studio, Admin, and Auth without changing application code.
- Scope: Documentation only. No application, package, database, migration, deployment, or configuration changes.
- Working branch: `codex/platform-architecture-blueprint`
- Working directory: `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/platform-architecture-blueprint`

## Current status

Planning documents were prepared from the latest fetched `origin/main`.

## Documents created

- `docs/plan/2026-07-16-platform-architecture-blueprint.md`
  - Defines the architecture constitution, application responsibilities, Platform boundary, target structure, authentication and SSO contract, shared-package policy, data ownership, deployment model, route ownership, future-growth rules, non-goals, and success criteria.
- `docs/plan/2026-07-16-platform-restructure-implementation-guide.md`
  - Defines the operating contract, interface contracts, persistent task queue, 13 deployable phases, detailed checklists, rollback rules, redirect and environment ledgers, verification matrix, review gates, proof template, decision log, and future resume procedure.

## Key decisions

- The long-term target is four independent applications: Portfolio, Studio, Admin, and Auth.
- The Platform remains shared infrastructure rather than a fifth application.
- `apps/jayantgoyal` is the technical predecessor of Studio; the technical move and Studio redesign are separate phases.
- Auth becomes a dedicated application while `packages/auth` contains only reusable infrastructure.
- Identity is global through one Supabase project; authorization remains local to the owning application.
- The current `jg_account`, `jg_app`, and `portfolio` schemas remain unless later evidence justifies evolution.
- Existing shared packages remain, and only `packages/auth` is approved as a new package.
- The migration begins with baseline inventory and regression coverage, not folder moves.
- Passkeys, SAML, API tokens, new schemas, and additional applications remain deferred.

## Validation

- Documentation-only scope was preserved.
- No application, package, database, migration, deployment, or runtime configuration file was changed.
- The worktree was created from the latest `origin/main`.
- Local environment files and non-secret Supabase link metadata were preserved according to worktree policy.
- Supabase link and linked migration-list verification completed successfully without applying migrations.
