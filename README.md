# Jayant Goyal

pnpm + Turbo monorepo with Next.js App Router apps and shared UI/config packages. Everything is TypeScript and React 19.

## Apps
- `apps/base`: Next 16 + Supabase; dev `pnpm dev --filter base` (port 3000), prod `pnpm start --filter base` (port 3001) after `pnpm build --filter base`. App code in `src/app/`, shared UI in `src/components`, hooks in `src/hooks`, assets in `public/`.
- `apps/portfolio/portfolio`: Next 16 portfolio site; dev `pnpm dev --filter portfolio` (port 3002), prod `pnpm start --filter portfolio` after build.

## Packages
- `@repo/ui`: React 19 + Tailwind v4 component kit; import styles via `@repo/ui/styles.css`. Build with `pnpm --filter @repo/ui build:styles` then `build:components` (or watch via `dev:*`).
- `@repo/tailwind-config`: Shared Tailwind/PostCSS config.
- `@repo/eslint-config`: Flat ESLint configs (base, Next, React) used across apps.
- `@repo/typescript-config`: Strict TS configs for apps and libraries.

## Getting Started
- Requirements: Node >=18, pnpm.
- Install deps: `pnpm install`.

## Development
- Run graph: `pnpm dev` (Turbo). Focused app: `pnpm dev --filter base` or `pnpm dev --filter portfolio`.
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
