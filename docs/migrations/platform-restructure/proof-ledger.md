# Platform Restructure Proof Ledger

## PLATFORM-00 — In Progress

- Baseline commit: `e6a7e60aa573f0468feedd47b6e4b059fd8553a6` on `origin/main`.
- Canonical Supabase target verified: `jayantgoyal` (`orwfvyditlguqvxvztkw`).
- Current Vercel platform projects verified:
  - `jayantgoyal-jayantgoyal` → `apps/jayantgoyal` → `jayantgoyal.com`, `www.jayantgoyal.com`
  - `jayantgoyal-admin` → `apps/admin` → `admin.jayantgoyal.com`
  - `jayantgoyal-portfolio` (`prj_EBZwXQASK4Abaw6Nc9ZG17j8cF7G`) → `apps/portfolio` → `portfolio.jayantgoyal.com`
- Vercel environment foundation applied and verified:
  - Created the persistent remote `staging` branch from the verified `origin/main` baseline.
  - Reset both Production `NEXT_PUBLIC_SITE_URL` values to their canonical Main/Admin hosts.
  - Added branch-specific Preview values for `studio.staging.jayantgoyal.com` on Main, `portfolio.staging.jayantgoyal.com` on Portfolio, and `admin.staging.jayantgoyal.com` on Admin.
  - Left generic Preview without a fixed site URL so each deployment uses its own origin.
  - Standardized Development URLs and local scripts: Portfolio `3000`, Studio `3001`, Admin `3002`; Auth remains reserved for `3003`.
  - Confirmed the three Supabase variables cover Development, Preview, and Production on both existing projects without exposing their values.
  - Configured Portfolio's complete eleven-key runtime contract across Development, generic Preview, branch-specific `staging` Preview, and Production. The Portfolio project intentionally has no Supabase service-role key.
- Existing e-commerce Vercel projects are intentionally outside this platform migration.
- Cloudflare stale Vercel records for `accounts`, `admin-employee`, `auth`, and `employee` were removed on the user's explicit instruction before implementation began. Additive DNS-only CNAME records now route `portfolio`, `studio`, `portfolio.staging`, and `studio.staging` to their exact Vercel-recommended targets; apex, `www`, Admin, commerce, and mail records were not changed.
- Live Supabase Auth baseline before remediation: Site URL and redirect allowlist were local-only; Google and email providers were enabled; GitHub and TOTP MFA were disabled.
- Expedited hosted Auth remediation approved by the user and applied through a scoped Supabase Management API patch:
  - Site URL is now `https://jayantgoyal.com`.
  - The allowlist covers current Main/Admin, planned Portfolio/Studio/Admin/Auth production and staging hosts, local ports `3000` through `3003`, and only the current Main/Admin Vercel preview hostname families.
  - The recovery template was subsequently corrected to use `{{ .RedirectTo }}` rather than `{{ .SiteURL }}`. This preserves the existing template and makes every password-recovery link use the exact callback requested by the application.
  - A read-after-write verification confirmed the exact URL settings, the recovery-template placeholder, and that Google/email providers remain enabled.
  - A non-user request to the hosted recovery endpoint confirmed that Supabase accepts `https://jayantgoyal.com/auth/callback` with HTTP `200`; no message was sent to a user.
- Residual risks:
  - The existing Google flow places `next` in `redirectTo`; the temporary same-origin wildcard paths preserve compatibility, but a tested server-side destination handoff is still required before narrowing production callbacks.
  - Parent-domain cookies and cross-subdomain SSO are deferred until PLATFORM-04.
  - Auth Vercel environment inventory remains pending until the Auth project exists.
  - Stable Portfolio and Studio staging domains are attached to the `staging` branch and temporarily alias the tested immutable deployments while new builds are rate-limited. Portfolio's inherited Vercel Authentication was removed to match the already-public Main project; both staging hosts are publicly reachable with valid TLS.
  - Vercel rejected Studio production promotion because the free team exceeded its daily deployment limit. The tested immutable preview is assigned directly to `studio.jayantgoyal.com`; promotion remains a later cleanup step when the limit resets.
  - Vercel subsequently rate-limited all new project builds for 24 hours. The latest single-hop redirect fix is committed and pushed but cannot replace the current Portfolio alias until the limit resets; apex cutover is blocked until that exact build passes.

## PLATFORM-08 — In Progress

- Execution order changed by accepted ADR-001: Portfolio and Studio boundaries precede shared Auth/SSO.
- The Portfolio dependency inventory confirms the public app needs portfolio content, public Supabase reads, GitHub statistics, contact delivery, resume export, and shared UI only.
- The new `apps/portfolio` boundary does not import Studio authentication, product routes, sidebar code, games, files, messenger, or other product workspaces.
- The current root application and its Vercel project remain unchanged during this local dark-launch build.
- Product links shown in Portfolio are resolved to the future canonical Studio origin so the later apex cutover does not strand product routes.
- Focused verification passed: Portfolio TypeScript, zero-warning ESLint, production build, desktop browser rendering, mobile navigation, all seven section anchors, project modal behavior, Studio link rewriting, zero horizontal overflow, and zero captured browser console errors.
- Portfolio now owns the public Blog index/articles, Resume landing/download, sitemap article discovery, `llms.txt`, not-found, and error surfaces without importing Studio authentication or product infrastructure.
- Local production smoke confirmed Portfolio content routes return `200`, unknown routes return `404`, known content aliases return `308`, and product/Auth/API families return one-hop method-preserving `307` redirects to Studio with query strings intact.
- Vercel project `jayantgoyal-portfolio` was created with root `apps/portfolio`, GitHub integration, and the corrected project-level build command `pnpm --filter portfolio build`.
- Preview deployment `dpl_7CiJsCTyFZfZGUb6Euro6etDAK3L` is Ready and reversibly assigned to `portfolio.jayantgoyal.com`; Cloudflare/Vercel both confirm the exact CNAME configuration.
- A fresh 90-day Vercel certificate was issued. Explicitly assigning the tested deployment replaced the stale edge mapping: HTTP/1.1 and HTTP/2 checks across both resolved edge addresses now present the fresh certificate, ten consecutive HTTPS checks returned `200`, and root, robots, sitemap, manifest, Open Graph, GitHub proxy, GitHub LOC, and resume routes return `200`.
- Deployed Chrome validation could not start because the installed extension connection was unavailable; local browser proof and deployed black-box HTTP proof are recorded, but the deployed visual gate and final rollback proof remain pending. PLATFORM-08 is not Done.
- `portfolio.staging.jayantgoyal.com` is public with valid TLS and serves the tested Portfolio deployment. The `staging` branch is fast-forwarded to the current PR head; its exact build remains pending the Vercel limit reset.

## PLATFORM-07 / PLATFORM-11 — Compatibility preparation

- The existing application recognizes the approved Studio production, staging, and local hostnames plus only Vercel's server-provided deployment hosts, enabling preview validation without hardcoded preview URL patterns.
- Studio hosts render a public inventory with five immediately usable products, five account-backed workspaces, and the separately deployed e-commerce application.
- The Studio hostname receives Studio-specific root metadata, sidebar branding, navigation ownership, and breadcrumb labeling.
- The existing apex/local root continues rendering the current Portfolio experience; no domain has been moved and no production host behavior has changed yet.
- Focused verification passed: Main TypeScript, zero-warning ESLint, production build, Studio hostname browser rendering, Studio product inventory and links, current-root Portfolio compatibility, zero horizontal overflow at the default browser viewport, and zero captured browser console errors.
- Vercel preview deployment `dpl_7y1m635L1BoYUzBqMqmYvunsjKTB` is Ready and passed black-box checks for Studio metadata and inventory links. Because the daily deployment limit blocked promotion, the exact tested deployment is reversibly assigned to `studio.jayantgoyal.com`.
- Public DNS resolves `studio.jayantgoyal.com` to Vercel, direct HTTPS checks return `200`, and the apex still redirects to the existing `www` Portfolio with no Studio marker.
- `studio.staging.jayantgoyal.com` has valid public DNS/TLS, is attached to the `staging` branch, and temporarily serves the same tested immutable Studio deployment until a post-limit staging build succeeds.
- This is preparatory compatibility evidence only. PLATFORM-07 and PLATFORM-11 remain open until the deployed Studio host, responsive layouts, auth-gated product transitions, rollback path, and required observation gates are verified.
