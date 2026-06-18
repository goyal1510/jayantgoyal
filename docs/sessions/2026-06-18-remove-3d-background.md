# 2026-06-18 - Remove 3D Background

## Area

- `apps/jayantgoyal`

## Problem

The app includes 3D background visuals and a UI toggle for them. The user does not like the 3D background effect and wants it removed.

## Plan

- Find the 3D background/provider components and where they are mounted.
- Remove the 3D background rendering and related toggle UI from the app shell.
- Clean up any now-unused imports/components while keeping unrelated app behavior unchanged.
- Run lint, type-check, and a production build for the main app.

## Implementation

- Removed the protected layout mount for `LazyThreeBgWrapper`.
- Removed the header `ThreeBgToggle` control so users no longer see a 3D background button.
- Removed the lazy 3D wrapper export from `lazy-components.tsx`.
- Deleted the `components/three` background implementation files and the persisted `use-three-bg-store`.
- Removed CSS rules that made the shell/cards transparent when `data-three-bg="active"` was set.
- Removed unused 3D dependencies from the main app: `@react-three/drei`, `@react-three/fiber`, `three`, and `@types/three`.

## Validation

- Confirmed no remaining `@react-three`, `three-bg`, `ThreeBg`, `data-three-bg`, or `components/three` references in app source/package files.
- Initial validation after dependency removal hit an incomplete local install state (`@eslint/js` and workspace dependency types missing); ran `pnpm install` to restore workspace dependencies before rerunning checks.
- `pnpm --filter jg lint` passed.
- `pnpm --filter jg check-types` passed.
- `pnpm build --filter jg` passed. Build still reports the existing `@repo/ui` output warning.
- Started the main app locally at `http://localhost:3003` and fetched a blog page; response was `200` and the rendered HTML did not contain `Toggle 3D background`, `three-bg`, or `data-three-bg`.

## Shipping

- Switched GitHub CLI to the personal `goyal1510` account for this personal repo.
- Verified the branch contains the latest fetched `origin/main` before staging.
- Ran `git diff --check`; no whitespace errors.
- Security review notes: this removes client-rendered visual code and dependencies only; no auth, database, service-role, env var, or user-data handling changes.
