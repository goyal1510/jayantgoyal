# Jayant Full Name Copy Cleanup

Date: 2026-06-19
Area: `apps/jayantgoyal`, repo copy/content

## Problem

Public-facing identity should use `Jayant` for the person, `JG` for the
minimal site/app brand, and `jayantgoyal.com` only as the domain. The cleanup
needs to avoid inventing a larger product name and avoid changing technical
identifiers like package names, domains, paths, emails, or database values.

## Plan

- Search the repo for name/brand occurrences and classify them before editing.
- Use `Jayant` for person/legal/author fields.
- Use `JG` for compact site/app brand surfaces.
- Leave domains, handles, asset paths, profile keys, and internal technical
  names unchanged.
- Run lint, typecheck, and a diff review after edits.

## Progress

- Created worktree
  `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/jayant-full-name-copy`
  from current `origin/main`.
- Copied five existing `.env*` files into the worktree without printing secret
  contents.
- Updated live app copy and metadata to the final model: `Jayant` for
  person/legal/author surfaces, `JG` for the site/app brand, and
  `jayantgoyal.com` for domain-only surfaces.
- Audited page/card metadata and updated the homepage Open Graph/Twitter card
  title, card image headline/alt text, manifest description, JSON-LD
  descriptions, admin app title template/description, and sitemap last-modified
  date for the final model.
- Corrected the public blog listing metadata to use `Jayant` as the author
  name instead of the full domain-style name.
- Updated the README and repo agent guide to use `JG` for the project label and
  `Jayant` for the person.
- Kept the Resend/Postgres docs reference sender display name as
  `Jayant <team@jayantgoyal.com>`.
- Verified remaining lowercase `jayant` matches are identifiers, domains, file
  names, URLs, handles, or profile keys that should not be renamed.

## Validation

- Focused scan across app/source SEO surfaces found no remaining full-name
  display strings.
- Wider repo scan only finds historical April session notes, which were left
  unchanged as history.
- `git diff --check` passed.
- `pnpm --filter jg lint` passed.
- `pnpm --filter jg check-types` passed.
- `pnpm build --filter jg` passed.
- Sitemap follow-up sets shared non-blog lastModified to 2026-06-19T00:00:00.000Z and the build confirms /sitemap.xml is generated.
- SEO follow-up fixes duplicate homepage canonicals by generating route-specific canonical URLs, adds dynamic noindex for auth-gated routes, and removes sign-in-gated app/game URLs from the sitemap. Local production checks verified /tools is indexable with a self-canonical URL, /games is noindex, and /sitemap.xml lists public URLs with the pinned lastModified value.
- Replaced the generated Open Graph card artwork with the existing JG favicon
  as the only visual and bumped OG image references to `?v=4` for cache refresh.
- Reduced empty space in the Open Graph card by matching the canvas background
  to the favicon blue and scaling the JG mark much larger.
- Revised the Open Graph card composition to place the JG favicon mark on the
  left and `Jayant` text on the right.
- Bumped Open Graph image metadata references from `?v=4` to `?v=5` so social
  scrapers pick up the revised left/right image.
- Replaced the experimental `Jayant` wordmark with a stacked JG favicon mark
  and `Portfolio / Tools / Projects` descriptor row for a cleaner link card.
- Matched the Open Graph card background and descriptor color to the favicon's
  exact blue/navy palette to avoid a visible icon tile edge.
- Revalidated the final stacked Open Graph card with `git diff --check`,
  `pnpm --filter jg lint`, `pnpm --filter jg check-types`,
  `pnpm build --filter jg`, and a local production render at
  `/opengraph-image`.
