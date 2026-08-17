# Shaamil domain, data, and messaging architecture

This page defines the recommended future Shaamil backend and client-sync
contract. No `shaamil` schema, table, function, policy, publication, Storage
bucket, Edge Function, product entitlement, or native client exists today.
Every physical object described here is conditional on a separately approved
implementation milestone and reviewed forward migration.

## Architecture recommendation

The target dependency and trust direction is:

```text
native platform UI
        ↓
Shaamil application commands and queries
        ↓
Shaamil domain state machines and authorization vocabulary
        ↓
encrypted local persistence, outbox, and sync coordinator
        ↓
RLS-safe Supabase reads/writes or trusted product commands
        ↓
Supabase Auth + IAM + shaamil PostgreSQL schema
        ↓
private Realtime delivery, Storage, push providers, and operations
```

Some simple reads and ownership-preserving writes may call the Supabase Data
API with the authenticated user's session. Ordering-sensitive, privileged,
transactional, abuse-sensitive, invitation, moderation, notification,
attachment-finalization, and ownership-transfer operations require a trusted
database function or product backend/Edge Function. A trusted boundary does not
mean every request receives a privileged key; it means the operation performs
server-owned validation and commits its invariants atomically.

## Schema and ownership boundaries

Shaamil uses the existing Supabase project and identity boundary. The future
physical ownership model is:

| Owner                       | Responsibility                                                                                                                                       | Must not own                                              |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `auth` (Supabase-managed)   | Credentials, identities, provider links, factors, sessions, token issuance                                                                           | Product membership, community roles, messages             |
| `iam`                       | Canonical profile, active subject state, Shaamil product entitlement, workforce/operator capabilities, policy acceptance, cross-product access audit | Community membership, product persona, moderation content |
| `iam_private`               | Private caller-bound IAM predicates and trusted provisioning helpers                                                                                 | Client-facing product tables                              |
| `foundation`                | Genuinely reused database primitives                                                                                                                 | Product aggregates or generic messaging platform          |
| future `shaamil`            | Communities, community membership/roles, channels, communication, read state, invitations, blocking, safety, product settings, notification state    | Credentials, cross-product roles, Studio/Portfolio data   |
| Supabase-managed `storage`  | Object metadata and Storage policy enforcement                                                                                                       | Product attachment metadata/invariants                    |
| Supabase-managed `realtime` | Broadcast/Presence infrastructure and authorization policy surface                                                                                   | Shaamil durable messages or custom tables/functions       |

The current Supabase changelog states that the managed `realtime` schema is
locked against custom object changes while RLS policies on
`realtime.messages` remain the authorization mechanism. Shaamil migrations
must never create helper functions, triggers, or application tables inside
`realtime`. See [Realtime schema lockdown](https://supabase.com/changelog/realtime-schema-locked-down-against-modification)
and [Realtime authorization](https://supabase.com/docs/guides/realtime/authorization).

The `shaamil` schema should be added to the Data API only when client-accessible
operations are approved. Grants and RLS are separate: every exposed operation
requires explicit table/function grants plus RLS or caller-bound function
authorization. Supabase is moving existing projects to opt-in exposure for new
objects; migrations must therefore state grants rather than inherit broad
defaults. See [Securing the Data API](https://supabase.com/docs/guides/api/securing-your-api)
and [the Data API exposure change](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).

## Authentication, identity, and profile model

One person may use the same Supabase Auth identity across Auth, Studio, Admin,
Portfolio administration, and Shaamil while holding different product access
and resource roles. “Same SSO approach” means the same authentication authority
and subject, not a shared browser cookie copied into native storage.

| Concept                     | Owner                             | Cardinality and purpose                                                                 |
| --------------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| Authentication identity     | `auth.users`                      | One Supabase subject with credentials/providers/factors                                 |
| Canonical ecosystem profile | `iam.profiles`                    | One lifecycle and public-name record per Auth subject                                   |
| Shaamil product entitlement | `iam.product_memberships`         | Zero or one active Shaamil entry membership per subject                                 |
| Workforce/operator role     | IAM                               | Optional operational authority; does not reveal private community content automatically |
| Product persona             | Future `shaamil` only if approved | Optional display name, handle, avatar override, biography, or privacy setting           |
| Community membership        | Future `shaamil`                  | One membership state per subject/community                                              |
| Community role              | Future `shaamil`                  | Product-local owner/moderator/member authority                                          |
| Device registration         | Future `shaamil`                  | One installation endpoint and notification/privacy state; not an authentication session |
| Authentication session      | Supabase Auth                     | Refresh/access lifecycle per signed-in client                                           |
| Moderation state            | Future `shaamil`                  | Community/product restriction independent of Auth identity status                       |

Shaamil should not create a mandatory duplicate profile. It renders the IAM
profile unless a real product requirement needs a separate persona. A username
or handle is therefore **open**. If approved, normalization, uniqueness,
confusable-character policy, reserved names, changes, impersonation handling,
and moderation belong to Shaamil rather than being inferred from email.

Native clients must use a publishable client key and the user's session. Secret
and legacy service-role credentials remain trusted-server-only. Supabase now
recommends publishable/secret keys instead of legacy `anon`/`service_role`
keys; migration of existing clients is a separate cross-product change. See
[Supabase API key migration](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).

### Native authentication behavior

- Use Authorization Code with PKCE and the system browser for approved OAuth
  providers; never collect provider credentials in a Shaamil webview.
- Validate exact callback scheme/host/path, state, PKCE verifier, expected
  transaction, expiry, and one-time completion.
- Store refresh/access material through reviewed Keychain/Keystore-backed
  storage; do not place it in SQLite, ordinary preferences, URLs, logs, crash
  reports, analytics, or notification payloads.
- Refresh in one serialized coordinator so concurrent 401 responses do not race
  token rotation.
- Treat current database membership as authoritative for revocation-sensitive
  operations. JWT claims may be navigation hints but can remain stale until
  refresh.
- Require AAL2 and recent authentication for owner transfer, high-impact
  moderation, export/deletion, device/session control, and other approved
  privileged actions.
- Support explicit local logout and approved all-device logout. Revoking an
  Auth user does not by itself guarantee that every existing access token has
  expired, so sensitive commands must validate current session/membership when
  strict revocation is required.
- Auth web remains the ecosystem web entry/security product. It is not a native
  token broker, and `@jayantgoyal/web-auth` is not imported or copied.

Recovery and verification may remain native if Supabase supports the approved
flow safely. A handoff to Auth web is acceptable only when it returns a
short-lived, single-use authorization result through a validated link; access
and refresh tokens must never be relayed in a URL.

## Aggregate boundaries

The domain is split by transaction and authorization responsibility rather
than by screen.

| Aggregate                    | Root                 | Owns                                                                                 | Key invariants                                                                                                                   |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Community                    | Community            | Active settings, ownership identity, lifecycle                                       | Exactly one current owner; archived communities reject new participation; transfer is atomic                                     |
| Membership                   | Community membership | Role, status, join/leave/ban timestamps                                              | At most one membership per subject/community; banned/removed is not active; actor cannot act on equal/higher protected authority |
| Channel                      | Channel              | Community relationship, visibility/write mode, durable order counter                 | Belongs to one community; slug unique within community; archived/read-only state constrains sends                                |
| Message                      | Message              | Author, channel sequence, body/tombstone, reply/revision relationships when approved | Immutable public ID and channel order; idempotent send; author/community consistency; bounded body                               |
| Invitation                   | Invitation           | Target, secret hash, scope, expiry, redemption/revocation state                      | Secret stored only as a hash; scope and target immutable; single-use/usage limits atomic                                         |
| Report                       | Report               | Reporter, subject evidence reference, reason, status                                 | Reporter must have seen/been eligible to see subject; one outcome is auditable; internal notes are private                       |
| Moderation action            | Moderation action    | Actor, target, reason/evidence reference, effect, expiry                             | Authorized actor; protected-role rule; append-only evidence; reversible actions retain history                                   |
| Read state                   | Channel read cursor  | Subject, channel, highest acknowledged sequence                                      | Monotonic per subject/channel and never beyond durable channel head                                                              |
| Device notification endpoint | Device endpoint      | Platform token, app installation, preferences, failure state                         | Tokens encrypted/restricted; rotation replaces old endpoint; logout/revocation disables delivery                                 |

Messages do not own community authorization. They reference a channel, and the
channel's community membership plus current state determines access.

## Draft schema by capability stage

Physical names are recommendations for review, not permission to create them.

### Technology proof

The native access proof needs no `shaamil` schema. It may add only the minimum
IAM product registry, product membership, and entry capability records required
to prove authorized native access. Those IAM changes still require a reviewed
migration and snapshot refresh.

### First reliable vertical slice

| Recommended table              | Required responsibility                      | Important keys and indexes                                                                                                            |
| ------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `shaamil.communities`          | One operator-created community and lifecycle | Public UUID; owner subject; status; unique active slug if slugs are approved                                                          |
| `shaamil.community_members`    | Owner/member membership and revocation       | `(community_id, user_id)` unique; indexes by user/status and community/status                                                         |
| `shaamil.channels`             | One durable text channel and its order head  | Public UUID; community FK; unique `(community_id, slug)`; status/write mode                                                           |
| `shaamil.messages`             | Ordered text messages                        | Unique `(channel_id, channel_sequence)` and `(sender_user_id, client_message_id)`; cursor index `(channel_id, channel_sequence desc)` |
| `shaamil.channel_read_cursors` | Monotonic per-user read state                | `(channel_id, user_id)` primary/unique; index unread queries by user                                                                  |
| `shaamil.invites`              | Single-use, expiring membership invitation   | Secret hash unique; scope/target/status/expiry indexes; no plaintext token                                                            |
| `shaamil.reports`              | Minimum report receipt and review state      | Reporter/status/created indexes; subject evidence reference                                                                           |
| `shaamil.moderation_actions`   | Removal/ban and report outcome evidence      | Community/target/actor/type/time indexes; immutable action identity                                                                   |

The vertical slice does not create categories, custom role tables, reactions,
mentions, attachments, notification delivery, presence, typing, direct
conversations, message revisions, pins, search documents, public discovery, or
provider placeholder tables.

### MVP additions only when their capability begins

- `message_revisions` for an approved edit history and retention policy;
- `message_reactions` with one reaction per user/message/key;
- structured `message_mentions` if notifications/search cannot derive them
  safely at send time;
- `message_attachments` after Storage validation/finalization exists;
- `message_pins` with actor and removal audit;
- `blocks` before unsolicited member-to-member communication or DMs;
- `notification_preferences`, `device_endpoints`, and a durable notification
  outbox when push begins;
- product-persona fields/table only after the profile decision;
- search representation only after language, retention, privacy, and cost are
  approved.

Custom role and channel-override tables are deferred until the fixed role model
is demonstrably insufficient. Future migration from fixed system roles is
preferable to shipping an unused generic permission designer.

## Public IDs, ordering, and idempotency

- Public resources use non-sequential UUIDs generated by an approved canonical
  primitive such as `foundation.uuid_v7()` when the migration is designed.
- A message also receives a server-owned monotonic `channel_sequence`. The send
  command locks/updates the channel order head and inserts the message in one
  transaction.
- Clients never supply or predict `channel_sequence`.
- A client supplies a random `client_message_id`; uniqueness across
  `(sender_user_id, client_message_id)` makes retry idempotent.
- The authoritative timeline cursor is `(channel_id, channel_sequence)`, not
  client time, PostgreSQL commit timestamp, or Realtime arrival order.
- Pagination requests `before_sequence`/`after_sequence` with bounded limits.
- A command returns the existing outcome when retried with the same idempotency
  key and equivalent payload. Reusing a key with different payload fails.
- Trusted membership, invitation, moderation, and attachment commands also need
  operation-specific idempotency when the same request can be retried across a
  network boundary. Add a generic command receipt table only when several real
  commands justify it.

## State transitions

### Community

```text
active → archived
archived → active       only if policy permits and dependencies remain valid
active/archived → deleted or anonymized cleanup state under approved retention
```

### Membership

```text
invited → active → left
invited → expired/revoked
active → removed
active/removed → banned
banned → active         explicit authorized reversal only
```

Leaving, removal, ban, community archive, IAM product revocation, or account
deactivation makes access fail immediately at the authoritative boundary.

### Invitation

```text
active → redeemed
active → revoked
active → expired        derived from time and finalized during use/cleanup
```

Redemption validates hash, scope, target, expiry, usage, product eligibility,
ban state, and existing membership in one transaction.

### Message client state

```text
local draft → pending → durable
                    ↘ failed → retrying → durable
durable → edited/tombstoned only after those policies are approved
```

The client state is not the server state. A pending message is visibly pending;
an optimistic item becomes durable only after an authoritative result with
public ID and sequence.

## Role and permission model

Authorization combines central IAM RBAC with Shaamil-owned resource attributes:

```text
authenticated session
AND active IAM profile
AND active IAM Shaamil product membership
AND baseline IAM entry/operations capability
AND active Shaamil community/channel membership
AND Shaamil system role grants the requested product permission
AND resource state, target authority, ban/block, rate, and assurance attributes permit it
```

### Dot-qualified vocabulary

Permissions use `product.resource.action`, not `product.role.permission`.
Examples:

- `shaamil.product.enter`
- `shaamil.community.read`
- `shaamil.community.update`
- `shaamil.member.invite`
- `shaamil.member.remove`
- `shaamil.channel.read`
- `shaamil.channel.update`
- `shaamil.message.read`
- `shaamil.message.create`
- `shaamil.message.moderate`
- `shaamil.report.create`
- `shaamil.report.review`

Roles are bundles of permissions and therefore never appear inside permission
keys. UI code consumes typed decisions such as `canInviteMember`; it does not
scatter raw strings or infer authority from labels.

IAM should hold only cross-product product-entry and operator/support
capabilities. Community permissions and role decisions are product-owned and
evaluated by Shaamil RLS/trusted functions. A global Admin or workforce role
does not automatically read private messages.

### Recommended fixed roles

| Role      | Initial stage  | Authority                                                                                                         |
| --------- | -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Owner     | Vertical slice | All approved community operations; sole ownership transfer/delete authority; cannot bypass platform safety/audit  |
| Moderator | MVP            | Member safety, reports, permitted message moderation; no owner transfer, infrastructure, secret, or IAM authority |
| Member    | Vertical slice | Read and send in allowed channels, manage own read state/settings, report content                                 |

Role permission sets should be explicit. A numeric authority rank may protect
targets (for example, a moderator cannot remove an owner), but rank must not
implicitly grant every lower permission. Ownership transfer is transactional:
verify AAL2/recent authentication, target active membership, one current owner,
actor authority, and audit evidence before atomically replacing the owner.

Private/read-only channels and permission overrides are future capabilities.
When added, evaluation order should be: product/community eligibility, channel
visibility membership, explicit deny, role allow, resource attributes. Deny
wins. Override administration requires its own permission and audit.

## RLS and trusted authorization

Every client-reachable table enables and forces reviewed RLS as appropriate.
Policies bind the caller with `(select auth.uid())`, require active IAM product
membership, then apply community/channel membership and resource constraints.
`TO authenticated` alone is authentication, not authorization.

| Resource/action                           | Direct RLS-safe candidate                            | Trusted command required                                               |
| ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| Read visible communities/channels/members | Yes, with current membership and privacy projection  | Support/exceptional access                                             |
| Read message pages                        | Yes, current channel access plus sequence pagination | Export spanning restricted/removed content                             |
| Send message                              | No                                                   | Ordering, idempotency, rate/body checks, membership, audit/abuse hooks |
| Advance own read cursor                   | Possibly, monotonic caller-bound function preferred  | Multi-device reconciliation if derived counts are updated atomically   |
| Create/redeem/revoke invite               | No                                                   | Secret validation, scope, usage, ban, membership transaction           |
| Remove/ban member                         | No                                                   | Hierarchy, reason, expiry, audit, cache-revocation signal              |
| Ownership transfer                        | No                                                   | AAL2/recent auth, single-owner invariant, protected transaction        |
| Create report                             | Caller-bound trusted function                        | Validate subject visibility, rate limit, receipt                       |
| Review report/moderate                    | No                                                   | Permission, evidence access, action/audit transaction                  |
| Attachment finalize/delete                | No                                                   | Object metadata, ownership, MIME/size/scan state, retention            |
| Register push token                       | Caller-bound function                                | Token rotation, installation binding, provider validation              |

Security-definer functions are exceptional. When necessary, keep private
helpers outside exposed schemas, fix `search_path`, revoke execution from
`PUBLIC`, validate `auth.uid()` and current authorization internally, grant only
the intentional wrapper, and run database security advisors. Prefer security
invoker operations where RLS can enforce the invariant.

## Community channels versus direct conversations

Do not create a generic shared message stream before a second real message
container exists. The first vertical slice should use `messages.channel_id`
with a non-null foreign key and channel-specific authorization.

If direct/group conversations are later approved, re-evaluate three options:

1. Keep channel and conversation message tables separate for simpler
   authorization and retention.
2. Introduce a real `message_streams` aggregate with one non-polymorphic stream
   owner relationship per channel/conversation and migrate channel messages.
3. Share only domain command/event contracts while retaining physical tables.

Reject nullable `channel_id`/`conversation_id` pairs or an unconstrained
`owner_type`/`owner_id` polymorphic association. Shared storage is justified
only when ordering, retention, search, moderation, and sync behavior are truly
the same. DMs also require relationships, contact discovery, blocking, spam
controls, notification policy, and abuse operations, so they remain V1.x
discovery rather than an MVP switch.

## Messaging correctness

### Durable send

The trusted send command must:

1. authenticate and resolve the current subject;
2. require active IAM Shaamil entry and community/channel membership;
3. reject banned, removed, archived, read-only, or rate-limited state;
4. normalize/validate message size and content without silently rewriting
   meaning;
5. deduplicate the client message ID;
6. allocate the next channel sequence under a transaction lock;
7. insert the durable message and any required abuse/audit metadata;
8. return the authoritative public ID, sequence, timestamps, and canonical
   payload;
9. emit/trigger private delivery only as part of the committed durable outcome.

### Edits and deletion

Edits and user deletion are not in the first slice. Before approval, define:

- author edit window and moderator exceptions;
- optimistic concurrency/version precondition;
- revision retention and export visibility;
- whether deletion produces a visible tombstone, hard deletion, or delayed
  purge;
- reply/pin/reaction behavior when a target is removed;
- moderation-evidence separation;
- notification/search/cache purge propagation.

An update uses an expected message version so concurrent edit/delete races fail
or produce a defined winner. Clients never overwrite a newer authoritative
version because their local copy is stale.

### Replies, reactions, mentions, and pins

- Replies reference an existing visible message in the same stream and preserve
  a bounded fallback preview only if retention/privacy allows.
- Reactions are durable, idempotent per `(message, user, reaction_key)`, and
  delivered as changes rather than full message rewrites.
- Mentions are parsed/validated server-side against eligible subjects. A raw
  `@name` does not grant visibility or trigger notification by itself.
- Pins are authorized community actions with actor/time audit and deterministic
  behavior when the message is removed.

## Realtime architecture

Realtime is separated by durability and operational value:

| Signal                     | Durable authority                | Delivery recommendation                                | Persistence guarantee                                              |
| -------------------------- | -------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| Messages                   | `shaamil.messages`               | Private database Broadcast on channel topic            | PostgreSQL durable; Broadcast may duplicate, reorder, or be missed |
| Membership/channel changes | Shaamil tables                   | Private Broadcast plus forced reconciliation/purge     | PostgreSQL durable                                                 |
| Reactions/pins             | Future Shaamil tables            | Private Broadcast when implemented                     | PostgreSQL durable                                                 |
| Read cursor                | Shaamil read cursor              | Coalesced write; optional lightweight delivery         | Latest durable monotonic cursor, not every intermediate read       |
| Presence                   | None beyond connection semantics | Realtime Presence only if approved                     | Ephemeral; never proof of authorization or reliable online status  |
| Typing                     | None                             | Private client Broadcast only if approved/rate-limited | Ephemeral; drop freely                                             |
| Notification work          | Durable notification outbox      | Trusted worker to provider                             | Durable attempt state; provider delivery is eventual/best effort   |

Supabase recommends Broadcast over Postgres Changes for scalability and
security. Private topics require Realtime Authorization policies. See
[Subscribing to database changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)
and [Broadcast](https://supabase.com/docs/guides/realtime/broadcast).

Topic names should contain opaque public IDs, for example
`shaamil:channel:<channel-id>`, and authorization must map the topic to current
membership. Client-originated durable message Broadcast is prohibited; the
database/trusted command emits after durable acceptance.

Broadcast replay is short-lived and bounded, so it cannot replace durable
history. On connection, reconnect, foreground, detected sequence gap, or
membership event, the client queries after its durable cursor. It accepts
duplicate/out-of-order events, discards already-applied versions, and fills
every missing sequence from PostgreSQL.

Unread counts should be derived from durable channel head/read cursors or a
transactionally maintained counter with repair capability. Realtime event count
is never the unread authority.

## Bounded offline and synchronization

The local database should contain only the data needed for current experience:

- visible communities/channels and membership projection;
- bounded recent message pages per channel;
- channel sync cursor and authoritative versions;
- local read state pending reconciliation;
- text-message outbox with idempotency key, attempt state, and last safe error;
- minimal client configuration and local database migration metadata.

Authentication tokens, database encryption keys, push credentials, and
provider secrets do not belong in SQLite.

### Included offline behavior

- Read previously cached authorized messages.
- Navigate cached current community/channel metadata with a clear stale/offline
  indicator.
- Compose and queue bounded text messages.
- Retry with exponential backoff and jitter when connectivity returns.
- Reconcile pending messages, duplicates, gaps, read cursors, and membership
  changes.
- Purge revoked/removed data as soon as authoritative revocation is known.

### Excluded offline behavior

- Creating/redeeming invitations.
- Membership, role, community, channel, moderation, report-review, ownership,
  or privacy administration.
- Attachments, search-index mutation, presence, or typing guarantees.
- Unlimited queued messages or complete history replication.
- Sending after known revocation.

### Conflict rules

- Server authorization and current resource state always win.
- A locally queued send rejected after removal becomes failed/revoked and is
  never silently sent to another channel.
- Duplicate idempotency outcomes reconcile to one durable item.
- Read cursors take the maximum authorized durable sequence, never client time.
- A remote delete/tombstone removes or replaces cached body content according
  to policy even if the user is offline when it occurs.
- Local database migration failure enters a safe recovery path; it must not
  upload arbitrary cache contents or bypass encryption.
- Multi-device changes converge through server versions/cursors, not device
  last-write timestamps.

Cache limits by age, messages/channel, total bytes, and protected/pinned state
remain open. Limits must be observable and tested against low-storage behavior.

## Attachments and Storage

Attachments are excluded from the first vertical slice. When approved, the
flow should be:

1. Request an upload intent from a trusted operation with community/channel,
   filename, claimed MIME, byte size, and client idempotency key.
2. Validate membership, rate/quota, allowed type/size, and attachment policy.
3. Return a short-lived signed upload target for a private candidate bucket.
4. Upload with progress, cancellation, bounded retry, and checksum where
   supported.
5. Finalize through a trusted command that verifies object existence, actual
   size/type/signature, ownership, scan status, and message relationship.
6. Publish attachment metadata only after finalization.
7. Serve through short-lived signed access after current message/channel
   authorization.

The candidate bucket name `shaamil-attachments` is not approved or created.
Executable/script types should be denied initially. Size/type limits, image
metadata stripping, malware scanning, thumbnail processing, provider choice,
and encrypted-at-rest requirements are open and block attachments.

Object paths should use opaque IDs rather than user filenames. Product metadata
records ownership, original display name, detected MIME, bytes, checksum,
state, retention, and deletion. A cleanup job removes abandoned upload intents
and unreferenced objects after a disclosed window. Deleting a message does not
leave an indefinitely accessible object.

## Push notifications

Push is excluded from the first vertical slice and must use a provider boundary
only when a real provider is selected.

```text
durable Shaamil event
        ↓
transactional notification intent/outbox
        ↓
trusted dispatcher and preference/privacy evaluation
        ↓
APNs / FCM / later Windows or macOS provider
        ↓
device opens validated native link
```

Requirements:

- bind each endpoint to subject, installation, platform, app environment, and
  last-seen/disabled state;
- treat provider tokens as sensitive operational data and restrict access;
- support rotation, duplicate endpoints, logout, uninstall/invalid-token
  feedback, multiple devices, and user preference changes;
- coalesce noisy events and avoid sending when the user is actively viewing the
  channel where practical;
- default lock-screen payloads to sender/community-neutral text until the user
  opts into previews;
- place no message body, token, private ID, or authorization fact in analytics
  or provider tags beyond what is necessary;
- make provider failure retryable with bounded attempts/dead-letter visibility;
- authorize again when the link opens rather than trusting receipt of a push.

Provider selection must compare direct APNs/FCM, Expo Push Service, and any
later Windows/macOS provider for privacy, token ownership, reliability, cost,
delivery receipts, regional/legal posture, and exit strategy. No provider
package is justified before that decision.

## Durable native links

The recommended semantic vocabulary is independent of any one domain or scheme:

| Intent          | Semantic route                            | Authorization behavior                                              |
| --------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Invitation      | `invite/<opaque-single-use-token>`        | Redact token from logs; authenticate, then trusted redemption       |
| Community       | `community/<public-id>`                   | Require current product/community access                            |
| Channel         | `channel/<public-id>`                     | Require current channel visibility                                  |
| Message         | `channel/<public-id>/message/<public-id>` | Require message visibility; fetch by durable ID and restore context |
| Report/settings | `settings/<approved-section>`             | Authenticate and apply current permission/assurance                 |

Development may map this vocabulary to an environment-qualified custom scheme.
Production should prefer verified universal/app links if an approved HTTPS host
exists. Every parser rejects unknown hosts/schemes, encoded traversal,
duplicate/conflicting parameters, oversize tokens, unexpected fragments, and
unapproved redirects. Links never make a resource public.

## Search

Search is not in the first vertical slice. Before MVP search, decide:

- language/tokenization, stemming, Unicode, and typo expectations;
- exact community/channel scope and current membership filtering;
- deleted/edited content propagation and moderation restrictions;
- retention/export interaction;
- PostgreSQL full-text/trigram cost versus a separate provider;
- encrypted local search and cache size;
- rate limits and protection against using search to enumerate private content.

Start with PostgreSQL search only if measured data and query plans remain
acceptable. A separate search service is not an extension seam to provision in
advance.

## Deletion, retention, export, and audit

Retention values are open, but ownership is defined:

- Auth owns identity/session deletion mechanics.
- IAM owns canonical profile/product-access lifecycle and access audit.
- Shaamil owns community content, membership, product persona/settings,
  reports, moderation evidence, local-cache purge commands, and notification
  endpoints.
- Storage owns physical objects subject to Shaamil finalization and cleanup
  metadata.

Account deletion must revoke/expire sessions as required, disable product
access and notification endpoints, remove local caches, then execute an
approved asynchronous content policy. Options include deleting authored
content, retaining tombstones with pseudonymous authors, or retaining content
under community policy. The chosen behavior must be disclosed before external
beta.

Exports include only data the requester is entitled to receive and must not
export other members' private profile fields, moderator notes, security logs,
or provider tokens. Export creation/download is privileged, rate-limited,
expiring, encrypted in transit/at rest, and audited.

Moderation evidence and security/access audit are separate from ordinary
message retention. Evidence access is narrower, every read/action is audited,
and retention/appeal/legal-hold rules require explicit approval. Audit events
are append-only facts with actor, action, target, reason category, request
correlation, source, timestamp, and safe metadata; they must not copy message
bodies or secrets by default.

## Migration and verification contract

Future backend work must:

1. establish a reliable current-schema local database/RLS test harness;
2. inspect current CLI help, Supabase changelog, schema snapshots, remote
   migration history, Data API settings, Realtime settings, Storage policies,
   and API key posture;
3. create forward migrations through the repository's reviewed workflow;
4. include explicit schema usage, object grants, RLS, policies, function ACLs,
   fixed search paths, indexes, constraints, cleanup, and rollback/forward-fix
   reasoning;
5. test anonymous, authenticated non-member, member, moderator, owner, removed,
   banned, expired/revoked IAM membership, and wrong-community access;
6. run database advisors and inspect every error;
7. apply remotely only through the dedicated approved disposable workflow;
8. refresh and review every affected canonical snapshot after apply;
9. verify remote grants, policies, functions, publications/Realtime
   authorization, Storage policies, and operation behavior;
10. coordinate backward-compatible client rollout before contracting old
    interfaces.

Never edit applied migrations, blanket-apply unexplained drift, place privileged
credentials in clients, or use security definer to hide a permission design
failure.
