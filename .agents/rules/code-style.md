# Code Style Rules

## Imports
- Use `@/*` alias for all `src/` imports.
- Import UI components from `@repo/ui/<component>`.
- Import `cn()` from `@repo/ui/lib/utils`.

## Components
- Use CVA (`class-variance-authority`) for component variants.
- Merge classes with `cn()`, never string concatenation.
- Use `sonner` toasts (`toast.success()`, `toast.error()`) for user feedback.
- Use plain `<img>` for external URLs — never `next/image` `<Image>`.

## State
- Zustand stores must use `persist` middleware with `skipHydration: true`.
- Hydrate stores manually to avoid SSR mismatch.
- Use `useTheme()` with a `mounted` guard for theme-dependent rendering.

## Pages
- Server component `page.tsx` exports `metadata` and renders a client component.
- Client component lives in `client.tsx` with `'use client'` directive.
- All protected pages use `<PageSpinner />` for loading UI.
