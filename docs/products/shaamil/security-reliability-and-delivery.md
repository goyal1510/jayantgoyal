# Shaamil security, reliability, and delivery

This page defines the current security, privacy, safety, operational, testing,
and delivery architecture for Shaamil. It is a design contract, not evidence
that a backend, client, provider, environment, or release exists. Product scope
lives in [the Shaamil product definition](README.md); client and release choices
live in [platform and client architecture](platform-and-client-architecture.md);
authorization and synchronization live in
[domain, data, and messaging architecture](domain-data-and-messaging.md).

## Decision summary

- Security is enforced by Supabase Auth, PostgreSQL constraints and RLS, narrow
  trusted operations, private Storage policies, and server-side capability
  evaluation. Client checks improve UX but never grant authority.
- Shaamil is private and invitation-led for its first release. Public discovery,
  anonymous posting, federation, bots, and public APIs are not accepted attack
  surfaces.
- Message contents, tokens, signed file URLs, private profile fields, and
  moderation evidence must not enter ordinary logs or analytics.
- Availability and scale targets remain open until the operator approves the
  initial community and service commitments. Architecture should fail safely
  and expose health before promising an SLO.
- Implementation proceeds through outcome gates. Completing a scaffold or
  screen does not satisfy a gate without authorization, sync, accessibility,
  observability, and recovery evidence.

Confidence is **high** in these boundaries and **medium** in provider- and
scale-specific controls because push, crash reporting, analytics, budget,
retention, and availability decisions are not yet approved.

## Trust boundaries

```text
untrusted person and device
  -> native client UI and local database
  -> public Supabase endpoint or trusted Shaamil operation
  -> Supabase Auth / PostgreSQL-RLS / Realtime / private Storage
  -> notification provider
  -> recipient device

operator or moderator
  -> ordinary authenticated client
  -> separately authorized moderation operation
  -> auditable product state and restricted evidence

CI or release operator
  -> protected build and signing services
  -> signed artifact / store channel
  -> installed client
```

The native process and its local storage are not trusted authorization
boundaries. A rooted, jailbroken, malware-controlled, or reverse-engineered
device can change local flags and requests. Public Supabase keys identify a
project, not a privileged caller. Service-role, secret, signing, provider, and
other privileged credentials belong only in separately controlled backend or
release systems.

## Initial threat model

Risk ratings are provisional until the user population, legal jurisdiction,
data sensitivity, and availability commitment are approved.

| Threat                                | Required controls                                                                                                                                                         | Verification                                                                                     | Residual risk                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Account or token compromise           | PKCE, platform secure storage, short-lived access tokens, refresh rotation, session/device visibility, revocation, MFA capability, reauthentication for sensitive actions | Stolen/expired/revoked token tests; session revocation across devices; secure-storage inspection | Compromised unlocked devices can act until detected or revoked              |
| Malicious OAuth callback or deep link | Exact schemes/hosts and routes, state and PKCE validation, allowlisted destinations, no authority in link parameters, reject malformed/foreign links                      | Unit, fuzz, and physical-device callback tests from cold/warm states                             | OS link-routing or provider defects remain external dependencies            |
| Privilege escalation                  | IAM product access plus Shaamil membership/capabilities, RLS on every exposed table, narrow trusted commands, fixed function search paths, no client-authored roles       | Capability matrix and negative RLS tests for every role/state                                    | Policy drift is possible without migration gates and continuous tests       |
| Cross-community leakage or IDOR       | Tenant/community key on owned rows, composite constraints, membership-aware RLS, server-derived scope, opaque public IDs, private signed file access                      | Wrong-community reads/writes across rows, RPCs, Realtime, Storage, search, and exports           | New surfaces can accidentally omit tenant scope                             |
| Unauthorized message or file access   | Membership checks at read time, removed/banned handling, private buckets, short-lived signed URLs, attachment finalization, no public object paths                        | Removed member and shared-URL expiry tests; bucket policy tests                                  | A recipient can copy content legitimately shown to them                     |
| Spam and invite abuse                 | Invitation-led entry, expiry/revocation/use limits, command idempotency, actor/device/IP-aware quotas, progressive cooldowns, block/report paths                          | Burst, rotation, replay, and distributed-source simulations                                      | Determined attackers can distribute activity across identities and networks |
| Impersonation or harassment           | Stable account identity, controlled handles, profile history where justified, block/report/moderation tools, display confusable review, rate limits                       | Confusable-handle and blocked-user journey tests                                                 | Social engineering cannot be eliminated technically                         |
| Reporting abuse                       | Idempotent reports, reporter rate limits, duplicate grouping, restricted evidence, reviewer audit, appeal policy                                                          | Duplicate/burst tests and reviewer authorization tests                                           | False reports require human judgment                                        |
| Rate-limit bypass                     | Limits at trusted operation/database boundary, not only UI; normalize actor/resource/action keys; bound anonymous endpoints                                               | Concurrent and multi-device load tests                                                           | IP-based signals are imperfect behind shared networks                       |
| Replay and duplicate commands         | Client command IDs, uniqueness scoped to actor/container, transactional mutation, canonical response on retry                                                             | Lost-response, concurrent-retry, reordered-event, and reconnect tests                            | Poorly scoped idempotency keys can suppress legitimate actions              |
| Unsafe local storage                  | Encrypted OS secure storage for tokens; bounded app database; protected files; screen/backup policy review; remote revocation                                             | Device backup, lock-state, uninstall/reinstall, and rooted-device review                         | Content visible to the user cannot be made fully secret from that device    |
| Notification privacy leakage          | Privacy-safe default previews, per-device/per-conversation preferences, no tokens or sensitive URLs in payloads, fetch content after authorization                        | Locked-screen, revoked-member, token-rotation, and disabled-preview tests                        | OS/vendor metadata still reveals that a notification occurred               |
| Log or analytics leakage              | Structured allowlist, field redaction, no bodies/tokens/signed URLs, restricted access, bounded retention, deletion policy                                                | Automated sensitive-field tests and periodic sample review                                       | Novel fields can bypass incomplete redaction rules                          |
| Privileged credential exposure        | No service/secret keys in clients; scoped CI secrets; key rotation; protected logs; least-privilege provider credentials                                                  | Artifact/static scans, secret scanning, rotation drills                                          | Compromise of CI or operator accounts remains high impact                   |
| Supply-chain compromise               | Lockfiles, reviewed upgrades, provenance/signature support where available, dependency scanning, minimal native modules, protected release workflows                      | CI scans, reproducible build comparison where practical, release audit                           | Platform SDK and store infrastructure remain trusted dependencies           |
| Denial of service or cost exhaustion  | Payload limits, quotas, timeouts, bounded queries, indexes, connection/realtime limits, alerting, provider spend limits, degrade nonessential work                        | Load, soak, oversized-input, and budget-alert drills                                             | Upstream outage and sufficiently large attacks can still degrade service    |

The most consequential design risk is inconsistent authorization across Data
API, trusted commands, Realtime, Storage, search, push, and exports. Each
capability must use the same product membership and resource rules, with tests
at every boundary.

## Authorization and secret ownership

The canonical permission form is `product.resource.action`, such as
`admin.portfolio.view` or `shaamil.message.create`. A role is a named bundle of
capabilities; it never appears in the capability key. IAM determines whether an
account may enter a product and may grant workforce-oriented capabilities.
Shaamil owns community membership and resource authorization.

All externally reachable tables have RLS enabled and explicit grants. Tables
are not secure merely because they are in a named schema. Trusted functions
must have a fixed search path, revoke unintended execution, validate the
authenticated actor, derive protected fields, and return only required data.

Secret classes and owners:

| Secret or credential                         | Owner                                      | Native client exposure                     |
| -------------------------------------------- | ------------------------------------------ | ------------------------------------------ |
| Supabase publishable/legacy anon project key | Public client configuration                | Allowed; it grants no privileged authority |
| Supabase access/refresh token                | Current signed-in session                  | Secure platform storage only               |
| Supabase secret/service-role key             | Trusted operations or protected automation | Never                                      |
| APNs/FCM provider credentials                | Trusted notification service/build system  | Never                                      |
| Apple/Google/Microsoft signing credentials   | Protected release system/operator          | Never                                      |
| Crash/analytics ingestion identifier         | Client configuration if provider requires  | Only if non-secret and abuse-bounded       |
| Moderation/export encryption or signing key  | Trusted backend                            | Never                                      |

Before implementation, current Supabase API-key posture must be audited against
[Supabase's publishable and secret key migration guidance](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).
No key migration is implied by this document.

## Privacy and data handling

Shaamil follows data minimization:

- authentication data stays with Supabase Auth;
- ecosystem identity and product/workforce access stay in IAM;
- Shaamil stores only product profile, community, message, safety, device, and
  preference data needed for accepted capabilities;
- provider tokens are stored separately from public device/profile records;
- logs use identifiers and reason codes rather than content;
- push payloads carry an opaque event/reference and privacy-safe text;
- analytics must be event-minimal, documented, retention-bounded, and useful
  for an approved product or reliability question.

Before external beta, approval is required for:

- jurisdiction and controller/operator identity;
- minimum age and whether minors are permitted;
- terms, privacy notice, community rules, takedown and law-enforcement process;
- default and maximum message, attachment, deleted-content, audit, report,
  backup, log, device-token, and export retention;
- whether users may hard-delete content already delivered to others;
- export scope, format, authentication, expiry, and delivery;
- account deletion grace period and interaction with security/legal holds;
- analytics and crash provider, consent posture, and data residency.

These are release blockers, not implementation blockers for a local technology
proof that uses synthetic data.

## Moderation and abuse controls

### Product safety model

The initial model is a privately operated community, not an open social
network. Safety responsibilities are split deliberately:

- a member controls their own block, notification, and report actions;
- a moderator can review reports and act only within assigned community scope;
- an owner manages membership, roles, ownership transfer, and moderator access;
- the operator may handle account-level abuse, legal requests, or emergency
  intervention through a separately audited path;
- automated signals may prioritize or slow work but do not silently make
  irreversible moderation decisions in the initial release.

### Report workflow

`submitted -> triaged -> under_review -> resolved | dismissed -> appealed`

A report captures the reporter, target type/public ID, bounded reason category,
optional user explanation, safe content snapshot/reference where policy permits,
and timestamps. Reviewers cannot see unrelated private content. Resolution
records the policy category, action, actor, reason, and appeal eligibility.
Duplicate reports may be grouped but remain attributable and auditable.

### Moderation actions

Actions are explicit and scoped: remove content, warn, restrict posting, remove
member, ban member, revoke invite, or escalate to account-level review. Every
action has a reason, actor, target, scope, effective time, optional expiry, and
appeal state. A ban and a block are not equivalent: a ban is community policy;
a block is an individual's interaction boundary.

Ownership transfer is an ordering-sensitive trusted operation. It requires
recent authentication, an eligible accepting member, one current owner at the
end of the transaction, audit events, and notification to both parties. The
initial release should not support silent forced transfer from an ordinary
client.

### Rate limits and abuse prevention

Limits apply independently to sign-in/recovery, invite creation/acceptance,
membership changes, message sends/edits/reactions, attachments, search,
reports, exports, and push registration. They use appropriate combinations of
account, device, network signal, community, resource, and time window. Client
cooldowns mirror server state but do not enforce it.

Limits must distinguish accidental retries from abuse through idempotency.
Responses avoid exposing whether a private user, community, invite, or resource
exists. Thresholds and enforcement storage require measurement in load and
abuse tests before beta.

## Retention, deletion, export, and recovery

Exact periods remain open. The durable behavior is:

- account deletion initiates a defined state transition rather than cascading
  unpredictably from `auth.users`;
- product access is revoked promptly across Data API, Realtime, Storage, push,
  local sync, and trusted commands;
- deleted messages retain only the minimum tombstone or evidence required by
  approved conversation, moderation, and legal policy;
- attachments are unlinked transactionally, then deleted asynchronously after
  the accepted recovery/evidence window;
- orphaned uploads and expired signed access are cleaned by observable,
  retryable jobs;
- exports are generated by a trusted, rate-limited operation, are encrypted in
  transit and at rest, expire, and never include other members' private fields,
  moderator notes, secrets, or unrelated community data;
- audit and moderation evidence have narrower access and separate retention
  from ordinary messages;
- client caches react to tombstones, access revocation, logout, account
  deletion, and cache-clear commands.

Supabase backup and point-in-time recovery capabilities do not by themselves
define product deletion semantics. The approved policy must disclose that
deleted data can remain in protected backups until those backups expire.

Recovery planning must define recovery point and recovery time objectives,
restore authority, restoration validation, reconciliation of Storage and
database state, notification suppression during recovery, and how clients
detect a restored or rolled-forward dataset. A restore drill using non-sensitive
test data is required before production readiness.

## Reliability and consistency

### Service behavior

The durable PostgreSQL record is authoritative. Realtime, local caches, push,
presence, typing, indexes, and unread projections are derived or delivery
mechanisms. A transient delivery failure must not create or delete durable
facts. Clients recover using ordered cursors and bounded reconciliation rather
than assuming uninterrupted subscriptions.

Expected failure behavior:

- Auth unavailable: preserve safe signed-out/locked state and do not invent a
  session.
- Message command timed out: keep the client command pending and retry with the
  same idempotency key; do not duplicate.
- Realtime disconnected: show connection state and reconcile from the last
  durable cursor.
- Push unavailable: messages remain discoverable on foreground sync.
- Attachment finalization failed: keep the message/attachment in an explicit
  failed or processing state and clean or retry safely.
- Search/index delayed: label results as incomplete when necessary; never
  broaden authorization to improve recall.
- Access revoked: stop delivery, reject commands, clear restricted local data,
  invalidate attachment access, and navigate to a safe surface.
- Partial provider outage: preserve messaging truth and degrade presence,
  typing, previews, or notification delivery independently.

### Availability and scale assumptions

Until approved, architecture planning may use a validation envelope of one
operator, a small number of private communities, hundreds rather than millions
of members, and modest message/media volume. This is an assumption for design
and test sizing, not a product limit or promise.

Before beta, approve measurable targets for command success and latency,
message visibility, reconnect recovery, push timeliness, crash-free sessions,
data loss, support response, and maintenance windows. Before setting them,
measure Supabase database, Realtime, Auth, Storage, egress, Edge Function,
connection, and provider behavior under representative load.

### Cost controls

Track cost drivers independently:

- database size, write amplification, indexes, retention, and backups;
- active Realtime connections, channel joins, messages, and egress;
- Storage bytes, transformations if used, signed downloads, and orphan volume;
- trusted-operation invocations, duration, and retries;
- notification provider usage and invalid-token churn;
- crash, log, trace, and analytics event volume;
- Apple, Google, and Microsoft developer/distribution programs;
- CI/build minutes, artifacts, signing, and device testing.

Budget alerts require an approved monthly operating envelope and thresholds.
Cost pressure must first reduce unnecessary retention, payloads, projections,
or telemetry—not weaken authorization or delete evidence unpredictably.

## Observability

Provider selection is open. The contract is provider-neutral and
privacy-respecting.

### Required structured events

- authentication start/result, provider, MFA/recovery outcome, and safe error
  class;
- session refresh/revocation and device registration lifecycle;
- invite and membership state changes;
- command type, actor/account ID, community/container ID, command ID,
  authorization result, latency, retry/deduplication outcome, and safe error;
- message persistence-to-delivery latency without message body;
- Realtime connect, authorization, disconnect reason, reconnect, cursor gap,
  reconciliation duration, and duplicate/reordered event count;
- outbox depth, oldest item age, retries, terminal failures, and conflict type;
- attachment upload/finalization/scan if adopted/download/cleanup outcome using
  metadata only;
- push registration, token rotation, send outcome, invalid-token cleanup,
  provider latency, and deep-link open outcome;
- moderation/report/export action and audit access;
- local database migration, corruption/recovery, cache eviction, and restricted
  data purge outcome;
- release/build/version/config compatibility and crash reports.

### Required metrics and alerts

| Area          | Core signals                                                           | Alert examples                                                    |
| ------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Auth          | sign-in/refresh success, revocation latency, recovery/MFA failures     | sustained provider failure, refresh loop, revocation not enforced |
| Commands      | rate, success, p50/p95/p99 latency, authorization denials, dedupe      | error/latency spike, unusual forbidden rate, retry storm          |
| Messaging     | accepted-to-visible latency, sequence gaps, edits/deletes failure      | durable send succeeds but delivery/reconciliation fails           |
| Realtime/sync | connections, authorization failures, reconnects, gap fills, outbox age | disconnect storm, cursor stalls, growing outbox                   |
| Storage       | upload/finalize/download success, orphan bytes, signed URL failures    | orphan growth, unauthorized access attempt spike                  |
| Push          | registrations, sends, delivery proxy where available, invalid tokens   | provider outage, invalid-token surge, queue age                   |
| Client        | crash-free sessions, ANR/hangs, startup, local migration failure       | crash regression, database migration failure                      |
| Safety        | invite/message/report rates, enforcement, appeals                      | coordinated abuse pattern, reviewer backlog                       |
| Cost          | usage and forecast by service                                          | forecast exceeds approved warning/critical threshold              |

Correlation IDs join client command, trusted operation, database/audit, and push
work without copying private content. Access to production telemetry is
least-privilege and audited. Retention and sampling are documented before a
provider is configured.

## Incident response

Production readiness requires named ownership and a concise runbook for:

1. detection and severity classification;
2. containment, including key/session/provider revocation and release stop;
3. evidence preservation with restricted access;
4. authorization/data-scope assessment;
5. safe mitigation and backward-compatible recovery;
6. user, provider, store, or regulatory communication where required;
7. restoration and reconciliation verification;
8. post-incident corrective controls reflected in current docs and tests.

Priority scenarios are credential exposure, tenant leakage, unauthorized file
access, destructive migration, widespread token compromise, malicious release,
Realtime/sync data loss or duplication, and abuse emergencies. Contact paths,
severity targets, and notification obligations remain open decisions.

## Testing strategy

Critical authorization, synchronization, and message logic cannot rely only on
UI tests. Fixtures use synthetic identities and communities; production data
must not be copied into ordinary test environments.

| Layer                     | Required evidence                                                                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain and state machines | Membership, invitation, ownership transfer, message lifecycle, moderation, device/session, retention, and idempotency transitions with invalid transitions rejected  |
| Contract                  | Stable command/event/error serialization, version compatibility, unknown-field behavior, and fixtures usable by each language ecosystem                              |
| Database                  | Constraints, indexes, grants, functions, triggers, RLS, tenant isolation, deletion, audit, pagination, and query plans against a current-schema harness              |
| Authentication            | OAuth/PKCE, email verification/recovery as approved, MFA capability, refresh, expiry, revoke-one/revoke-all, logout, account deletion, and callback validation       |
| Client UI                 | View models, optimistic/pending/failed/retry states, navigation, settings, error recovery, text scaling, screen readers, keyboard/pointer where applicable           |
| Local persistence         | Schema migrations, transactions, encrypted secrets boundary, cache limits, purge, corruption recovery, reinstall/restore behavior                                    |
| Sync and Realtime         | Offline sends, lost responses, retries, duplicates, reordered/missing events, reconnect, multi-device edits/deletes/reactions, cursor gaps, access revocation        |
| Attachments               | MIME/size validation, progress/cancel/retry, ownership, finalization, expired access, cleanup, malicious names/content handling, and removed-member denial           |
| Push and links            | Registration/rotation/revocation, preferences, privacy, failure/retry, cold/warm launch, malformed and unauthorized destinations                                     |
| Integration and E2E       | New account/invite/member/message/read/reconnect/moderation journeys across real local/test services and physical devices                                            |
| Accessibility             | Automated checks plus manual VoiceOver/TalkBack, dynamic type/font scaling, contrast, reduced motion, focus order, touch targets, switch/keyboard flows              |
| Security                  | Threat-model abuse cases, dependency/secret scans, static analysis, permission/RLS fuzzing, rate-limit bypass, log redaction, artifact review                        |
| Performance and load      | Timeline/database size, pagination, local query latency, send/reconnect latency, burst communities, attachment load, memory/battery/network use, soak tests          |
| Upgrade and migration     | Database forward migration, supported client compatibility, local database upgrade, interrupted upgrade, rollback/forward-fix, old-client rejection when unavoidable |
| Release smoke             | Install/upgrade, signing, configuration, Auth, send/receive, reconnect, push/link, logout/revocation, crash/telemetry, store-channel metadata                        |

Repository-wide gates remain `pnpm check:architecture`,
`pnpm check:source-health`, `pnpm check:dead-code`, `pnpm check:docs`, lint,
strict type checking, tests, build, and database migration checks when relevant.
Future mobile and desktop work adds ecosystem-specific formatting, static
analysis, unit/integration tests, dependency audits, build/signing validation,
accessibility checks, and physical-device smoke gates. No coverage percentage
may be claimed until measured; risk-based branch/transition coverage matters
more than a single aggregate number.

## Outcome-based delivery sequence

No implementation is authorized by this page. Each phase begins only after the
previous exit gate and any named product approvals. Scope may be reduced when
evidence supports it; later capabilities are not scaffolded early.

### 1. Product validation and architecture approval

- **Outcome and user value:** confirm that a private, invitation-led mobile
  community solves a real operator/member problem worth adopting.
- **In scope:** interviews or direct evidence, operating assumptions, key
  journeys, capability boundaries, retention/age/legal questions, architecture
  and technology recommendation review.
- **Out of scope:** code, schemas, providers, accounts, distribution, and
  production commitments.
- **Dependencies:** operator and representative intended users.
- **Security/data/client effects:** approve data sensitivity, trust model,
  initial platform, and unacceptable risks before collecting data.
- **Tests/evidence:** documented problem evidence and journey prototype
  feedback, not fabricated metrics.
- **Documentation:** update these central current-state pages with accepted
  decisions only.
- **Acceptance and exit gate:** operator approves wedge, first platform,
  invitation model, validation envelope, and proof scope.
- **Primary risk:** building a general chat feature set without a specific
  adoption reason.

### 2. Current-schema harness and technology proof

- **Outcome and user value:** demonstrate on physical devices that the chosen
  mobile stack can securely authenticate, persist locally, reconnect, and
  deliver an accessible native experience before product architecture depends
  on it.
- **In scope:** disposable proof branch; current-schema local database/RLS test
  harness; Android then iOS device builds; PKCE callback; secure token storage;
  SQLite migration; synthetic outbox/reconnect; push/deep-link feasibility;
  performance/accessibility measurements.
- **Out of scope:** reusable product framework, permanent message schema,
  production provider setup, public beta, desktop, full visual system.
- **Dependencies:** approved proof criteria, developer accounts/devices where
  required, safe local/test Supabase target.
- **Security/data/client effects:** use synthetic data and public client keys;
  prove no privileged key is embedded; audit current Supabase grants/key
  posture without modifying production.
- **Tests/evidence:** the rejection criteria in the platform page, RLS harness
  repeatability, artifact secret scan, device accessibility/performance notes.
- **Documentation:** record only the selected current architecture after the
  decision; discard proof code that does not meet production quality.
- **Acceptance and exit gate:** pass criteria on target physical devices and a
  dependable current-schema authorization harness.
- **Primary risk:** treating a simulator-only happy path as proof of native,
  background, or secure-storage behavior.

### 3. Product/client foundation and Auth/profile slice

- **Outcome and user value:** an approved account can securely enter Shaamil,
  see and edit the minimum product profile, inspect/revoke its device/session,
  and leave safely.
- **In scope:** production-shaped client boundary, navigation shell, Auth/PKCE,
  secure storage, local database versioning, product profile, IAM product
  access, logout/revocation, loading/error/offline states, observability.
- **Out of scope:** community messaging, files, push, contacts, broad settings,
  desktop.
- **Dependencies:** approved technology proof, identity/profile field policy,
  account recovery/MFA handoff decisions, reviewed forward migrations.
- **Security/data/client effects:** separate Auth identity, IAM access, Shaamil
  profile, device registration, and local cache; RLS and negative tests are
  mandatory.
- **Tests/evidence:** Auth lifecycle, callbacks, secure storage, device/session,
  profile RLS, revocation, local migration, accessibility, release-like build.
- **Documentation:** update shared Auth/data pages and Shaamil pages only for
  behavior that now exists.
- **Acceptance and exit gate:** unauthorized accounts cannot enter; approved
  account flow passes on a physical Android device and iPhone.
- **Primary risk:** copying web SSR Auth or conflating profile with authority.

### 4. First reliable messaging vertical slice

- **Outcome and user value:** an invited member can open one private community
  and channel, send text, receive ordered messages, reconnect without gaps or
  duplicates, and read history.
- **In scope:** invitation, owner/member roles, one initial channel, text
  messages, pagination, client command IDs, durable ordering, outbox,
  reconciliation cursor, bounded cache, explicit connection/pending/failed
  states, basic read cursor, RLS, audit for privileged changes.
- **Out of scope:** DMs, attachments, reactions, replies, search, push, typing,
  presence, arbitrary roles, public discovery, desktop.
- **Dependencies:** Auth/profile slice, approved membership and retention
  semantics, reviewed schema/RLS, Realtime proof.
- **Security/data/client effects:** community isolation across Data API,
  trusted commands, Realtime, and cache purge; ordering/idempotency invariants
  become durable contracts.
- **Tests/evidence:** concurrent sends, lost response, duplicate/reordered
  events, reconnect/cursor gap, wrong-community access, member removal,
  multi-device read/send, load envelope, accessibility.
- **Documentation:** update actual schema catalog/snapshots and current runtime
  flow after approved implementation.
- **Acceptance and exit gate:** no duplicate durable message from retries, no
  cross-community access, deterministic recovery from tested disconnects.
- **Primary risk:** a UI that appears realtime while losing or duplicating
  durable state.

### 5. Community and communication MVP

- **Outcome and user value:** an owner can operate a useful small private
  community with channels and limited moderation.
- **In scope:** multiple channels, read-only/private rules if validated,
  owner/moderator/member fixed roles, member management, removal/ban, invite
  lifecycle, editing/deletion policy, replies/reactions/mentions only when
  validated, notifications inbox/preferences without OS push if necessary.
- **Out of scope:** arbitrary custom roles, DMs unless the wedge changes,
  public discovery, bots, files/push if not yet proven, desktop.
- **Dependencies:** reliable messaging slice and approved moderation/community
  rules.
- **Security/data/client effects:** permission inheritance, ownership transfer,
  audit, report/moderation states, revoked-access cleanup.
- **Tests/evidence:** capability matrix, private/read-only channels, role
  changes, transfer/removal/ban races, abuse/rate-limit tests, key journeys.
- **Documentation:** current product, schema, security, and operations pages.
- **Acceptance and exit gate:** operator can run the intended community without
  manual database intervention; safety-critical actions are auditable.
- **Primary risk:** permission complexity outrunning the fixed-role product
  need.

### 6. Files, push, and bounded offline hardening

- **Outcome and user value:** members can share approved files, receive private
  device notifications, and continue predictably through temporary network
  loss.
- **In scope:** strict attachment policy, private upload/finalization/cleanup,
  progress/cancel/retry, APNs/FCM provider boundary, preferences/token
  lifecycle, durable links, cache bounds/protection, outbox/conflict/revocation
  hardening.
- **Out of scope:** unlimited offline history, offline membership/moderation,
  background execution guarantees the OS cannot provide, media processing
  without a validated need.
- **Dependencies:** stable message contract, provider/privacy approvals,
  signing/build access, retention and MIME/size policy.
- **Security/data/client effects:** Storage RLS/signed access, trusted
  finalization, privacy-safe payloads, invalid-token and orphan cleanup.
- **Tests/evidence:** malicious/oversized files, expired URLs, revoked members,
  interrupted uploads, notification privacy, device rotation, extended offline
  and multi-device reconciliation, resource usage.
- **Documentation:** provider ownership, environment variables, runbooks, and
  accepted limits only after configuration exists.
- **Acceptance and exit gate:** no public attachment path, no sensitive push
  payload, deterministic tested recovery inside approved offline bounds.
- **Primary risk:** files and push multiply authorization, privacy, provider,
  and operational failure modes.

### 7. Security and reliability hardening

- **Outcome and user value:** the system is safe and operable enough for invited
  users beyond the development team.
- **In scope:** threat-model closure, rate limits, dependency/artifact review,
  telemetry and alerts, backup/restore and incident drills, retention/deletion/
  export implementation, load/soak testing, privacy/safety operations.
- **Out of scope:** growth features, desktop, public availability, unapproved
  analytics.
- **Dependencies:** stable MVP behavior and approved legal/retention/SLO/budget
  decisions.
- **Security/data/client effects:** exercise all trust boundaries and failure
  paths; close release-blocking findings.
- **Tests/evidence:** full security matrix, restore/reconciliation drill,
  provider outage simulations, load envelope, log-redaction review,
  accessibility audit.
- **Documentation:** current runbooks, provider/config/ownership pages, user
  policy content, release checklist.
- **Acceptance and exit gate:** no open critical/high authorization or privacy
  issue; alerts and human response paths work; approved reliability envelope is
  met.
- **Primary risk:** observability or operational ownership arriving after real
  users and data.

### 8. Internal alpha

- **Outcome and user value:** Jayant and a very small invited cohort use the
  complete MVP in real workflows while impact remains contained.
- **In scope:** signed internal builds, support intake, controlled accounts and
  communities, usage/reliability/cost observation, rapid compatible fixes.
- **Out of scope:** public store listing, broad invitation, growth campaigns,
  desktop parity.
- **Dependencies:** hardening exit gate, internal distribution, support and
  incident ownership.
- **Security/data/client effects:** real data begins; privacy terms, deletion,
  moderation, backups, access reviews, and telemetry controls must operate.
- **Tests/evidence:** release smoke per build, cohort journey review, incident
  drill, crash/sync/push/cost trends, qualitative adoption evidence.
- **Documentation:** only durable operating behavior and runbooks; no progress
  ledger.
- **Acceptance and exit gate:** sustained successful real usage inside approved
  limits with no unresolved release-blocking issue.
- **Primary risk:** interpreting friendly internal use as external product
  validation.

### 9. External beta

- **Outcome and user value:** a deliberately bounded set of target communities
  can adopt Shaamil with clear expectations and support.
- **In scope:** beta distribution, controlled invitations, compatibility
  policy, support/moderation coverage, measured reliability/cost/adoption,
  staged rollout and rollback.
- **Out of scope:** general public discovery, desktop promise, speculative V1.x
  features, production scale claims beyond evidence.
- **Dependencies:** approved terms/privacy/age/retention, support capacity,
  store requirements, SLO/budget, alpha evidence.
- **Security/data/client effects:** production-like access reviews, incident
  response, user export/deletion, abuse handling, backup/recovery.
- **Tests/evidence:** release certification, staged cohort monitoring, abuse
  exercises, compatibility/upgrade tests, target load and cost forecast.
- **Documentation:** current support, release, privacy, and operations guidance.
- **Acceptance and exit gate:** beta success criteria and reliability/cost/
  safety targets are met for an agreed observation period.
- **Primary risk:** expanding invitations faster than moderation and support.

### 10. Production readiness and staged release

- **Outcome and user value:** the accepted product is supportable, recoverable,
  secure, and distributable under an explicit service commitment.
- **In scope:** final threat/risk acceptance, store/release metadata, signing and
  ownership audit, staged rollout, rollback/forward-fix plans, on-call/contact
  paths, capacity and cost approval.
- **Out of scope:** automatic desktop delivery, public discovery, rejected
  business models, or unvalidated future capabilities.
- **Dependencies:** beta exit gate and explicit operator approval.
- **Security/data/client effects:** production access, secret rotation,
  recovery, retention, deletion/export, and incident controls are verified.
- **Tests/evidence:** production-candidate smoke, restore and rollback drills,
  dependency/artifact attestation, final accessibility/security/performance
  review.
- **Documentation:** current user-facing policy, operating/runbook, release,
  schema, client, and ownership pages match reality.
- **Acceptance and exit gate:** operator signs off named risks, service targets,
  budget, support, policy, and staged production rollout.
- **Primary risk:** treating store approval or a successful build as production
  readiness.

## Exact first future implementation milestone

If phases 1 and 2 are approved, the first product implementation milestone is
**one authenticated invited member reading and sending text in one private
community channel on Android, with the same React Native/Expo client proven on
iOS, durable ordering, idempotent retry, bounded local persistence,
reconnect reconciliation, member-removal enforcement, and accessible core
states**.

It intentionally excludes DMs, arbitrary roles, attachments, OS push, search,
reactions, replies, typing, presence, desktop, and public distribution. The
milestone is not complete until direct/RLS/Realtime access tests, offline and
duplicate/reorder tests, physical-device accessibility checks, and
privacy-safe operational signals pass.

This milestone is a recommendation awaiting approval. The current request
authorizes documentation only.

## Major risks and failure modes

| Risk                                           | Consequence                                   | Current response                                                                     | Confidence  |
| ---------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ | ----------- |
| Wedge is too broad or weak                     | High feature cost with little adoption        | Validate a private community/channel wedge before implementation                     | Medium      |
| Current schema cannot be reproduced reliably   | RLS/migration work is unsafe and slow         | Make current-schema local test harness an exit gate before product schema            | High        |
| Authorization semantics diverge by surface     | Tenant leakage or privilege escalation        | One capability vocabulary and cross-surface negative tests                           | High        |
| Realtime is treated as truth                   | Gaps, duplicates, stale access                | PostgreSQL truth, cursor reconciliation, idempotent commands                         | High        |
| Shared message abstraction is premature        | Complex schema and slower wedge               | Model community messages first; generalize only after a second container is accepted | High        |
| React Native/Expo native dependency fails      | Rework after architecture commitment          | Physical-device proof with rejection criteria                                        | Medium-high |
| Desktop is promised too early                  | Four release ecosystems overwhelm maintenance | Mobile first; separate Windows/macOS decisions after mobile evidence                 | High        |
| Existing Supabase project couples blast radius | Shaamil changes affect current products       | Owned schema, explicit grants, reviewed forward migrations, shared IAM contract      | High        |
| Retention/privacy policy remains implicit      | User harm and legal/operational ambiguity     | Require approval before real-user beta                                               | High        |
| Files/push expand attack surface               | Leakage, abuse, provider failures, cost       | Add only after reliable text messaging and dedicated threat tests                    | High        |
| Moderation burden is underestimated            | Harm, operator overload, stalled growth       | Invitation limits, fixed roles, clear tools, capacity gate                           | Medium      |
| Cost/availability claims precede evidence      | Uncontrolled spend or unmet expectations      | Measurement envelope and approved targets before beta                                | High        |
| Mixed-language clients drift                   | Contract incompatibility and duplicated logic | Language-neutral versioned contracts and conformance fixtures                        | Medium-high |
| Telemetry captures content                     | Privacy breach through logs/providers         | Structured allowlist, redaction tests, narrow retention/access                       | High        |

## Open approvals and blockers

The documentation set is complete enough to support a decision, but these
questions are deliberately not decided silently:

1. Confirm the private community/channel wedge and first target cohort.
2. Confirm Android-first React Native/Expo proof, followed by iOS in the same
   proof; approve the stated rejection criteria.
3. Approve the initial validation envelope: communities, members/community,
   peak concurrent devices, daily messages, media volume, regions, budget, and
   availability expectation.
4. Approve invitation behavior, handle/profile visibility, and whether any
   content is discoverable without membership.
5. Approve retention, deletion, edit history, export, legal hold, and backup
   disclosure rules.
6. Approve minimum age, jurisdiction, privacy/terms/community rules, and
   moderation/appeal obligations.
7. Choose native Auth behavior for provider login, MFA/recovery, and the narrow
   cases that may hand off to the existing Auth web product.
8. Approve fixed MVP roles and exact channel privacy/read-only semantics.
9. Decide whether replies, reactions, mentions, read state, and notifications
   are required for MVP after vertical-slice evidence; DMs remain later unless
   the wedge changes.
10. Approve attachment MIME/size/retention policy and push privacy defaults
    before those capabilities begin.
11. Select crash, logging, analytics, notification, and support providers only
    after their data, cost, security, and operational review.
12. Approve measurable beta/production reliability targets, incident ownership,
    support capacity, and operating budget.

Items 1 and 2 block a technology proof. Data-policy items block real-user beta,
not a synthetic local proof. Desktop technology, arbitrary custom roles, DMs,
public discovery, and future business features do not block the first vertical
slice.
