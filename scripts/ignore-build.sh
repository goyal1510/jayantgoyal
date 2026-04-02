#!/bin/bash

# Usage: scripts/ignore-build.sh <app-directory>
# Vercel Ignored Build Step — exits 0 to skip, 1 to build
#
# Set in Vercel: Project Settings → Git → Ignored Build Step
#   jayantgoyal: bash ../../scripts/ignore-build.sh apps/jayantgoyal
#   admin:       bash ../../scripts/ignore-build.sh apps/admin

APP_DIR="${1:?Usage: ignore-build.sh <app-directory>}"

echo "Checking for changes in: $APP_DIR, packages/, turbo.json, pnpm-lock.yaml"

git diff HEAD^ HEAD --quiet -- \
  "$APP_DIR" \
  packages \
  turbo.json \
  pnpm-lock.yaml

# git diff --quiet exits 0 if no changes, 1 if changes
# Vercel skips build on exit 0, builds on exit 1
