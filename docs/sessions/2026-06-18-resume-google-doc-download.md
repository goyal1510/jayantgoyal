# 2026-06-18 - Resume Google Doc Download

## Area

- `apps/jayantgoyal`

## Problem

The portfolio currently downloads a committed static resume PDF from `public/assets`. The goal is to download the current Google Doc resume as a PDF so resume updates do not require replacing a file in the repo.

## Plan

- Add a public API route that exports the configured Google Doc to PDF through the Google Drive API.
- Point the hero resume CTA to the API route instead of the static PDF.
- Document the Google service account and resume document environment variables.
- Keep the route outside auth/terms enforcement so public visitors can download it.

## Implementation

- Added `apps/jayantgoyal/src/app/api/resume/route.ts` as a Node runtime route that uses the Google service-account JWT flow and Drive `files.export` endpoint to return the configured Google Doc as `Jayant_Resume.pdf`.
- Updated the hero resume CTA to download from `/api/resume` instead of the committed PDF under `public/assets`.
- Added `/api/resume` to the proxy zero-cost allowlist so public resume downloads skip Supabase auth and terms checks.
- Documented `GOOGLE_RESUME_DOCUMENT_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` in the main app env example.
- Declared the Google resume env vars in `turbo.json` so ESLint's Turbo env rule passes.
- Added a static PDF redirect fallback when Google resume env vars are missing, keeping the current download working until Drive API setup is complete.

## Decisions

- Used direct `fetch` plus a signed service-account JWT instead of adding a `googleapis` dependency, keeping the runtime surface small.
- Set a short CDN cache (`s-maxage=300`) so Google Doc updates are reflected quickly without calling Google on every visitor click.
- Fallback only applies when configuration is missing; once env vars are present, Google export failures return an error so setup issues are visible.

## Validation

- `pnpm --filter jg check-types` passed.
- Initial `pnpm --filter jg lint` failed on undeclared Turbo env vars; `turbo.json` was updated.
- `pnpm --filter jg lint` passed after the Turbo env update.
- `pnpm --filter jg check-types` passed again after the fallback update.
- Started the app on `http://localhost:3002` and verified `/api/resume` redirects to the current static PDF while Google env vars are missing.
- Followed the `/api/resume` redirect with `curl`; the response was `application/pdf`, 103703 bytes, and detected as a one-page PDF.

## Google API Setup

- Found the downloaded service-account JSON at `/Users/jayant/Downloads/jayantgoyal-6727e72e29f9.json`.
- Verified the JSON is a Google `service_account` key with client email `resume-pdf-exporter-963@jayantgoyal.iam.gserviceaccount.com`.
- Updated local `apps/jayantgoyal/.env.local` with `GOOGLE_RESUME_DOCUMENT_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` without exposing the private key in logs.
- Restarted the app with the Google env vars loaded and verified `/api/resume` returned a direct `200 application/pdf` response from Google Drive, 98307 bytes, with `Content-Disposition: attachment; filename="Jayant_Resume.pdf"`.
- Installed Vercel CLI `54.14.2`, confirmed login as `goyal1510`, and linked `apps/jayantgoyal` to `jayants-projects-8c2f7bf9/jayantgoyal-jayantgoyal`.
- Added `GOOGLE_RESUME_DOCUMENT_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` to Vercel Production, Preview, and Development environments. The private key was piped from the service-account JSON and not printed.
- Verified the three Google resume variables appear in `vercel env ls` for all three environments.
- Linked the worktree root to the same Vercel project because the project root setting is `apps/jayantgoyal`; running `vercel` from inside the app directory doubled the root path.
- Created preview deployment `dpl_6ds57UxvV3uuvrj5eh4kvK1JZQp9` at `https://jayantgoyal-jayantgoyal-np534lyni-jayants-projects-8c2f7bf9.vercel.app`.
- Verified the protected preview route with `vercel curl /api/resume --deployment dpl_6ds57UxvV3uuvrj5eh4kvK1JZQp9`; it returned `200 application/pdf`, 98307 bytes, matched `/api/resume`, and saved as a one-page PDF.
- Preview build succeeded with pre-existing Turbo warnings for commerce env vars missing from `turbo.json`; Google resume env vars were available.

## Shipping Checks

- Verified branch freshness against fetched `origin/main` before staging.
- Switched GitHub CLI to the personal `goyal1510` account for this personal repo.
- Ran `git diff --check`; no whitespace errors.
- Ran `pnpm --filter jg lint`; passed.
- Ran `pnpm --filter jg check-types`; passed.
- Ran `pnpm build --filter jg`; passed. Next.js listed `/api/resume` as a dynamic route.
- Security review notes: Google credentials stay server-side in non-`NEXT_PUBLIC` env vars, the browser only calls `/api/resume`, the public route is intentionally zero-cost in the proxy, and fallback redirects only to the fixed same-origin static resume path.
