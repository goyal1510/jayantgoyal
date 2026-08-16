#!/bin/bash

# Usage: scripts/ignore-build.sh <app-directory>
# Vercel Ignored Build Step — exits 0 to skip, 1 to build
#
# Set in Vercel: Project Settings → Git → Ignored Build Step
#   portfolio: bash ../../../scripts/ignore-build.sh apps/portfolio/web
#   studio:    bash ../../../scripts/ignore-build.sh apps/studio/web
#   admin:     bash ../../../scripts/ignore-build.sh apps/admin/web
#   auth:      bash ../../../scripts/ignore-build.sh apps/auth/web

APP_DIR="${1:?Usage: ignore-build.sh <app-directory>}"

# Ensure paths resolve from repo root, not Vercel's root directory
cd "$(git rev-parse --show-toplevel)" || exit 1

HEAD_SHA="${VERCEL_GIT_COMMIT_SHA:-HEAD}"
PREVIOUS_SHA="${VERCEL_GIT_PREVIOUS_SHA:-}"

echo "Checking deployment range for changes in: $APP_DIR, packages/, scripts/ignore-build.sh, package.json, pnpm-lock.yaml, pnpm-workspace.yaml, turbo.json"

# Vercel can push several commits in one deployment. Comparing only HEAD^..HEAD
# misses application changes when the last commit is documentation-only. The
# previous successful deployment SHA covers the complete undeployed range.
# If Vercel does not provide a usable range, build rather than risk a false skip.
if [ -z "$PREVIOUS_SHA" ]; then
  echo "VERCEL_GIT_PREVIOUS_SHA is unavailable; building safely."
  exit 1
fi

if ! git rev-parse --verify --quiet "${HEAD_SHA}^{commit}" >/dev/null; then
  echo "Current deployment SHA is unavailable; building safely."
  exit 1
fi

if ! git rev-parse --verify --quiet "${PREVIOUS_SHA}^{commit}" >/dev/null; then
  echo "Previous deployment SHA is unavailable in the clone; building safely."
  exit 1
fi

git diff --quiet "$PREVIOUS_SHA" "$HEAD_SHA" -- \
  "$APP_DIR" \
  packages \
  scripts/ignore-build.sh \
  package.json \
  turbo.json \
  pnpm-lock.yaml \
  pnpm-workspace.yaml

DIFF_STATUS=$?

if [ "$DIFF_STATUS" -eq 0 ]; then
  echo "No relevant changes detected; skipping build."
  exit 0
fi

echo "Relevant changes or an unreadable diff detected; building."
exit 1
