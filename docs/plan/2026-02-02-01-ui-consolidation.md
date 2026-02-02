# Shared UI Component Consolidation — Implementation Plan

**Date:** 2026-02-02
**Feature:** Consolidate duplicated UI components into `@repo/ui` shared package

## Summary

Convert `packages/ui` from a compiled demo package (Turborepo starter components with `ui:` prefixed Tailwind) into an internal source-export package containing all shared UI components. Apps import TypeScript source directly via `transpilePackages`, eliminating duplication across 3 apps.

---

## 1. Current state (duplication analysis)

| Component | jayantgoyal | admin | url-shortener |
|-----------|:-----------:|:-----:|:-------------:|
| button, card, input, badge, sonner, dialog, dropdown-menu, label, skeleton, switch | x | x | x |
| avatar, breadcrumb, collapsible, select, separator, sheet, sidebar, tooltip, textarea | x | x | - |
| checkbox, context-menu, flip-text, logo-slider, progress, scroll-area, spinner, table, typewriter | x | - | - |

- **19 components** fully duplicated between jayantgoyal and admin
- **10 components** duplicated across all 3 apps
- **~5,500+ lines** of redundant code
- `@repo/ui` currently only has demo components (card, gradient, turborepo-logo) with `ui:` prefix classes — unused in practice

### Implementation divergence

- **jayantgoyal**: Modern React 19 pattern for button/input (no `forwardRef`, `React.ComponentProps<>`, `data-slot` attributes)
- **admin/url-shortener**: Older `React.forwardRef` pattern
- **5 shared components** in jayantgoyal still use `forwardRef` and need modernizing: card, label, textarea, switch, select

---

## 2. Approach — Internal source-export package

Export TypeScript source directly from `packages/ui/src/`. Apps transpile it via Next.js `transpilePackages`. No build step for components.

Benefits:
- No separate tsc build for components
- Tailwind JIT scans source directly
- `"use client"` directives preserved naturally
- Standard Turborepo pattern for internal packages

---

## 3. Package restructure (`packages/ui/`)

### 3a. New `package.json`

Remove `"files": ["dist"]`, `"sideEffects"`, build scripts. Change exports to point at source:

```json
{
  "exports": {
    "./lib/utils":        "./src/lib/utils.ts",
    "./hooks/use-mobile": "./src/hooks/use-mobile.ts",
    "./*":                "./src/components/*.tsx"
  }
}
```

**Dependencies to add** (moved from apps):

| Package | Version |
|---------|---------|
| `@radix-ui/react-avatar` | `^1.1.11` |
| `@radix-ui/react-collapsible` | `^1.1.12` |
| `@radix-ui/react-dialog` | `^1.1.15` |
| `@radix-ui/react-dropdown-menu` | `^2.1.16` |
| `@radix-ui/react-label` | `^2.1.8` |
| `@radix-ui/react-select` | `^2.2.6` |
| `@radix-ui/react-separator` | `^1.1.8` |
| `@radix-ui/react-slot` | `^1.2.4` |
| `@radix-ui/react-switch` | `^1.1.4` |
| `@radix-ui/react-tooltip` | `^1.2.8` |
| `class-variance-authority` | `^0.7.1` |
| `clsx` | `^2.1.1` |
| `tailwind-merge` | `^3.4.0` |
| `lucide-react` | `^0.554.0` |
| `sonner` | `^2.0.7` |
| `next-themes` | `^0.4.6` |

**peerDependencies:** `react ^19`, `react-dom ^19`, `next ^16`

**Remove from devDependencies:** `@tailwindcss/cli`, `tailwindcss`, `@repo/tailwind-config`

### 3b. New `tsconfig.json`

```json
{
  "extends": "@repo/typescript-config/react-library.json",
  "compilerOptions": {
    "noEmit": true,
    "module": "ESNext",
    "moduleResolution": "bundler"
  },
  "include": ["src"],
  "exclude": ["dist", "build", "node_modules"]
}
```

Source is transpiled by Next.js, so bundler resolution is correct.

### 3c. Simplified `turbo.json`

```json
{
  "extends": ["//"],
  "tasks": {
    "build": {}
  }
}
```

Empty build task satisfies the `^build` dependency chain without doing anything.

### 3d. Delete old files

- `src/card.tsx`, `src/gradient.tsx`, `src/turborepo-logo.tsx`, `src/styles.css`
- Entire `dist/` directory

---

## 4. New file structure

```
packages/ui/src/
  lib/
    utils.ts                ← cn() utility (clsx + tailwind-merge)
  hooks/
    use-mobile.ts           ← useIsMobile() hook (used by sidebar)
  components/
    button.tsx              ← Tier 1 (all 3 apps)
    card.tsx
    input.tsx
    badge.tsx
    sonner.tsx
    dialog.tsx
    dropdown-menu.tsx
    label.tsx
    skeleton.tsx
    switch.tsx
    avatar.tsx              ← Tier 2 (jayantgoyal + admin)
    breadcrumb.tsx
    collapsible.tsx
    select.tsx
    separator.tsx
    sheet.tsx
    sidebar.tsx
    tooltip.tsx
    textarea.tsx
```

**Source:** Copy from `apps/jayantgoyal/src/components/ui/` (canonical, most modern versions).

---

## 5. Modernize forwardRef components

Convert 5 components to modern React 19 pattern before placing in package:

| Component | Sub-components using forwardRef |
|-----------|-------------------------------|
| `card.tsx` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| `label.tsx` | Label |
| `textarea.tsx` | Textarea |
| `switch.tsx` | Switch |
| `select.tsx` | SelectTrigger, SelectScrollUpButton, SelectScrollDownButton, SelectContent, SelectLabel, SelectItem, SelectSeparator |

Conversion pattern:
```tsx
// Before (old):
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("...", className)} {...props} />
  )
)
Card.displayName = "Card"

// After (modern React 19):
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("...", className)} {...props} />
}
```

- `ref` passed automatically via `...props` in React 19
- Add `data-slot="component-name"` for consistency
- Remove `.displayName` assignments
- For Radix-wrapped components, use `React.ComponentProps<typeof RadixComponent>`

---

## 6. Fix internal imports within package

All `@/` path aliases must become relative imports:

| Old import | New import |
|-----------|-----------|
| `@/lib/utils` | `../lib/utils` |
| `@/hooks/use-mobile` | `../hooks/use-mobile` |
| `@/components/ui/button` | `./button` |
| `@/components/ui/sheet` | `./sheet` |
| (etc. for all sidebar.tsx cross-component imports) | |

---

## 7. Update consuming apps

### 7a. App configs

| App | Change |
|-----|--------|
| jayantgoyal `next.config.ts` | Add `transpilePackages: ["@repo/ui"]` |
| admin `package.json` | Add `"@repo/ui": "workspace:*"` to dependencies |
| url-shortener `package.json` | Add `"@repo/ui": "workspace:*"` to dependencies |

### 7b. Tailwind content scanning

| App | Change |
|-----|--------|
| jayantgoyal `tailwind.config.ts` | Add `"../../packages/ui/src/**/*.{ts,tsx}"` to content array |
| admin | Relies on Tailwind v4 auto-detection (no config file) |
| url-shortener | Relies on Tailwind v4 auto-detection (no config file) |

### 7c. Remove old CSS import

- jayantgoyal `src/app/layout.tsx`: Delete `import "@repo/ui/styles.css"` (line 1)

---

## 8. Update import paths across apps

Replace `@/components/ui/<name>` with `@repo/ui/<name>` for all 19 shared components in every file across all 3 apps.

**Do NOT change** imports for jayantgoyal-only components (checkbox, context-menu, flip-text, logo-slider, progress, scroll-area, spinner, table, typewriter).

**Also update** jayantgoyal-only components that reference shared ones (e.g., if `context-menu.tsx` imports `@/components/ui/button`, change to `@repo/ui/button`).

Estimated scale: ~160 files across all 3 apps.

---

## 9. Delete moved files from apps

| App | Files to delete |
|-----|----------------|
| jayantgoyal | 19 component files from `src/components/ui/` |
| admin | All 19 files from `src/components/ui/` + `src/hooks/use-mobile.ts` |
| url-shortener | All 10 files from `src/components/ui/` |

---

## 10. Clean up app dependencies

| App | Remove from dependencies |
|-----|------------------------|
| jayantgoyal | 10 `@radix-ui/*` packages (keep checkbox, context-menu, progress, scroll-area for local components) |
| admin | All `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge` (if no local components need them) |
| url-shortener | All `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge` (if no local components need them) |

---

## 11. Verification

```bash
pnpm install          # Resolve new dependency graph
pnpm check-types      # TypeScript across all packages and apps
pnpm lint             # ESLint (zero warnings)
pnpm build            # All apps build successfully
```

---

## Key design decisions

| Decision | Rationale |
|----------|-----------|
| Source exports (not compiled) | Simpler, no build step, Tailwind JIT scans source directly |
| jayantgoyal as canonical source | Most modern React 19 patterns, already working perfectly |
| Modernize remaining forwardRef components | Consistent pattern across all shared components |
| `cn()` in package, not apps | Components need it internally; apps can re-export or import from `@repo/ui/lib/utils` |
| `use-mobile` hook in package | Sidebar depends on it; cleaner than external injection |
| Delete old demo components | `ui:` prefix approach not used; no backward compatibility needed |
| Empty build task in turbo.json | Satisfies `^build` dependency graph without doing work |
