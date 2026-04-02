# Vercel Ignored Build Step

Prevents unnecessary deployments in our Turborepo monorepo when changes don't affect an app.

---

## Problem

This monorepo has two apps deployed as separate Vercel projects:

- **jayantgoyal** (Root Directory: `apps/jayantgoyal`)
- **admin** (Root Directory: `apps/admin`)

Both projects had "Include files outside the root directory in the Build Step" enabled (required for monorepo builds to access shared `packages/`). This meant **any** push to `main` — even changes to `.claude/`, `docs/`, `scripts/`, or `CLAUDE.md` — triggered full rebuilds of **both** apps, wasting build minutes and causing unnecessary deployments.

Vercel's built-in "Skip deployments when there are no changes to the root directory or its dependencies" checkbox was insufficient because:
1. It only checked the app's root directory, not shared dependencies like `packages/` or `pnpm-lock.yaml`
2. It conflicted with the custom Ignored Build Step — Vercel's built-in check would preempt our script, causing it to skip builds even when `pnpm-lock.yaml` changed (lockfile lives at repo root, outside the app's root directory)

---

## Solution

Created a custom `scripts/ignore-build.sh` script that Vercel runs as the **Ignored Build Step** before every build. The script determines whether the commit contains changes relevant to the specific app.

### Script: `scripts/ignore-build.sh`

```bash
#!/bin/bash
APP_DIR="${1:?Usage: ignore-build.sh <app-directory>}"
cd "$(git rev-parse --show-toplevel)" || exit 1
echo "Checking for changes in: $APP_DIR, packages/, turbo.json, pnpm-lock.yaml"
git diff HEAD^ HEAD --quiet -- \
  "$APP_DIR" \
  packages \
  turbo.json \
  pnpm-lock.yaml
```

**How it works:**
- `git diff HEAD^ HEAD --quiet` compares the current commit against its parent
- `--quiet` makes git exit with code **0** if no changes found (Vercel **skips** build) or **1** if changes found (Vercel **proceeds** with build)
- `cd "$(git rev-parse --show-toplevel)"` ensures paths resolve from the repo root, not the app's root directory (critical fix — without this, paths like `apps/jayantgoyal` would be resolved relative to the Vercel Root Directory setting)

### Watched paths

| Path | Reason |
|------|--------|
| `$APP_DIR` (`apps/jayantgoyal` or `apps/admin`) | Direct app code changes |
| `packages/` | Shared UI components, configs, utilities used by both apps |
| `turbo.json` | Build pipeline configuration — changes here can affect build behavior |
| `pnpm-lock.yaml` | Dependency lockfile — any `pnpm add/remove` at root or app level modifies this file, and resolved dependency versions could affect any app |

### Ignored paths (no build triggered)

`.claude/`, `docs/`, `scripts/`, `supabase/`, `CLAUDE.md`, `README.md`, `.github/`, and any other file/directory not in the watched list above.

---

## Setup

### Vercel Dashboard Configuration

**For each project: Project Settings > Git > Ignored Build Step**

| Project | Command |
|---------|---------|
| jayantgoyal | `bash ../../scripts/ignore-build.sh apps/jayantgoyal` |
| admin | `bash ../../scripts/ignore-build.sh apps/admin` |

> The `../../` prefix is required because Vercel runs the Ignored Build Step from the app's **Root Directory** (`apps/jayantgoyal` or `apps/admin`), not the repo root.

**Important:** The "Skip deployments when there are no changes to the root directory or its dependencies" checkbox must be **unchecked** for both projects. This built-in check conflicts with the custom script — it runs first and can skip builds before the script executes, causing missed deployments when `pnpm-lock.yaml` changes.

---

## Implementation Timeline

### Iteration 1: Initial script
- **Commit:** `0081b2a` — Created `scripts/ignore-build.sh`
- **Vercel command:** `bash scripts/ignore-build.sh apps/jayantgoyal`
- **Result:** `bash: scripts/ignore-build.sh: No such file or directory`
- **Root cause:** Vercel runs the Ignored Build Step from the Root Directory (`apps/jayantgoyal`), not the repo root. The path `scripts/ignore-build.sh` didn't exist relative to `apps/jayantgoyal/`.

### Iteration 2: Fixed path with `../../` prefix
- **Commit:** `195f18c` — Updated command docs
- **Vercel command:** `bash ../../scripts/ignore-build.sh apps/jayantgoyal`
- **Result:** Both apps canceled — script ran but `git diff` paths (`apps/jayantgoyal`, `packages`) were still resolving relative to the app directory, not the repo root.
- **Root cause:** `git diff` was running from `apps/jayantgoyal/` working directory, so paths like `apps/jayantgoyal` resolved to `apps/jayantgoyal/apps/jayantgoyal` (which doesn't exist), meaning no changes were ever detected.

### Iteration 3: Added `cd` to repo root
- **Commit:** `f662f9b` — Added `cd "$(git rev-parse --show-toplevel)"` before `git diff`
- **Result:** jayantgoyal still canceled — but this was because the weather page change was in the previous commit (`478db99`), and the current commit only changed `scripts/ignore-build.sh` (not a watched path). The script was actually working correctly.

### Iteration 4: Clean test with fixed script
- **Commit:** `8eede12` — jayantgoyal-only change (weather page)
- **Result:** jayantgoyal built, admin skipped. Script working correctly.

### Iteration 5: Discovered built-in check conflict
- **Commit:** `c1a4692` — App-level `pnpm add` (changed `apps/jayantgoyal/package.json` + `pnpm-lock.yaml`)
- **Result:** admin showed "Skipped - Not affected" instead of "Canceled by Ignored Build Step"
- **Root cause:** Vercel's built-in "Skip deployments when there are no changes to the root directory or its dependencies" was **still enabled**. It ran **before** the custom script, saw no changes in `apps/admin/`, and skipped the build without ever executing `ignore-build.sh`. The lockfile change at the repo root was missed.
- **Fix:** Unchecked the built-in skip option on both Vercel projects, relying entirely on the custom script.

---

## Verification Results

Full test suite run on **2026-04-02** after all fixes applied (built-in skip disabled, script with `cd` to repo root).

### Test 1: jayantgoyal-only change
- **Commit:** `2dead75`
- **Changed:** `apps/jayantgoyal/src/app/(protected)/weather/page.tsx`
- **Expected:** jayantgoyal builds, admin skips
- **Result:** jayantgoyal: `Deployment has completed` | admin: `Canceled by Ignored Build Step`

### Test 2: admin-only change
- **Commit:** `031b34e`
- **Changed:** `apps/admin/src/app/unauthorized/page.tsx`
- **Expected:** admin builds, jayantgoyal skips
- **Result:** admin: `Deployment has completed` | jayantgoyal: `Canceled by Ignored Build Step`

### Test 3: both apps changed
- **Commit:** `9dc66f8`
- **Changed:** `apps/jayantgoyal/src/app/(protected)/weather/page.tsx`, `apps/admin/src/app/unauthorized/page.tsx`
- **Expected:** both build
- **Result:** jayantgoyal: `Deployment has completed` | admin: `Deployment has completed`

### Test 4: non-dependable file
- **Commit:** `403c30a`
- **Changed:** `.claude/README.md`
- **Expected:** both skip
- **Result:** jayantgoyal: `Canceled by Ignored Build Step` | admin: `Canceled by Ignored Build Step`

### Test 5: lockfile change (app-level dependency removal)
- **Commit:** `932b878`
- **Changed:** `apps/jayantgoyal/package.json`, `pnpm-lock.yaml`
- **Expected:** both build (lockfile is a shared dependency)
- **Result:** jayantgoyal: `Deployment has completed` | admin: `Deployment has completed`

### Summary

| # | Scenario | jayantgoyal | admin | Pass |
|---|----------|------------|-------|------|
| 1 | `apps/jayantgoyal/` only | Built | Skipped | Yes |
| 2 | `apps/admin/` only | Skipped | Built | Yes |
| 3 | Both apps changed | Built | Built | Yes |
| 4 | Non-dependable (`.claude/`) | Skipped | Skipped | Yes |
| 5 | Lockfile change (`pnpm-lock.yaml`) | Built | Built | Yes |

**All 5/5 scenarios passed.**

---

## Cleanup

After verification, all test artifacts were reverted:
- `is-odd` dev dependency removed from root `package.json`
- Weather page and unauthorized page restored to original state
- `.claude/README.md` restored

Final cleanup commit: `f474aa0`
