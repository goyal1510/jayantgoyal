#!/bin/bash

# Usage: scripts/ignore-build.sh <app-directory>
# Vercel Ignored Build Step — exits 0 to skip, 1 to build
#
# Set in Vercel: Project Settings → Git → Ignored Build Step
#   portfolio: bash ../../scripts/ignore-build.sh apps/portfolio
#   studio:    bash ../../scripts/ignore-build.sh apps/studio
#   admin:     bash ../../scripts/ignore-build.sh apps/admin

APP_DIR="${1:?Usage: ignore-build.sh <app-directory>}"

# Ensure paths resolve from repo root, not Vercel's root directory
cd "$(git rev-parse --show-toplevel)" || exit 1

echo "Checking for changes in: $APP_DIR, packages/, turbo.json, pnpm-lock.yaml"

git diff HEAD^ HEAD --quiet -- \
  "$APP_DIR" \
  packages \
  turbo.json \
  pnpm-lock.yaml

# git diff --quiet exits 0 if no changes, 1 if changes
# Vercel skips build on exit 0, builds on exit 1
