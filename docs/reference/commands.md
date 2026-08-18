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

## LinkedIn publishing

These commands operate the manual LinkedIn tooling documented in [LinkedIn
publishing operations](../operations/linkedin-publishing.md).

| Command                                                        | Purpose                                           |
| -------------------------------------------------------------- | ------------------------------------------------- |
| `node scripts/linkedin/auth.mjs`                               | Authorize or renew the local member access token  |
| `node scripts/linkedin/post.mjs "Post text"`                   | Publish text and record it in local history       |
| `node scripts/linkedin/post.mjs "Post text" --url <url>`       | Publish text with an attached article URL         |
| `node scripts/linkedin/post.mjs --writing <slug>`              | Publish the default announcement for a writing    |
| `node scripts/linkedin/manage.mjs list`                        | List tracked posts and their current indices      |
| `node scripts/linkedin/manage.mjs edit <index> "New text"`     | Delete and replace a tracked post                 |
| `node scripts/linkedin/manage.mjs delete <index>`              | Delete a tracked post and update local history    |

The post command publishes immediately. The management `edit` command is a
delete-and-repost operation, so it changes the post URL and loses existing
reactions and comments.
