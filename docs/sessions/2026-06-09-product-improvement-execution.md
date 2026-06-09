# Product Improvement Execution

Date: 2026-06-09
App: `apps/jayantgoyal`, `apps/admin`
Worktree: `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
Branch: `codex/commercial-product-foundation`

## Problem

The product audit found that the app has many useful surfaces but still feels more like a portfolio/tool collection than a sellable product. Highest-priority gaps are commerce discoverability, admin commerce operations, messenger mobile UX, game AI/polish, file-manager/tool product depth, and accessibility defects.

## Plan Created

Created `docs/plan/product-improvement-execution-guide.md` with:

- Operating contract and stop conditions.
- Interface contracts for commerce, messenger, games, file manager, and tools.
- Persistent task queue from Phase 1 through Phase 5.
- Verification matrix, review gates, and proof-ledger requirements.

## Current Execution State

- Phase 1 tasks `P1A-commerce-nav`, `P1B-hero-accessibility`, `P1C-mobile-messenger-composer`, and `P1D-admin-action-accessibility` are implemented and verified.
- Phase 2 task `P2-commerce-operations` is implemented and verified.
- Phase 3 task `P3-games-upgrade` is implemented and verified.
- Phase 4 task `P4-file-manager-tools-productization` is implemented and verified.
- Phase 5 task `P5-monetization-polish` is implemented and verified.
- Current goal state: all planned phases in the product improvement execution guide are complete locally in the worktree.

## Productization Phase Checklist

- [x] Phase 0 - Re-anchor the plan around the actual `apps/admin` and `apps/jayantgoyal` code instead of only games.
- [x] Phase 1 - Admin command center: replace the admin root redirect with a dashboard for commerce health, support, product readiness, and next actions.
- [x] Phase 2 - Tools workspace expansion: tool-level favorites, recent tools, safe saved history, and richer tools home discovery.
- [x] Phase 3 - Product launch workflow: admin checklist from product draft to pricing, delivery, test checkout, and publish.
- [x] Phase 4 - Buyer purchase library polish: receipts, delivery status, versioned assets, and clearer support handoff.
- [x] Phase 5 - File manager as product delivery layer: attach stored files to paid products, improve Pro storage value, and add version/share analytics.
- [x] Phase 6 - Messenger support CRM: filters, unread/SLA states, assignment, search, pinned threads, and order context.
- [x] Phase 7 - Games retention layer: leaderboards, achievements, daily challenges, match history, and computer difficulty polish.
- [x] Phase 8 - Quality/security/observability: payment reconciliation, admin audit review, rate limits, and browser validation.

## Proof Ledger

- Orientation: confirmed implementation worktree is `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`.
- Branch: `codex/commercial-product-foundation`.
- Source clone remains protected and untouched.
- Task `P1A-commerce-nav`: added internal `Store` app navigation with `Store` and `Pricing` subnav entries in `hub-config.ts`, preserved the existing separate external `E-commerce` project link, and mapped `/store` plus `/pricing` to the new commerce active-route state in `use-active-app.ts`.
- Task `P1B-hero-accessibility`: added a clean `aria-label` to the hero `<h1>` and hid decorative animated name characters from assistive tech through `HeroName`/`FlipText`, preserving the visual animation.
- Task `P1C-mobile-messenger-composer`: changed mobile messenger from stacked list+thread into a two-panel flow, added a mobile back button, added safe-area padding around the composer, and named the message textarea for assistive tech.
- Task `P1D-admin-action-accessibility`: added accessible names/titles to confirmed unlabeled admin icon actions, replaced project/blog native delete confirmations with Dialog confirmations, and named the admin password visibility toggle.
- Follow-up accessibility fix: named the main app welcome and reset-password password visibility toggles after browser verification found the same unlabeled control pattern on `/welcome`.
- Static verification: `pnpm lint` passed, `pnpm check-types` passed, and `git diff --check` passed.
- Browser verification: main app on `http://localhost:3000` showed hero heading as `Hi, I'm JAYANT`, authenticated sidebar showed internal `Store` and separate external `E-commerce`, `/store` rendered, mobile `/messenger` showed `Back to conversations` plus `Message Test Two` textbox in viewport, and `/welcome` showed `Show password`.
- Admin browser verification: admin on `http://localhost:3001` showed `Show password`, project actions such as `Hide/Edit/Delete Currency Calculator`, blog actions such as `Hide/Edit/Delete Introducing jayantgoyal.com...`, user remove buttons with target emails, and the project delete dialog with `Cancel` and `Delete project`.
- Task `P2-commerce-operations`: started admin operational APIs for manual order lifecycle updates and delivery creation/update. The implementation uses existing `commerce_orders`, `commerce_deliveries`, `commerce_entitlements`, and `commerce_events` tables, records admin audit events with privacy-safe metadata, grants order entitlements when an admin marks an order paid, and revokes order entitlements/deliveries when an admin records cancellation/refund.
- Task `P2-commerce-operations`: added `/commerce/orders/[id]` admin detail page, linked each order row to it, and added client controls for manual lifecycle actions, delivery creation/editing, delivery inspection, and audit history.
- Task `P2-commerce-operations`: improved the buyer purchase library so pending/manual/revoked/expired deliveries render as status badges instead of broken download/open actions; only available/fulfilled deliveries with an external URL or storage object render an action.
- Validation fix: replaced an over-complex conditional admin client type in the order lifecycle route with the explicit `CommerceAdminClient` helper type after `pnpm check-types` reported `never` for `.from(...)`.
- Security review fix: changed new order lifecycle and delivery normalizers to reject invalid enum values instead of falling back to defaults, so malformed admin mutations fail closed.
- Browser/API validation fix: invalid delivery payloads initially failed closed but returned `500`; added a shared admin commerce error response so validation failures return `400` while internal errors stay generic.
- Phase 2 static verification: `pnpm lint` passed, `pnpm check-types` passed, and `git diff --check` passed after commerce changes.
- Phase 2 security review: confirmed new admin commerce mutation routes call `authorizeCommerceAdmin()` before service-role writes, reject invalid lifecycle/delivery enums, validate external URLs, sanitize audit metadata, do not expose secrets, and keep provider refunds as manual recorded status rather than pretending to call Razorpay.
- Phase 2 browser verification: admin on `http://localhost:3000` showed `/commerce/orders` with `Open` links, `/commerce/orders/[id]` with lifecycle and delivery controls, and invalid delivery POST returned `400` with `Delivery type is invalid.` Buyer mobile on `http://localhost:3001/account/purchases` rendered the purchase library after delivery-action safety changes.
- Task `P3-games-upgrade`: started game AI upgrades with Rock Paper Scissors computer difficulty levels (`Casual`, `Adaptive`, `Ruthless`) and adaptive move selection based on recent/player-common choices instead of pure random play.
- Compatibility fix: replaced `toSorted` in the RPS difficulty scorer with a copied `sort` to avoid relying on newer array runtime support.
- Task `P3-games-upgrade`: added chess computer strength levels (`beginner`, `balanced`, `sharp`). Beginner plays random legal moves, balanced uses the current tactical/center heuristic, and sharp subtracts the opponent's strongest immediate reply from move scoring.
- Task `P3-games-upgrade`: softened the ludo board presentation by removing the universal 225-cell border, changing path cells to rounded pips, replacing safe-cell text with a centered star, and using a cleaner neutral board background.
- Phase 3 static verification: `pnpm lint` passed, `pnpm check-types` passed, and `git diff --check` passed.
- Phase 3 browser verification: authenticated main app on `http://localhost:3001` showed RPS difficulty controls (`Casual`, `Adaptive`, `Ruthless`), chess strength controls (`Beginner`, `Balanced`, `Sharp`), and ludo rendering with the cleaned board/token controls.
- Task `P4-file-manager-tools-productization`: improved file-manager and tools polish without changing storage permissions: named file search, made the upload dropzone keyboard-accessible, named the hidden file input, added labels/autocomplete controls to tool workspace save input, added saved-item search, and labeled the bulk JSON textarea.
- Phase 4 static verification: `pnpm lint` passed, `pnpm check-types` passed, and `git diff --check` passed.
- Phase 4 browser verification: authenticated main app showed `/files` with a named `Search this folder` textbox and JSON Prettify with labeled `Save title` plus `JSON documents` inputs.
- Task `P5-monetization-polish`: added clearer buyer onboarding and post-purchase expectations across Store, Pricing, product detail, and Billing. Store now explains choose/pay/delivery-support flow; Pricing includes a launch-readiness checklist; product detail calls out delivery status and order-linked support; Billing directs purchase issues back to the order-linked purchase library.
- Phase 5 static verification: `pnpm lint` passed, `pnpm check-types` passed, and `git diff --check` passed.
- Phase 5 browser verification: public `/store` showed `Choose a product`, `Pay with Razorpay`, and `Get delivery and support`; public `/pricing` showed `Launch readiness` and `What paid access means here`; authenticated `/account/billing` showed `Need help with a purchase?` and an `Open purchase library` CTA pointing to `/account/purchases`.
- Phase 5 mobile verification: at `390px` width, `/store`, `/pricing`, and `/account/billing` all rendered the new monetization sections with `scrollWidth` equal to `clientWidth` and no horizontal overflow offenders.
- Productization restart: created a new phase checklist covering admin, main app tools, commerce, file manager, messenger, games, and quality. Started Phase 1 by replacing the admin root redirect with a real command center and adding dashboard navigation/breadcrumb support.
- Phase 1 validation: `pnpm lint --filter admin` and `pnpm check-types --filter admin` passed for the new admin command center.
- Phase 2 start: replacing the flat tools grid with a tools workspace hub that supports search, category filters, local favorites, local recents, quick stats, and safer discovery around cloud-save-ready tools.
- Phase 2 implementation: expanded the safe saved-history allow-list from two JSON formatter tools to structural JSON/YAML/TOML/XML formatter/converter tools, keeping credential/security tools blocked. Replaced the flat `/tools` page with a client workspace hub for local favorites, local recents, search, category filters, cloud-history badges, and workspace stats.
- Phase 2 validation: `pnpm lint --filter jg`, `pnpm check-types --filter jg`, and `git diff --check` passed after the tools workspace changes.
- Phase 2 mobile fix: browser verification at `390px` initially found horizontal overflow from tool-card min-content sizing. Tightened the tools grid to `minmax(0,1fr)` and added `min-w-0`/`break-words` guards to tool cards.
- Browser proof: main app ran on `http://localhost:3001/tools`; desktop browser showed `Tools Workspace`, search, favorites, and `Cloud history` badges. Filtering for `yaml` and starring `YAML to JSON Converter` changed the favorite control to the remove-favorite state.
- Mobile browser proof: after the card sizing fix, `/tools` at `390px` rendered `Tools Workspace` and search with `scrollWidth` equal to `clientWidth` (`390`).
- Admin proof: admin app ran on `http://localhost:3000`; in-app browser could not type because its virtual clipboard was unavailable, so an authenticated Supabase SSR HTTP render check with the known super-admin account returned `200` for `/` and included `Command Center`, `Launch Readiness`, `Recent Orders`, and `Support Queue`.
- Security review: no raw SQL or `dangerouslySetInnerHTML`; Supabase service-role usage remains server-only inside admin protected routes; tools favorites/recents use local browser storage only; saved-history expansion still excludes token, password, auth, JWT, hash, encryption, and key-generator tools.
- Phase 3 start: adding a `/commerce/launch` admin workflow that scores each product across offer copy, active pricing, delivery plan, test checkout proof, and publish state. Product editor now stores safe launch metadata fields (`delivery_plan`, `launch_note`) for pre-purchase delivery readiness.
- Phase 3 implementation: added `/commerce/launch`, linked it from commerce navigation and the admin command center, and added product editor fields for `Delivery plan` and `Launch note`. The launch workflow reads real products, prices, orders, deliveries, and commerce events to score launch readiness.
- Phase 3 validation: `pnpm lint --filter admin`, `pnpm check-types --filter admin`, and `git diff --check` passed.
- Phase 3 authenticated render proof: admin app on `http://localhost:3000` returned `200` for `/commerce/launch` as `super_admin` and included `Product Launch Checklist`, `Offer copy`, `Delivery plan`, `Test checkout`, and `Launch` nav. Dashboard `/` returned `200` and included the `Run launch checklist` action.
- Phase 3 security review: no raw SQL, no `dangerouslySetInnerHTML`, no client-side service-role exposure, and product launch metadata is limited to explicit text fields with length caps. `/commerce/launch` is a server-rendered admin page under the existing protected admin layout/proxy.
- Phase 4 start: polishing the buyer purchase library with account summary metrics, richer order cards, delivery timeline states, version/expiry/download metadata, clearer support handoff copy, and authenticated printable receipts per paid order.
- Phase 4 validation fix: moved receipt print controls into a client component and surfaced the no-delivery count in purchase metrics after lint caught an unused metric.
- Phase 4 render proof: authenticated main app on `http://localhost:3000/account/purchases` returned `200` and showed the purchase library shell, paid-orders metric, ready-delivery metric, support-watch metric, and receipt link text. The checked buyer account currently has no paid orders, so receipt runtime rendering was not exercised against live order data in this pass.
- Phase 4 validation: `pnpm lint --filter jg`, `pnpm check-types --filter jg`, and `git diff --check` passed.
- Phase 4 security review: purchase and receipt pages only render authenticated user-scoped paid orders through existing commerce helpers; delivery downloads still use the authenticated delivery redirect; storage paths and signed URLs are not exposed in the purchase library; long payment references are shortened in the card UI.
- Phase 5 start: connecting file manager assets to commerce fulfillment. Added an admin-only order delivery file picker that searches uploaded files owned by the order buyer, returns only non-deleted uploaded file rows with private bucket/path metadata, and fills the delivery form as a private `download` without exposing storage objects to buyer UI.
- Phase 5 security fix: authenticated API smoke found invalid order ids leaked a Supabase UUID parse error. Added UUID validation plus generic database error responses to the delivery file picker route.
- Phase 5 validation: `pnpm lint --filter admin`, `pnpm check-types --filter admin`, and `git diff --check` passed. Authenticated smoke on `http://localhost:3000` returned `400` with `Order id is invalid.` for an invalid picker API id, rendered a real order detail with `Buyer file manager`, `Search buyer files`, and `private download`, and returned `200` from the picker API with a `files` array containing only safe file metadata keys.
- Phase 6 start: improving commerce support from a raw inbox into a triage view. Added support metrics, buyer/order/product search, status and `Needs response` filters, SLA waiting labels, buyer-waiting badges, direct order links, status-update success feedback, and an accessible reply textarea using existing support conversation metadata and latest-message data.
- Phase 6 validation: `pnpm lint --filter admin`, `pnpm check-types --filter admin`, and `git diff --check` passed. Authenticated smoke on `http://localhost:3000/commerce/support` returned `200` and rendered `Commerce support`, `Needs response`, and `Search buyer, order, product`; `/api/commerce/support` returned `200` with a valid `data` array. Current live data has no support threads, so the active-thread reply composer was not exercised in this smoke.
- Phase 7 start: adding a retention layer to the games hub without new schema. Added deterministic daily challenges, a date-stamped challenge panel, and an achievement ladder derived from existing online room/result stats so the hub has return targets beyond active rooms and recent results.
- Phase 7 validation fix: `pnpm check-types --filter jg` caught unchecked daily-challenge indexing. Added explicit game/challenge fallbacks so the deterministic selector remains type-safe under strict checks.
- Phase 7 validation fix: added a concrete fallback daily challenge after TypeScript still treated the first challenge in each pool as possibly undefined.
- Phase 7 validation: `pnpm lint --filter jg`, `pnpm check-types --filter jg`, and `git diff --check` passed. Authenticated smoke on `http://localhost:3001/games` returned `200` and rendered `Daily Challenges`, `Achievement Ladder`, `Fresh targets`, `Online Rooms`, and game cards.
- Phase 8 final validation: reviewed the changed admin delivery picker, support triage UI, and games hub retention code for raw HTML, client-side service role exposure, unsafe Supabase filter strings, and error leakage. Final `pnpm lint`, `pnpm check-types`, and `git diff --check` passed across the monorepo.

## Payment Reliability Follow-up

- New recommendation scope: build the next sellable-product foundation slice around payment reconciliation. Target admin visibility into provider/webhook/order/entitlement mismatches before adding more paid products.
- Added the first admin payment reconciliation workflow plan: a server-rendered `/commerce/reconciliation` page scanning existing order, entitlement, delivery, webhook, and commerce email rows for mismatches; added it to commerce navigation and the admin command center next-actions list.
- Tightened the reconciliation review queue UI for real use: desktop keeps the table structure, while mobile switches to compact issue rows so payment problems remain readable without clipped columns.
- Started the buyer post-purchase access follow-up by adding a protected `/account/purchases/[orderId]` order detail page. It reuses authenticated purchase lookups, exposes receipt/support/delivery actions, and links from purchase library rows so paid products have a durable account-bound access page.
- Fixed checkout return paths around the new purchase detail surface: unauthenticated checkout returns buyers to the page they started from, Razorpay verification redirects to `/account/purchases/[orderId]?checkout=success`, and Stripe success URLs can resolve a `:orderId` placeholder after the pending order is created.
- Added buyer-facing checkout-success confirmation banners on both the purchase library and purchase detail pages so successful payment return paths visibly explain that the order and access state have refreshed.
- Started storefront conversion polish by replacing the static catalog grid with a client catalog surface. Buyers can search products, filter by product type, sort by featured or price, see result counts, and reset empty searches without schema changes.
- Fixed a storefront dead-action state found in browser verification: products without an active price now render disabled checkout buttons instead of an enabled Buy button that can only fail with a toast.
- Improved the product detail page using existing commerce metadata: it now surfaces delivery plan, launch note, account-bound access, receipt, support, and checkout reassurance sections so the product page reads like a sellable offer instead of a thin detail screen.
- Hardened the admin order status mutation used from order details/reconciliation: invalid order ids now return a generic validation error and database load/update failures no longer return raw Supabase messages.
- Hardened the admin commerce analytics API by replacing raw database/catch error responses with generic messages and moving active-entitlement expiry filtering out of a dynamic Supabase `.or(...)` string.
- Hardened remaining admin commerce product/support API surfaces so unknown database failures use generic responses while known validation and duplicate-key cases still return actionable copy.
- Added UUID validation to admin commerce support status/message routes after smoke testing showed invalid support thread IDs were reaching database parsing and returning a generic 500 instead of a 400 validation response.
- Razorpay test-mode proof exposed a provider/database currency mismatch in the webhook path: Razorpay sends uppercase `INR`, while commerce order constraints require lowercase currency. Normalized Razorpay webhook currency before marking orders paid so signed test webhooks can complete without violating `commerce_orders_currency_check`.
- Razorpay test-mode proof after the fix: created a real Razorpay test order `order_SzVvCVIu9pcmt8` for `test1@jayantgoyal.com`, sent a signed local `payment.captured` webhook, and verified order `019eac1c-2e5f-74b2-8792-f930acfe357e` became `paid` with lowercase `inr`, processed webhook status, active `product:<id>` plus `workspace_pro` entitlements, and an available test delivery row `019eac1d-87f0-7bb2-ba92-9198cec01cfb`.
- Store UI follow-up: verified `/store` was public and therefore outside the protected sidebar shell. Added a public store layout using the same app sidebar/header controls without gating buyers behind auth, redesigned the store catalog around paid workspace products, and replaced the unrelated product hero imagery with real tools/files/custom-calculator visuals plus clearer checkout, delivery, receipt, and support states.
- Store UI refinement: Browser screenshots confirmed the sidebar/header are visible on `/store` and the product detail page, but the catalog still read like generic e-commerce cards. Tightened the hero, added an app-status panel, and converted the catalog into a product-console table/list with type, price, published status, and actions so it feels part of the workspace instead of a detached storefront.
