# Studio

Product discovery plus public utilities, games, and account-backed personal
workspaces.

- Production: [studio.jayantgoyal.com](https://studio.jayantgoyal.com)
- Package/filter: `studio`
- Local port: `3001`
- Access: mixed public and authenticated surfaces

## Product Surfaces

| Surface                | Primary route                   | Access                             |
| ---------------------- | ------------------------------- | ---------------------------------- |
| Studio home            | `/`                             | Public                             |
| Product catalog/detail | `/products`, `/products/[slug]` | Public                             |
| Tech Tools             | `/tools/*`                      | Public                             |
| Weather                | `/weather`                      | Public                             |
| GitHub Stats           | `/github-stats`                 | Public                             |
| Calculator Builder     | `/custom-calculator`            | Public beta                        |
| Game Hub               | `/games/*`                      | Account-backed; modes vary by game |
| Activity Tracker       | `/activity-tracker/dashboard`   | Account-backed                     |
| Currency Calculator    | `/calculator/new`               | Account-backed                     |
| File Manager           | `/files/*`                      | Account-backed                     |
| Sync Scratchpad        | `/scratchpad`                   | Account-backed beta                |

Studio also links to the separately deployed Portfolio, Writing, and external
E-commerce experiment. Professional content belongs to Portfolio; historical
Studio paths redirect to its canonical origin.

## Canonical Registries

Do not hand-maintain separate feature inventories. Use:

- `src/lib/config/studio-inventory.ts` for catalog entries.
- `src/lib/config/studio-surfaces.ts` for route/access ownership.
- `src/lib/config/hub-config.ts` for sidebar navigation.
- `src/lib/tools/tools.ts` for all tool categories and routes.
- `src/lib/games/config.ts` for game names and supported modes.

The current registries contain 10 catalog entries, 87 tools across 11
categories, and 9 games.

## Authentication and Access

`src/proxy.ts` handles request-level auth state, MFA, recovery, terms, protected
APIs, public fast paths, and trusted request headers. The `(protected)` route
group supplies the shared application shell, but public routes within it are
released by `components/auth/auth-gate.tsx`.

Auth is the normal owner of sign-in and account-security flows. Studio keeps
`/welcome`, recovery, callback, and MFA compatibility routes for controlled
rollback through `NEXT_PUBLIC_AUTH_FLOW_OWNER`.

## Data

Studio uses:

- `jg_account.profiles` for account and terms state.
- `jg_app` tables for Activity Tracker, Currency Calculator, File Manager,
  Game Hub, Scratchpad, tool favorites/history, and typing results.
- `private-files` for user-owned file storage.
- Supabase Realtime for synchronized product experiences.

RLS is the default authorization boundary. Server-only service-role usage is
limited to explicitly authorized account deletion and transactional game
operations.

## Environment

Use `.env.example` as the contract. Studio requires Supabase configuration,
the server-only service role, a Wordle seed, Auth routing/session values, its
application origins, OpenWeather, and GitHub configuration.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `WORDLE_SEED_SECRET`, or
`GITHUB_TOKEN` to client modules.

## Development

```bash
pnpm --filter studio dev
pnpm --filter studio test
pnpm --filter studio lint
pnpm --filter studio check-types
pnpm --filter studio build
```

For public routes, keep route metadata, `app/sitemap.ts`, the proxy public-path
lists, the client auth gate, and Studio registries synchronized.
