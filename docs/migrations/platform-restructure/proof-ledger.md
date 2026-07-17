# Platform Restructure Proof Ledger

## PLATFORM-00 — In Progress

- Baseline commit: `e6a7e60aa573f0468feedd47b6e4b059fd8553a6` on `origin/main`.
- Canonical Supabase target verified: `jayantgoyal` (`orwfvyditlguqvxvztkw`).
- Current Vercel platform projects verified:
  - `jayantgoyal-studio` (`prj_i9cXy9kUNTtLcewSSmO90d9hmYdl`) → `apps/studio` → `studio.jayantgoyal.com`
  - `jayantgoyal-admin` → `apps/admin` → `admin.jayantgoyal.com`
  - `jayantgoyal-portfolio` (`prj_EBZwXQASK4Abaw6Nc9ZG17j8cF7G`) → `apps/portfolio` → `jayantgoyal.com`, `www.jayantgoyal.com`
- Vercel environment foundation applied and verified:
  - ADR-006 defines exactly three contexts: localhost Development, Vercel-managed Preview, and final-domain Production.
  - Set Production `NEXT_PUBLIC_SITE_URL` to the canonical Portfolio and Studio hosts after the apex cutover. Admin does not consume this variable and uses the current browser origin for its callback.
  - Left Preview without a fixed site URL so each deployment uses its actual Vercel origin.
  - Standardized Development URLs and local scripts: Portfolio `3000`, Studio `3001`, Admin `3002`; Auth remains reserved for `3003`.
  - Read back Studio's cross-app `NEXT_PUBLIC_PORTFOLIO_URL` for Development, Preview, and Production. Local Studio targets Portfolio on `3000`; Preview and Production target the stable apex.
  - Read back Studio's canonical `NEXT_PUBLIC_STUDIO_URL` for the same three targets. Development uses `3001`; Preview and Production use the canonical Studio host.
  - Confirmed the three Supabase variables cover Development, Preview, and Production on both existing projects without exposing their values.
  - Configured Portfolio's complete eleven-key runtime contract across Development, Preview, and Production. The Portfolio project intentionally has no Supabase service-role key.
  - Verified every consumed public URL value through Vercel's read API without printing secret/provider values. Preview has no fixed `NEXT_PUBLIC_SITE_URL`; Portfolio and Studio use exact localhost Development origins and canonical Production hosts; Admin has no unused site-URL entry.
  - Removed thirteen Portfolio/Resume/Commerce-only variables from Studio after a source inventory proved no Studio consumer remains. Admin now uses `VERCEL_PROJECT_ID_STUDIO` in all three targets and no longer has `VERCEL_PROJECT_ID_JG`.
- Existing e-commerce Vercel projects are intentionally outside this platform migration.
- A post-merge provider audit found zero branch-scoped or staging-named variables
  across Portfolio, Studio, and Admin, and no staging Vercel domains. The unused
  Admin `NEXT_PUBLIC_SITE_URL` entries were removed from Development and
  Production; all remaining Admin variables have active source consumers.
  Admin's project build command now matches its package exactly:
  `pnpm --filter admin build`. Portfolio, Studio, Admin, apex, and `www` retain
  only their intended Production domain assignments.
- Cloudflare stale Vercel records for `accounts`, `admin-employee`, `auth`, and `employee` were removed on the user's explicit instruction before implementation began. The later ADR-006 cleanup removed every `*.staging.jayantgoyal.com` record and the orphaned `portfolio.jayantgoyal.com` CNAME after Vercel confirmed it had no project assignment. Final Portfolio/Studio/Admin, apex, `www`, commerce, and mail records were not changed by that cleanup.
- Live Supabase Auth baseline before remediation: Site URL and redirect allowlist were local-only; Google and email providers were enabled; GitHub and TOTP MFA were disabled.
- Expedited hosted Auth remediation approved by the user and applied through a scoped Supabase Management API patch:
  - Site URL is now `https://jayantgoyal.com`.
  - The allowlist covers the production platform hosts, local ports `3000` through `3003`, and only the current Studio/Admin Vercel preview hostname families. The pre-rename Studio wildcard and every staging callback were removed.
  - The recovery template was subsequently corrected to use `{{ .RedirectTo }}` rather than `{{ .SiteURL }}`. This preserves the existing template and makes every password-recovery link use the exact callback requested by the application.
  - A read-after-write verification confirmed the exact URL settings, the recovery-template placeholder, and that Google/email providers remain enabled.
  - A non-user request to the hosted recovery endpoint confirmed that Supabase accepts `https://jayantgoyal.com/auth/callback` with HTTP `200`; no message was sent to a user.
- Residual risks:
  - The existing Google flow places `next` in `redirectTo`; the temporary same-origin wildcard paths preserve compatibility, but a tested server-side destination handoff is still required before narrowing production callbacks.
  - Parent-domain cookies and cross-subdomain SSO are deferred until PLATFORM-04.
  - Auth Vercel environment inventory remains pending until the Auth project exists.
  - Unrelated Vercel preview hosts cannot prove parent-domain cookies or cross-subdomain SSO; those journeys require a controlled, reversible Production rollout under ADR-006.
  - Deployed authenticated product journeys, rollback rehearsal, and the required observation window remain incomplete even though public production smoke checks pass.

## Post-merge deployment reconciliation

- PR #39 merged to `main` as `4703e7c83d0b92935dc8dd10a3535a2f7d51a426`; the Portfolio, Studio, and Admin production deployment checks passed for the merged boundary.
- Post-merge public checks on 2026-07-17 returned `200` for `https://jayantgoyal.com/` and `https://studio.jayantgoyal.com/`. Admin completed its expected single redirect from `/` to `/welcome?redirect=%2F` and returned `200`.
- ADR-006 superseded the persistent staging model. Cloudflare and Vercel read-backs confirm that the Portfolio, Studio, and Admin staging domains are absent; six branch-scoped Vercel variables were deleted; Supabase contains no staging callback; and the redundant remote branch was deleted only after it matched `origin/main` and had no open PR.
- The previous build-rate-limit and pre-cutover canonical blockers are resolved. The open gates are authenticated product coverage, deployed responsive/browser evidence, controlled Production auth proof, rollback rehearsal, and observation.

## PLATFORM-01 / PLATFORM-02 / PLATFORM-03 — Auth foundation in progress

- Added repository-local Vitest `4.1.10` with a single `pnpm test` command and no production dependency.
- Twelve focused tests pass across four files: Studio hostname classification, Vercel-host recognition, cross-application URL normalization, Portfolio/Studio redirect ownership, and contact validation that exits before delivery.
- The host tests exposed and now prevent an empty-host regression where absent Vercel variables could classify a missing Host header as Studio.
- Test fixtures contain no credentials, tokens, session data, or real delivery request. Provider, session, role, MFA, logout, and recovery regression coverage remains incomplete; PLATFORM-01 is not Done.
- The Auth-foundation slice upgrades `@supabase/ssr` from `0.7.0` to `0.12.3` and `@supabase/supabase-js` from `2.84.0` to `2.110.7` after reviewing current official SSR client, cookie, and authorization guidance. The supported runtime floor is now Node.js 22.
- `@repo/auth` owns only the neutral browser client, per-request/server client, refreshed-cookie/cache-header adapter, and safe same-origin return-path policy. Admin retains role/AAL2 enforcement; Studio retains terms, profile, product-access, and destination policy; privileged service-role clients remain application-local.
- Studio and Admin callbacks, Proxies, welcome flows, and MFA continuations now reject external redirect destinations. Replacement MFA/recovery/error redirects retain refreshed cookies and Supabase's private/no-cache headers without copying the old `Location` header.
- Focused tests cover malicious return paths, refreshed cookie/header writes, and cache-header propagation; the final focused pass completed 10 tests across two files. The full pre-review local pass completed 61 tests across 15 files, all eight zero-warning lint and typecheck tasks, and the full Portfolio/Studio/Admin monorepo build. Targeted Auth, Studio, and Admin typechecks and zero-warning lint passed again after the final response-propagation correction; the expensive full suite was not repeated. The production-dependency audit reports no known vulnerabilities.
- ADR-008 freezes UI work and assigns browser, Preview, Production, and observation checks to the user's manual deployment pass. These phases remain In Progress until their remaining automated contract coverage and required manual acceptance are recorded.
- The follow-up regression slice adds 15 synthetic tests for Admin anonymous redirects, role denial/success, AAL1-to-AAL2 step-up, callback failure, safe destinations, Studio callback failure/recovery, recovery-mode confinement, terms enforcement, and replacement-response propagation. The full local suite now passes 77 tests across 18 files; targeted Admin/Studio typechecks and zero-warning lint pass. No production source, credential, provider, database, or deployed application is touched.

## PLATFORM-04 — Shared-session compatibility in progress

- Installed-source review confirms the legacy Supabase storage key is `sb-<project-ref>-auth-token`, cookie chunks use exact numeric suffixes, and `@supabase/ssr` `0.12.3` applies configured attributes to deletion while clearing a host-only counterpart during a Domain migration.
- `@repo/auth/cookies` defines three explicit modes: rollback/default `legacy`, validated dual-read `compatibility`, and post-observation `platform`. Trusted Production hosts use `__Secure-jg-session-v1` with Domain `jayantgoyal.com`, Path `/`, Secure, and SameSite Lax. Generated Previews use that name host-only; localhost uses host-only `jg-session-v1` without Secure/Domain.
- Compatibility mode prefers any platform cookie. With legacy state only, the request client authenticates it through `getUser()`, transfers only in-memory access/refresh credentials through `setSession()`, and validates the platform user again. Invalid state is never authorized, tokens never enter URLs/logs, and Studio/Admin policy remains application-local.
- Studio's fast path now detects the cookie families allowed by the active mode instead of manually decoding only the first legacy chunk. AAL comes from the Supabase client after the authenticated path is entered.
- The Studio protected layout now uses that same shared detector with the
  request hostname, so legacy, compatibility, platform, localhost, Preview, and
  trusted Production names cannot disagree with the Proxy. Shared Server
  Components select the legacy family only for the original legacy-only request
  being promoted, prefer platform when both exist, and never fall back in final
  platform mode. This closes the first-request gap where the Proxy wrote the new
  cookie to the response but the rendered component could see only the original
  request snapshot.
- Ordinary Studio/Admin logout, terms rejection, and recovery cleanup explicitly use local scope. Global sign-out is reserved for an explicit password-reset choice or account deletion. Admin role denial no longer destroys the shared identity session.
- Turborepo treats `NEXT_PUBLIC_AUTH_SESSION_MODE` as a build input and no longer lists obsolete guest credentials. Vercel Studio and Admin each have exactly one unscoped, non-sensitive rollout entry covering Development, Preview, and Production; both are set to `legacy`, so current deployed behavior remains unchanged.
- Vercel Studio and Admin also have the non-sensitive Auth entry owner set to
  `legacy` for Development, Preview, and Production. Their Auth URL is local
  port `3003` in Development and canonical Auth in Preview/Production; the URL
  remains inert while the owner is `legacy`.
- Local proof covers cookie attributes, chunk selection, platform preference, validated promotion/failure/mismatch, logout scopes, Admin denial/AAL2, callbacks, recovery, terms, and response propagation. The first final-suite attempt caught bracketed IPv6 localhost receiving the secure policy; the corrected focused file passes 23 tests. The final full suite passes 110 tests across 21 files, all eight zero-warning lint and typecheck tasks pass, and the complete Portfolio/Studio/Admin build passes. No hosted Supabase or database change was made.
- A deterministic two-request regression starts Studio and Admin legacy
  promotion concurrently and simulates one refresh-token transfer collision.
  The successful request adopts the platform client while the affected request
  retains its already validated legacy client; client state is not shared
  across the two factories. Hosted refresh-token timing is still a manual
  Production observation rather than a claim made by the synthetic test.
- The follow-up consumer audit passes 34 focused cookie/factory/Studio tests and
  15 focused Admin/Auth regression contracts. Auth, Studio, Admin, and the
  shared Auth package pass TypeScript and zero-warning lint. The audit search
  finds no remaining application-side manual Supabase session-cookie detector.
- Remaining gates: user manual same-app Preview acceptance, controlled
  cross-subdomain Production validation (including actual expired-token and
  open-tab behavior), and rollback observation. PLATFORM-04 is not Done.

## PLATFORM-05 — Standalone Auth local dark launch in progress

- `apps/auth` is an independently buildable Next.js application named `auth`
  on local port `3003`. It consumes `@repo/auth`, `@repo/brand`,
  `@repo/platform`, and behavior-neutral `@repo/ui` presentation primitives.
- The initial route inventory exists: login, registration, forgot/reset,
  verification, callback, MFA, account security, connected providers, logout,
  and a safe error/retry surface. Portfolio, Studio, and Admin do not redirect
  to these routes, so existing authentication remains primary.
- Exact return-target validation supports relative destinations, canonical
  platform origins, local application ports, and explicitly configured exact
  Preview origins. Lookalikes, protocol-relative URLs, credentials, unsupported
  schemes, and unconfigured Preview hosts fall back safely.
- Password login, Google initiation, registration, recovery, provider linking,
  identity unlinking, current/global logout, password reauthentication, MFA
  enrollment/challenge/disable, and callback exchange use shared Supabase SSR
  clients. User-triggered mutations verify the exact request Origin. Logout is
  POST-only; callback GET is limited to provider/OTP protocol completion.
- Auth requests are no-index and no-store. Its CSP omits Studio analytics and
  unrelated API hosts. Callback errors are mapped to stable user-safe codes;
  authorization codes, tokens, and provider error messages are not logged.
- Auth has no service-role environment variable or admin client. Existing
  Studio/Admin service-role operations were not copied.
- Provider-readiness target is the exact Vercel project `jayantgoyal-auth`
  (`prj_aioHlnbOo2PcCbTjjDHUwQon2iDD`) linked to `goyal1510/jayantgoyal`, root
  `apps/auth`, build `pnpm --filter auth build`, install `pnpm install`, and
  Node.js 24.x. `auth.jayantgoyal.com` is assigned to this project. Cloudflare
  now has a DNS-only `A` record to Vercel at `76.76.21.21`, and public DNS
  resolves to that exact address.
- Auth's hosted inventory contains only the public Supabase URL/anon key,
  `legacy` session mode, and environment-specific public application URLs.
  Development uses ports 3000 through 3003, Preview has no fixed Auth Site URL,
  and Production reserves `https://auth.jayantgoyal.com`. No service-role,
  Vercel, email, or unrelated integration secret was copied.
- All nine existing Portfolio/Studio/Admin environment inventories resolve to
  the approved Supabase project `jayantgoyal` (`orwfvyditlguqvxvztkw`) with the
  same public URL and anon key. The scoped hosted Auth patch adds only the Auth
  Preview callback family, enables TOTP enrollment/verification, and enables
  authenticated manual identity linking. The hosted Site URL remains
  `https://jayantgoyal.com`; no default application cutover occurred.
- Final local proof passes 153 tests across 26 files, all nine zero-warning lint
  tasks, all nine TypeScript tasks, and the complete Portfolio, Studio, Admin,
  Auth, and shared-package production build. Auth's build manifest contains the
  entire approved route inventory and Proxy. The build emitted only the
  existing Portfolio missing-local-public-Supabase fallbacks and source-package
  output warnings.
- The subsequent security-review corrections pass focused Auth TypeScript,
  zero-warning lint, and all eight Auth contract tests. Mutation actions were
  then split by entry, recovery, account, MFA, and logout responsibility; all
  35 targeted Auth tests across five files, Auth TypeScript, and zero-warning
  Auth lint pass after the split. The complete expensive gate was not repeated
  after these narrowly scoped corrections under ADR-008.
- A direct deployment API request and the subsequent Git Preview check were
  rejected by Vercel's account-wide daily deployment/build rate limit before an
  Auth deployment was created. Vercel reports retry in 24 hours; this is an
  operational limit, not an application build failure. Portfolio, Studio,
  Admin, and Auth now all use their exact `scripts/ignore-build.sh` project
  settings to avoid consuming future capacity on unrelated changes.
- A default-off canonical-entry adapter is prepared in Studio and Admin.
  `NEXT_PUBLIC_AUTH_FLOW_OWNER` defaults to `legacy`; only the exact `auth`
  value redirects `/welcome` to canonical Auth. The shared builder preserves an
  exact application return target, rejects external paths and lookalike Auth
  origins, and falls back to canonical Auth for invalid configuration. Session
  migration remains independently controlled by `NEXT_PUBLIC_AUTH_SESSION_MODE`.
  Legacy callback, recovery, MFA, and logout code is retained.
- Focused readiness proof passes 14 tests across the shared Auth entry contract
  and the Studio/Admin adapters. Auth, Studio, and Admin zero-warning lint and
  TypeScript pass after one nullable annotation caught by the first type gate.
- Remaining gates: first Git deployment, user-owned generated
  Preview application-local flows, controlled Production dark launch, manual
  browser acceptance, deployment/rollback identifiers, and observation.
  PLATFORM-05 is not Done.

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
- Portfolio was first validated additively at the now-retired compatibility hostname; the apex and `www` were later moved to the Portfolio project after route checks passed.
- Product links shown in Portfolio are resolved to the future canonical Studio origin so the later apex cutover does not strand product routes.
- Focused verification passed: Portfolio TypeScript, zero-warning ESLint, production build, desktop browser rendering, mobile navigation, all seven section anchors, project modal behavior, Studio link rewriting, zero horizontal overflow, and zero captured browser console errors.
- Portfolio now owns the public Blog index/articles, Resume landing/download, sitemap article discovery, `llms.txt`, not-found, and error surfaces without importing Studio authentication or product infrastructure.
- Local production smoke confirmed Portfolio content routes return `200`, unknown routes return `404`, known content aliases return `308`, and product/Auth/API families return one-hop method-preserving `307` redirects to Studio with query strings intact.
- The extracted Portfolio now preserves the historical `POST /api/contact` contract through the same server-only delivery service as the UI Server Action. Portfolio TypeScript, zero-warning lint, and production build pass; local black-box checks confirm malformed JSON, missing fields, invalid email, and unsupported methods fail without attempting delivery.
- Vercel project `jayantgoyal-portfolio` was created with root `apps/portfolio`, GitHub integration, and the corrected project-level build command `pnpm --filter portfolio build`.
- Preview deployment `dpl_7CiJsCTyFZfZGUb6Euro6etDAK3L` was used for the initial compatibility validation before that custom hostname was retired. Portfolio diagnosis now uses generated immutable Vercel URLs, while the apex and `www` remain canonical.
- A fresh 90-day Vercel certificate was issued. Explicitly assigning the tested deployment replaced the stale edge mapping: HTTP/1.1 and HTTP/2 checks across both resolved edge addresses now present the fresh certificate, ten consecutive HTTPS checks returned `200`, and root, robots, sitemap, manifest, Open Graph, GitHub proxy, GitHub LOC, and resume routes return `200`.
- Deployed Chrome validation could not start because the installed extension connection was unavailable; local browser proof and deployed black-box HTTP proof are recorded, but the deployed visual gate and final rollback proof remain pending. PLATFORM-08 is not Done.
- Portfolio is independently available through generated Vercel previews and its canonical Production domains; no stable Preview domain is retained.

## PLATFORM-07 / PLATFORM-11 — Studio rename and deployment in progress

- The tracked application moved physically from `apps/jayantgoyal` to `apps/studio`; its package and workspace filter are now exactly `studio`.
- The existing Vercel project was renamed in place to `jayantgoyal-studio`, repointed to `apps/studio`, and configured with `pnpm --filter studio build` plus the project-level Studio ignore-build command. No second Studio project was created.
- Studio is a single-purpose runtime on every host and renders its public inventory with five immediately usable products, five account-backed workspaces, and the separately deployed e-commerce application.
- Studio-owned root metadata, sidebar branding, navigation, breadcrumbs, manifest, robots, sitemap, and structured data no longer select a Portfolio identity by hostname.
- Duplicated Portfolio components, data access, Blog/Resume/Contact routes, and assets were removed from Studio. Legacy Portfolio page routes use permanent cross-application redirects, while compatibility API routes use temporary method-preserving redirects.
- Focused verification passed: Main TypeScript, zero-warning ESLint, production build, Studio hostname browser rendering, Studio product inventory and links, current-root Portfolio compatibility, zero horizontal overflow at the default browser viewport, and zero captured browser console errors.
- Studio's Blog, Portfolio, terms/contact, and error-navigation links now respect the split boundary. A local production black-box check confirms the Studio marker renders, Blog crosses to Portfolio, and product links remain on Studio.
- Studio identity is fixed; hostname awareness is retained only for generated-Preview indexability.
- Vercel preview deployment `dpl_7y1m635L1BoYUzBqMqmYvunsjKTB` is Ready and passed black-box checks for Studio metadata and inventory links. Because the daily deployment limit blocked promotion, the exact tested deployment is reversibly assigned to `studio.jayantgoyal.com`.
- Public DNS resolves `studio.jayantgoyal.com` to Vercel, direct HTTPS checks return `200`, and the apex still redirects to the existing `www` Portfolio with no Studio marker.
- Studio is independently available through generated Vercel previews and `studio.jayantgoyal.com`; no stable Preview domain is retained.
- Local verification after the physical rename passes: 11 focused Vitest tests, Studio TypeScript, zero-warning ESLint, and the Studio production build. The merged boundary is deployed; PLATFORM-07 and PLATFORM-11 remain open until responsive/auth-gated product transitions and the rollback/observation gates are verified.
- PLATFORM-11 discovery now separates the intentional featured set on Studio
  Home from a public `/products` catalog and static product-detail pages. Each
  product declares type, status, access requirement, capability, highlights,
  and launch destination before opening its existing public, account-backed, or
  external experience. Blog remains a Portfolio-owned navigation link rather
  than a Studio product. ADR-007 preserves the user-approved shared Studio shell
  on discovery pages without moving product permissions or workspace data into
  the shared UI package.
- The discovery slice passes 13 Vitest files and 52 tests, Studio zero-warning
  lint, TypeScript, and a production build. Chrome production-mode checks cover
  desktop and mobile discovery, type filtering, public/account/external details,
  canonical product JSON-LD, and the account launch gate; the final browser log
  contains no warnings or errors. Preview/Production deployment and observation
  proof remain pending, so PLATFORM-11 remains In Progress.

## PLATFORM-09 — Domain cutover in progress

- Vercel moved `jayantgoyal.com` and `www.jayantgoyal.com` from the renamed Studio project to the Portfolio project. Studio retains `studio.jayantgoyal.com` as its only platform custom domain.
- The canonical domain direction is now apex-first: `www.jayantgoyal.com` returns permanent `308` to `https://jayantgoyal.com/`; the apex does not redirect.
- The apex is assigned to the Portfolio project, and the merged PR #39 production deployment completed successfully.
- Live black-box checks pass for Portfolio root, Blog, Resume, robots, sitemap, and manifest. Historical professional aliases return `308` to Portfolio sections; all classified product families and current Auth paths return method-preserving `307` handoffs to Studio; Studio and the Portfolio compatibility subdomain return `200`.
- The post-merge Portfolio deployment emits the apex canonical contract and public root checks pass. PLATFORM-09 remains open for the deployed browser matrix, rollback rehearsal, observation window, and residual callback compatibility review.

## PLATFORM-10 — Admin domain organization in progress

- Admin now has one app-owned navigation-domain contract for Portfolio, Studio, and System. The generic `@repo/ui` renderer remains unaware of routes and roles.
- Portfolio includes the existing profile/content managers and Blog. System includes Users and Deployments. Studio is retained as an explicit domain but is not rendered empty and has no invented route; a managed catalog remains blocked on a separately approved `jg_app` contract.
- The browser-facing Vercel environment manager, value-reveal UI, client helpers,
  and read/write API routes are removed. The old `/deployments/env` URL now
  temporarily redirects to Deployments so bookmarks fail safely while provider
  secrets remain in Vercel configuration.
- Role visibility is unchanged: ordinary admins see Portfolio operations; super admins additionally see the current System operations. No authorization, service-role, session, callback, or database behavior changed.
- Focused proof now passes across twelve Vitest files and forty-nine tests, including sidebar preference restoration, route intent, Admin domain visibility, active routes, deployment details, and legacy environment-route classification. Full monorepo TypeScript, zero-warning lint, and Portfolio/Studio/Admin production builds passed for the shared-foundation tree; the final Admin-only correction also passes focused TypeScript, lint, tests, and build.
- Authenticated local browser proof confirmed the Admin routes render, active navigation and breadcrumbs update, and the shared collapse state survives reload with the `48px` collapsed header. Existing development warnings around Supabase session access and Next.js smooth scrolling remain recorded; Auth/session work is still deferred under ADR-001.
- PLATFORM-10 remains In Progress: Studio catalog operations, Resume ownership,
  terms/policies, AAL2 mutation proof, and the complete
  authorization/rollback/deployment gates are not done.
