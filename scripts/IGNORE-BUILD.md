# Vercel Ignored Build Step

Prevents unnecessary deployments when changes don't affect an app.

## Setup

**Vercel Dashboard > Project Settings > Git > Ignored Build Step:**

| Project | Command |
|---------|---------|
| jayantgoyal | `bash ../../scripts/ignore-build.sh apps/jayantgoyal` |
| admin | `bash ../../scripts/ignore-build.sh apps/admin` |

**Important:** Uncheck "Skip deployments when there are no changes to the root directory or its dependencies" — our script handles all skip logic.

## How It Works

The script runs `git diff HEAD^ HEAD` from the repo root and checks for changes in:

- `$APP_DIR` (the app's directory)
- `packages/` (shared packages)
- `turbo.json` (build pipeline config)
- `pnpm-lock.yaml` (dependency lockfile)

If none of these changed, the build is skipped (exit 0). If any changed, the build proceeds (exit 1).

## Behavior Matrix

| Change | jayantgoyal | admin |
|--------|------------|-------|
| `apps/jayantgoyal/` only | Builds | Skips |
| `apps/admin/` only | Skips | Builds |
| Both apps | Builds | Builds |
| `packages/` (shared code) | Builds | Builds |
| `turbo.json` | Builds | Builds |
| `pnpm-lock.yaml` (any dep change) | Builds | Builds |
| Non-dependable (`.claude/`, `docs/`, `scripts/`, etc.) | Skips | Skips |

All scenarios verified on 2026-04-02.
