# Repository agent contract

This is the `jayantgoyal` monorepo for products built by Jayant. `Jayant` is
the public person name, `jg` is the short visual mark, and `jayantgoyal` is the
repository/domain/package namespace. Never expand it into a personal full name
or use it as an umbrella product brand.

Read [docs/README.md](docs/README.md) before changing architecture. Code,
package manifests, runtime registries, tests, migrations, and schema snapshots
remain authoritative when prose disagrees.

## Operating rules

- Work only in an approved worktree; never edit the protected source clone.
- Keep all products and future clients in this monorepo.
- Put a client under `apps/<product>/<platform>` only when that client exists.
  Do not create empty mobile, desktop, commerce, advertising, or sales folders.
- Keep product rules and contracts with the owning product. Promote code to a
  shared package only after stable cross-product reuse exists.
- Applications may import packages, but never another application's source.
- Reusable packages must never import a web client.
- Web-specific code belongs under `packages/web`; product-neutral identity
  belongs under `packages/foundation`; provider code belongs under
  `packages/integrations`; build configuration belongs under
  `packages/tooling`.
- Do not create session-entry files for this personal repository.
- Keep docs current-state only. Do not add history ledgers, progress trackers,
  completed plans, or QA archives.
- Keep authored TypeScript, JavaScript, JSX/TSX, CSS, and SCSS files at or below
  500 physical lines. Treat 401-500 lines as a refactoring warning and prefer
  files below 400 lines.
- Remove unused files, imports, exports, helpers, stale branches, and speculative
  implementations. Run the repository dead-code check before shipping.
- Document exported and non-trivial functions when their responsibility, side
  effects, authorization assumptions, external I/O, or invariants are not
  obvious from names and types. Do not add comments that merely restate code.
- Split by responsibility and ownership; do not create arbitrary fragments only
  to satisfy the source-size check.

Run `pnpm check:architecture` after ownership or dependency changes.

## Applications

| Product   | Workspace                    | Ownership                                       |
| --------- | ---------------------------- | ----------------------------------------------- |
| Portfolio | `@jayantgoyal/portfolio-web` | Public professional and editorial content       |
| Studio    | `@jayantgoyal/studio-web`    | Product catalog, utilities, games, workspaces   |
| Admin     | `@jayantgoyal/admin-web`     | Portfolio CMS, users, deployment operations     |
| Auth      | `@jayantgoyal/auth-web`      | Sign-in, recovery, MFA, profile, account safety |

Every current client is Next.js 16, React 19, TypeScript 5.9, and Tailwind CSS
v4. Next.js request middleware is `src/proxy.ts`, not `middleware.ts`. Use the
application-local `@/*` alias for its `src/*` files.

## Shared ownership

- `@jayantgoyal/identity`: framework-neutral person, technical namespace,
  product identity, canonical host, and development-origin registry.
- `@jayantgoyal/web-brand`: web-facing product labels, descriptions, and
  synchronized web asset paths.
- `@jayantgoyal/web-urls`: canonical web origins and URL rewriting.
- `@jayantgoyal/web-seo`: shared Next.js metadata/indexability helpers.
- `@jayantgoyal/web-auth`: Supabase SSR, session, entry, redirect, profile, password,
  and logout contracts.
- `@jayantgoyal/web-ui`: shared Studio/Admin/Auth components and application shell.
- `@jayantgoyal/portfolio-contracts`: Portfolio/Admin data and validation contract.
- `@jayantgoyal/github`: provider integration used by Portfolio and Studio.
- `@jayantgoyal/tailwind-config`, `@jayantgoyal/eslint-config`, and
  `@jayantgoyal/typescript-config`: shared web/tooling configuration.

Portfolio deliberately owns its editorial component system and must not import
the shared application shell or application-surface stylesheet.

## Supabase safety

The canonical linked project is `jayantgoyal` (`orwfvyditlguqvxvztkw`). Read
[the data and Supabase guide](docs/shared-systems/data/README.md) before database
work.

- The current application schemas are private `foundation`, cross-product
  `iam`, private `iam_private`, and product-owned `studio` and `portfolio`.
  Select the intended schema explicitly.
- IAM owns
  profiles, product/workforce access, roles, and capabilities; products own
  resource-specific authorization and data.
- Read `docs/shared-systems/data/schema-ownership.md` before moving or renaming
  any schema, table, function, policy, publication, or bucket.
- Check every Supabase error.
- Never expose a service-role key to client code.
- Portfolio and Auth must not use a service-role key.
- Treat `supabase/.temp` as machine-local and never commit it.
- Inspect local/remote migration history before any remote apply.
- Never edit an applied migration. Add a new reviewed migration.
- Use the dedicated remote-migration workflow for an approved apply; never
  apply from the source clone or an ordinary worktree.
- After an apply, refresh and review every affected canonical schema snapshot.

`pnpm test:db:linked` reads and writes remote test records; run it only when the
task explicitly authorizes that remote validation.

## Product conventions

Studio registries are the source of truth for its catalog and navigation:

- `apps/studio/web/src/lib/config/studio-inventory.ts`
- `apps/studio/web/src/lib/config/studio-surfaces.ts`
- `apps/studio/web/src/lib/games/config.ts`
- `apps/studio/web/src/lib/tools/tools.ts`
- `apps/studio/web/src/lib/config/hub-config.ts`

For public routes, update metadata, canonical/Open Graph data, sitemap coverage,
route protection, and zero-cost API classification where applicable.

Portfolio reads canonical CMS data from Supabase without duplicated static
fallback content. Admin writes the same Portfolio and Writing contracts and
must authorize callers before any service-role operation. Auth is the only
interactive entry, recovery, MFA, provider, normal logout, and account-security
owner. Product entry URLs are redirect aliases; compatibility callbacks do not
define a second ownership model.

## Commands

```bash
pnpm dev
pnpm --filter @jayantgoyal/portfolio-web dev
pnpm --filter @jayantgoyal/studio-web dev
pnpm --filter @jayantgoyal/admin-web dev
pnpm --filter @jayantgoyal/auth-web dev

pnpm check:architecture
pnpm check:brand-assets
pnpm check:identity
pnpm check:seo
pnpm check:service-role
pnpm check:source-health
pnpm check:dead-code
pnpm check:docs
pnpm lint
pnpm check-types
pnpm test
pnpm build
pnpm db:migrations:check
```

Build success does not replace strict type checking. Keep app-specific
environment contracts in `apps/<product>/web/.env.example` and per-client Turbo
build inputs in `apps/<product>/web/turbo.json`.

Before direct shipping, fetch `origin/main`, verify the branch contains it, run
the relevant full checks, review the staged diff for secrets and generated
files, commit under Jayant's configured identity without co-author trailers,
and push the reviewed commit to `main`.
