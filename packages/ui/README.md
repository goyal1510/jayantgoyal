# @repo/ui

Shared React component library for the monorepo.

## Usage

```tsx
// Import components
import { Button } from '@repo/ui/button';
import { Card } from '@repo/ui/card';

// Import styles in app layout
import '@repo/ui/styles.css';
```

## Tech Stack

- **React 19** - Component library
- **Tailwind CSS v4** - Styling
- **class-variance-authority** - Component variants
- **clsx + tailwind-merge** - Class composition via `cn()`

## Components

Components are exported individually for tree-shaking:

```
@repo/ui/button
@repo/ui/card
@repo/ui/input
@repo/ui/label
@repo/ui/checkbox
@repo/ui/dropdown-menu
@repo/ui/dialog
@repo/ui/tooltip
...
```

## Development

```bash
# Watch styles
pnpm --filter @repo/ui dev:styles

# Watch components
pnpm --filter @repo/ui dev:components
```

## Build

Built with:
- **Tailwind CLI** - Compiles styles to `dist/styles.css`
- **tsc** - Compiles components to `dist/`

## cn() Helper

Utility for merging Tailwind classes:

```tsx
import { cn } from '@repo/ui/lib/utils';

<div className={cn(
  'base-styles',
  isActive && 'active-styles',
  className
)} />
```
