# Product Improvement Execution Guide

Date: 2026-06-09
Worktree: `/Users/jayant/Desktop/Jayant/Projects/worktrees/jayantgoyal/game-time-controls`
Branch: `codex/commercial-product-foundation`

## Operating Contract

Source contract: `/Users/jayant/.codex/skills/agentic-execution-guide/references/agentic-execution-guide-contract.md`

Current build scope:
- Make commerce/store discoverable and operational enough to sell real products.
- Fix the most visible UI/accessibility defects found in browser and code audit.
- Upgrade messenger, games, file manager, and tools in phases using actual code and black-box browser proof.
- Keep work in the existing worktree, not the protected source clone.

Deferred scope:
- Payment-provider country/compliance decisions that require external account setup.
- New paid products whose offer, license terms, or delivery assets are not yet defined.
- Major database schema rewrites unless a specific phase requires them and migrations are reviewed first.

Stop conditions:
- Missing credentials or inaccessible required environment.
- Destructive production data operation without explicit approval.
- Irreversible product-contract ambiguity around paid entitlement or refunds.
- Security/compliance risk that cannot be mitigated locally.
- Validation failure that remains unexplained after one scoped retry.

Proof-note location:
- `docs/sessions/2026-06-09-product-improvement-execution.md`

## Interface Contracts

Commerce:
- Public surfaces: `/store`, `/store/[slug]`, `/pricing`.
- Buyer surfaces: `/account/billing`, `/account/purchases`, purchase delivery routes.
- Admin surfaces: `/commerce/products`, `/commerce/orders`, `/commerce/support`, `/deployments/env`.
- Access control: public offer pages remain public; purchase and delivery data remains authenticated and user-scoped; admin actions require admin/super_admin.
- Error behavior: buyer-facing failures must show recoverable messages and support path; admin actions must show specific error toasts and never expose secrets.

Messenger:
- Public API routes remain authenticated.
- Message list, composer, conversations, attachments, reactions, typing, and presence stay realtime-backed.
- Mobile layout must keep active conversation and composer usable within viewport.

Games:
- Routes remain client-side games under `/games/*`.
- Computer mode must be available per supported game and expose difficulty where meaningful.
- Animations must respect reduced-motion preferences.

File Manager:
- Storage remains Supabase-backed and user-scoped.
- Upload, folders, trash, favorites, sharing, preview, and search must handle empty, loading, error, and permission states.

Tools:
- Tool workspace data must stay user-scoped.
- Tool inputs must be labeled and safe to save/share only when content is explicitly persisted by user action.

## Persistent Task Queue

Task ID: P1A-commerce-nav
Status: Done
Objective: Make Store and Pricing first-class product navigation instead of hiding commerce behind account pages or an external e-commerce link.
Dependencies: Current `/store` and `/pricing` routes compile.
Target files/surfaces: `hub-config.ts`, active-app routing, sidebar/navigation surfaces, `/store`, `/pricing`.
Allowed changes: Add internal commerce app/nav entries, improve labels/descriptions, add breadcrumbs/sitemap if missing.
Forbidden changes: Remove existing external e-commerce link unless replaced with a clear internal path.
Acceptance checks:
- API/BFF: no API changes expected.
- native/client: sidebar exposes internal Store/Pricing entry and active state works.
- offline/retry: no new persistence.
- source/security scan: no secrets or auth bypass.
- black-box: authenticated user can reach Store/Pricing from app navigation on desktop and mobile.
Proof note required: Browser route and source references.
Stop/escalate if: current nav model cannot represent internal and external commerce safely.

Task ID: P1B-hero-accessibility
Status: Done
Objective: Fix animated portfolio hero so assistive tech reads a clean name instead of repeated characters.
Dependencies: None.
Target files/surfaces: `hero-section.tsx`, `flip-text.tsx`.
Allowed changes: Add aria-label or visually-hidden accessible text and hide decorative animated characters.
Forbidden changes: Remove the visible hero animation unless required for correctness.
Acceptance checks:
- API/BFF: no API changes.
- native/client: visual hero remains intact.
- offline/retry: no persistence.
- source/security scan: no user input impact.
- black-box: accessibility snapshot reads a clean heading.
Proof note required: Browser/accessibility snapshot summary.
Stop/escalate if: animation component is shared in a way that needs a broader accessibility contract.

Task ID: P1C-mobile-messenger-composer
Status: Done
Objective: Keep messenger conversation composer visible and usable on mobile.
Dependencies: Existing messenger routes and APIs.
Target files/surfaces: messenger page/components, message input, conversation layout.
Allowed changes: CSS/layout refinements, sticky footer behavior, safe-area padding, mobile-specific conversation sizing.
Forbidden changes: Rewriting realtime or message APIs in this phase.
Acceptance checks:
- API/BFF: existing conversations/messages still load.
- native/client: composer remains visible at 390px width after opening a conversation.
- offline/retry: existing retry/error states preserved.
- source/security scan: no attachment/auth regressions.
- black-box: logged-in test user can type in mobile viewport.
Proof note required: Mobile browser screenshot/observation.
Stop/escalate if: layout issue is caused by shell-level viewport bug affecting multiple protected pages.

Task ID: P1D-admin-action-accessibility
Status: Done
Objective: Add accessible labels/tooltips to admin icon actions and replace native destructive confirms with app dialogs where practical.
Dependencies: Admin app compiles.
Target files/surfaces: projects list, blog list, users table, login password reveal.
Allowed changes: aria-label/title, AlertDialog/Dialog usage, clearer toasts.
Forbidden changes: Broad admin CRUD redesign.
Acceptance checks:
- API/BFF: no API behavior change.
- native/client: icon-only actions are named in browser accessibility tree.
- offline/retry: destructive action behavior remains recoverable and explicit.
- source/security scan: no role bypass.
- black-box: admin pages show named controls.
Proof note required: Admin accessibility snapshot summary.
Stop/escalate if: shared admin table abstraction is needed before scoped fixes can be safe.

Task ID: P2-commerce-operations
Status: Done
Objective: Make admin commerce operational: order detail, fulfillment/delivery management, refund/cancel/manual resolution, and audit history.
Dependencies: P1A complete; data model reviewed.
Target files/surfaces: admin commerce orders/products/support, buyer purchase pages, commerce APIs, Supabase migrations if needed.
Allowed changes: New admin routes, APIs, migration files, audit tables if reviewed.
Forbidden changes: Destructive production data edits during development.
Acceptance checks:
- API/BFF: order detail and fulfillment APIs enforce admin/user scoping.
- native/client: admin can manage order lifecycle end to end.
- offline/retry: clear retry/error states.
- source/security scan: authz/RLS/service-role paths reviewed.
- black-box: buyer purchase delivery flow and admin fulfillment flow verified.
Proof note required: API/browser proof and migration status.
Stop/escalate if: entitlement/refund policy is ambiguous.

Task ID: P3-games-upgrade
Status: Done
Objective: Add difficulty levels, stronger computer play, smoother animations, and ludo board redesign.
Dependencies: Phase 1 stability.
Target files/surfaces: chess, ludo, RPS, game hub, shared game components.
Allowed changes: Add proven game logic libraries where appropriate, animation polish, accessibility mode.
Forbidden changes: Hand-rolling complex chess engine if a reliable library can be used.
Acceptance checks:
- API/BFF: no server API unless leaderboard/persistence is introduced.
- native/client: every game has computer mode where applicable and stable mobile UI.
- offline/retry: local state remains recoverable.
- source/security scan: no unsafe dynamic code.
- black-box: desktop/mobile playthrough for each upgraded game.
Proof note required: Screenshots and gameplay observations.
Stop/escalate if: package choice affects bundle/performance materially.

Task ID: P4-file-manager-tools-productization
Status: Done
Objective: Productize file manager and tools with previews, upload queue, global search, tool history, and reusable workspace bundles.
Dependencies: Phase 1/2 auth and commercial surfaces stable.
Target files/surfaces: files routes/components/APIs, tools workspace APIs/components.
Allowed changes: New UI panels, user-scoped APIs, storage helpers.
Forbidden changes: Public sharing defaults that expose private files.
Acceptance checks:
- API/BFF: sharing/search/upload APIs are user-scoped and validated.
- native/client: mobile and desktop workflows verified.
- offline/retry: upload retry/progress states work.
- source/security scan: file access and sharing reviewed.
- black-box: upload/search/share/tool-save journeys verified.
Proof note required: Browser and API proof.
Stop/escalate if: sharing permissions need product decision.

Task ID: P5-monetization-polish
Status: Done
Objective: Add onboarding, bundles, feature gates, usage analytics, lifecycle emails, and post-purchase clarity.
Dependencies: Phase 2 commerce operations.
Target files/surfaces: onboarding, account, store, pricing, email APIs, analytics.
Allowed changes: UI flows, email templates, analytics events, gated feature checks.
Forbidden changes: Dark patterns or unclear paid entitlements.
Acceptance checks:
- API/BFF: events/emails/gates are scoped and idempotent.
- native/client: new user can understand and purchase a product.
- offline/retry: purchase/support failures are recoverable.
- source/security scan: paid access checks reviewed.
- black-box: guest/new buyer/admin journeys verified.
Proof note required: End-to-end journey proof.
Stop/escalate if: offer/pricing/product positioning is undecided.

## Verification Matrix

- Source checks: `pnpm lint`, `pnpm check-types`.
- Browser checks: desktop and mobile authenticated main app; desktop admin app.
- Accessibility checks: browser accessibility snapshots for hero, admin actions, messenger mobile.
- Security checks: targeted review after auth, admin, payment, storage, or user-input changes.
- Release checks: inspect `git status`, verify branch/upstream, then ship only when requested.

## Review Gates

- Adversarial review: read diff against this guide before marking each phase done.
- Black-box testing: required for each user-facing task.
- Deep code review: required for phases touching shared layout, commerce APIs, storage, or auth.
- Security review: required for admin actions, commerce, file sharing, messenger attachments, and env management.

## Proof Ledger

Proof is recorded in `docs/sessions/2026-06-09-product-improvement-execution.md`.

Phase 1 proof summary:
- `pnpm lint` passed.
- `pnpm check-types` passed.
- `git diff --check` passed.
- Main browser checks verified clean hero heading text, Store plus separate E-commerce navigation, mobile messenger composer visibility, and named main welcome password toggle.
- Admin browser checks verified named password toggle, named project/blog/user icon actions, and project delete dialog rendering with Cancel/Delete controls.

Phase 2 proof summary:
- `pnpm lint` passed.
- `pnpm check-types` passed.
- `git diff --check` passed.
- Security review checked new commerce admin APIs for admin authorization, validation, service-role usage, metadata sanitization, and generic internal error handling.
- Admin browser checks verified `/commerce/orders`, `/commerce/orders/[id]`, lifecycle/delivery controls, and invalid delivery mutation returning `400` without insert.
- Buyer browser checks verified mobile `/account/purchases` renders after the delivery-action safety update.

Phase 3 proof summary:
- `pnpm lint` passed.
- `pnpm check-types` passed.
- `git diff --check` passed.
- Browser checks verified RPS difficulty controls (`Casual`, `Adaptive`, `Ruthless`), chess strength controls (`Beginner`, `Balanced`, `Sharp`), and authenticated ludo board rendering after the visual cleanup.

Phase 4 proof summary:
- `pnpm lint` passed.
- `pnpm check-types` passed.
- `git diff --check` passed.
- Browser checks verified named file search on `/files`, labeled tool workspace save input, and labeled bulk JSON input on JSON Prettify.

Phase 5 proof summary:
- `pnpm lint` passed.
- `pnpm check-types` passed.
- `git diff --check` passed.
- Browser checks verified Store buyer-flow copy, Pricing launch-readiness copy, and authenticated Billing purchase-help CTA.
- Mobile browser checks at `390px` verified Store, Pricing, and Billing render the new sections with no horizontal overflow.
