# @repo/eslint-config

Shared ESLint flat configurations for the monorepo.

## Configs

| Config | Use Case |
|--------|----------|
| `base` | Base TypeScript rules |
| `next-js` | Next.js apps |
| `react` | React libraries |

## Usage

```js
// eslint.config.js
import { nextJsConfig } from '@repo/eslint-config/next-js';

export default nextJsConfig;
```

## Rules

- Strict TypeScript checks
- React hooks rules
- Next.js specific rules
- Zero warnings allowed (`--max-warnings 0`)
