# Media Converter Decommission

## Goal

Remove the Media Converter experiment and its unused local, application, cloud,
and database resources.

## Scope

- Delete the locally downloaded test media and local-only CLI environment.
- Remove the Media Converter worktrees and obsolete branches.
- Delete the Back4App media worker application.
- Remove the Studio Media Lab UI, API routes, navigation, and worker package.
- Add and apply a forward Supabase migration that removes the live conversion
  jobs, worker functions, output objects, and storage bucket.
- Refresh the canonical Supabase schema snapshots.
- Validate, ship, and merge the decommissioning change.

## Status

- Created `codex/media-decommission` from the latest `origin/main`.
- Deleted the 13 MB local test MP3 and its now-empty download directory.
- Deleted the local CLI and cloud experiment worktrees, including the 95 MB
  Python virtual environment.
- Deleted the local CLI branch and the local/remote cloud experiment branch;
  neither branch had a pull request.
- Deleted the `jg-media-worker` Back4App application and confirmed the web
  deployment list is empty.
- Deleted the Media Converter Preview and Production allowlist variables from
  the Vercel Studio project; the other media-specific variables were absent.
- Removed the Studio Media Lab route, APIs, navigation, inventory entries,
  documentation, and the Python worker package.
- Deleted the empty `media-converter-output` bucket through the supported
  Supabase Storage API.
- Applied `20260723120000_decommission_media_converter.sql` to `jayantgoyal`
  (`orwfvyditlguqvxvztkw`) to remove the storage policy, worker functions, and
  `jg_app.media_conversion_jobs`.
- Refreshed all canonical schema snapshots from the verified remote project.
- Removed the 4.46 GB Supabase Postgres image that the schema dump command
  temporarily pulled. No `jg-media-worker` Docker image existed.

## Validation

- `supabase migration list --linked` — decommission migration present locally
  and remotely.
- Remote bucket lookup — `Bucket not found`.
- Remote `jg_account`, `jg_app`, `portfolio`, and `storage` schema dumps contain
  no Media Converter table, function, or policy references.
- `git diff --check` — passed.
- Application tree comparison against the first parent of the original feature
  merge — restored exactly to the pre-feature state.
- Media reference scan outside the retained audit migrations/session entries —
  no matches.
- `pnpm --filter studio test` — 12 files and 35 tests passed.
- `pnpm --filter studio lint` — passed with zero warnings.
- `pnpm --filter studio check-types` — passed.
- `pnpm check:architecture` — passed.
- `pnpm check:service-role` — passed.
- `pnpm --filter studio build` — production build passed; the Media Lab page and
  API routes are absent from the generated route manifest.
