# Commands

Run repository commands from the monorepo root unless a page says otherwise.

## Development and build

| Command                                        | Purpose                              |
| ---------------------------------------------- | ------------------------------------ |
| `pnpm install`                                 | Install the frozen workspace graph   |
| `pnpm dev`                                     | Run all client development tasks     |
| `pnpm --filter @jayantgoyal/<product>-web dev` | Run one product web client           |
| `pnpm build`                                   | Build every workspace                |
| `pnpm format`                                  | Format TypeScript and Markdown files |

## Required quality

| Command                    | Purpose                                             |
| -------------------------- | --------------------------------------------------- |
| `pnpm check:architecture`  | Enforce product/package dependency boundaries       |
| `pnpm check:brand-assets`  | Verify canonical favicon copies                     |
| `pnpm check:identity`      | Enforce public identity and workspace namespace     |
| `pnpm check:seo`           | Verify shared metadata and tool-description policy  |
| `pnpm check:service-role`  | Enforce privileged-client and Portfolio boundaries  |
| `pnpm check:source-health` | Enforce the 500-line limit and 400-line alert       |
| `pnpm check:dead-code`     | Find unused files, exports, types, and dependencies |
| `pnpm check:docs`          | Validate central docs structure and links           |
| `pnpm lint`                | Run ESLint with zero warnings                       |
| `pnpm check-types`         | Generate routes and run strict TypeScript checks    |
| `pnpm test`                | Run all Vitest projects                             |
| `pnpm db:migrations:check` | Compare linked local/remote migration history       |

`pnpm test:db:linked` mutates remote test records and is not a normal quality
gate. Run it only with explicit authorization. `pnpm check:bundle-budgets`
performs expensive builds and analysis for bundle-budget work.
