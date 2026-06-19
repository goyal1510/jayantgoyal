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
  descriptions, and admin app title template/description for the final model.
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
