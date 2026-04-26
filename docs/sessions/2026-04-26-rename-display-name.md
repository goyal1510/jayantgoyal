# 2026-04-26 — Rename display name from "Jayant Goyal" to "Jayant"

## Area
Main app (`apps/jayantgoyal`) — SEO metadata, OG image, manifest, JSON-LD

## Problem
Replace all display name instances of "Jayant Goyal" with "Jayant" across metadata and SEO files, while preserving URLs, email addresses, and profile links that contain "goyal".

## Files Changed
- `src/app/layout.tsx` — title, description, keywords, authors name, creator, openGraph, twitter metadata
- `src/app/(protected)/page.tsx` — page description and openGraph metadata
- `src/app/opengraph-image.tsx` — alt text; removed GOYAL span from rendered image
- `src/app/manifest.ts` — PWA manifest name
- `src/components/seo/json-ld.tsx` — all `name` fields in Person, WebSite, ProfilePage, SoftwareApp JSON-LD

## What was preserved (unchanged)
- All URLs (`jayantgoyal.com`, `github.com/goyal1510`, LinkedIn URL)
- Email address (`goyal151002@gmail.com`)
- Asset paths (`/assets/Jayant_favicon_io/...`)
- Template string `%s | Jayant` (already correct)
