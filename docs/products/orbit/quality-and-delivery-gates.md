# Orbit quality and delivery gates

> **Status: proposed future product.** Orbit is not currently implemented, deployed, or provisioned. These requirements describe an approved documentation target, not current runtime behavior.

This page preserves the proposed acceptance catalogue, test layers, milestone gates, approval boundaries, definition of done, and handoff requirements. It is not a progress log.

## 21. Test plan and acceptance catalogue

Tests must use independent users/workspaces and exercise actual database privileges, not only mocked UI. Authorize as real user-context roles in an isolated database. Use the existing Vitest setup for logic and integration tests; add browser tooling consistent with repository policy. Policy tests may use pgTAP or an equivalent repeatable database harness.

### 21.1 Critical acceptance cases

| ID  | Scenario                                       | Required result                                                  |
| --- | ---------------------------------------------- | ---------------------------------------------------------------- |
| A01 | Existing Auth session opens Orbit              | No second credential UI; current entitlement checked             |
| A02 | No session opens private card link             | Exact safe Auth return; card hidden until authorized             |
| A03 | Malicious return host/path                     | Rejected; no token leakage or open redirect                      |
| A04 | Orbit shared-host extension                    | Portfolio/Studio/Admin/Auth login and logout still pass          |
| A05 | Studio user lacks Orbit entitlement            | No Orbit content or workspace creation                           |
| A06 | CMS administrator lacks workspace membership   | No content access merely from CMS role                           |
| A07 | Member queries another workspace by UUID       | No rows/data through page, API, or Data API                      |
| A08 | Member self-promotes through raw API/RPC       | Denied; membership unchanged                                     |
| A09 | Viewer receives a malicious Editor board grant | Grant rejected; effective permission remains Viewer              |
| A10 | Guest opens a nonassigned workspace board      | No content, counts, names, or directory leak                     |
| A11 | Member opens someone else's private board      | Denied; Owner/Admin exception matches disclosed policy           |
| A12 | Admin tries to demote Owner or Admin peer      | Denied                                                           |
| A13 | Owner leaves without transfer                  | Denied; one eligible Owner retained                              |
| A14 | Concurrent ownership acceptance                | Exactly one final Owner; transactional audit                     |
| A15 | Invite forwarded to wrong verified email       | Acceptance denied without account enumeration                    |
| A16 | Invite accepted twice/concurrently             | One membership/entitlement; no duplicate notifications           |
| A17 | Scanner/prefetch opens invite GET              | Invite not consumed or accepted                                  |
| A18 | Revoked inviter or suspended recipient         | Acceptance cannot resurrect authority                            |
| A19 | Card references a column in another board      | Rejected by database invariant                                   |
| A20 | Two users edit stale card description          | Conflict instead of silent lost update                           |
| A21 | Two simultaneous drag operations               | Valid deterministic ordering; no duplicate/lost card             |
| A22 | Same idempotency key, different body           | Conflict; original operation not duplicated                      |
| A23 | Card completion/reopening                      | Column category and completion timestamp consistent              |
| A24 | Delete nonempty column without destination     | Denied; no orphan cards                                          |
| A25 | Access revoked while tab is open               | Subsequent reads/mutations deny; private UI clears               |
| A26 | Old Realtime channel after revocation          | No new board emissions to old epoch                              |
| A27 | Existing broad Realtime policy                 | Cannot authorize Orbit topics accidentally                       |
| A28 | Attachment path guessed or copied              | Current board/card access still required                         |
| A29 | Unverified/oversize/mismatched upload          | Unreadable/rejected; quota correctly reconciled                  |
| A30 | Scanner unavailable                            | Scanner-dependent formats remain disabled                        |
| A31 | Member removed during queued email/export      | Delivery cancelled or safely redacted                            |
| A32 | Private card appears in search/inbox/count     | No unauthorized projection or metadata disclosure                |
| A33 | Malicious Markdown, URL, filename              | No script execution or unsafe navigation/header injection        |
| A34 | Request Origin is hostile sibling/Preview      | Sensitive mutation denied under exact policy                     |
| A35 | Dependency fails during command                | No false success, no partial commit, no fail-open access         |
| A36 | Worker crashes after provider call             | Retry dedupe prevents repeat logical notification                |
| A37 | Job lease expires or two workers race          | One valid claim/effect; eventual recovery                        |
| A38 | Trash purge/recovery boundary                  | Restore before expiry; no normal reads while trashed             |
| A39 | Backup restoration rehearsal                   | Product records AND file bytes recover; other products unchanged |
| A40 | Keyboard and click/tap card movement           | Same authorized operation works without dragging                 |
| A41 | Narrow mobile screen / 200% zoom               | Usable controls, focus, dialogs, and readable content            |
| A42 | Account/logout token freshness boundary        | Verified behavior documented; no false instant-revocation claim  |
| A43 | High-risk operation without step-up            | Auth challenge required; direct RPC cannot bypass it             |
| A44 | Private schema/function probing                | No broad API exposure; missing caller and arbitrary actor denied |
| A45 | Mutation-control table raw DML                 | Denied unless explicitly designed/tested safe path               |
| A46 | Moderating another user's comment              | Tombstone + audit; text cannot be impersonated or rewritten      |
| A47 | CSV export contains formula-like text          | Safe CSV cells; JSON preserves original text                     |
| A48 | Dates around timezone/daylight boundaries      | Correct date-only display and deduped reminder schedule          |

### 21.2 Test layers

Unit: role precedence, validators, safe URLs, state machines, quotas, rank comparisons, date behavior. Database: grants, RLS, private command access, tenant constraints, transaction rollback, concurrency, and immutable audit. Integration: SSO, invitation/IAM provisioning, provider adapters, Storage, and workers. Browser: all P0 user journeys, role-restricted controls, accessible interaction, refresh/back/deep links, network failure. Operational: migration compatibility, cross-app regressions, backup restore, no-secret logs, and measured performance under the defined fixtures.

A mocked screenshot or a successful homepage load is not sufficient evidence of readiness.

---

---

## 22. Implementation milestones and concrete deliverables

### M0 — Repository reconciliation and design confirmation

Inspect current manifests, `docs/README.md`, identity/host registries, web-auth exports/tests, IAM schema/helpers, existing user lifecycle, environment examples, Supabase exposure settings where authorized, and CI/build scripts. Confirm name and local port through the current inventory. Identify precise changes before coding. Do not dump secrets or private user data into the report.

**Deliverables:** a bounded change list; confirmed dependency versions; explicit decisions about product entitlement, command execution, jobs, file scanner, and live session revocation. Keep proposed-product documentation clearly labeled. No deployment or production migration.

### M1 — Product shell and shared entry

Create `apps/orbit/web`; extend canonical identity/URL/brand/session contracts; add independent build configuration; implement public entry, safe Auth redirect, entitlement state, and account links. Use an access-denied stub only as a real state, not a fake logged-in application.

**Gate:** A01–A06 and existing four-product SSO regression tests pass. New host trust is exact and Preview behavior remains safe.

### M2 — Workspace and authorization foundation

Add reviewed schemas, permission predicates, grants/RLS, workspace and board membership, creation, invites, owner/admin operations, product provisioning, and lifecycle invariants. Establish isolated fixtures and database tests before exposing collaboration UI.

**Gate:** role matrix, tenant integrity, invitation replay, and ownership tests pass against real policies.

### M3 — End-to-end board work

Implement boards, columns, cards, safe Markdown, ordering, card details/deep links, assignment, labels, due dates, archive/trash, search, Home, and My Work. Use real commands and authoritative persistence. Add conflict UI and non-drag movement.

**Gate:** reload persistence, concurrency, stale-edit rejection, negative Data API tests, and representative performance checks pass.

### M4 — Collaboration and private-alpha readiness

Add comments/mentions/reactions, activity, in-app inbox, private invalidation/epoch behavior, durable outbox worker, invitation delivery, attachment reservation/verification, and operational health. Configure scanner-dependent formats only when the scanner is actually available. Complete retention/recovery documentation and tests.

**Gate:** all P0 acceptance cases relevant to shipped functionality pass; unfinished optional paths are disabled, not advertised. Owner authorizes any production rollout separately.

### M5 — Polished v1

Implement checklists, saved views, watches/snooze, richer email/reminders, bulk actions, templates, exports, and optional workspace MFA in independently tested increments. Each P1 feature inherits the same authorization and job standards.

**Gate:** all P1-specific tests, no regression of P0, documented operational limits, and current-state docs updated alongside code.

### M6 — Separately approved extensions

Design and deliver P2 one capability at a time. Public publication, integrations, automation, and AI each introduce new trust/data boundaries and cannot be turned on through placeholder settings alone.

### Documentation placement

Within the repository, a proposed Orbit page may live under `docs/products/orbit/` with a clear status and index entry, consistent with its existing proposed-product practice. As functionality ships, maintain the smallest current behavior pages: README, capabilities, routes/flows, data, and operations. Do not add chronological progress journals or completed-plan archives. Keep build-agent reports in the agent response/CI system; Git preserves history. [R8]

---

---

## 23. Decisions, assumptions, and approval gates

### 23.1 Defaults selected in this specification

| Decision                     | Proposed default                                              | Why                                                           |
| ---------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| Name                         | Orbit by Jayant                                               | Standalone product identity consistent with the repository    |
| Placement                    | Fifth independent web client in existing monorepo             | Reuse foundations without absorbing product logic into Studio |
| Identity                     | Existing Auth + Supabase Auth + IAM                           | Avoid duplicate accounts/session contracts                    |
| Database                     | Shared verified project; `orbit`/`orbit_private`              | Matches current ownership model; requires careful isolation   |
| Entry                        | Invite-only; explicit creator/operator grants                 | Controlled alpha and clear entitlement boundary               |
| Private-board administration | Owner/Admin can access all workspace boards                   | Transparent manageable workspace model                        |
| Guest                        | Explicit board grant only; maximum Editor                     | Useful external collaboration without workspace-wide access   |
| Content editing              | Markdown, not collaborative rich text                         | Smaller surface and reusable current renderer                 |
| Workflow state               | Derived from column category                                  | Avoid conflicting status fields                               |
| Movement                     | Same-board only in P0                                         | Keep access/labels/files coherent                             |
| Realtime                     | Minimal invalidation + authoritative refetch + epoch rotation | Limits data leakage and handles cached channel authorization  |
| Public sharing               | Off through P1                                                | Separate publication design required                          |
| Billing / AI                 | Not in initial scope                                          | Avoid unnecessary trust and product complexity                |

### 23.2 Must verify before implementation or launch

Confirm exact code contracts and current migration state; actual deployed project linkage; scope of existing Realtime/Storage policies; any profile/session revocation helper; capability registry extensibility; operational worker and scan runtime; sender configuration; plan-specific limits/backups; existing host/port inventory; and how Admin safely provisions minimal Orbit access.

These are concrete verification tasks, not a reason to invent integration endpoints. The implementing agent may complete local UI and isolated database work while keeping production-dependent features disabled, but must label remaining integration blockers honestly.

### 23.3 Owner approvals before external effects

Obtain explicit approval for final naming/host creation; live Supabase migrations and exposure changes; new hosting resources; email sending to real invitees; paid services; broad shared-auth changes; publication of private content; external integration writes; destructive deletion; and production rollout. Preparing this specification authorizes none of those effects.

### 23.4 Principal risks

Shared-session changes can regress multiple products. Shared-database changes can expand blast radius. Row/column privileges and private function call graphs can diverge from the UI's role labels. Cached Realtime grants can outlive membership. Signed URLs and emailed content cannot be recalled as easily as database rows. New background work can be unreliable without a real worker. These risks are addressed by scope separation, explicit policies, minimal payloads, short file-link expiry, transactional outbox, and cross-product/negative tests—not by assuming the framework handles them automatically.

---

---

## 24. Definition of done and handoff

### 24.1 Private-alpha definition of done

All P0 flows work against real persisted data and the real intended authorization model. Every matrix denial has database/API coverage. Auth remains the only credential/security UI. Owner/Admin/Member/Viewer/Guest behaviors match this specification. No private information leaks through files, search, counts, notifications, channels, exports, caches, or error messages. Card edits/moves are conflict-safe and retry-safe. All destructive actions follow lifecycle/retention rules. Jobs are durable and observable. Accessibility alternatives work. Existing applications' tests/builds pass where affected. Backups and recovery are documented and rehearsed. Costs/limits are recorded from the chosen live configuration. Owner approves launch separately.

### 24.2 Handoff deliverables expected from implementation

A runnable monorepo application; reviewed forward migrations and schema contracts; generated types; typed input/error contracts; documented environment examples without secrets; permission/command/Storage/Realtime tests; browser journeys; current product docs; independent deployment settings; worker and monitoring configuration; recovery instructions; and a truthful final report of tested behavior, untested dependencies, and disabled/deferred features.

Do not deliver only polished static screens, fake API responses, an unreviewed SQL dump, or a claim that “everything works” without execution evidence.

### 24.3 Suggested first implementation request

“Read `ORBIT_PRODUCT_AND_TECHNICAL_SPEC.md` and `ORBIT_BUILD_PROMPT.md`. Inspect the current `jayantgoyal` repository. Complete M0 and implement the M1 shared-auth product shell without modifying live infrastructure. Preserve all existing products and report the exact tests run and any integration gaps.”

---
