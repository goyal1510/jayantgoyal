# Repository agent contract

This is the **Jayant** monorepo. `jayantgoyal.com` is a domain, not the name of
the product ecosystem or a platform.

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
  belongs under `packages/ecosystem`; provider code belongs under
  `packages/integrations`; build configuration belongs under
  `packages/tooling`.
- Do not create session-entry files for this personal repository.
- Keep docs current-state only. Do not add history ledgers, progress trackers,
  completed plans, or QA archives.

Run `pnpm check:architecture` after ownership or dependency changes.

## Applications

| Product   | Workspace               | Ownership                                       |
| --------- | ----------------------- | ----------------------------------------------- |
| Portfolio | `@jayant/portfolio-web` | Public professional and editorial content       |
| Studio    | `@jayant/studio-web`    | Product catalog, utilities, games, workspaces   |
| Admin     | `@jayant/admin-web`     | Portfolio CMS, users, deployment operations     |
| Auth      | `@jayant/auth-web`      | Sign-in, recovery, MFA, profile, account safety |

Every current client is Next.js 16, React 19, TypeScript 5.9, and Tailwind CSS
v4. Next.js request middleware is `src/proxy.ts`, not `middleware.ts`. Use the
application-local `@/*` alias for its `src/*` files.

## Shared ownership

- `@jayant/identity`: framework-neutral person and product identity.
- `@jayant/web-brand`: web metadata and synchronized web asset paths.
- `@jayant/web-urls`: canonical web origins and URL rewriting.
- `@jayant/web-seo`: shared Next.js metadata/indexability helpers.
- `@jayant/web-auth`: Supabase SSR, session, entry, redirect, profile, password,
  and logout contracts.
- `@jayant/web-ui`: shared Studio/Admin/Auth components and application shell.
- `@jayant/portfolio-contracts`: Portfolio/Admin data and validation contract.
- `@jayant/github`: provider integration used by Portfolio and Studio.
- `@jayant/tailwind-config`, `@jayant/eslint-config`, and
  `@jayant/typescript-config`: shared web/tooling configuration.

Portfolio deliberately owns its editorial component system and must not import
the shared application shell or application-surface stylesheet.

## Supabase safety

The canonical linked project is `jayantgoyal` (`orwfvyditlguqvxvztkw`). Read
[docs/database/supabase.md](docs/database/supabase.md) before database work.

- Select the intended `jg_account`, `jg_app`, or `portfolio` schema explicitly.
- Check every Supabase error.
- Never expose a service-role key to client code.
- Portfolio and Auth must not use a service-role key.
- Treat `supabase/.temp` as machine-local and never commit it.
- Inspect local/remote migration history before any remote apply.
- Never edit an applied migration. Add a new reviewed migration.
- Use the dedicated remote-migration workflow for an approved apply; never
  apply from the source clone or an ordinary worktree.
- After an apply, refresh and review all canonical schema snapshots.

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
pnpm --filter @jayant/portfolio-web dev
pnpm --filter @jayant/studio-web dev
pnpm --filter @jayant/admin-web dev
pnpm --filter @jayant/auth-web dev

pnpm check:architecture
pnpm check:brand-assets
pnpm check:service-role
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
