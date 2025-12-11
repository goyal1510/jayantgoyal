# Repository Guidelines

This monorepo uses pnpm, Turbo, and Next.js (App Router) with shared UI/config packages. Keep changes scoped, typed, and consistent with the existing apps and packages.

## Project Structure & Module Organization
- `apps/`: product surfaces. Notable: `portfolio` (Next 16), `game-hub`, `weather`, `currency-calculator`, `custom-drag-drop-calculator`.
- `packages/`: shared building blocks. `@repo/ui` (React 19 + Tailwind v4 components), `@repo/tailwind-config`, `@repo/eslint-config`, `@repo/typescript-config`.
- Root configs: `turbo.json` for task graph and env passthrough; `pnpm-workspace.yaml` defines workspaces.

## Build, Test, and Development Commands
- Install: `pnpm install` (Node >=18).
- Dev: `pnpm dev` to run all dev tasks; focus an app with `pnpm dev --filter portfolio`.
- Build: `pnpm build` (Turbo orchestrates; respects `.env*` inputs).
- Lint: `pnpm lint`; Type check: `pnpm check-types`; Format: `pnpm format`.
- UI package: `pnpm --filter @repo/ui dev:styles` and `dev:components` to watch CSS/TS; `build:styles` and `build:components` for production outputs.

## Coding Style & Naming Conventions
- Prettier (with `prettier-plugin-tailwindcss`) formats code and sorts class names; default 2-space indentation.
- ESLint configs live in `packages/eslint-config`; keep warnings at zero by fixing or annotating intentionally.
- TypeScript strict configs come from `@repo/typescript-config`; avoid `any` and prefer typed props/hooks.
- Components export in PascalCase; filenames may remain lowercase. Keep shared styles in `@repo/ui/styles.css` and import Tailwind config from `@repo/tailwind-config`.

## Testing Guidelines
- No global test task yet; when adding tests, colocate `*.test.ts(x)` or `*.spec.ts(x)` beside the code in `apps/<app>/` or `packages/ui` and wire a `test` script into Turbo for repeatability.
- Cover data formatting, conditional UI states, and API boundary behaviors; prefer lightweight mocking over network calls.

## Commit & Pull Request Guidelines
- Use concise, imperative commit messages (see history: “Fix guest login redirect to home”). Group related changes per commit.
- PRs should include: summary of scope, affected app/package, screenshots for UI changes, steps to reproduce/verify, and linked issues if applicable.
- Call out environment variable changes (e.g., `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GUEST_*`) and never commit `.env*` files.
