# Platform Restructure Proof Ledger

## PLATFORM-00 — In Progress

- Baseline commit: `e6a7e60aa573f0468feedd47b6e4b059fd8553a6` on `origin/main`.
- Canonical Supabase target verified: `jayantgoyal` (`orwfvyditlguqvxvztkw`).
- Current Vercel platform projects verified:
  - `jayantgoyal-jayantgoyal` → `apps/jayantgoyal` → `jayantgoyal.com`, `www.jayantgoyal.com`
  - `jayantgoyal-admin` → `apps/admin` → `admin.jayantgoyal.com`
- Vercel environment foundation applied and verified:
  - Created the persistent remote `staging` branch from the verified `origin/main` baseline.
  - Reset both Production `NEXT_PUBLIC_SITE_URL` values to their canonical Main/Admin hosts.
  - Added branch-specific Preview values for `portfolio.staging.jayantgoyal.com` and `admin.staging.jayantgoyal.com`.
  - Left generic Preview without a fixed site URL so each deployment uses its own origin.
  - Confirmed the three Supabase variables cover Development, Preview, and Production on both existing projects without exposing their values.
- Existing e-commerce Vercel projects are intentionally outside this platform migration.
- Cloudflare stale Vercel records for `accounts`, `admin-employee`, `auth`, and `employee` were removed on the user's explicit instruction before implementation began.
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
  - Studio/Auth Vercel environment inventories remain pending until those projects exist.
  - Staging domains and DNS remain pending; no host is attached before its application is ready.

## PLATFORM-08 — In Progress

- Execution order changed by accepted ADR-001: Portfolio and Studio boundaries precede shared Auth/SSO.
- The Portfolio dependency inventory confirms the public app needs portfolio content, public Supabase reads, GitHub statistics, contact delivery, resume export, and shared UI only.
- The new `apps/portfolio` boundary does not import Studio authentication, product routes, sidebar code, games, files, messenger, or other product workspaces.
- The current root application and its Vercel project remain unchanged during this local dark-launch build.
- Product links shown in Portfolio are resolved to the future canonical Studio origin so the later apex cutover does not strand product routes.
- Focused verification passed: Portfolio TypeScript, zero-warning ESLint, production build, desktop browser rendering, mobile navigation, all seven section anchors, project modal behavior, Studio link rewriting, zero horizontal overflow, and zero captured browser console errors.
- Deployment, browser validation, domain attachment, and rollback proof remain pending; PLATFORM-08 is not Done.

## PLATFORM-07 / PLATFORM-11 — Compatibility preparation

- The existing application now recognizes only the approved Studio production, staging, and local hostnames.
- Studio hosts render a public inventory with five immediately usable products, five account-backed workspaces, and the separately deployed e-commerce application.
- The Studio hostname receives Studio-specific root metadata, sidebar branding, navigation ownership, and breadcrumb labeling.
- The existing apex/local root continues rendering the current Portfolio experience; no domain has been moved and no production host behavior has changed yet.
- Focused verification passed: Main TypeScript, zero-warning ESLint, production build, Studio hostname browser rendering, Studio product inventory and links, current-root Portfolio compatibility, zero horizontal overflow at the default browser viewport, and zero captured browser console errors.
- This is preparatory compatibility evidence only. PLATFORM-07 and PLATFORM-11 remain open until the deployed Studio host, responsive layouts, auth-gated product transitions, rollback path, and required observation gates are verified.
