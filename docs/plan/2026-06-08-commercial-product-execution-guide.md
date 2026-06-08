# Commercial Product Execution Guide

Date: 2026-06-08
App: `apps/jayantgoyal`
Mode: New guide
Source contract: `/Users/jayant/.codex/skills/agentic-execution-guide/references/agentic-execution-guide-contract.md`

## Operating Contract

### Current Scope

Turn `jayantgoyal` from a portfolio-centered authenticated hub into a sellable product platform while preserving the portfolio as a personal/public surface.

The first commercial product shape is:

- Public portfolio remains at `/`.
- Public product marketing and store live at `/pricing`, `/store`, `/store/[slug]`, and focused feature pages.
- Authenticated product remains under the current protected app shell.
- Admin app manages products, orders, subscriptions, entitlements, and support operations.
- Razorpay is the active payment provider for checkout and webhooks because Stripe account activation is blocked by India account geography. Stripe remains optional fallback code only.
- Supabase remains the source of truth for user profiles, product catalog mirror, orders, subscription status, entitlements, files, messenger, games, and tool usage.

### Deferred Scope

- Native mobile apps.
- Team/workspace billing.
- Marketplace payouts to third-party sellers.
- Real-money game wagering, rewards, or gambling mechanics.
- Complex tax/VAT automation beyond payment-provider defaults.
- Enterprise SSO.
- Multi-provider payment abstraction.
- AI features that require separate cost controls, unless billing/entitlements are already stable.

### Stop Conditions

Stop and escalate before implementation if any of these are true:

- Razorpay credentials, webhook secret, or provider-mode decision is missing.
- There is ambiguity between Razorpay test and live dashboard credentials.
- A migration may alter or delete production customer, file, message, order, or auth data.
- A payment flow can grant access without verified payment or webhook confirmation.
- A webhook handler cannot be made idempotent.
- A service-role key would be exposed to client code.
- There is a legal/compliance ambiguity around refund terms, privacy terms, tax collection, or paid digital delivery.
- Validation fails after one scoped retry and the cause is still unexplained.

### Proof-Note Location

Write proof notes to this guide's Proof Ledger and to a matching session entry under `docs/sessions/`.

Proof notes must omit secrets, raw webhook payloads, raw customer PII, credential values, and unredacted screenshots.

## Product Strategy

### Sellable Product Thesis

Position the app as **Jayant Tools**, a practical developer and creator workspace:

- Free: portfolio, public blog, limited tools, limited games, limited storage.
- Pro: saved tool history, bulk utilities, file storage, share links, premium calculators, advanced game stats, and priority support.
- Digital products: templates, starter kits, resume/portfolio kits, productivity files, custom calculator templates, and downloadable guides.
- Services: fixed-scope packages such as portfolio setup, code review, dashboard build, or Supabase/Next.js implementation support.

### Monetization Priorities

1. One-time digital products.
2. Subscription plan for premium workspace features.
3. Service packages sold through the store.
4. Later: API access, team workspaces, AI credits, or branded template packs.

## Interface Contracts

### Public Routes

- `GET /pricing`
  - Shows plan tiers, free/pro comparison, upgrade CTA, and logged-in plan state when available.
- `GET /store`
  - Lists published products with category, price, short description, and CTA.
- `GET /store/[slug]`
  - Product detail page with media, price, delivery type, purchase CTA, and trust/refund copy.
- `GET /terms-conditions`, `GET /privacy`, `GET /refund-policy`
  - Required commercial policy pages before real payment launch.

### Authenticated Product Routes

- `GET /account/billing`
  - Current plan, active entitlements, invoices/portal CTA, purchases, and cancellation state.
- `GET /account/purchases`
  - Purchased digital products and download/access actions.
- Existing protected app routes
  - Add entitlement-aware limits where relevant: tools, files, calculator, messenger, and games.

### Admin Routes

Admin app target surfaces:

- `/commerce/products`
- `/commerce/orders`
- `/commerce/subscriptions`
- `/commerce/entitlements`
- `/commerce/support`

Admin routes must require existing admin/super_admin role checks.

### API/BFF Contracts

- `GET /api/commerce/products`
  - Public list of published products.
  - No service-role access.
- `GET /api/commerce/products/[slug]`
  - Public detail for a published product.
- `POST /api/commerce/checkout`
  - Auth required.
  - Body: `{ priceId: string, successPath?: string, cancelPath?: string }`.
  - Creates a Razorpay Order for one-time products.
  - Returns Razorpay Checkout options for the client modal.
  - Must validate price/product exists and is active.
- `POST /api/commerce/billing-portal`
  - Auth required.
  - Returns provider-specific billing support when supported; Razorpay portal support is not part of the current slice.
- `POST /api/commerce/webhooks/razorpay`
  - No Supabase user session required.
  - Validates Razorpay signature using webhook secret.
  - Idempotently stores event id and processes supported event types.
- `GET /api/account/entitlements`
  - Auth required.
  - Returns normalized plan and feature access for UI gates.
- `GET /api/account/purchases`
  - Auth required.
  - Lists completed paid products owned by current user.
- `POST /api/account/purchases/[id]/download`
  - Auth required.
  - Verifies entitlement/purchase ownership.
  - Returns short-lived signed URL or app-scoped access token.

### Data Ownership

- Razorpay owns payment method details, hosted checkout state, external payment ids, and webhook delivery.
- Supabase owns the app mirror of products, prices, customers, orders, subscriptions, entitlements, usage, and delivery records.
- App users own their files, messages, tool history, game stats, and purchased downloads.
- Admin users own product catalog content and fulfillment configuration.

### Access Control

- Public users can only read published products, public pricing, public blog, and portfolio content.
- Authenticated users can create checkout sessions, view their own billing state, and access their own purchases/entitlements.
- Admin users can manage catalog, orders, entitlements, and support.
- Webhook route can write commerce state only after Razorpay signature verification.
- Service-role usage must stay server-only and never cross into client bundles.

### Persistence And Offline Behavior

- Payments and entitlements must be server-persisted.
- Client UI may optimistically show "processing" after checkout return, but paid access is granted only after webhook/order confirmation.
- Checkout return pages must handle delayed webhooks and show a pending state with refresh/retry.
- Digital delivery links must be short-lived and regenerated on demand.

### Error And Retry Behavior

- Checkout creation failures show actionable UI messages without exposing provider internals.
- Webhook processing must be idempotent by Razorpay event id.
- Webhook failures should be retry-safe and log event id, event type, and sanitized reason.
- Entitlement checks default to deny when state is unknown.
- Admin catalog writes must fail closed on duplicate slugs, inactive prices, missing provider ids where required, or invalid delivery configuration.

## Persistent Task Queue

Task ID: COM-001
Status: Done
Objective: Create the commercial product session entry and execution guide.
Dependencies: None.
Target files/surfaces: `docs/plan/2026-06-08-commercial-product-execution-guide.md`, `docs/sessions/2026-06-08-commercial-product-planning.md`
Allowed changes: Planning docs only.
Forbidden changes: App code, database migrations, payment-provider calls, production data writes.
Acceptance checks:
- API/BFF: Not applicable.
- native/client: Not applicable.
- offline/retry: Not applicable.
- source/security scan: `git diff --check`.
- black-box: Not applicable.
Proof note required: Document exact files created and any validation command run.
Stop/escalate if: The guide lacks required agentic execution sections.

Task ID: COM-002
Status: Done
Objective: Confirm commerce provider configuration and product-mode decisions.
Dependencies: COM-001.
Target files/surfaces: `.env.example` files, Vercel env inventory, Razorpay dashboard decisions, Supabase project link, `docs/references/razorpay-commerce-setup.md`.
Allowed changes: Environment documentation, non-secret examples, setup notes.
Forbidden changes: Printing secrets, committing `.env*`, switching live payment mode without explicit confirmation.
Acceptance checks:
- API/BFF: Confirm required env var names for Razorpay keys and webhook secret.
- native/client: Confirm public env use is limited to Razorpay key id.
- offline/retry: Document local webhook testing strategy for Razorpay.
- source/security scan: Search for accidental secret literals before commit.
- black-box: Not applicable.
Proof note required: Record selected payment provider, env var names, and confirmation that no secret values were committed.
Stop/escalate if: Razorpay account access, webhook forwarding, or test/live mode is unclear.

Task ID: COM-003
Status: Done
Objective: Add commerce schema for catalog, customers, orders, subscriptions, entitlements, webhook events, and digital delivery.
Dependencies: COM-002.
Target files/surfaces: `supabase/migrations/*`, `supabase/schemas/*`, generated database types if present.
Allowed changes: New `jg_app` commerce tables, indexes, RLS policies, helper functions, migration docs.
Forbidden changes: Destructive changes to existing auth, files, messenger, game, or portfolio tables.
Acceptance checks:
- API/BFF: Tables support product lookup, checkout/order state, subscription state, entitlement lookup, and idempotent webhook storage.
- native/client: Not applicable.
- offline/retry: Webhook event table has unique provider event id and retry-safe status fields.
- source/security scan: RLS enforces users read only own orders/subscriptions/entitlements; admins can manage catalog.
- black-box: Not applicable.
Proof note required: Migration filename, local/remote apply status, schema objects created, and RLS summary.
Stop/escalate if: Migration touches existing customer data destructively or RLS cannot be proven.

Task ID: COM-004
Status: Done
Objective: Build payment-provider server integration and commerce service helpers.
Dependencies: COM-003.
Target files/surfaces: `apps/jayantgoyal/src/lib/commerce/*`, env examples, server-only helpers.
Allowed changes: Payment-provider helper, product/price lookup service, customer/order mapping service, entitlement read service.
Forbidden changes: Client-side secret usage, direct provider calls from client components except hosted checkout script.
Acceptance checks:
- API/BFF: Helpers validate active products/prices and create provider order/customer ids where needed.
- native/client: No client bundle imports server-only commerce helpers.
- offline/retry: Helper functions return typed errors for retryable vs terminal failures.
- source/security scan: No service role or payment secret leaks into client files.
- black-box: Not applicable.
Proof note required: Commands run, source scan query used, and server/client boundary summary.
Stop/escalate if: Razorpay SDK cannot be installed or env contract is missing.

Task ID: COM-005
Status: Done
Objective: Implement checkout, billing portal, webhook, entitlement, and purchase APIs.
Dependencies: COM-004.
Target files/surfaces: `apps/jayantgoyal/src/app/api/commerce/*`, `apps/jayantgoyal/src/app/api/account/entitlements`, `apps/jayantgoyal/src/app/api/account/purchases`.
Allowed changes: Route handlers, typed request/response contracts, webhook event processors.
Forbidden changes: Granting access from checkout return alone, raw webhook logging, unauthenticated purchase access.
Acceptance checks:
- API/BFF: Checkout returns Razorpay Checkout options; webhook verifies signature; order state updates idempotently; entitlements default deny.
- native/client: API errors are shaped for UI consumption.
- offline/retry: Duplicate webhook event does not duplicate orders or entitlements.
- source/security scan: Auth checks on account APIs; signature verification on webhook; service role server-only.
- black-box: Use Razorpay test payment/webhook or documented signature test in local mode.
Proof note required: API test commands, event ids redacted, entitlement before/after state summary.
Stop/escalate if: Webhook signature verification cannot be tested.

Task ID: COM-006
Status: Done
Objective: Build public pricing and storefront pages.
Dependencies: COM-005.
Target files/surfaces: `apps/jayantgoyal/src/app/pricing`, `apps/jayantgoyal/src/app/store`, SEO files, breadcrumbs, sitemap, proxy/public route config.
Allowed changes: Public pages, metadata, Open Graph, sitemap entries, public route allowlist.
Forbidden changes: Replacing portfolio home with store without explicit approval.
Acceptance checks:
- API/BFF: Pages fetch only public/published product data.
- native/client: CTA works for logged-in and logged-out users; logged-out users are routed through auth before checkout.
- offline/retry: Checkout failures show recoverable UI state.
- source/security scan: Public pages cannot expose unpublished products or internal ids beyond safe public price/product ids.
- black-box: Browser test `/pricing`, `/store`, product detail, and checkout CTA path.
Proof note required: URLs tested, persona used, and visible UI results.
Stop/escalate if: Product positioning/copy is not approved for public launch.

Task ID: COM-007
Status: Done
Objective: Build account billing and purchase access UI.
Dependencies: COM-005.
Target files/surfaces: `apps/jayantgoyal/src/app/(protected)/account/billing`, `apps/jayantgoyal/src/app/(protected)/account/purchases`, sidebar/hub config.
Allowed changes: Protected account pages, billing portal CTA, purchase list, entitlement display, download access.
Forbidden changes: Persistent client-side entitlement decisions without server confirmation.
Acceptance checks:
- API/BFF: UI reads account entitlements and purchases from authenticated APIs.
- native/client: Shows free/pro/pending/canceled states clearly.
- offline/retry: Pending webhook state has retry/refresh affordance.
- source/security scan: Download action verifies ownership server-side.
- black-box: Browser test as free user, paid-test user, and admin if available.
Proof note required: Test persona, route URLs, and billing state observations.
Stop/escalate if: Test paid user cannot be created in Razorpay/Supabase safely.

Task ID: COM-008
Status: Done
Objective: Add admin commerce management.
Dependencies: COM-003, COM-005.
Target files/surfaces: `apps/admin/src/app/(admin)/commerce/*`, admin APIs/helpers, sidebar.
Allowed changes: Admin catalog CRUD, order view, subscription view, entitlement adjustments with audit trail.
Forbidden changes: Non-admin access, silent manual entitlement grants without audit reason.
Acceptance checks:
- API/BFF: Admin can create/edit products, attach prices, publish/unpublish, inspect orders.
- native/client: Admin UI handles empty/error/loading states.
- offline/retry: Admin writes are explicit and retry-safe; duplicate slug/price errors are clear.
- source/security scan: Admin role enforcement is server-side.
- black-box: Browser test as admin and non-admin.
Proof note required: Admin persona, blocked non-admin result, and CRUD result summary.
Stop/escalate if: Admin role or target app auth state is unclear.

Task ID: COM-009
Status: Done
Objective: Gate premium workspace features by entitlements and usage limits.
Dependencies: COM-007.
Target files/surfaces: tools, file manager, custom calculator, games, messenger support entry points, shared entitlement client/server helpers.
Allowed changes: Free/pro limits, upgrade prompts, usage counters, premium badges, access checks.
Forbidden changes: Breaking existing free core flows without product decision.
Acceptance checks:
- API/BFF: Server enforces limits for storage, downloads, saved history, and premium actions.
- native/client: UI explains locked states and routes to upgrade.
- offline/retry: Usage counters fail closed for paid-only actions and fail soft for read-only free features.
- source/security scan: No client-only paid gates for sensitive or resource-consuming actions.
- black-box: Browser test free user lock, pro user access, and downgrade behavior.
Proof note required: Feature gates tested, personas used, and limits verified.
Stop/escalate if: Free/pro feature matrix is not approved.

Task ID: COM-010
Status: Done
Objective: Productize file manager with paid storage and sharing.
Dependencies: COM-009.
Target files/surfaces: file APIs, storage policies, file manager UI, signed link routes.
Allowed changes: Quota checks, share links, expiring links, password option if feasible, download tracking.
Forbidden changes: Public file exposure without explicit share token and ownership checks.
Acceptance checks:
- API/BFF: Upload checks plan quota; share token grants only intended file access; revoke works.
- native/client: Share dialog, quota meter, plan upgrade states.
- offline/retry: Upload/share failures preserve user data and explain retry.
- source/security scan: Signed URLs are short-lived; share tokens are unguessable and scoped.
- black-box: Browser test upload near quota, share, revoke, expired link.
Proof note required: Test file type/size summary without sensitive contents, quota result, link behavior.
Stop/escalate if: Storage policy or RLS cannot be proven safe.

Task ID: COM-011
Status: Done
Objective: Productize tools with saved workspaces, bulk utilities, and paid history.
Dependencies: COM-009.
Target files/surfaces: tools routes, tool config, database usage/history tables, API routes.
Allowed changes: Saved history, favorites, tool collections, export results, premium bulk operations.
Forbidden changes: Persisting sensitive tool inputs by default for security-sensitive tools.
Acceptance checks:
- API/BFF: History persistence is opt-in or safe-by-default; paid limits enforced server-side.
- native/client: Tool pages expose save/export/bulk actions consistently.
- offline/retry: Local drafts survive transient API errors where safe.
- source/security scan: Hash/password/token/private-key tools do not store secrets unless explicitly user-approved and encrypted.
- black-box: Browser test save/export/bulk flow for safe sample data.
Proof note required: Tools tested, data sensitivity decision, and history visibility.
Stop/escalate if: Sensitive-data storage policy is ambiguous.

Task ID: COM-012
Status: Done
Objective: Turn messenger into buyer support and product conversation center.
Dependencies: COM-008.
Target files/surfaces: messenger APIs, admin commerce support route, notification/email hooks.
Allowed changes: Support conversations linked to orders/products, labels/statuses, admin reply flow, attachments.
Forbidden changes: Making private user-to-user messages visible to admins unless explicitly support-thread scoped.
Acceptance checks:
- API/BFF: Support threads have clear participants and product/order context.
- native/client: Buyer can open support from purchase/order; admin can respond.
- offline/retry: Failed send/upload can retry without duplicate messages.
- source/security scan: User conversations and support threads have separate visibility rules.
- black-box: Browser test buyer support thread and admin response.
Proof note required: Persona pair used, support thread lifecycle, and access-control result.
Stop/escalate if: Messenger privacy model is ambiguous.

Task ID: COM-013
Status: Done
Objective: Add product analytics and revenue dashboard.
Dependencies: COM-005, COM-008.
Target files/surfaces: admin dashboard, commerce reporting queries, event tracking.
Allowed changes: Revenue metrics, conversion funnel, product sales, active subscribers, churn states.
Forbidden changes: Tracking raw sensitive content from messages/files/tools.
Acceptance checks:
- API/BFF: Admin metrics are scoped to admin users and aggregate safely.
- native/client: Dashboard shows empty/loading/error states.
- offline/retry: Analytics ingestion is non-blocking for checkout and product usage.
- source/security scan: No sensitive payload logging.
- black-box: Browser test dashboard with seeded/test data.
Proof note required: Metrics shown, data source, and privacy summary.
Stop/escalate if: Analytics provider or self-hosted tracking decision is unresolved.

Task ID: COM-014
Status: Done
Objective: Add commercial policies, emails, and release readiness.
Dependencies: COM-006, COM-007.
Target files/surfaces: policy pages, email templates, Resend helpers, sitemap, robots, metadata.
Allowed changes: Privacy/refund/contact policy pages, receipt/access emails, support emails, launch checklist.
Forbidden changes: Sending production emails to real users during tests without approval.
Acceptance checks:
- API/BFF: Email triggers use completed order/subscription events only.
- native/client: Policy pages are reachable from checkout/store/footer.
- offline/retry: Email failures are logged and retryable without blocking entitlement grants.
- source/security scan: No secrets or raw payment details in emails/logs.
- black-box: Browser policy navigation; test email in approved test environment.
Proof note required: Pages tested, email route/template tested, and delivery mode.
Stop/escalate if: Legal copy needs owner approval.

Task ID: COM-015
Status: Done
Objective: End-to-end launch validation and direct-to-main shipping.
Dependencies: COM-002 through COM-014.
Target files/surfaces: Whole monorepo, Vercel deployment, Supabase, Razorpay test mode.
Allowed changes: Fixes discovered by validation, documentation updates, release notes.
Forbidden changes: Live-mode launch without explicit final approval.
Acceptance checks:
- API/BFF: Checkout, webhook, entitlement, billing portal, purchase download, admin catalog all pass.
- native/client: Public store/pricing, account billing, gated features, admin commerce pass in browser.
- offline/retry: Delayed webhook and duplicate webhook scenarios pass.
- source/security scan: Lint, typecheck, build, diff security review, secret scan pass.
- black-box: Full buyer journey: signup/login, checkout, return, entitlement, access/download, billing portal, support.
Proof note required: Full command list, browser journeys, Razorpay mode, Supabase project, residual risks.
Stop/escalate if: Any payment entitlement path is inconsistent or live-mode approval is missing.

## Verification Matrix

| Layer | Required Verification |
| --- | --- |
| Source hygiene | `git status --short --branch`, explicit worktree path, no source clone edits. |
| Formatting | `git diff --check`. |
| Lint | `pnpm --filter jg lint`; `pnpm --filter admin lint` when admin changes. |
| Types | `pnpm --filter jg check-types`; `pnpm --filter admin check-types` when admin changes. |
| Build | `pnpm build --filter jg`; `pnpm build --filter admin` when admin changes. |
| Database | Local migration validation plus reviewed remote apply when user approves. |
| API | Route-level tests with authenticated users, admin user, unauthenticated user, and webhook signature validation. |
| Razorpay | Test-mode checkout, signature verification, webhook event replay, duplicate event replay, and failed payment handling. |
| Browser | Agent browser validation for public store/pricing, auth redirect, checkout return, account billing, admin catalog, gated features. |
| Security | Service-role/server-only review, RLS review, webhook signature/idempotency review, secret scan, entitlement bypass review. |
| Release | Vercel env presence, deployment build, policy pages linked, no live-mode switch without approval. |

## Review Gates

### Gate A: Commerce Schema Review

Required after COM-003.

- Verify RLS and grants for every commerce table.
- Verify idempotent webhook event model.
- Verify no destructive changes to existing app schemas.
- Verify indexes support user entitlement lookup and admin order views.

### Gate B: Payment Flow Adversarial Review

Required after COM-005.

- Attempt to grant access without webhook.
- Attempt to access another user's purchase.
- Replay duplicate webhook event.
- Send invalid webhook signature.
- Confirm entitlement default-deny behavior.

### Gate C: Product UI Black-Box Review

Required after COM-006 and COM-007.

- Logged-out buyer path.
- Logged-in free buyer path.
- Paid test buyer path.
- Failed/canceled checkout path.
- Delayed webhook pending path.

### Gate D: Admin Operations Review

Required after COM-008 and COM-013.

- Non-admin blocked from commerce admin.
- Admin can publish/unpublish product.
- Admin can inspect order without seeing unsafe payment details.
- Manual entitlement change requires reason and audit trail.

### Gate E: Premium Feature Gate Review

Required after COM-009 through COM-012.

- Free user cannot perform paid action via UI or direct API.
- Pro user can perform paid action.
- Downgraded/canceled user loses future paid access but keeps valid purchase records.
- Sensitive tool inputs are not stored unexpectedly.

### Gate F: Launch Readiness Review

Required before live-mode launch.

- All required env vars exist in development, preview, and production.
- Razorpay webhook endpoint is configured for production.
- Policy pages are public and linked.
- Test-mode buyer journey passes.
- Live-mode switch has explicit user approval.

## Proof Ledger

Use this format for each completed task:

```markdown
### Proof: TASK-ID

- Date:
- Environment:
- Branch/worktree:
- Commands:
- Test persona:
- Browser/API coverage:
- Observations:
- Artifacts:
- Residual risks:
```

### Proof: COM-001

- Date: 2026-06-08
- Environment: Local planning worktree
- Branch/worktree: `codex/game-time-controls` at `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Commands: `rg -n "^## (Operating Contract|Interface Contracts|Persistent Task Queue|Verification Matrix|Review Gates|Proof Ledger)|^Task ID: COM-" docs/plan/2026-06-08-commercial-product-execution-guide.md`, `git diff --check`
- Test persona: Not applicable
- Browser/API coverage: Not applicable
- Observations: Created the commercial execution guide and matching planning session entry.
- Artifacts: `docs/plan/2026-06-08-commercial-product-execution-guide.md`, `docs/sessions/2026-06-08-commercial-product-planning.md`
- Residual risks: Implementation has not started; Stripe account mode and product feature matrix still require confirmation.

### Proof: COM-002

- Date: 2026-06-08
- Environment: Local setup planning worktree
- Branch/worktree: `codex/commercial-product-foundation` at `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Commands: `sed -n '1,220p' apps/jayantgoyal/.env.example`, `sed -n '1,220p' apps/admin/.env.example`, `find apps -maxdepth 3 -name '.env.example' -o -name '.env.local'`, `git diff --check`, `rg -n "sk_live_|sk_test_|whsec_|rk_live_|rk_test_" ...`
- Test persona: Not applicable
- Browser/API coverage: Not applicable
- Observations: Selected Stripe test mode as the only approved implementation mode before launch approval. Added non-secret env placeholders for both apps and documented local Stripe CLI webhook forwarding.
- Artifacts: `apps/jayantgoyal/.env.example`, `apps/admin/.env.example`, `docs/references/stripe-commerce-setup.md`
- Residual risks: Real Stripe dashboard access and actual Vercel env values still need to be configured outside Git; no secret values were read or committed.

### Proof: COM-003

- Date: 2026-06-08
- Environment: Temporary local PostgreSQL 17.10 cluster because Docker-backed Supabase local stack was unavailable
- Branch/worktree: `codex/commercial-product-foundation` at `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Commands: `supabase migration new commerce_foundation`, `supabase status`, temporary `initdb`/`pg_ctl`/`psql -v ON_ERROR_STOP=1` migration apply, `rg -n "ENABLE ROW LEVEL SECURITY|CREATE POLICY|GRANT SELECT|GRANT SELECT, INSERT" supabase/migrations/20260608130812_commerce_foundation.sql`, `rg --pcre2 -n "DROP\\s|TRUNCATE\\s|DELETE\\s+FROM|ALTER\\s+TABLE\\s+(?!ONLY\\s+jg_app\\.commerce_|jg_app\\.commerce_)" supabase/migrations/20260608130812_commerce_foundation.sql`, `git diff --check`
- Test persona: Not applicable
- Browser/API coverage: Not applicable
- Observations: Migration creates 9 additive commerce tables and validated cleanly in temporary Postgres after mocking Supabase helper functions. Static review found RLS enabled for every commerce table, explicit grants for public/authenticated/service roles, and no destructive SQL patterns. Remote apply to Supabase project `orwfvyditlguqvxvztkw` succeeded through a temp-workdir linked migration flow. A follow-up grant-hardening migration revoked unintended `anon` table-level reads from customer, order, subscription, entitlement, webhook, delivery, and usage tables while preserving public product/price reads.
- Artifacts: `supabase/migrations/20260608130812_commerce_foundation.sql`, `supabase/migrations/20260608132708_commerce_grant_hardening.sql`
- Residual risks: Docker was not running, so `supabase status` could not inspect a local Supabase stack. Remote verification covered table count, RLS, and grants, but not seeded product data or paid checkout behavior.

### Proof: COM-004

- Date: 2026-06-08
- Environment: Local Next.js worktree
- Branch/worktree: `codex/commercial-product-foundation` at `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Commands: `pnpm --filter jg add stripe`, `pnpm --filter jg lint`, `pnpm --filter jg check-types`, `git diff --check`, `rg -n "STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|COMMERCE_STRIPE_MODE|NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" apps packages turbo.json docs -S`, `rg -n "commerce/(stripe|database)\\.server|stripe\\.server|database\\.server" apps/jayantgoyal/src -S`
- Test persona: Not applicable
- Browser/API coverage: Not applicable
- Observations: Added Stripe SDK `22.2.0`, server Stripe mode/key/webhook helpers, and Supabase commerce helpers for published products, checkout price validation, customer upsert, and entitlement reads. No client imports reference the `.server.ts` helper files.
- Artifacts: `apps/jayantgoyal/src/lib/commerce/types.ts`, `apps/jayantgoyal/src/lib/commerce/stripe.server.ts`, `apps/jayantgoyal/src/lib/commerce/database.server.ts`, `apps/jayantgoyal/package.json`, `pnpm-lock.yaml`, `turbo.json`
- Residual risks: Stripe credentials are not configured locally yet, so live Stripe API calls are intentionally untested.

### Proof: COM-005

- Date: 2026-06-08
- Environment: Local Next.js worktree
- Branch/worktree: `codex/commercial-product-foundation` at `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Commands: `pnpm --filter jg lint`, `pnpm --filter jg check-types`, `pnpm build --filter jg`, `pnpm --filter admin lint`, `pnpm --filter admin check-types`, `git diff --check`, `rg -n "constructEvent|stripe-signature|getAuthenticatedCommerceUser|grantOrderEntitlement|recordCommerceWebhookProcessing|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET" apps/jayantgoyal/src/lib/commerce apps/jayantgoyal/src/app/api/commerce apps/jayantgoyal/src/app/api/account -S`
- Test persona: Not applicable yet
- Browser/API coverage: Build-level route manifest confirmed `/api/commerce/products`, `/api/commerce/products/[slug]`, `/api/commerce/checkout`, `/api/commerce/billing-portal`, `/api/commerce/webhooks/stripe`, `/api/account/entitlements`, and `/api/account/purchases` are compiled.
- Observations: Added authenticated checkout, billing portal, account entitlement, account purchase APIs, public product APIs, and Stripe webhook signature/idempotency handling. Entitlement grant is idempotent by `order_id` and `feature_key`.
- Artifacts: `apps/jayantgoyal/src/app/api/commerce/*`, `apps/jayantgoyal/src/app/api/account/entitlements/route.ts`, `apps/jayantgoyal/src/app/api/account/purchases/route.ts`, `apps/jayantgoyal/src/lib/commerce/*`
- Residual risks: `COM-005` remains In Progress because runtime checkout/webhook tests require Stripe test credentials, a webhook secret, and seeded active products/prices.

### Proof: COM-006

- Date: 2026-06-08
- Environment: Local Next.js dev server at `http://localhost:3000`
- Branch/worktree: `codex/commercial-product-foundation` at `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Commands: `curl -i http://localhost:3000/api/commerce/products`, `curl -I http://localhost:3000/pricing`, `curl -I http://localhost:3000/store`, `curl -i -X POST http://localhost:3000/api/commerce/checkout -H 'Content-Type: application/json' -d '{"priceId":"missing"}'`, `curl -i http://localhost:3000/api/account/entitlements`, `pnpm --filter jg lint`, `pnpm --filter jg check-types`, `pnpm build --filter jg`, `git diff --check`
- Test persona: Logged-out buyer
- Browser/API coverage: Public products API returned `{"products":[]}` from the remote-backed app configuration. `/pricing` and `/store` returned `200 OK`. Protected checkout and entitlement APIs returned JSON `401 Unauthorized` rather than proxy redirects.
- Observations: Added public pricing/store/product-detail surfaces, checkout CTA component, commerce formatting helper, public route allowlist, sitemap entries, and visual/structured breadcrumb mappings. The production build includes `/pricing`, `/store`, `/store/[slug]`, and all commerce/account API routes.
- Artifacts: `apps/jayantgoyal/src/app/pricing/page.tsx`, `apps/jayantgoyal/src/app/store/page.tsx`, `apps/jayantgoyal/src/app/store/[slug]/page.tsx`, `apps/jayantgoyal/src/components/commerce/checkout-button.tsx`, `apps/jayantgoyal/src/lib/commerce/format.ts`
- Residual risks: `COM-006` remains In Progress because there are no seeded published commerce products yet, so product detail and checkout CTA success/cancel flows cannot be fully black-box tested.

### Proof: COM-007

- Date: 2026-06-08
- Environment: Local Next.js dev server at `http://localhost:3000` plus remote Supabase project `orwfvyditlguqvxvztkw`
- Branch/worktree: `codex/commercial-product-foundation` at `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Commands: `pnpm --filter jg lint`, `pnpm --filter jg check-types`, `pnpm build --filter jg`, `git diff --check`, `curl -i http://localhost:3000/api/account/purchases`, `curl -i -X POST http://localhost:3000/api/commerce/billing-portal`, authenticated cookie-backed `GET /api/account/entitlements`, authenticated cookie-backed `GET /api/account/purchases`, authenticated cookie-backed `GET /account/billing`, authenticated cookie-backed `GET /account/purchases`, security scans with `rg`
- Test persona: `test1@jayantgoyal.com` as a free authenticated user; `test2@jayantgoyal.com` was also verified/updated as an available test user.
- Browser/API coverage: Logged-out account APIs returned JSON `401 Unauthorized`. Authenticated `test1` account APIs returned `200` with zero entitlements and zero purchases. Authenticated page checks confirmed `/account/billing` rendered "Plan, purchases, and paid access" plus "Free workspace", and `/account/purchases` rendered "Products you own" plus "No purchases yet" without the auth gate.
- Observations: Added protected account billing and purchases pages, a Stripe billing portal client button, account parent redirect, enriched purchase/subscription detail helpers, a richer purchases API response, private account sidebar navigation, active route resolution, and visual/structured breadcrumbs.
- Artifacts: `apps/jayantgoyal/src/app/(protected)/account/page.tsx`, `apps/jayantgoyal/src/app/(protected)/account/billing/page.tsx`, `apps/jayantgoyal/src/app/(protected)/account/billing/billing-portal-button.tsx`, `apps/jayantgoyal/src/app/(protected)/account/purchases/page.tsx`, `apps/jayantgoyal/src/lib/commerce/database.server.ts`, `apps/jayantgoyal/src/lib/commerce/types.ts`, `apps/jayantgoyal/src/app/api/account/purchases/route.ts`, `apps/jayantgoyal/src/lib/config/hub-config.ts`, `apps/jayantgoyal/src/hooks/use-active-app.ts`
- Residual risks: Paid-user, billing-portal success, and purchase delivery button behavior remain unverified because Stripe test keys, webhook secret, and seeded paid products/prices are still missing.

### Proof: Payment Provider Pivot

- Date: 2026-06-08
- Environment: Local Next.js worktree plus remote Supabase project `orwfvyditlguqvxvztkw`
- Branch/worktree: `codex/commercial-product-foundation` at `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Commands: `pnpm --filter jg add razorpay`, `supabase migration new razorpay_commerce_provider`, `pnpm --filter jg lint`, `pnpm --filter jg check-types`, `git diff --check`, `rg -n "Stripe|stripe|STRIPE|stripe-commerce" ...`
- Test persona: Not applicable yet
- Browser/API coverage: Not yet run with Razorpay keys. Checkout can only be fully exercised after Razorpay test credentials and a seeded one-time product price exist.
- Observations: Pivoted active payment provider from Stripe to Razorpay because Stripe account activation is blocked by India account geography. Added Razorpay order creation, client Standard Checkout loading, backend payment signature verification, Razorpay webhook signature/idempotency handling, provider-aware order columns, and Razorpay-facing buyer copy. Storefront and pricing CTAs now send app price ids instead of Stripe price ids.
- Artifacts: `apps/jayantgoyal/src/lib/commerce/razorpay.server.ts`, `apps/jayantgoyal/src/app/api/commerce/checkout/verify/route.ts`, `apps/jayantgoyal/src/app/api/commerce/webhooks/razorpay/route.ts`, `supabase/migrations/20260608170144_razorpay_commerce_provider.sql`, `docs/references/razorpay-commerce-setup.md`
- Remote apply: Applied `20260608170144_razorpay_commerce_provider.sql` to Supabase project `orwfvyditlguqvxvztkw` from a disposable temp workdir. The final migration list showed `20260608170144` present on both local and remote histories. Verification query confirmed the new provider columns and provider indexes.
- Additional validation: `pnpm --filter admin lint`, `pnpm --filter admin check-types`, `pnpm --filter jg lint`, `pnpm --filter jg check-types`, `pnpm build --filter jg`, and `git diff --check` passed after the pivot. Build completed with the existing `/games` dynamic-server-usage warnings. Local smoke tests verified that `/api/commerce/webhooks/razorpay` fails closed with JSON `400` when unsigned, `/api/commerce/checkout/verify` stays auth-protected with JSON `401`, `/api/commerce/products` returns `200`, `/pricing` and `/store` render in agent-browser, and logged-out `/account/billing` shows the sign-in gate.
- Residual risks: Real Razorpay keys and webhook secret are not present locally. Razorpay recurring/subscription support is not implemented in this slice; one-time products are the supported checkout path.

### Proof: COM-008

- Date: 2026-06-08
- Environment: Local admin dev server at `http://localhost:3001` plus remote Supabase project `orwfvyditlguqvxvztkw`
- Branch/worktree: `codex/commercial-product-foundation` at `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Commands: `pnpm --filter admin lint`, `pnpm --filter admin check-types`, `git diff --check`, role verification query for `test1@jayantgoyal.com`, `test2@jayantgoyal.com`, and `goyal151002@gmail.com`
- Test persona: `test1@jayantgoyal.com` as non-admin; `goyal151002@gmail.com` as super_admin
- Browser/API coverage: Agent-browser confirmed non-admin login stayed blocked from admin commerce. Super-admin accessed `/commerce/products`, created a temporary draft product through the UI, and viewed `/commerce/orders`.
- Observations: Admin commerce sidebar, breadcrumb, products CRUD, duplicate-safe price/product validation, and read-only order inspection are implemented. The orders page showed pending Razorpay orders without unsafe payment details.
- Artifacts: `apps/admin/src/app/(admin)/commerce/*`, `apps/admin/src/app/api/commerce/*`, `apps/admin/src/lib/commerce-api.ts`, `apps/admin/src/lib/commerce-format.ts`, admin sidebar/nav/type updates.
- Residual risks: Subscription, manual entitlement, and support admin pages remain for later task slices.

### Proof: COM-009 Partial

- Date: 2026-06-08
- Environment: Local main app dev server at `http://localhost:3000` plus remote Supabase project `orwfvyditlguqvxvztkw`
- Branch/worktree: `codex/commercial-product-foundation` at `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Commands: `pnpm --filter jg lint`, `pnpm --filter jg check-types`, `supabase db push --linked --include-all`, `supabase migration list --linked`, `supabase db query --linked` schema/grant/policy verification and temporary usage/entitlement cleanup queries, agent-browser in-page `fetch` checks for `/api/account/entitlements`, `/api/files/usage`, `/api/files/upload/signed-url`, `/api/games/sessions`, `/api/calculator`, and `/api/custom-calculator/templates`
- Test persona: `test1@jayantgoyal.com`
- Browser/API coverage: Free user returned `plan=free`, `isPro=false`, 50MB file storage limit, and visible "Upgrade storage" CTA. A temporary near-quota metadata row made a small 2MB upload exceed the free cap; `/api/files/upload/signed-url` returned `402 FILE_STORAGE_LIMIT_REACHED` before issuing a storage upload URL. A temporary manual `workspace_pro` entitlement returned `plan=pro` and 1GB storage limit. All temporary test rows were removed afterward.
- Browser/API coverage update: A temporary messenger message metadata row made a small 2MB attachment exceed the free cap; `/api/messenger/conversations/[conversationId]/attachments` returned `402 MESSENGER_STORAGE_LIMIT_REACHED` before issuing a storage upload URL. `/api/files/usage` included the messenger attachment metadata in private storage usage. The temporary message row was removed afterward.
- Browser/API coverage update: Free user room creation through `/api/games/sessions` returned `402 ONLINE_GAMES_PRO_REQUIRED` with `plan=free` and `/pricing` upgrade path. The games hub rendered the "Online Rooms" section, "Upgrade for rooms" CTA, and "Online rooms Pro" card labels. A temporary manual `workspace_pro` entitlement allowed the same user to create a Tic Tac Toe room with HTTP `201`; the validation session, participant/result rows, and temporary entitlement were removed afterward.
- Browser/API coverage update: Currency calculator new-calculation screen rendered "Upgrade history" for the free user. Temporary calculator rows brought `test1` to the free 25-save cap; `/api/calculator` returned `402 SAVED_CALCULATIONS_LIMIT_REACHED`. A temporary manual `workspace_pro` entitlement allowed saving one additional calculation with HTTP `200` and one denomination row. Temporary calculation, denomination, and entitlement rows were removed afterward.
- Browser/API coverage update: `/custom-calculator` rendered "Upgrade templates" for the free user. Free POST to `/api/custom-calculator/templates` returned `402 CUSTOM_CALCULATOR_TEMPLATES_PRO_REQUIRED`. A temporary manual `workspace_pro` entitlement allowed saving a four-component template with HTTP `201`; the list endpoint returned the template with Pro limit `50`, DELETE returned `200`, and the temporary template/entitlement rows were removed afterward. Logged-out GET now returns JSON `401 Unauthorized` from the route handler instead of a proxy page redirect.
- Observations: Checkout/webhook payment completion now grants both product-specific entitlement and normalized `workspace_pro`; file uploads and messenger attachment uploads are server-gated before signed upload URL creation; message send also rechecks attachment bytes before finalizing attachment metadata; file usage API exposes quota metadata for UI; shareable online game room creation is server-gated while local/computer games remain free; saved calculator history is capped on free and unlocked by Pro server-side; custom calculator cloud templates are persisted with owner RLS and Pro-only save access while free local building remains available; custom calculator evaluation no longer uses `Function(...)` in the touched calculator scope.
- Artifacts: `apps/jayantgoyal/src/lib/commerce/entitlements.server.ts`, `apps/jayantgoyal/src/lib/commerce/file-gates.server.ts`, file upload/usage routes, storage summary UI, entitlement grant callers, `apps/jayantgoyal/src/app/api/games/sessions/route.ts`, `apps/jayantgoyal/src/app/(protected)/games/page.tsx`, `apps/jayantgoyal/src/app/api/calculator/route.ts`, `apps/jayantgoyal/src/app/(protected)/calculator/new/page.tsx`, `apps/jayantgoyal/src/components/calculator/currency-calculator-form.tsx`, `supabase/migrations/20260608185029_custom_calculator_templates.sql`, `apps/jayantgoyal/src/app/api/custom-calculator/templates/*`, `apps/jayantgoyal/src/components/custom-calculator/TemplateManager.tsx`, `apps/jayantgoyal/src/lib/custom-calculator/evaluate.ts`.
- Remote apply: Applied `20260608185029_custom_calculator_templates.sql` to Supabase project `orwfvyditlguqvxvztkw`. Verification showed the table exists, local/remote migration histories include `20260608185029`, grants exist for `authenticated` and `service_role` only, and four owner-scoped authenticated RLS policies exist.
- Residual risks: COM-009 remains in progress. Remaining gates still need to cover broader safe tools/history behavior, messenger/support entry points, downgrade read-only behavior, and any deeper per-game premium actions beyond online room creation.

### Proof: COM-010

- Date: 2026-06-08
- Environment: Local main app dev server at `http://localhost:3000` plus remote Supabase project `orwfvyditlguqvxvztkw`
- Branch/worktree: `codex/commercial-product-foundation` at `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Commands: `supabase db push --linked --include-all`, `supabase migration list --linked`, `supabase db query --linked` table/grant/policy checks, `pnpm --filter jg lint`, `pnpm --filter jg check-types`, `git diff --check`, agent-browser in-page `fetch` checks for `/api/files/[id]/share`, `/api/files/[id]/share/[shareId]`, and `/api/files/share/[token]?json=1`
- Test persona: `test1@jayantgoyal.com`
- Browser/API coverage: A temporary text file was uploaded into the private storage bucket and registered in `jg_app.file_manager_files`. Free share creation returned `402 FILE_SHARING_PRO_REQUIRED`. A temporary `workspace_pro` entitlement allowed creating an expiring share link with HTTP `201`. Public token access returned HTTP `200` with file metadata and a short-lived signed URL. Revoke returned HTTP `200`, and the same public token returned HTTP `404` afterward. An explicitly expired temporary share row returned HTTP `404 Share link not found`. Temporary file, storage object, share rows, and entitlement rows were removed afterward.
- Observations: Share tokens are only stored as SHA-256 hashes. Public access does not expose the storage bucket; it validates an active, unexpired, unrevealed token and then issues a fresh 120-second Supabase signed URL. The proxy allowlist lets public share tokens reach the route handler without requiring app login. The file manager UI now exposes create/copy/revoke share behavior from file action menus, and directories remain unshareable.
- Artifacts: `supabase/migrations/20260608190210_file_manager_share_links.sql`, `apps/jayantgoyal/src/lib/file-manager/share-links.ts`, `apps/jayantgoyal/src/app/api/files/[id]/share/*`, `apps/jayantgoyal/src/app/api/files/share/[token]/route.ts`, `apps/jayantgoyal/src/components/file-manager/share-dialog.tsx`, file action/list/grid wiring, `apps/jayantgoyal/src/proxy.ts`
- Remote apply: Applied `20260608190210_file_manager_share_links.sql` to Supabase project `orwfvyditlguqvxvztkw`. Verification showed local/remote migration histories include `20260608190210`, the table exists, grants exist for `authenticated` and `service_role` only, and four owner-scoped authenticated RLS policies exist.
- Residual risks: Password-protected links can be added later, but the COM-010 acceptance surface is covered: quota enforcement was proven in COM-009, share/revoke/expired-token behavior is server-enforced, the UI exposes sharing and quota state, and public storage access remains token-scoped with short-lived signed URLs.

### Proof: COM-011

- Date: 2026-06-08
- Environment: Local main app dev server at `http://localhost:3000` plus remote Supabase project `orwfvyditlguqvxvztkw`
- Branch/worktree: `codex/commercial-product-foundation` at `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Status: Done. Safe saved workspaces cover JSON Prettify and JSON Minify, paid bulk processing is server-enforced for those safe JSON tools, and saved tool outputs can be managed from a Tool Workspace with favorites, collections, exports, and deletion.
- Data sensitivity decision: Only tools allowlisted by `SAFE_SAVED_TOOL_IDS` can use saved history. Token, hash, password, private-key, JWT, basic-auth, and obfuscation tools are explicitly blocked from the saved-history API.
- Commands: `supabase migration up --linked` from a temp Supabase directory with full migration history visible, `supabase migration list --linked`, `supabase db query --linked` table/grant/policy checks, `pnpm --filter jg lint`, `pnpm --filter jg check-types`, `git diff --check`, agent-browser authenticated checks for `/tools/formatters/json-prettify`, `/tools/formatters/json-minify`, `/api/tools/saved`, and `/api/tools/bulk`.
- Browser/API coverage: Logged-out `/api/tools/saved?toolId=json-prettify` returned JSON `401`. Authenticated `test1@jayantgoyal.com` loaded JSON Prettify, generated valid formatter output, saw the Workspace panel, saved a JSON sample with HTTP `201`, reloaded history visibility, restored the saved input, exported JSON, and deleted the saved item. A direct UI Save click also created a saved workspace row, which was cleaned up afterward.
- Limit coverage: Five temporary saved rows caused a free account save to return HTTP `402 TOOL_SAVED_ITEMS_LIMIT_REACHED` with limit `5`. A temporary `workspace_pro` entitlement allowed saving another row with plan `pro` and limit `200`; temporary saved rows and entitlement rows were removed afterward.
- Security coverage: A direct attempt to save `token-generator` data returned HTTP `400 TOOL_HISTORY_NOT_ALLOWED`. The table has owner RLS policies for authenticated select/insert/update/delete, authenticated/service_role grants, and no anon table grants.
- Bulk coverage: Logged-out `/api/tools/bulk` returned JSON `401`. Authenticated free `test1@jayantgoyal.com` processed a two-item JSON Prettify batch with HTTP `200`, then a four-item batch returned HTTP `402 TOOL_BULK_LIMIT_REACHED` with limit `3`. A temporary `workspace_pro` entitlement allowed a four-item JSON Minify batch with plan `pro` and limit `100`; the temporary entitlement was removed afterward. A `token-generator` bulk request returned HTTP `400 TOOL_BULK_NOT_ALLOWED`.
- Broader safe-tool coverage: JSON Minify now uses the same workspace save/export/restore controls as JSON Prettify. A JSON Minify saved-history row was created with HTTP `201`, listed with HTTP `200`, deleted with HTTP `200`, and cleanup verification showed zero validation rows remaining.
- Workspace coverage: `/tools/workspace` renders saved safe-tool outputs with saved/favorite/collection counts, collection grouping, favorite toggles, collection edits, export, and delete actions. Authenticated owner API validation created a saved item with HTTP `201`, PATCHed `isFavorite` and `collection` with HTTP `200`, listed all safe saved items with HTTP `200`, rendered the item under `Client demos`, updated it to `Launch assets` through the workspace form handler, deleted it with HTTP `200`, and verified zero validation rows remained in Supabase. Logged-out PATCH returned JSON `401`.
- Artifacts: `supabase/migrations/20260608191250_tool_saved_items.sql`, `/api/tools/saved`, `/api/tools/saved/[id]`, `/api/tools/bulk`, `/tools/workspace`, `apps/jayantgoyal/src/lib/tools/persistence.ts`, `apps/jayantgoyal/src/components/tools/tool-workspace-panel.tsx`, `apps/jayantgoyal/src/components/tools/tool-bulk-json-panel.tsx`, JSON Prettify and JSON Minify client integrations, tools index/sidebar/breadcrumb wiring, proxy API bypass for JSON auth responses.
- Residual risks: Expansion to additional safe non-JSON tools can happen later using the same allowlist pattern. Bulk inputs are intentionally processed and returned without persistence.

### Proof: COM-012

- Date: 2026-06-08
- Environment: Local main app dev server at `http://localhost:3000`, temporary local admin app dev server at `http://localhost:3001`, and remote Supabase project `orwfvyditlguqvxvztkw`
- Branch/worktree: `codex/commercial-product-foundation` at `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Status: Done. Paid purchases can open support conversations, support threads carry product/order metadata and support status, admin commerce support can list/reply/update status, and buyer/support visibility remains participant/support scoped.
- Migration: Applied `20260608194616_messenger_support_threads.sql` to remote Supabase. Verification showed `messenger_conversations_type_check` includes `support`, `messenger_conversation_participants_role_check` includes `support_agent`, and support order/status/unique-order indexes exist.
- Personas: Buyer `test1@jayantgoyal.com`, cross-user denial with `test2@jayantgoyal.com`, admin `goyal151002@gmail.com`.
- Browser/API coverage: Seeded one temporary paid Razorpay test order for `test1`. Buyer POST to `/api/account/purchases/[orderId]/support` returned HTTP `201` and created one support conversation. Cross-user POST from `test2` for the same order returned HTTP `404`. Admin GET `/api/commerce/support` returned HTTP `200` and listed only the support thread with the expected order id, buyer, product, and `open` status. Admin POST reply returned HTTP `201`; admin PATCH status to `pending` returned HTTP `200`. Buyer GET `/api/messenger/conversations/[conversationId]/messages` returned HTTP `200` and included both buyer and admin support messages. `test2` GET for the same conversation returned HTTP `404`. `/account/purchases` rendered the `Get support` entry point, and `/commerce/support` rendered the admin support page heading.
- Security coverage: Admin support APIs call the existing admin/super_admin authorization helper and explicitly filter `conversation_type = 'support'`. Normal messenger message APIs still require participant rows. Service-role usage stays in server route/helper files. Focused scan found no credential literals, no `dangerouslySetInnerHTML`, and no admin route that queries direct/self conversations.
- Cleanup: Temporary support conversation and temporary paid order were deleted; verification returned zero remaining rows for both ids.
- Validation commands: `pnpm --filter jg lint`, `pnpm --filter jg check-types`, `pnpm --filter admin lint`, `pnpm --filter admin check-types`, `git diff --check`, remote Supabase migration/index/constraint checks, and direct localhost SSR-cookie API validation.
- Residual risks: Email notifications and support attachments remain future follow-up surfaces. The current accepted slice covers purchase-linked support creation, admin reply/status flow, retry-safe one-active-thread-per-order behavior, and support/private-conversation separation.

### Proof: COM-013

- Date: 2026-06-08
- Environment: Local main app dev server at `http://localhost:3000`, temporary local admin app dev server at `http://localhost:3001`, and remote Supabase project `orwfvyditlguqvxvztkw`
- Branch/worktree: `codex/commercial-product-foundation` at `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Status: Done. Admin commerce analytics now includes a privacy-safe event table, non-blocking event tracking, an admin-only aggregate analytics API, and a dashboard with loading/error states, KPIs, revenue trend, funnel, product performance, order status, event, webhook, and support panels.
- Migrations: Applied `20260608200334_commerce_analytics_events.sql` and follow-up hardening migration `20260608200904_commerce_events_grant_hardening.sql` to remote Supabase. Verification showed `jg_app.commerce_events` exists, indexes exist for created/type/product/order lookup, authenticated has SELECT only, service_role has SELECT/INSERT/UPDATE/DELETE, anon has no table grant, and the only authenticated RLS policy is admin SELECT.
- Data source and privacy summary: Revenue and order metrics come from `commerce_orders`; funnel metrics come from sanitized `commerce_events`; product metrics join events/orders to `commerce_products`; subscription metrics come from `commerce_subscriptions`; support metrics read only support-thread status metadata from `messenger_conversations`; webhook health reads status from `commerce_webhook_events`. The implementation does not store raw webhook payloads, payment signatures, message contents, file names, or tool inputs in analytics events.
- Personas: Admin `goyal151002@gmail.com`; non-admin validation with `test1@jayantgoyal.com`; anonymous API validation without cookies.
- Browser/API coverage: Seeded one temporary paid Razorpay test order, four sanitized COM-013 commerce events, and two webhook health rows. Product page `GET /store/jayant-tools-starter-pass` returned HTTP `200` and exercised the product-view tracking path. Admin `GET /api/commerce/analytics` returned HTTP `200` with at least one paid order, one failed webhook, one product performance row for `jayant-tools-starter-pass`, and counts for `product_view`, `checkout_started`, `checkout_verified`, and `entitlement_granted`. Non-admin `GET /api/commerce/analytics` returned JSON HTTP `403`; anonymous `GET /api/commerce/analytics` returned JSON HTTP `401`. Admin `GET /commerce/analytics` returned HTTP `200` and rendered the dashboard route.
- Non-blocking behavior: Store product view, checkout start, checkout verification, entitlement grant, and Razorpay webhook received/duplicate/processed/failed paths use `trackCommerceEvent`, which catches analytics insert failures and logs only a generic failure line instead of blocking checkout, webhook, or entitlement behavior.
- Cleanup: Temporary COM-013 order, webhook rows, validation-tagged events, and recent localhost product-view validation events were deleted; cleanup verification returned zero COM-013 order/event/webhook rows.
- Validation commands: `pnpm --filter jg lint`, `pnpm --filter jg check-types`, `pnpm --filter admin lint`, `pnpm --filter admin check-types`, `git diff --check`, remote Supabase migration/grant/policy/index checks, direct localhost SSR-cookie API validation, and focused security scans for service-role boundaries, raw payload logging, `dangerouslySetInnerHTML`, and secret literals.
- Residual risks: The dashboard is aggregate-first and does not yet include cohort retention or external analytics provider ingestion. That is acceptable for COM-013 because the commercial launch path now has admin-scoped revenue, funnel, product, webhook, support, and subscription visibility without sensitive-content tracking.

### Proof: COM-014

- Date: 2026-06-09
- Environment: Local main app dev server at `http://localhost:3000` and remote Supabase project `orwfvyditlguqvxvztkw`
- Branch/worktree: `codex/commercial-product-foundation` at `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Status: Done. Commercial policy pages are public and linked from checkout-adjacent surfaces, and commerce email events are recorded/retryable for paid purchase receipt/access notices and purchase support notices.
- Migration: Applied `20260609020533_commerce_email_events.sql` to remote Supabase after two rolled-back pre-recording fixes. Verification showed `jg_app.commerce_email_events` exists, indexes exist for event key, status retry, order type, and conversation lookup, authenticated has SELECT only, service_role has SELECT/INSERT/UPDATE/DELETE, anon has no table grant, and the only authenticated RLS policy is admin SELECT.
- Pages tested: Agent-browser loaded `/privacy-policy`, `/refund-policy`, and `/contact-policy` and verified their headings and policy sections. Agent-browser also verified `Commerce policies` links on `/store`, `/pricing`, and `/store/jayant-tools-starter-pass`.
- Email route/template tested: A temporary signed Razorpay `payment.captured` webhook for a pending COM-014 order returned HTTP `200` and created `purchase_receipt` and `product_access` email event rows. A buyer-authenticated POST to `/api/account/purchases/[orderId]/support` returned HTTP `201` and created a `support_opened` email event row.
- Delivery mode: Local validation used `COMMERCE_EMAIL_DELIVERY_MODE=record_only`, so all three email events were marked `skipped` rather than sent. Production sending requires `COMMERCE_EMAIL_DELIVERY_MODE=send`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL`; failures are recorded as `failed` with `next_retry_at` without rolling back the paid order, entitlement, webhook, or support conversation.
- Security coverage: Email metadata is sanitized to primitive values and truncated; recipient email is not stored in `commerce_email_events`; email templates include product/order/conversation ids but not raw Razorpay payloads, payment signatures, private files, tool inputs, or message bodies. Focused scan found no `dangerouslySetInnerHTML` and no raw secret literal exposure.
- Cleanup: Temporary COM-014 orders, support conversation, email events, webhook rows, entitlements, and recent validation webhook analytics events were deleted; cleanup verification returned zero remaining COM-014 order/email/webhook/conversation rows.
- Validation commands: `pnpm --filter jg lint`, `pnpm --filter jg check-types`, `pnpm build --filter jg`, `git diff --check`, remote Supabase migration/grant/policy/index checks, signed Razorpay webhook validation, authenticated buyer support API validation, and agent-browser policy navigation checks.
- Residual risks: Legal copy is pragmatic launch copy and should still receive owner/legal review before live launch. Local email delivery was intentionally record-only; a real Resend delivery test should be run only after the sending domain/from address is approved.

### Proof: COM-015

- Date: 2026-06-09
- Environment: Local main app dev server at `http://localhost:3000`, temporary local admin app dev server at `http://localhost:3001`, Vercel linked projects, and remote Supabase project `orwfvyditlguqvxvztkw`
- Branch/worktree: `codex/commercial-product-foundation` at `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
- Status: Done for test-mode launch validation. Public commerce, Razorpay checkout, webhook idempotency, entitlement grant, purchase delivery, buyer support, premium gates, admin catalog/support/analytics, policy pages, email-event recording, and final source checks passed.
- Razorpay mode: Local and Vercel production/development commerce env configuration uses Razorpay test-mode key ids. No live-mode switch was performed, and live launch still requires explicit owner approval plus live Razorpay credentials/webhook verification.
- Buyer journey: Agent-browser logged in as `test1@jayantgoyal.com`, loaded `/store`, created a Razorpay test checkout order for `jayant-tools-starter-pass`, verified a signed simulated payment through `/api/commerce/checkout/verify`, confirmed `/api/account/entitlements` returned `plan=pro` with `workspace_pro`, confirmed `/account/purchases` rendered download/support actions, and confirmed a delivery access route marked the delivery fulfilled with one download count.
- Webhook journeys: Signed `payment.captured` webhook for a pending order returned HTTP `200`, duplicate replay returned `{ duplicate: true }`, and signed `payment.failed` returned HTTP `200` with failed order state. Webhook event rows were processed once and validation rows were cleaned afterward.
- Gated feature journeys: `/api/files/usage` returned `plan=pro` after entitlement grant, and `/api/tools/bulk` allowed a four-item JSON Minify batch with `limit=100` for the paid test user.
- Admin journeys: Agent-browser logged in as admin `goyal151002@gmail.com` and verified `/commerce/products`, `/commerce/orders`, `/commerce/support`, and `/commerce/analytics`. The admin support page showed the validation purchase support thread, and the analytics API returned paid order/product metrics with no failed webhook health rows after cleanup.
- Vercel env readiness: Main app production and development env inventories include the required commerce env names for Razorpay provider, key id, key secret, webhook secret, public key id, email delivery mode, and support email. Preview env adds were attempted with the Vercel CLI, but preview pull/list behavior remained inconsistent; direct main deployment depends on production envs.
- Cleanup: Temporary COM-015 orders, deliveries, email events, webhook rows, support conversation, entitlements, and validation analytics events were deleted; follow-up counts returned zero for the validation ids.
- Validation commands: `pnpm --filter jg lint`, `pnpm --filter admin lint`, `pnpm --filter jg check-types`, `pnpm --filter admin check-types`, `pnpm build --filter jg`, `pnpm build --filter admin`, `git diff --check`, local env inventory checks, Vercel env inventory checks, Supabase migration list checks, authenticated browser/API checks, signed Razorpay checkout/webhook signature checks, cleanup verification queries, and focused secret/security scans.
- Security coverage: Final scans found no admin password, no Razorpay live key literals, no committed secret values, no raw webhook payload storage, and no client-side service-role usage in the commerce paths. Hits were limited to env placeholder names, existing public contact email references, and the RSA generator's expected generated key text.
- Residual risks: Razorpay billing portal is not available in this slice and correctly returns HTTP `409 billing_portal_not_supported`; email sending remains record-only until Resend send mode/from-domain are approved; legal copy still needs owner/legal review before live sales; live-mode launch remains blocked until the owner explicitly approves switching from test credentials.
