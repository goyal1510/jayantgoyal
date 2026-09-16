# Orbit domain lifecycle and experience

> **Status: proposed future product.** Orbit is not currently implemented, deployed, or provisioned. These requirements describe an approved documentation target, not current runtime behavior.

This page defines proposed state machines, tenant invariants, navigation, interaction states, and accessibility expectations.

## 7. Domain lifecycle and non-negotiable invariants

### 7.1 State machines

| Entity              | Allowed lifecycle                                                          | Important restriction                                             |
| ------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Product entitlement | invited/pending → active → suspended/revoked                               | Workspace actions cannot clear a global suspension                |
| Workspace           | active ↔ archived; active/archived → deletion_pending → purging → deleted | Only Owner requests/cancels deletion; purge is a worker operation |
| Membership          | invited → active ↔ suspended → removed                                    | Owner must remain an active eligible member                       |
| Invitation          | pending → accepted / expired / revoked                                     | Resend rotates secret; acceptance is one-use and explicit         |
| Board               | active ↔ archived; active/archived → trashed → purged                     | Archived is read-only; trash hidden from ordinary reads           |
| Card                | column-derived workflow + independent archive/trash state                  | Do not maintain contradictory editable status fields              |
| Upload              | reserved → uploading → verifying → ready / rejected / expired              | Read permission exists only for ready, accessible files           |
| Job                 | queued → leased/running → succeeded / retry_wait / failed / cancelled      | A lease can expire; retry must not repeat logical effects         |
| Export              | queued → running → ready → expired; or failed/cancelled                    | Permission is checked again before delivery                       |

### 7.2 Tenant integrity

All workspace-owned records have a `workspace_id`. All board-owned children also carry `board_id` where needed to enforce composite relationships and indexed permission checks. A child cannot reference a parent in another workspace/board merely because both UUIDs are valid.

Use composite uniqueness and foreign keys, for example a column's `(workspace_id, board_id, id)` and a card's matching reference. Make tenant/parent identifiers immutable outside a specific reviewed transfer command. Enforce active membership and lifecycle checks in the database command as well as the application. Product access, board visibility, and export scope are not inferred from untrusted HTTP headers.

### 7.3 Ordering, ownership, and uniqueness

Card numbers are unique and monotonically allocated per board; gaps are acceptable and numbers are not recycled. Rank is a server-computed sortable value; every query uses a deterministic `(rank, id)` tie-break. Ownership is a single authoritative reference, changed with a transfer transaction. Unique constraints prevent duplicate memberships, assignments, reactions, watches, and notification deliveries.

### 7.4 Deletion and authorship

Foreign-key cascade is not a substitute for a product deletion policy. Removing a user must not destroy shared cards or comments. Keep attributable records only as justified by the agreed retention policy, using a former-member display projection where appropriate. Account deletion belongs to Auth/IAM; it must coordinate owned-workspace transfer or deletion and redact personal data without granting Orbit authority over other products.

Thirty-day trash and one-year security-audit retention are proposed defaults for this private product, not claims of legal compliance. Confirm them before opening to external organizations. Backups have their own expiry and cannot be represented as instant erasure.

---

---

## 8. Navigation, screens, and interaction specification

### 8.1 Application shell

Use existing shared web UI, theme, and brand foundations. Orbit may have a product-specific accent, density, and card treatment, but must not introduce a separate global identity system. Desktop layout: product/app switcher, workspace switcher, navigation sidebar, page header, content. Mobile: compact header, drawer navigation, accessible card list/column selector, full-screen details.

Core navigation: Home; My Work; Inbox; current workspace Boards; workspace Settings when authorized; account menu linking to Auth. Hide inaccessible resources entirely. For a visible but forbidden action, omit the action or explain the restriction without exposing hidden object existence.

### 8.2 Proposed route map

Paths are new Orbit routes, not claims about existing routes in the repository.

| Route                                     | Purpose                                              | Access                                        |
| ----------------------------------------- | ---------------------------------------------------- | --------------------------------------------- |
| `/`                                       | Product entry / redirect into authorized home        | Public introduction; no private data          |
| `/access`                                 | No-entitlement/access-request state                  | Signed-in minimal context                     |
| `/home`                                   | Recent work and workspace overview                   | Active Orbit participant                      |
| `/my-work`                                | Self-assigned accessible cards                       | Active participant                            |
| `/inbox`                                  | Recipient-scoped notifications                       | Active participant                            |
| `/workspaces/new`                         | Workspace creation                                   | Creator capability                            |
| `/w/[workspaceId]`                        | Workspace home / board listing                       | Active workspace membership                   |
| `/w/[workspaceId]/boards`                 | Boards and favorites                                 | Scoped visible boards                         |
| `/w/[workspaceId]/b/[boardId]`            | Board/list workspace                                 | Effective board read                          |
| `/w/[workspaceId]/b/[boardId]/c/[cardId]` | Canonical card deep link                             | Effective board read + card lifecycle         |
| `/w/[workspaceId]/settings`               | Workspace settings                                   | Owner/Admin                                   |
| `/w/[workspaceId]/members`                | Directory and member operations                      | Role-scoped projection                        |
| `/w/[workspaceId]/audit`                  | Workspace security audit                             | Owner/Admin                                   |
| `/w/[workspaceId]/trash`                  | Recovery surface                                     | Owner/Admin or appropriate Manager projection |
| `/invites/[token]`                        | Minimal invitation preview and explicit acceptance   | Token preview; authenticated acceptance       |
| `/settings/preferences`                   | Orbit-only personal settings                         | Self                                          |
| `/health/live`                            | Runtime liveness without secrets                     | Minimal public response                       |
| `/api/...`                                | Explicit application command/provider/job boundaries | Per-handler policy                            |

Do not create `/login`, `/signup`, `/password`, or `/mfa` credential screens in Orbit. Compatibility aliases may redirect to Auth using existing helpers. Keep canonical card deep links consistent when opening a modal from a board. Refresh and browser Back must work without losing the board context.

### 8.3 Required component states

Every async screen needs: initial loading; populated state; empty state with authorized next action; validation errors; dependency failure with retry; no permission; stale-data conflict; and offline/reconnecting treatment where applicable. Do not convert an API failure into an empty successful board.

Card controls must show saving/saved/error. A destructive confirmation names the object and consequence. Lists support keyboard traversal, visible focus, labeled controls, and screen-reader announcements for committed moves. A keyboard shortcut must not fire inside text entry; show a discoverable shortcut help surface.

### 8.4 Accessibility acceptance

Target WCAG 2.2 AA for implemented flows, with actual automated and manual checks rather than an unverified compliance claim. Provide click/tap “Move to…” controls in addition to keyboard and dragging, focus restoration after dialogs, sufficient contrast, non-color-only priority labels, reduced-motion support, and usable layouts at 200% zoom. Pointer alternatives matter separately from keyboard access. [S5]

---
