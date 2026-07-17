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
  - Portfolio and Studio stable staging hosts resolve publicly and return `200`. `admin.staging.jayantgoyal.com` did not resolve during the 2026-07-17 post-merge check, so the complete stable-staging contract remains open.
  - Deployed authenticated product journeys, rollback rehearsal, and the required observation window remain incomplete even though public production smoke checks pass.

## Post-merge deployment reconciliation

- PR #39 merged to `main` as `4703e7c83d0b92935dc8dd10a3535a2f7d51a426`; the Portfolio, Studio, and Admin production deployment checks passed for the merged boundary.
- Post-merge public checks on 2026-07-17 returned `200` for `https://jayantgoyal.com/` and `https://studio.jayantgoyal.com/`. Admin completed its expected single redirect from `/` to `/welcome?redirect=%2F` and returned `200`.
- Portfolio and Studio stable staging roots returned `200`. Admin staging DNS did not resolve and remains a required environment repair, not an application-code failure.
- The previous build-rate-limit and pre-cutover canonical blockers are resolved. The open gates are authenticated product coverage, deployed responsive/browser evidence, Admin staging, rollback rehearsal, and observation.

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
- Automated proof: six Vitest files and sixteen tests pass, including assertions that Studio/Admin child-page suffixes never include `by`. Full monorepo TypeScript, zero-warning lint, and production builds pass.
- Rendered local proof: Portfolio home is `Jayant Goyal | Full-Stack Developer` and Blog is `Blog | Jayant Goyal`; Studio home is `Studio by Jayant Goyal | Apps, Tools, and Experiments`, Weather is `Weather | Studio`, and UUID Generator is `UUID Generator | Studio`; authenticated Admin renders `Hero | Admin`, `Users | Admin`, and `Deployments | Admin`.

## Cross-application shared infrastructure proof

- `@repo/platform` is the single dependency-free application-host/URL boundary above `@repo/brand`. Portfolio and Studio now use it for canonical origins, cross-application links, Next.js environment fallbacks, and legacy URL rewriting.
- `@repo/seo` owns reusable public metadata composition, pathname normalization, indexability matching, and canonical-host checks. Portfolio and Studio retain their page inventories and indexing decisions.
- `@repo/ui` now owns the proven application frame, brand header, navigation-section renderer, responsive top header, breadcrumb trail, theme provider, lazy-motion provider, spinner/page spinner, sidebar user menu, welcome card/shell, password field, divider, and Google-button presentation.
- Application policy remains outside shared packages: Portfolio builds scroll-section navigation locally; Studio builds nested public/private/external product groups and owns account state; Admin constructs role-gated groups locally; every app maps its own route semantics to breadcrumb items. Supabase clients, email/password actions, OAuth callbacks, MFA, cookies, role checks, redirects, and sign-out destinations remain app-owned.
- Duplicate app-local shell/provider/loading files were removed only after all three adapters compiled against the shared contracts. Admin now reads the same `sidebar_state` and `sidebar_width` cookies as Portfolio and Studio, fixing collapse/width persistence across Admin route navigation.
- Automated proof: eight Vitest files and twenty-three tests pass, including new platform URL/host and shared SEO/path contracts. Full monorepo TypeScript, zero-warning ESLint, and production builds for Portfolio, Studio, and Admin pass.
- Browser proof at `1280x720`: all three applications measure `256px` sidebars and `64px` headers expanded, then `48px` sidebars and `48px` headers collapsed. Portfolio Blog, Studio Weather, and Admin Hero/Users breadcrumbs render from their app-owned adapters; Admin collapse state persists across route navigation; Studio and Admin expose the same Settings/Log out presentation; Studio's password visibility control toggles `password` → `text` → `password`; and no browser console warnings or errors were captured. The authenticated Admin guard redirected `/welcome` to `/portfolio/hero`, so Admin welcome rendering is covered by TypeScript/lint/build rather than disturbing the signed-in session.

## Cross-application deployment-selection proof

- The Vercel ignored-build script compares `VERCEL_GIT_PREVIOUS_SHA` with `VERCEL_GIT_COMMIT_SHA` rather than only comparing the final commit with its parent. This prevents a final documentation-only commit from hiding application or shared-package changes earlier in the same deployment push.
- The watched contract includes the selected application, all shared packages, the detector script itself, root `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `turbo.json`.
- Missing or shallow-cloned deployment SHAs fail open and trigger a build. Focused temporary-repository tests cover app isolation, multi-commit shared changes, documentation-only skips, every shared root configuration input, and both missing-SHA paths.
- Commit `63321b1139ad27199108e0d552d28bb23d577d0c` triggered real Portfolio, Studio, and Admin Vercel builds; all three deployment checks passed, proving the shared-root change was not skipped. Immutable preview smoke checks returned Portfolio `200` with `Jayant Goyal | Full-Stack Developer`, Studio `200` with `Studio by Jayant Goyal | Apps, Tools, and Experiments`, and the expected Admin `/` → `/welcome` redirect followed by `200` with `Welcome | Admin`.

## PLATFORM-08 — In Progress

- Execution order changed by accepted ADR-001: Portfolio and Studio boundaries precede shared Auth/SSO.
- The Portfolio dependency inventory confirms the public app needs portfolio content, public Supabase reads, GitHub statistics, contact delivery, resume export, and shared UI only.
- The new `apps/portfolio` boundary does not import Studio authentication, product routes, product navigation logic, games, files, messenger, or other product workspaces.
- The rejected centralized navigation-policy shell was reverted with Git. After the three app-owned adapters independently proved the same mechanics, only the behavior-neutral frame/header/breadcrumb renderers moved to `@repo/ui`; Portfolio still owns its navigation inventory and does not import Studio product logic.
- Local Portfolio browser proof covers the expanded structure, icon collapse, section scrolling and active state, mobile drawer, Blog navigation/title, automatic drawer close, and zero captured console errors. The full repository test, type, lint, and production-build gates pass after the app-local replacement.
- Portfolio's shared top-header renderer mirrors Studio's responsive shell contract while its breadcrumb model remains local: browser measurement confirms its `64px` expanded to `48px` collapsed transition, it preserves the trigger/separator/actions layout, and it renders route-aware breadcrumbs for Portfolio, Blog, article, and Resume surfaces with no captured console errors.
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
- Local verification after the physical rename passes: 11 focused Vitest tests, Studio TypeScript, zero-warning ESLint, and the Studio production build. The merged boundary is deployed; PLATFORM-07 and PLATFORM-11 remain open until responsive/auth-gated product transitions and the rollback/observation gates are verified.

## PLATFORM-09 — Domain cutover in progress

- Vercel moved `jayantgoyal.com` and `www.jayantgoyal.com` from the renamed Studio project to the Portfolio project. Studio retains only `studio.jayantgoyal.com` and `studio.staging.jayantgoyal.com`.
- The canonical domain direction is now apex-first: `www.jayantgoyal.com` returns permanent `308` to `https://jayantgoyal.com/`; the apex does not redirect.
- The apex is assigned to the Portfolio project, and the merged PR #39 production deployment completed successfully.
- Live black-box checks pass for Portfolio root, Blog, Resume, robots, sitemap, and manifest. Historical professional aliases return `308` to Portfolio sections; all classified product families and current Auth paths return method-preserving `307` handoffs to Studio; Studio and the Portfolio compatibility subdomain return `200`.
- The post-merge Portfolio deployment emits the apex canonical contract and public root checks pass. PLATFORM-09 remains open for the deployed browser matrix, rollback rehearsal, observation window, and residual callback compatibility review.

## PLATFORM-10 — Admin domain organization in progress

- Admin now has one app-owned navigation-domain contract for Portfolio, Studio, and System. The generic `@repo/ui` renderer remains unaware of routes and roles.
- Portfolio includes the existing profile/content managers and Blog. System includes Users and Deployments. Studio is retained as an explicit domain but is not rendered empty and has no invented route; a managed catalog remains blocked on a separately approved `jg_app` contract.
- The legacy Vercel environment-manager route remains reachable for compatibility and keeps a System breadcrumb, but its navigation link was removed because the binding blueprint keeps infrastructure secrets in provider configuration rather than Admin.
- Role visibility is unchanged: ordinary admins see Portfolio operations; super admins additionally see the current System operations. No authorization, service-role, session, callback, or database behavior changed.
- Focused proof now passes across twelve Vitest files and forty-nine tests, including sidebar preference restoration, route intent, Admin domain visibility, active routes, deployment details, and legacy environment-route classification. Full monorepo TypeScript, zero-warning lint, and Portfolio/Studio/Admin production builds passed for the shared-foundation tree; the final Admin-only correction also passes focused TypeScript, lint, tests, and build.
- Authenticated local browser proof confirmed the Admin routes render, active navigation and breadcrumbs update, and the shared collapse state survives reload with the `48px` collapsed header. Existing development warnings around Supabase session access and Next.js smooth scrolling remain recorded; Auth/session work is still deferred under ADR-001.
- PLATFORM-10 remains In Progress: Studio catalog operations, Resume ownership, terms/policies, provider-secret removal from the legacy route, AAL2 mutation proof, and the complete authorization/rollback/deployment gates are not done.
