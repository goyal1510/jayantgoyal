# Orbit data and command contracts

> **Status: proposed future product.** Orbit is not currently implemented, deployed, or provisioned. These requirements describe an approved documentation target, not current runtime behavior.

This page defines proposed schema ownership, persistence, database authorization, application commands, error behavior, search, and privacy-safe read models.

## 10. Data model and persistence contracts

### 10.1 Schema boundaries

Use `orbit` for product tables and intentionally exposed safe API wrappers. Use `orbit_private` for internal authorization helpers, invitation secrets, job payloads, deduplication records, and worker state. Keep `orbit_private` out of the Data API exposed-schema list.

Add only necessary `orbit` schema grants, RLS policies, and explicit function execution permissions. Do not replace the project's existing exposed-schema list, remove other products' grants, disable the shared Data API, or change global defaults without a coordinated review. Supabase object grants and RLS are independent access controls. [S3]

### 10.2 Reused identity

Reference `iam.profiles` and the existing Supabase Auth identity. Do not create a second `public.profiles` or Orbit-specific email/password user table. Orbit preferences live in `orbit.user_preferences` and reference the existing profile. Member display uses a permission-safe projection of IAM profile fields, not unrestricted access to `auth.users`.

### 10.3 Core table dictionary

Every mutable entity has server timestamps. Use the existing approved UUID helper when compatible; do not invent Fizzy-style base-36 serialization. Proposed fields below describe the target schema, not executable migrations.

| Table                         | Principal fields                                                                                                                                        | Key constraints                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `orbit.workspaces`            | id, name, description, owner_user_id, timezone, lifecycle, deletion_requested_at, version                                                               | One eligible owning membership; lifecycle enum/check; version positive                   |
| `orbit.workspace_members`     | workspace_id, user_id, role, status, joined_at, removed_at                                                                                              | Unique pair; Owner derived elsewhere; no self-promotion                                  |
| `orbit.boards`                | id, workspace_id, key, name, description, visibility, lifecycle, rank, revision, channel_epoch, default_done_column_id                                  | Unique workspace/key; owner workspace immutable; valid default column                    |
| `orbit.board_members`         | workspace_id, board_id, user_id, role                                                                                                                   | Composite board/workspace and workspace-member references; reject Guest Manager          |
| `orbit.columns`               | id, workspace_id, board_id, name, category, rank                                                                                                        | Composite parent reference; valid category; deterministic order                          |
| `orbit.cards`                 | id, workspace_id, board_id, column_id, number, title, description, priority, rank, due_date, completed_at, archived_at, deleted_at, created_by, version | Composite column reference; unique board/number; positive version; immutable tenant keys |
| `orbit.card_assignees`        | workspace_id, board_id, card_id, user_id, assigned_by                                                                                                   | Unique card/user; eligible active board Editor-or-higher at assignment                   |
| `orbit.labels`                | id, workspace_id, name, color_token                                                                                                                     | Case-normalized workspace/name uniqueness; approved color token                          |
| `orbit.card_labels`           | workspace_id, board_id, card_id, label_id                                                                                                               | Label and card must share workspace; unique pair                                         |
| `orbit.comments`              | id, workspace_id, board_id, card_id, author_id, body, version, edited_at, deleted_at                                                                    | Author immutable; safe size; edits versioned                                             |
| `orbit.comment_mentions`      | workspace_id, board_id, comment_id, user_id                                                                                                             | Unique pair; safe visible recipient; used to dedupe mention delivery                     |
| `orbit.comment_reactions`     | workspace_id, board_id, comment_id, user_id, emoji                                                                                                      | Unique comment/user/emoji; allowlisted emoji                                             |
| `orbit.attachments`           | id, workspace_id, board_id, card_id, uploader_id, object_key, original_name, mime, bytes, checksum, status, deleted_at                                  | Unique opaque key; byte quota; ready-only read                                           |
| `orbit.activity_events`       | id, workspace_id, board_id, card_id?, actor_id?, event_type, safe_metadata, occurred_at, command_id                                                     | Append-only; no secrets; actor deletion does not cascade content                         |
| `orbit.notifications`         | id, recipient_id, workspace_id, board_id?, subject_type, subject_id, event_id, reason, read_at, archived_at                                             | Recipient/event/reason unique; subject visibility rechecked                              |
| `orbit.user_preferences`      | user_id, default_workspace_id?, theme, density, notification_preferences                                                                                | One row per existing profile; allowlisted JSON contract                                  |
| `orbit.board_favorites`       | workspace_id, board_id, user_id                                                                                                                         | Unique board/user; no access granted by favorite                                         |
| `orbit.security_audit_events` | id, workspace_id?, actor_id?, action, target_type/id, reason?, safe_delta, command_id, occurred_at                                                      | Append-only; no client insert/update; operational vs content audit projections           |

### 10.4 Internal and later tables

| Table/group                                         | Purpose                                                                     | Release |
| --------------------------------------------------- | --------------------------------------------------------------------------- | ------- |
| `orbit_private.invitations`                         | Hashed secret, normalized email, role, board scope, inviter, expiry, status | P0      |
| `orbit_private.command_receipts`                    | Actor + command + idempotency key + request hash + minimal result reference | P0      |
| `orbit_private.board_sequences`                     | Atomic card-number allocation                                               | P0      |
| `orbit_private.outbox_events`                       | Durable post-commit delivery intent                                         | P0      |
| `orbit_private.job_runs`                            | Lease, attempts, next_attempt_at, outcome, dead-letter reason               | P0      |
| `orbit_private.upload_reservations`                 | Reserved bytes, opaque path, uploader, expiry, verification status          | P0      |
| `orbit_private.rate_limits`                         | Bounded user/workspace action counters; short retention                     | P0      |
| `orbit_private.ownership_transfers`                 | Current owner, target, confirmation, expiry, one-use transition             | P0      |
| `orbit.checklists` / `checklist_items`              | Ordered checklists and versioned completion                                 | P1      |
| `orbit.saved_views` / `watches` / `card_snoozes`    | Personal or explicitly shared view state                                    | P1      |
| `orbit.templates` / template children               | Versioned, sanitized board templates                                        | P1      |
| `orbit_private.export_jobs`                         | Requester scope, manifest, output key, expiry                               | P1      |
| Dependency/recurrence/automation/integration tables | Define only when the owning P2 feature is approved                          | P2      |

Do not create speculative P2 tables just to make the schema appear complete. Generate shared TypeScript database types from reviewed schema state and commit them where the repository already keeps data contracts.

### 10.5 Required indexes

Prioritize `(workspace_id, user_id, status)` on memberships; `(board_id, user_id)` on explicit board roles; `(workspace_id, visibility, lifecycle)` on boards; `(board_id, column_id, rank, id)` on active cards; `(user_id, card_id)` on assignments; `(card_id, created_at, id)` on comments; `(recipient_id, read_at, created_at, id)` on notifications; and job indexes on status/next attempt/lease expiry.

Use partial indexes for common active/nondeleted queries. Add a GIN index on the chosen card text-search vector and an index on board/key/number lookup. Index parent columns used by foreign keys and RLS predicates. Confirm with representative query plans; do not apply indexes blindly to every field.

### 10.6 Schema evolution

Use the repository's existing central Supabase migration workflow. Create new migration files through the installed CLI's supported `migration new` command after checking `--help`. Never edit previously applied migrations, invent remote state from historical migrations, run a production reset, or import a baseline that deletes existing schemas. Build and verify on isolated local/staging data first. The repository has retired schemas that must not be revived by assumption. [R7]

---

---

## 12. Database authorization and command security

### 12.1 Single policy model, multiple enforcement points

Define pure role-resolution tests and mirror the rules in authoritative database predicates. UI gating improves usability, application checks improve error quality, and database policy/commands enforce access against direct clients. Each layer must use the same lifecycle and permission rules.

Required caller-bound predicates include the semantics of “can enter Orbit,” “active workspace member,” “effective board role,” “can read subject,” and “can execute command.” Names and SQL signatures are determined during implementation after inspecting IAM helpers. They are proposed behaviors, not assertions that functions already exist.

### 12.2 Recommended mutation boundary

Use normal user-context RLS reads. Do **not** give browser roles unrestricted direct mutation privileges on command-controlled tables such as membership, cards, ordering, audit, notifications, or attachment lifecycle.

Expose a deliberately small set of `orbit` RPC entrypoints. Prefer `SECURITY INVOKER` for read operations and wrappers. Where a command needs narrowly elevated table privileges to enforce a single atomic write path, put its privileged implementation in `orbit_private`, not an exposed schema. A dedicated no-login command-executor role must not be a superuser, have `BYPASSRLS`, or own unrelated schemas/tables. Give it only necessary privileges and explicit applicable RLS policies. This is an intentional restricted command boundary, not a workaround for a failing query. [S8]

Every privileged implementation independently derives the caller from validated request context, rejects a missing caller, checks live IAM and resource permission, validates all inputs and versions, and writes its own audit/outbox. It must not trust a client-supplied `actor_id`, `role`, or `workspace_owner`. Configure a fixed/empty search path, fully qualify objects, revoke default `PUBLIC`/anonymous function execution, and grant only the call graph required by approved entrypoints. Do not rely on “the wrapper already checked” as the only authorization.

Membership predicates may require carefully scoped private read helpers to avoid recursive RLS. Give those helpers the minimum read access and a caller-bound API. Test recursion and bypass attempts. Do not add arbitrary `SECURITY DEFINER` functions in `public`, broadly grant all functions, or make private schemas globally API-visible.

### 12.3 Database policy checklist

Enable RLS on all exposed product tables; explicitly manage object grants in the same migration. Check active profile and product access as well as workspace/board membership. Validate old-row and new-row conditions for updates. Prevent tenant-key reassignment with constraints/command boundaries. Treat views deliberately: safe views should use invoker security when appropriate, and any privileged projection must be narrowly authorized. [S3, S7]

No anonymous access to Orbit product content in P0/P1. Storage and Realtime need their own matching policies; a Data API pre-request check alone does not cover them. Notifications and activity must resolve subjects under current permission. Rate limits/quotas important to correctness must remain enforced even when an attacker bypasses the Next.js UI.

### 12.4 Product operations and service credentials

Use server-only secret clients only for specifically reviewed operations such as provider delivery or IAM administration. Each service-role action must independently authorize its initiating human or trusted job scope. A service credential is not a user permission model. Auth remains without a service-role dependency, consistent with its current contract. [R5]

Read-only operational summaries should contain product status, counts, quota consumption, and failure summaries—not card bodies. There is no content-impersonation or silent operator-support bypass in P0/P1. Any future support access must be explicit, time-limited, logged, and approved as a separate feature.

---

---

## 13. Commands, API contracts, and error behavior

### 13.1 Command envelope

All mutations validate an explicit schema and reject unknown privileged fields. Use an idempotency key for create, move, invitation acceptance, lifecycle transitions, upload finalize, and job-triggering commands. Key scope is caller + operation; persist a request hash to reject reuse with different payloads. Store minimal result references and reauthorize before returning replayed results.

Example **proposed request contract**, not runnable implementation:

```json
{
  "cardId": "<uuid>",
  "targetColumnId": "<uuid>",
  "beforeCardId": "<uuid-or-null>",
  "afterCardId": "<uuid-or-null>",
  "expectedCardVersion": 7,
  "expectedBoardRevision": 19,
  "idempotencyKey": "<random-request-uuid>"
}
```

The command derives actor, workspace, board, current roles, and rank. It rejects a card/column mismatch and checks resource lifecycle inside the transaction. Return the authoritative card version, affected-column order or refetch hint, new board revision, and command/event ID.

### 13.2 Proposed command inventory

| Command family     | Examples                                                      | Required boundary                                          |
| ------------------ | ------------------------------------------------------------- | ---------------------------------------------------------- |
| Workspace          | create, update settings, archive, restore                     | Creator or Owner/Admin; atomic initialization/lifecycle    |
| Workspace security | invite, accept, revoke, role change, remove member            | Role hierarchy + invitation proof + audit                  |
| Ownership          | initiate transfer, accept transfer, request/cancel deletion   | Owner/target-specific; recent auth/MFA                     |
| Board              | create, update, visibility, membership, archive/trash/restore | Effective Manager; workspace membership invariants         |
| Column             | create, rename, reorder, move-and-delete                      | Manager; lock board; no orphaned cards                     |
| Card               | create, edit, move, complete, reopen, archive/trash/restore   | Editor or Manager as specified; versions; immutable tenant |
| Collaboration      | comment create/edit/remove, mention/reaction                  | Board role + ownership/moderation                          |
| Attachments        | reserve, finalize, inspect status, remove, authorize download | Lifecycle/quota/path checks, ready-only reads              |
| Preferences        | favorites, notification read, view preferences                | Self-only                                                  |
| Later features     | bulk actions, templates, exports, reminders                   | Feature gate plus unchanged permission model               |

### 13.3 Transport design

Server Actions can drive ordinary forms. Use Route Handlers where a documented HTTP interface is useful: upload workflows, provider callbacks, health endpoints, and worker invocation. Keep a single command implementation underneath. Do not expose an unauthenticated `/api/admin` convenience route. Reads use selected fields and cursor pagination; do not fetch an entire workspace into the browser to filter there.

### 13.4 Error contract

| Code                           | Meaning                                    | UI behavior                                          |
| ------------------------------ | ------------------------------------------ | ---------------------------------------------------- |
| `UNAUTHENTICATED` / 401        | Valid identity unavailable                 | Clear sensitive UI; use safe Auth entry              |
| `FORBIDDEN` / 403              | Known context but operation not allowed    | Explain action restriction without hidden content    |
| `NOT_FOUND` / 404              | Missing or inaccessible object             | Generic unavailable page to prevent enumeration      |
| `CONFLICT` / 409               | Version/order/idempotency conflict         | Refetch safe state; preserve unsent draft for review |
| `VALIDATION_ERROR` / 422       | Invalid input/relationship                 | Field-level errors; no partial commit                |
| `RATE_LIMITED` / 429           | Action/quota limit                         | Retry-after or quota explanation                     |
| `DEPENDENCY_UNAVAILABLE` / 503 | Auth/database/storage/provider unavailable | Fail closed for access; retry appropriate operations |
| `INTERNAL_ERROR` / 500         | Unexpected failure                         | Request ID; no SQL, secrets, or stack traces         |

Business errors must be distinguishable from network errors. A provider-email failure after a committed invitation is “invitation created; delivery failed,” not a rollback of the membership state. The outbox handles retry. Do not report a job as done merely because it was queued.

---

---

## 17. Search, aggregation, and privacy-safe read models

Use native PostgreSQL full-text search for P0. A materialized or maintained search vector can combine weighted title and description, with exact board-key/card-number lookup. Select a language configuration deliberately; for mixed names/code tokens an appropriately tested `simple` configuration may be preferable to aggressive language stemming. This is an implementation decision requiring representative search tests. [S11]

Filters must be validated enums/IDs/date ranges. Parameterize every query and cap result size. Stable cursor pagination includes a deterministic tie-break. Search snippets are escaped, and archived/deleted content obeys explicit filters/lifecycle. Query performance must be measured with RLS enabled, not only as the database administrator.

For Home, My Work, notification feeds, and reporting, filter before aggregating. A count of hidden private cards is itself a disclosure. Do not retain cached titles in audit/notification projections visible after a resource's access changes. A safe unavailable-notification state may preserve “This item is no longer available” without revealing the former content.

P2 reports need written metric definitions: how completion/reopening, cancelled work, archived cards, timezone boundaries, and imported historical events are treated. Avoid presenting a raw “cards closed” count as a measure of an individual's productivity.

---
