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
