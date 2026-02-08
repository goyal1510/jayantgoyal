# @repo/tailwind-config

Shared Tailwind CSS v4 configuration for the monorepo.

## Usage

```ts
// tailwind.config.ts
import baseConfig from '@repo/tailwind-config';

export default {
  ...baseConfig,
  content: ['./src/**/*.{ts,tsx}'],
};
```

## Custom Theme

### Colors

Extended color palette with deep variants:

```css
--color-blue-1000
--color-purple-1000
--color-red-1000
```

### Dark Mode

Uses class strategy via `next-themes`:

```tsx
<ThemeProvider attribute="class" defaultTheme="system">
  {children}
</ThemeProvider>
```

## PostCSS

Includes shared PostCSS config with `@tailwindcss/postcss`.
