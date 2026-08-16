# Quality gates

The repository uses layered checks so structural moves and product changes are
validated at their actual boundaries.

| Command                     | Contract                                                        |
| --------------------------- | --------------------------------------------------------------- |
| `pnpm check:architecture`   | Package group, product contract, and client dependency rules    |
| `pnpm check:brand-assets`   | Every deployed favicon copy matches `assets/brand/web`          |
| `pnpm check:service-role`   | Service-role code stays server-only and outside Portfolio       |
| `pnpm check:source-health`  | Authored source stays within the 500-line hard limit            |
| `pnpm check:dead-code`      | Unused files, exports, types, and dependencies are rejected     |
| `pnpm check:docs`           | Central docs structure, placement, reachability, and links      |
| `pnpm lint`                 | ESLint across every workspace with zero warnings                |
| `pnpm check-types`          | Next route generation plus strict TypeScript checks             |
| `pnpm test`                 | Vitest projects for each web client, shared packages, contracts |
| `pnpm build`                | Turborepo build for all applications and source packages        |
| `pnpm check:bundle-budgets` | Studio and cross-client bundle budget analysis                  |
| `pnpm db:migrations:check`  | Read-only linked local/remote migration history comparison      |

Each web client owns a Vitest project with its own `@/*` alias. Root Vitest
discovers `apps/*/web/vitest.config.ts` and separately tests grouped packages
and product contracts. Tests therefore do not depend on a particular client
being the repository-wide alias owner.

## Test layers

| Layer               | What it should prove                                                       | Typical source                                              |
| ------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Pure unit           | Parsers, validators, state transitions, URL/cookie policy                  | Product/package `*.test.ts`                                 |
| Contract            | Public columns, payload shapes, package exports, product registries        | Portfolio contracts and package tests                       |
| Authorization       | Safe returns, MFA/recovery, roles, ownership, service-role boundaries      | Auth/proxy/API tests and structural scripts                 |
| Route/source        | Metadata, indexability, route presence, server/client boundaries           | Source regression tests and generated route types           |
| Database            | Schema/RLS/RPC invariants                                                  | Migrations/snapshots and explicitly authorized linked tests |
| Integration adapter | Provider response/error mapping without exposing secrets                   | Integration package/product route tests                     |
| Build               | Every workspace resolves and all Next.js clients produce production output | `pnpm build`                                                |
| Production smoke    | Canonical deployment responds and key redirect/data path is intact         | Post-push manual/operational verification                   |

## Change-to-validation matrix

| Change                 | Minimum focused validation in addition to common gates                             |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Route/page or metadata | Route test/typegen, sitemap/robots/indexability, owning client build               |
| Shared package         | Package tests plus every consumer type/build path                                  |
| Auth/cookie/return     | Cookie modes, exact returns, callback, MFA/recovery, Studio/Admin integration      |
| Admin privileged API   | Role denial/allow, payload/resource allowlist, no pre-auth service-role creation   |
| Database migration     | SQL review, migration history, contract/RLS tests, refreshed snapshots after apply |
| Storage/upload         | Owner/path/MIME/size/conflict/rollback tests                                       |
| Provider route         | Validation, missing config, provider failure, cache/rate-limit behavior            |
| Registry/inventory     | Registry consistency, navigation, route, metadata and docs coverage                |
| Tooling/checker        | Positive fixture/current repo and representative failure case                      |

GitHub Actions runs architecture, brand asset, service-role, source health,
dead-code, documentation, lint, type, test, and complete build checks for pull
requests and pushes to `main`. Direct solo development still requires the same
gates before pushing.

`pnpm test:db:linked` is not an ordinary local quality gate: it mutates remote
test records while validating RLS and schema invariants. Use it only with
explicit remote-write authorization.

Unit tests should avoid real external providers. Linked remote database tests
are the exception and are opt-in because they write controlled records. Build
and production smoke checks validate wiring, not every behavior, so they do not
replace focused tests.

Build configuration may ignore framework type errors for deployment behavior;
that never replaces `pnpm check-types`.

## Test definition of done

Changed logic has success, invalid-input, denied-authorization, and relevant
provider/database failure coverage. Tests assert contracts rather than private
implementation details where possible. A claim of complete/100% coverage is
made only when measured. Known untested risk is reported explicitly instead of
being hidden by a passing unrelated suite.
