# Jayant Goyal

pnpm + Turbo monorepo with Next.js App Router apps and shared UI/config packages. Everything is TypeScript and React 19.

## Apps
- `apps/portfolio/`: Next 16 portfolio site; dev `pnpm dev --filter portfolio` (port 3000), prod `pnpm start --filter portfolio` after build.
- `apps/activity-tracker/`: Supabase-authenticated activity tracking tool for monitoring daily activities with performance KPIs; dev `pnpm dev --filter atrack`.
- `apps/currency-calculator/`: Supabase-authenticated currency breakdown tool for INR with saved calculation history; dev `pnpm dev --filter ccal`.
- `apps/custom-drag-drop-calculator/`: Customizable calculator with drag-and-drop button/operator layout; dev `pnpm dev --filter customcal`.
- `apps/game-hub/`: Mini-game hub (Tic Tac Toe, Rock Paper Scissors, Dare X) with Supabase auth; dev `pnpm dev --filter ghub`.
- `apps/supabase-manager/`: Multi-project Supabase management interface with user management; dev `pnpm dev --filter smanager`.
- `apps/tech/`: Collection of 99+ developer tools and utilities (generators, converters, parsers, validators, formatters); dev `pnpm dev --filter tech`.
- `apps/weather/`: Weather dashboard powered by OpenWeather API with city search and 5-day forecast; dev `pnpm dev --filter weather`.

## Packages
- `@repo/ui`: React 19 + Tailwind v4 component kit; import styles via `@repo/ui/styles.css`. Build with `pnpm --filter @repo/ui build:styles` then `build:components` (or watch via `dev:*`).
- `@repo/tailwind-config`: Shared Tailwind/PostCSS config.
- `@repo/eslint-config`: Flat ESLint configs (base, Next, React) used across apps.
- `@repo/typescript-config`: Strict TS configs for apps and libraries.

## Getting Started
- Requirements: Node >=18, pnpm.
- Install deps: `pnpm install`.

## Development
- Run all apps: `pnpm dev` (Turbo orchestrates the dev graph).
- Run a specific app: `pnpm dev --filter <app-name>` (e.g., `pnpm dev --filter portfolio`, `pnpm dev --filter atrack`, `pnpm dev --filter ccal`).
- UI package during dev: `pnpm --filter @repo/ui dev:styles` and `pnpm --filter @repo/ui dev:components` to watch CSS/TS output.
- Import `@repo/ui/styles.css` and `@repo/tailwind-config` in global styles for shared theming.

## Quality and Builds
- Lint: `pnpm lint`.
- Type check: `pnpm check-types` (includes Next typegen).
- Build: `pnpm build` (Turbo orchestrated across workspaces).
- Format: `pnpm format` (Prettier + Tailwind class sorting).

## Environment
- Key vars (see `turbo.json`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GUEST_EMAIL_LOGIN`, `GUEST_PASSWORD_LOGIN`. Keep them in local `.env*`, not in VCS.

## Notes
- ESLint warns on undeclared env vars (`turbo/no-undeclared-env-vars`); declare them in `.env*`.
- Components export in PascalCase; file names may remain lowercase.
