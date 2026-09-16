# Orbit Realtime, files, and jobs

> **Status: proposed future product.** Orbit is not currently implemented, deployed, or provisioned. These requirements describe an approved documentation target, not current runtime behavior.

This page defines proposed concurrency, invalidation, revocation, file authorization, transactional outbox, and durable worker behavior.

## 14. Concurrency, Realtime, and revocation

### 14.1 Ordering algorithm

Use server-computed fractional ranks or another bounded sortable representation. Start with a board-level transactional lock for ordering changes; this is a deliberate simplicity trade-off for the initial concurrency envelope. Read neighbors within the lock, compute a valid intermediate rank, and increment the board revision. Rebalance one column under that same lock only when rank space needs it. Represent high-precision rank values as strings in transport when necessary; do not round them through JavaScript floating-point arithmetic.

Apply a consistent lock order when multiple records are involved. Retry deadlocks or serialization failures only when the command is idempotent, with a bounded attempt count. The UI may retry a conflict after refetch, but must not silently reapply an old text edit.

### 14.2 Lost updates and idempotency

Card/comment edits include `expectedVersion`; accepted writes increment the stored version atomically. Ordering commands additionally carry board revision. Treat a repeat of the same idempotency key and same body as the same operation; a changed body with that key is a conflict. Store receipts for a configurable minimum of 24 hours and keep response data minimal. After authorization is revoked, receipt replay must not reveal the original sensitive response.

Completion is a state transition, not a toggling endpoint. Prefer “set checked=true” over “toggle” for retryable checklist/reaction operations. Job deduplication uses stable logical event IDs, not HTTP request timestamps.

### 14.3 Private channel design

Proposed board topic: `orbit:board:<board_id>:<channel_epoch>`. A subscriber must have live Orbit/board access and match the current random epoch. Channel names are not an authorization mechanism by themselves. Browser clients receive server-originated invalidations; they cannot spoof authoritative `board.changed` events.

Messages contain a minimal event ID and revision/refetch signal, not application rows. Client refetches all current visible data on initial subscription, reconnect, visibility changes, and detected revision gaps. Duplicate or out-of-order invalidations are harmless. The channel is cleaned up on navigation/logout.

**Why epoch rotation is required:** Supabase caches channel authorization for a connection and reevaluates it on specific authentication/subscription events, not each message. Revoking a database membership alone must not be described as immediate removal from an already joined topic. [S2]

### 14.4 Revocation protocol

In the same transaction as board access narrowing, rotate `channel_epoch`, change membership/visibility, and append an access-change event. For workspace/IAM revocation, rotate the affected workspace boards through a narrow, reviewed integration with existing IAM writes. New invalidations resolve the current topic at send time; queued events must not emit to an obsolete epoch. Active remaining users refetch and subscribe to the new authorized topic. Old subscriptions receive no new board emissions.

Since P0 payloads contain no content, an imperfect disconnect must not become a card-content leak; nonetheless epoch integration is a launch test. Do not shorten a shared project's JWT lifetime or disable existing public Realtime features merely to solve Orbit's problem without checking impacts on Studio games and other consumers. Audit any existing permissive `realtime.messages` policies: additive RLS policies must not accidentally grant access to Orbit-prefixed topics. Restrict existing broad policies to their owning topic namespaces where necessary and regression-test their consumers.

Presence is optional P1 and must use the same epoch boundary. Do not include email addresses or fine-grained user activity in presence payloads. If immediate, verified channel revocation cannot be achieved safely, ship authorized refetch polling instead of claiming the private-channel design is complete.

---

---

## 15. File pipeline and storage authorization

### 15.1 Upload protocol

1. **Reserve:** verified Editor/Manager requests an upload reservation with card ID, size, declared type, and idempotency key. Server checks live access and active state; atomically reserves quota and returns an opaque object path.
2. **Upload:** use the user-context Storage client and a reservation-aware policy, or a narrowly authorized upload mechanism. An arbitrary client-chosen path is rejected. No broad bucket write policy.
3. **Finalize:** server independently verifies stored object existence, actual bytes, type signature, uploader/reservation, and expected card association. Finalization is idempotent.
4. **Validate:** image decoder limits dimensions/pixel count and verifies safe raster content; configured scanner checks enabled documents. Status remains quarantined until all required checks pass.
5. **Ready:** change attachment to ready and settle actual bytes against the reservation. Enqueue safe activity/notifications if appropriate.
6. **Clean up:** expiry/rejection deletes the object through the Storage API, releases reservation accounting, and records a minimal outcome. Cleanup retries are idempotent.

Proposed object layout: `<workspace_uuid>/<board_uuid>/<card_uuid>/<attachment_uuid>/<opaque_key>`. This is a naming convention plus a validated database relationship, not authority from path prefixes alone. The original filename is display metadata only.

### 15.2 Access and removal

Storage policies must check current product entitlement, membership, effective board permission, card lifecycle, attachment status, and exact object association. RLS must not depend solely on uploader ownership because teammates need authorized reads and former uploaders must lose access. Validate INSERT and any required SELECT/UPDATE paths rather than assuming upsert has the same permissions as insert. [S4, S12]

Use authenticated downloads by default. Signed thumbnail URLs, if introduced, should have a short proposed TTL of 60 seconds; disclose that a signed URL is bearer access until expiry. Sensitive download responses are private/no-store. Never render uploaded HTML/SVG as same-origin executable content, iframe untrusted documents with application privileges, or serve arbitrary external URLs through a credentialed fetcher.

Removal first marks the attachment unavailable, then queues physical deletion. If bytes cannot be removed immediately, they remain inaccessible through new authorized requests. Reconcile orphan objects, quota reservations, and metadata with a bounded daily job. Back up file bytes separately from database metadata. [S9]

---

---

## 16. Activity delivery, email, and durable jobs

### 16.1 Transactional outbox

A committed domain mutation inserts the corresponding activity and outbox intent in the same database transaction. A worker claims eligible items with leases, executes bounded work, records outcome, and retries transient failures with exponential backoff plus jitter. Start with five attempts; after exhaustion send to a dead-letter state for operator review. An audit-only, non-delivery event must not be confused with a notification.

Suggested job types: invitation delivery; notification fan-out; private invalidation; upload verification; orphan cleanup; trash purge; and, once enabled, reminders, digests, exports, recurrence. Not all jobs need exist before their owning feature is shipped.

### 16.2 Worker runtime choice

Select a real durable execution path before enabling job-dependent features: a bounded scheduled worker invocation with database leases, or a dedicated worker runtime. Use the existing deployment/provider conventions when practical. Do not rely on browser tabs, in-memory arrays, unawaited promises, `setInterval` in a request handler, or a process remaining alive after an HTTP response.

For an HTTP-invoked worker, verify a dedicated server-only credential/signature, limit batch size/runtime, prevent concurrent duplicate claims, and reject public unauthenticated triggers. Inspect the actual hosting plan's schedule/runtime limits instead of promising an unsupported cadence. A job's status must distinguish queued, running, completed, failed, and cancelled.

### 16.3 Delivery correctness

Generate recipient lists from current visible subjects. Recheck membership and preferences immediately before sending; avoid embedding confidential card content in email defaults. Default notification email contains a generic event description and authorized deep link, not the full card. Dedupe recipient/event/reason at the database and use provider idempotency support where available. Provider webhooks verify their documented signatures and cannot mutate unrelated jobs.

Store UTC instants for scheduling, plus an IANA timezone for local interpretation. Date-only due dates remain dates. Reminder identity includes card, recipient, due-date version, and reminder type. A due date moved or a card completed before delivery cancels obsolete intent.

### 16.4 Invitation handoff without token leakage

Do not carry a raw invitation secret through an Auth return URL. On the invitation entry surface, validate the secret without consuming acceptance, establish a short-lived, signed or server-backed **host-only invitation context**, and redirect to a clean continuation URL. The invitation context is not a new authentication session. Use HttpOnly/Secure rules for that temporary server-only context where applicable; retain the existing shared Auth cookie behavior.

Acceptance still requires the matching verified email, live invite status, valid context, explicit same-origin POST, and role checks. Use no-referrer treatment and redact invitation-entry URLs from analytics and logs, including relevant hosting/proxy logging. A link preview cannot accept an invitation.

---
