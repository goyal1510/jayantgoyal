# Platform Restructure Proof Ledger

## PLATFORM-00 — In Progress

- Baseline commit: `e6a7e60aa573f0468feedd47b6e4b059fd8553a6` on `origin/main`.
- Canonical Supabase target verified: `jayantgoyal` (`orwfvyditlguqvxvztkw`).
- Current Vercel platform projects verified:
  - `jayantgoyal-studio` (`prj_i9cXy9kUNTtLcewSSmO90d9hmYdl`) → `apps/studio` → `studio.jayantgoyal.com`
  - `jayantgoyal-admin` → `apps/admin` → `admin.jayantgoyal.com`
  - `jayantgoyal-portfolio` (`prj_EBZwXQASK4Abaw6Nc9ZG17j8cF7G`) → `apps/portfolio` → `jayantgoyal.com`, `www.jayantgoyal.com`, `portfolio.jayantgoyal.com`
- Vercel environment foundation applied and verified:
  - Created the persistent remote `staging` branch from the verified `origin/main` baseline.
  - Set Production `NEXT_PUBLIC_SITE_URL` to the canonical Portfolio, Studio, and Admin hosts after the apex cutover.
  - Added branch-specific Preview values for `studio.staging.jayantgoyal.com` on Studio, `portfolio.staging.jayantgoyal.com` on Portfolio, and `admin.staging.jayantgoyal.com` on Admin.
  - Left generic Preview without a fixed site URL so each deployment uses its own origin.
  - Standardized Development URLs and local scripts: Portfolio `3000`, Studio `3001`, Admin `3002`; Auth remains reserved for `3003`.
  - Added and read back Studio's cross-app `NEXT_PUBLIC_PORTFOLIO_URL` exactly once for Development, generic Preview, `staging` Preview, and Production. Local Studio targets Portfolio on `3000`, persistent staging targets Portfolio staging, and generic Preview/Production target the stable apex.
  - Added and read back Studio's canonical `NEXT_PUBLIC_STUDIO_URL` exactly once for the same four scopes. Development uses `3001`, persistent staging uses the Studio staging host, and generic Preview/Production use the stable Studio host.
  - Confirmed the three Supabase variables cover Development, Preview, and Production on both existing projects without exposing their values.
  - Configured Portfolio's complete eleven-key runtime contract across Development, generic Preview, branch-specific `staging` Preview, and Production. The Portfolio project intentionally has no Supabase service-role key.
  - Verified every public URL value through Vercel's read API without printing secret/provider values. Generic Preview has no fixed `NEXT_PUBLIC_SITE_URL`; Development and `staging` use their exact local/staging hosts; Production uses each canonical host.
  - Removed thirteen Portfolio/Resume/Commerce-only variables from Studio after a source inventory proved no Studio consumer remains. Admin now uses `VERCEL_PROJECT_ID_STUDIO` in all three targets and no longer has `VERCEL_PROJECT_ID_JG`.
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
  - Stable Portfolio and Studio staging domains are attached to the `staging` branch and temporarily alias the tested immutable deployments while new builds are rate-limited. Portfolio's inherited Vercel Authentication was removed to match the already-public product project; both staging hosts are publicly reachable with valid TLS.
  - Vercel rejected Studio production promotion because the free team exceeded its daily deployment limit. The tested immutable preview is assigned directly to `studio.jayantgoyal.com`; promotion remains a later cleanup step when the limit resets.
  - Vercel subsequently rate-limited all new project builds for 24 hours. The single-hop redirect fix is pushed, while the subsequent contact, URL-contract, discovery, and regression-test commits are intentionally held locally to avoid guaranteed failed deployments; apex cutover is blocked until the exact current branch build passes.

## PLATFORM-01 — Test foundation prepared; Auth execution deferred

- Added repository-local Vitest `4.1.10` with a single `pnpm test` command and no production dependency.
- Twelve focused tests pass across four files: Studio hostname classification, Vercel-host recognition, cross-application URL normalization, Portfolio/Studio redirect ownership, and contact validation that exits before delivery.
- The host tests exposed and now prevent an empty-host regression where absent Vercel variables could classify a missing Host header as Studio.
- Test fixtures contain no credentials, tokens, session data, or real delivery request. Provider, session, role, MFA, logout, and recovery regression coverage remains deferred with the rest of Auth under ADR-001; PLATFORM-01 is not Done.

## Cross-phase security gate — In Progress

- The dependency audit found the deployed apps and `@repo/ui` resolving Next.js `16.1.6`, which was inside current high-severity Server Component and proxy-bypass advisory ranges. Studio, Portfolio, Admin, the UI peer resolution, and the shared Next ESLint plugin now resolve to `16.2.10`.
- Repository-local Vercel CLI is updated to `56.3.0`; Vitest remains development-only at `4.1.10`.
- Precise same-major overrides replace vulnerable tar, minimatch, flatted, picomatch, path-to-regexp, and ws patch levels without forcing incompatible majors.
- `pnpm test`, full monorepo TypeScript, zero-warning lint, and full monorepo production build pass after the final dependency graph change.
- Targeted production dependency remediation upgraded Portfolio's Resend client, removed Studio's unused Resend dependency, and pinned safe `dompurify`, `postcss`, and `prismjs` patch levels. `pnpm audit --prod` now reports no known vulnerabilities at any severity. The full development audit still retains six high advisories exclusively through Vercel CLI's upstream `undici` major-5 dependencies; Vercel `56.3.0` is current and still ships them, so those development-only residuals remain recorded rather than hidden behind incompatible overrides.

## Cross-application branding and metadata proof

- The shared `@repo/brand` contract separates application labels from ownership: UI chrome uses `Portfolio`, `Studio`, and `Admin`; app-level identities use `Jayant Goyal`, `Studio by Jayant Goyal`, and `Admin by Jayant Goyal`.
- Page titles avoid repetitive ownership wording. Portfolio pages use `%s | Jayant Goyal`, Studio pages use `%s | Studio`, and Admin pages use `%s | Admin`. Admin remains `noindex`/`nofollow`.
- Every non-redirect page in Portfolio has direct metadata; Studio's remaining MFA and loader-preview routes now do as well; Admin client-only Welcome and Access Denied routes receive metadata through server layouts, while redirect-only index routes inherit and immediately redirect.
- Automated proof: six Vitest files and sixteen tests pass, including assertions that Studio/Admin child-page suffixes never include ` by `. Full monorepo TypeScript, zero-warning lint, and production builds pass.
- Rendered local proof: Portfolio home is `Jayant Goyal | Full-Stack Developer` and Blog is `Blog | Jayant Goyal`; Studio home is `Studio by Jayant Goyal | Apps, Tools, and Experiments`, Weather is `Weather | Studio`, and UUID Generator is `UUID Generator | Studio`; authenticated Admin renders `Hero | Admin`, `Users | Admin`, and `Deployments | Admin`.

## PLATFORM-08 — In Progress

- Execution order changed by accepted ADR-001: Portfolio and Studio boundaries precede shared Auth/SSO.
- The Portfolio dependency inventory confirms the public app needs portfolio content, public Supabase reads, GitHub statistics, contact delivery, resume export, and shared UI only.
- The new `apps/portfolio` boundary does not import Studio authentication, product routes, product navigation logic, games, files, messenger, or other product workspaces.
- The rejected centralized application-sidebar shell was reverted with Git. Studio and Admin retain their prior app-local sidebar implementations; Portfolio now owns a local implementation that follows Studio's same `Sidebar`/header/content/footer/rail structure and shared primitive behavior without importing Studio product logic.
- Local Portfolio browser proof covers the expanded structure, icon collapse, section scrolling and active state, mobile drawer, Blog navigation/title, automatic drawer close, and zero captured console errors. The full repository test, type, lint, and production-build gates pass after the app-local replacement.
- Portfolio's app-local top header now mirrors Studio's responsive shell contract: browser measurement confirms its `64px` expanded to `48px` collapsed transition, it preserves the trigger/separator/actions layout, and it renders route-aware breadcrumbs for Portfolio, Blog, article, and Resume surfaces with no captured console errors.
- Portfolio was first validated additively at `portfolio.jayantgoyal.com`; the apex and `www` were later moved to the same Portfolio project after route checks passed.
- Product links shown in Portfolio are resolved to the future canonical Studio origin so the later apex cutover does not strand product routes.
- Focused verification passed: Portfolio TypeScript, zero-warning ESLint, production build, desktop browser rendering, mobile navigation, all seven section anchors, project modal behavior, Studio link rewriting, zero horizontal overflow, and zero captured browser console errors.
- Portfolio now owns the public Blog index/articles, Resume landing/download, sitemap article discovery, `llms.txt`, not-found, and error surfaces without importing Studio authentication or product infrastructure.
- Local production smoke confirmed Portfolio content routes return `200`, unknown routes return `404`, known content aliases return `308`, and product/Auth/API families return one-hop method-preserving `307` redirects to Studio with query strings intact.
- The extracted Portfolio now preserves the historical `POST /api/contact` contract through the same server-only delivery service as the UI Server Action. Portfolio TypeScript, zero-warning lint, and production build pass; local black-box checks confirm malformed JSON, missing fields, invalid email, and unsupported methods fail without attempting delivery.
- Vercel project `jayantgoyal-portfolio` was created with root `apps/portfolio`, GitHub integration, and the corrected project-level build command `pnpm --filter portfolio build`.
- Preview deployment `dpl_7CiJsCTyFZfZGUb6Euro6etDAK3L` is Ready and reversibly assigned to `portfolio.jayantgoyal.com`; Cloudflare/Vercel both confirm the exact CNAME configuration.
- A fresh 90-day Vercel certificate was issued. Explicitly assigning the tested deployment replaced the stale edge mapping: HTTP/1.1 and HTTP/2 checks across both resolved edge addresses now present the fresh certificate, ten consecutive HTTPS checks returned `200`, and root, robots, sitemap, manifest, Open Graph, GitHub proxy, GitHub LOC, and resume routes return `200`.
- Deployed Chrome validation could not start because the installed extension connection was unavailable; local browser proof and deployed black-box HTTP proof are recorded, but the deployed visual gate and final rollback proof remain pending. PLATFORM-08 is not Done.
- `portfolio.staging.jayantgoyal.com` is public with valid TLS and serves the tested Portfolio deployment. The `staging` branch is fast-forwarded to the current PR head; its exact build remains pending the Vercel limit reset.

## PLATFORM-07 / PLATFORM-11 — Studio rename and deployment in progress

- The tracked application moved physically from `apps/jayantgoyal` to `apps/studio`; its package and workspace filter are now exactly `studio`.
- The existing Vercel project was renamed in place to `jayantgoyal-studio`, repointed to `apps/studio`, and configured with `pnpm --filter studio build` plus the project-level Studio ignore-build command. No second Studio project was created.
- Studio is a single-purpose runtime on every host and renders its public inventory with five immediately usable products, five account-backed workspaces, and the separately deployed e-commerce application.
- Studio-owned root metadata, sidebar branding, navigation, breadcrumbs, manifest, robots, sitemap, and structured data no longer select a Portfolio identity by hostname.
- Duplicated Portfolio components, data access, Blog/Resume/Contact routes, and assets were removed from Studio. Legacy Portfolio page routes use permanent cross-application redirects, while compatibility API routes use temporary method-preserving redirects.
- Focused verification passed: Main TypeScript, zero-warning ESLint, production build, Studio hostname browser rendering, Studio product inventory and links, current-root Portfolio compatibility, zero horizontal overflow at the default browser viewport, and zero captured browser console errors.
- Studio's Blog, Portfolio, terms/contact, and error-navigation links now respect the split boundary. A local production black-box check confirms the Studio marker renders, Blog crosses to Portfolio, and product links remain on Studio.
- Studio identity is fixed; hostname awareness is retained only for preview/staging indexability.
- Vercel preview deployment `dpl_7y1m635L1BoYUzBqMqmYvunsjKTB` is Ready and passed black-box checks for Studio metadata and inventory links. Because the daily deployment limit blocked promotion, the exact tested deployment is reversibly assigned to `studio.jayantgoyal.com`.
- Public DNS resolves `studio.jayantgoyal.com` to Vercel, direct HTTPS checks return `200`, and the apex still redirects to the existing `www` Portfolio with no Studio marker.
- `studio.staging.jayantgoyal.com` has valid public DNS/TLS, is attached to the `staging` branch, and temporarily serves the same tested immutable Studio deployment until a post-limit staging build succeeds.
- Local verification after the physical rename passes: 11 focused Vitest tests, Studio TypeScript, zero-warning ESLint, and the Studio production build. PLATFORM-07 and PLATFORM-11 remain open until the exact commit is deployed, responsive/auth-gated product transitions pass, and the rollback/observation gates are verified.

## PLATFORM-09 — Domain cutover in progress

- Vercel moved `jayantgoyal.com` and `www.jayantgoyal.com` from the renamed Studio project to the Portfolio project. Studio retains only `studio.jayantgoyal.com` and `studio.staging.jayantgoyal.com`.
- The canonical domain direction is now apex-first: `www.jayantgoyal.com` returns permanent `308` to `https://jayantgoyal.com/`; the apex does not redirect.
- The apex is reversibly assigned to tested Portfolio deployment `dpl_21MRG8eNBm913FjVNPtSdnf5kbkL` while fresh builds remain rate-limited.
- Live black-box checks pass for Portfolio root, Blog, Resume, robots, sitemap, and manifest. Historical professional aliases return `308` to Portfolio sections; all classified product families and current Auth paths return method-preserving `307` handoffs to Studio; Studio and the Portfolio compatibility subdomain return `200`.
- The current immutable deployment still emits `portfolio.jayantgoyal.com` in canonical/Open Graph metadata because it predates the cutover. Portfolio Production `NEXT_PUBLIC_SITE_URL` now reads back exactly as `https://jayantgoyal.com`; the metadata fix requires the next fresh deployment and remains an explicit PLATFORM-09 blocker.
