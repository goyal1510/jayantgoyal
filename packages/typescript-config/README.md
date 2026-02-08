# @repo/typescript-config

Shared TypeScript configurations for the monorepo.

## Configs

| Config | Use Case |
|--------|----------|
| `base.json` | Base strict config |
| `nextjs.json` | Next.js apps |
| `react-library.json` | React packages |

## Usage

```json
// tsconfig.json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Compiler Options

- `strict: true` - Full strict mode
- `noEmit: true` - For apps (Next.js handles emit)
- `declaration: true` - For libraries
- Path alias: `@/*` -> `src/*`
