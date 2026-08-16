# Quality gates

The repository uses layered checks so structural moves and product changes are
validated at their actual boundaries.

| Command                     | Contract                                                        |
| --------------------------- | --------------------------------------------------------------- |
| `pnpm check:architecture`   | Package group, product contract, and client dependency rules    |
| `pnpm check:brand-assets`   | Every deployed favicon copy matches `assets/brand/web`          |
| `pnpm check:service-role`   | Service-role code stays server-only and outside Portfolio       |
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

GitHub Actions runs architecture, brand asset, service-role, lint, type, test,
and complete build checks for pull requests and pushes to `main`. Direct solo
development still requires the same gates before pushing.

`pnpm test:db:linked` is not an ordinary local quality gate: it mutates remote
test records while validating RLS and schema invariants. Use it only with
explicit remote-write authorization.

Build configuration may ignore framework type errors for deployment behavior;
that never replaces `pnpm check-types`.
