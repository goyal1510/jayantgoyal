# Shaamil

Shaamil is the approved name for an independent communication and community
product owned in this monorepo. Its technical slug is `shaamil`. The name is a
public product identity; `jayantgoyal` remains the repository, domain, and
package namespace rather than an umbrella product brand.

Shaamil is currently a defined product and architecture boundary, not an
implemented runtime. There is no Shaamil client, package, database schema,
Storage bucket, Edge Function, environment contract, provider configuration,
distribution record, or production host. The documents in this directory
define the decision framework for future approval; they do not claim that any
planned capability exists.

## How to read this documentation

Statements use four decision states:

- **Verified** describes current repository or deployed-system fact backed by
  code, manifests, schema snapshots, migrations, or environment examples.
- **Approved** describes a product or architecture decision explicitly
  accepted by Jayant.
- **Recommended** is the current architectural default but still requires the
  implementation milestone that uses it to be approved.
- **Open** identifies a product, policy, operational, legal, or distribution
  decision that must not be silently institutionalized.

The Shaamil documentation is centralized here:

- This page defines product intent, users, positioning, journeys, scope,
  experience principles, capability roadmap, assumptions, and open decisions.
- [Platform and client architecture](platform-and-client-architecture.md)
  evaluates mobile and desktop technologies, rollout, native architecture,
  repository placement, proof requirements, environments, and releases.
- [Domain, data, and messaging architecture](domain-data-and-messaging.md)
  defines identity, aggregates, authorization, draft schema ownership,
  messaging, Realtime, offline synchronization, files, notifications, and
  deletion boundaries.
- [Security, reliability, testing, and delivery](security-reliability-and-delivery.md)
  defines the threat model, privacy and safety posture, observability, cost and
  scale assumptions, test strategy, and outcome-based approval gates.

Shared current behavior remains authoritative in [Authentication
ownership](../../shared-systems/authentication/README.md), [Data and
Supabase](../../shared-systems/data/README.md), [Database schema
ownership](../../shared-systems/data/schema-ownership.md), and [Security
boundaries](../../operations/security/README.md).

## Executive recommendation

The recommended first adoption wedge is one invite-only, operator-created
private community with one reliable text channel. It serves invited members
who want a focused place to communicate with a Jayant-operated community
without depending on a third-party community platform.

The product should prove trusted membership, deterministic text messaging,
revocation, bounded offline recovery, and minimum reporting before expanding
into direct messages, group conversations, multiple channels, attachments,
search, broad notifications, presence, or desktop clients. This deliberately
rejects the earlier assumption that every familiar communication capability
belongs in one MVP.

Mobile should be validated first. React Native with Expo development builds is
the recommended iOS/Android candidate, conditional on physical-device proof.
Windows and macOS should remain independent later clients, with WinUI 3 and
SwiftUI as the current native-first recommendations. No web client is planned.

Shaamil should use the existing Supabase project and Auth identity boundary.
IAM should grant product entry; Shaamil should own communities, memberships,
roles, communication, safety, privacy, sync, and notification state in an
eventual `shaamil` schema. PostgreSQL is the durable authority. Private
Realtime delivery accelerates updates but never replaces cursor-based durable
reconciliation.

**Confidence:** high for the product/data ownership boundaries; medium-high
for the narrow private-community wedge; medium for the client technology until
the physical-device proof; low for unapproved retention, availability, budget,
age-policy, and distribution assumptions.

## Verified repository baseline

The following facts are current and verified:

- The canonical project is `jayantgoyal` (`orwfvyditlguqvxvztkw`).
- Supabase Auth is the shared authentication authority.
- Application schemas are private `foundation`, cross-product `iam`, private
  `iam_private`, and product-owned `studio` and `portfolio`.
- IAM owns canonical profiles, product memberships, workforce memberships,
  roles, capabilities, policy acceptances, and access audit events.
- Capabilities use `product.resource.action`; role names are not embedded in
  capability keys.
- Products apply resource-specific attributes after IAM grants baseline
  product access.
- Current clients are web clients for Portfolio, Studio, Admin, and Auth.
- The workspace pattern `apps/*/*` can accommodate a future client without
  changing the workspace root convention.
- Shaamil has no current runtime artifact or deployed data object.
- Historical removed Messenger objects are not part of the current schema and
  must not be revived.

One repository limitation must be resolved before serious Shaamil database
work: the full historical local migration reset is not yet a dependable test
path. A current-schema disposable database/RLS harness is therefore an exit
condition before the first messaging schema is approved. Applied migrations
must not be rewritten to manufacture a clean history.

## Product boundary

Shaamil is an independent communication and community product. It is not:

- a Portfolio demonstration;
- a Studio utility;
- a generic chat application;
- a public social network;
- a Discord, Slack, WhatsApp, or Telegram clone;
- an umbrella identity for other products;
- an internal platform or shared messaging infrastructure project.

Its purpose is to reduce unnecessary dependency on third-party communication
platforms for communities owned and operated by Jayant while preserving a
clear reason for an invited member to join: direct, focused access to a private
community with less noise and clearer ownership than a broad external server.

Jayant is the initial operator. Invited community members are the primary
users. Moderators, if introduced, receive explicit Shaamil authorization;
neither an ecosystem account nor an Admin role automatically grants access to
private communication content.

## Positioning and adoption reason

The recommended positioning is **focused private communication for
Jayant-operated communities**. The adoption promise is not a larger feature
list. It is:

- the community is owned and governed by the operator members know;
- access is intentional rather than public-by-default;
- communication is organized around a small number of durable spaces;
- member safety, data access, and deletion rules are explicit;
- the native experience remains fast and understandable under intermittent
  connectivity.

The initial wedge should be community/channel interaction rather than direct
messages. A direct-message-first product has weak differentiation and creates
relationship discovery, contact abuse, spam, blocking, notification, and
privacy obligations before the operator-owned community value is proven.
Private groups are a credible alternative but provide less durable
organization and weaker moderation boundaries than one explicit community and
channel.

This wedge remains **recommended**, not approved. Implementing it is blocked
until Jayant approves the invitation model, initial community purpose, and
membership policy.

## Primary users and trust model

| Actor                            | Need                                                                                             | Trust and authority                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Jayant as operator               | Create and govern an owned community, invite members, respond to reports, and recover operations | Trusted control-plane operator; privileged actions require strong authentication and audit         |
| Community owner                  | Maintain community settings and membership                                                       | Highest community authority; ownership transfer is explicit, atomic, and audited                   |
| Moderator                        | Handle member safety without infrastructure access                                               | Limited product-local authority; cannot change IAM, secrets, billing, or owner status              |
| Member                           | Read and participate in spaces they belong to                                                    | Untrusted client; every resource action is constrained by current membership and RLS/server checks |
| Blocked, removed, or banned user | No continuing access to revoked spaces                                                           | Revocation wins over stale sessions, cached events, queued work, or optimistic UI                  |
| Support/operations actor         | Diagnose delivery or account problems                                                            | Minimum necessary metadata access; private content access is exceptional and audited               |

All native clients, networks, deep links, cached data, Realtime payloads, and
caller-supplied identifiers are untrusted. Client authorization shapes UX only.
The database or a trusted operation makes the security decision.

## Recommended operating assumptions

These values are planning inputs, not commitments or service-level promises.
They must be replaced by approved targets before production readiness.

| Dimension         | Reliability proof              | Recommended MVP planning value                                                                                                    | Approval status                  |
| ----------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Operators         | Jayant                         | Jayant plus a very small moderator set                                                                                            | Recommended                      |
| Communities       | One                            | Up to 20 operator-approved communities                                                                                            | Open                             |
| Members           | 2-20 proof users               | Up to 1,000 total accounts; normally no more than 500 in one community                                                            | Open                             |
| Message rate      | Human test traffic             | Design and load-test for 50,000 durable messages/day without claiming that demand                                                 | Open                             |
| Availability      | Best-effort development proof  | Monitored service without a contractual SLA; consider 99.9% only for V1 production readiness                                      | Open                             |
| Operating budget  | No production commitment       | Establish alerts before monthly backend/provider spend exceeds an approved ceiling; suggested starting review point USD 100/month | Open                             |
| Message retention | Disposable proof data          | No default is approved; options are member-controlled indefinite retention, a fixed operator period, or community policy          | Open and implementation-blocking |
| Deleted content   | Verify deletion and revocation | Short recovery window only if explicitly disclosed; moderation evidence separated and access-restricted                           | Open                             |
| Legal age         | Adults during closed proof     | Minimum age, parental-consent posture, and jurisdictional terms require legal/product approval                                    | Open and production-blocking     |

The architecture should be cost-aware but must not pre-provision for these
ceilings. Indexes, pagination, cursor models, load tests, and cost telemetry
should support measured growth; speculative sharding, multi-region writes, or a
separate event platform are not justified.

## Key journeys

### Invitation and first entry

1. A trusted operator creates a single-use, expiring invitation scoped to a
   community or named identity.
2. The recipient opens a validated native link.
3. The native client authenticates with the existing Supabase Auth identity or
   creates an allowed identity through the approved flow.
4. A trusted redemption command validates token state, target, expiry, current
   bans, and product entitlement in one transaction.
5. The user sees the community landing state, membership expectations, and
   first channel.

The system must not reveal whether an unrelated account exists, place access
or refresh tokens in URLs, or trust an invitation identifier without the
secret proof.

### Read and send a message

1. The timeline opens from an encrypted bounded local cache.
2. The client reconciles after its durable channel cursor.
3. A send command receives a client-generated idempotency key and enters a
   pending state locally.
4. The server verifies current membership, rate limits, body constraints, and
   channel state, then assigns durable order atomically.
5. The client reconciles the authoritative message and consumes private
   Realtime delivery as an acceleration signal.
6. Retry never creates a duplicate visible message.

### Reconnect after being offline

The client resumes from its last durable cursor, handles duplicate or reordered
delivery, reconciles pending commands, and updates unread/read state. Full
history download and unrestricted offline mutation are not required.

### Remove a member

An authorized owner or moderator removes or bans a lower-authority member. The
server records the action, invalidates access, and causes clients to purge the
affected cached content. A queued message cannot override revocation.

### Report content

A member reports a specific message with a bounded reason. The reporter sees a
receipt without learning internal moderation notes. Authorized reviewers see
only the evidence necessary to decide and every action is audited.

## Experience and information architecture

The mobile-first navigation recommendation is:

```text
App entry
├── Authentication / invitation recovery
├── Home
│   ├── Communities
│   └── Unread activity
├── Community
│   ├── Channel list
│   ├── Member list
│   └── Community settings (authorized roles only)
├── Channel timeline
│   ├── Message list
│   ├── Composer
│   └── Context actions / report
└── Account and app settings
    ├── Profile and privacy
    ├── Notification preferences
    ├── Devices and sessions
    ├── Data export / deletion
    └── Help and safety
```

The first reliability proof contains only the routes needed for authentication,
one community, one channel, settings/logout, member removal, and reporting.
Empty tabs for future capabilities are prohibited.

Loading, empty, error, offline, access-revoked, session-expired, send-pending,
send-failed, and retry states are first-class designs. The timeline must keep
the user's reading position when new messages arrive, disclose when cached
content may be stale, and never make a failed send appear durable.

Desktop information architecture is deferred. If approved later, it should use
a resizable multi-column layout, platform menus, multiple windows only where
they add value, keyboard navigation, context menus, drag/drop where safe, and
native notification/settings conventions rather than scaling up a phone view.

## Accessibility and inclusive design

Accessibility is a release property rather than a later remediation:

- support VoiceOver and TalkBack labels, roles, states, headings, traversal,
  focus restoration, and live-region announcements;
- respect dynamic text size without truncating identity, message, error, or
  moderation content;
- maintain contrast in normal, dark, high-contrast, selected, pending, failed,
  and disabled states;
- respect reduced motion and never communicate delivery state only through
  animation or color;
- provide keyboard and pointer parity before any desktop release;
- keep tap targets and message actions usable without precision gestures;
- test bidirectional text, long unbroken strings, emoji, Unicode normalization,
  and assistive input;
- offer notification privacy controls and avoid exposing message bodies on a
  locked device by default.

The onboarding/invitation flow, timeline/composer behavior, offline and retry
states, member removal, reporting, and desktop multi-column navigation require
interactive prototypes before their corresponding implementation begins.

## Initial client direction

Shaamil is mobile-first and has no planned initial web client. The current
technology recommendation is React Native with Expo development builds for iOS
and Android, conditional on a physical-device reliability proof and explicit
implementation approval. Android-first iteration is recommended, with physical
iOS parity required before the proof exits; reverse the order if available
hardware dictates.

Windows and macOS remain later independent clients. Their current direction is
WinUI 3 and SwiftUI respectively, but neither path exists until mobile product
value, operating reliability, and desktop-specific demand are demonstrated.
The evidence, scoring, alternatives, risks, and proof requirements live in
[Platform and client architecture](platform-and-client-architecture.md).

Shaamil native clients must not import `@jayantgoyal/web-auth`,
`@jayantgoyal/web-ui`, or another application's source. Native authentication,
local persistence, navigation, accessibility, background behavior, packaging,
and distribution remain client-owned. Product contracts move to
`apps/shaamil/contracts` only after a second real consumer needs a stable
language-neutral boundary.

## Data and IAM boundary

Shaamil will use the existing canonical Supabase project and existing
`auth.users` identity boundary. A second hosted Supabase project is not
approved, and Shaamil will not duplicate ecosystem accounts.

Supabase Auth owns credentials, identities, factors, and sessions. IAM owns the
canonical profile, Shaamil product entitlement, workforce membership, and
cross-product capability assignments. Shaamil owns communities, community
membership and roles, communication, safety, privacy, product settings,
device-notification state, and resource-specific authorization.

Shaamil does not duplicate the canonical user profile by default. It references
the same Auth/IAM subject and adds a product persona only if an approved handle,
display-name override, avatar override, biography, or privacy requirement must
differ from the canonical profile.

Product entry and community access are separate. An active IAM Shaamil
membership permits entry to the product; Shaamil RLS or a trusted operation
still requires current membership in the requested community or channel.

When backend implementation is approved, Shaamil receives a product-owned
`shaamil` schema rather than adding communication tables to `studio` or
reviving historical Messenger migrations. Only intentional client-facing
objects receive explicit Data API grants, and every exposed table uses RLS.
Ordering-sensitive, privileged, transactional, abuse-sensitive, invitation,
moderation, push, and attachment-finalization operations use a trusted product
boundary.

Detailed aggregate, schema, RLS, Realtime, sync, file, and notification design
is documented in [Domain, data, and messaging
architecture](domain-data-and-messaging.md).

## Capability roadmap

| Stage                         | Included                                                                                                                                                                                                                                                                                             | Explicitly excluded at that stage                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Technology proof              | Physical iOS/Android development builds; native Auth session; validated callback; secure token storage; encrypted local database; IAM product-entry check; logout and revocation purge                                                                                                               | Shaamil communication schema, production distribution, broad UI shell, push, files                                                      |
| First reliable vertical slice | One private operator-created community; one channel; owner/member; single-use invitation; ordered idempotent text messages; bounded cache/outbox; durable cursor reconciliation; read cursor; removal; minimum report                                                                                | DMs, group conversations, multiple channels, roles UI, replies, reactions, mentions, edits, search, attachments, push, presence, typing |
| MVP                           | Multiple approved communities and channels; moderator role; channel administration; message edit/delete policy; replies; mentions; reactions; blocking/report workflow; unread counts; bounded search if operationally affordable; push and deep links; small attachments after file threat controls | Public discovery, self-service public community creation, bots, APIs, voice/video, desktop parity                                       |
| V1                            | Mature invitation lifecycle; private/read-only channels; pins; notification preferences; account export/deletion; device/session management; moderation evidence and appeals; reliable multi-device reconciliation; production mobile release                                                        | Marketplace, billing, ads, broad integrations, calls                                                                                    |
| V1.x                          | Direct and group conversations if the community product proves demand; custom community roles and permission overrides; richer search; macOS client proof; Windows client proof                                                                                                                      | Automatic cross-platform parity or shared desktop shell                                                                                 |
| Future                        | Optional desktop releases, richer media, community discovery only after safety approval, carefully scoped integrations                                                                                                                                                                               | Anything without an owner, threat model, operating plan, and measured demand                                                            |
| Rejected                      | Placeholder schemas/packages, web wrapper presented as native, generic public chat, blanket offline mutation, public webhooks/API, ads/sales/billing, calls/conferencing/screen sharing                                                                                                              | Reconsider only through an explicit product decision                                                                                    |

Relationships/contacts are not required for the community-first MVP. Blocking
is required before unsolicited member-to-member communication or direct
messages. Profiles, MFA capability, session management, recovery, deletion,
and export are ecosystem-account concerns integrated through Auth/IAM rather
than independently reimplemented by Shaamil.

## First implementation boundary

No implementation is currently approved. If implementation is later approved,
the first outcome should be a **native access and storage proof**, not a broad
scaffold:

- physical Android and iOS development builds;
- native authentication against the existing Supabase Auth project;
- safe callback/deep-link validation;
- client publishable key only, never a secret or service-role credential;
- secure session storage and encrypted SQLite lifecycle;
- IAM Shaamil product membership check;
- authorized, unauthorized, offline, expired-session, revoked, and logout
  states;
- cache purge and log-redaction verification.

That proof must pass before creating the `shaamil` communication schema. The
next separately approved outcome would be the two-person private-room
reliability slice described in the roadmap. This sequence validates the riskiest
native and identity assumptions without creating empty future abstractions.

## Explicit non-goals

- Voice/video calls, conferencing, phone calling, and screen sharing.
- Bots, plugins, public developer APIs, marketplaces, and webhooks.
- Public discovery and anonymous participation.
- Ads, sales, checkout, purchases, subscriptions, and billing.
- Self-service public community creation in the initial product.
- A web client or browser-rendered desktop application.
- Full offline mutation support.
- End-to-end encryption claims without a separately approved product,
  recovery, search, notification, abuse, and moderation decision.
- Empty future client directories, provider packages, schemas, tables, or
  adapters.
- One framework forced across mobile, Windows, and macOS for code-reuse optics.

## Naming and repository contract

Use these values only when their corresponding implementation exists:

| Responsibility               | Value                                                         | Status                                              |
| ---------------------------- | ------------------------------------------------------------- | --------------------------------------------------- |
| Product name                 | Shaamil                                                       | Approved                                            |
| Product slug                 | `shaamil`                                                     | Approved                                            |
| Future mobile path           | `apps/shaamil/mobile`                                         | Recommended; create only with implementation        |
| Future mobile workspace      | `@jayantgoyal/shaamil-mobile`                                 | Recommended; create only with implementation        |
| Future product contracts     | `@jayantgoyal/shaamil-contracts`                              | Conditional on a second real consumer               |
| Future database schema       | `shaamil`                                                     | Recommended; create only with backend milestone     |
| Candidate development app ID | `com.jayantgoyal.shaamil.dev`                                 | Open; development only                              |
| Candidate production app ID  | `com.jayantgoyal.shaamil`                                     | Open; requires distribution and trademark clearance |
| Candidate native scheme      | `shaamil` with environment-qualified development alternatives | Open; must be collision-tested                      |
| Candidate product host       | `shaamil.jayantgoyal.com`                                     | Open; optional future links, not a web client       |

The candidate identifiers and host require distribution, link, domain,
provider, and trademark clearance before configuration. Their documentation
does not reserve them or claim that they exist.

## Extension rules

- Keep Shaamil business rules and contracts with Shaamil.
- Do not generalize messaging, Realtime, permissions, storage, notifications,
  moderation, search, or sync into cross-product packages without genuine
  stable reuse.
- Keep native code out of `packages/web` and do not import another client's
  source.
- Treat PostgreSQL as durable authority and Realtime as delivery; reconcile by
  durable cursor after gaps or reconnects.
- Keep offline behavior bounded. Revoked access wins over queued client work.
- Never expose a secret, service-role, signing, or provider credential to a
  native client.
- Keep role bundles separate from permission keys; do not scatter permission
  strings through presentation components.
- Add a contracts workspace only after two real consumers require the same
  stable interface.
- Preserve forward migration seams without adding placeholder objects.
- Update this central documentation and the smallest relevant shared page when
  behavior becomes current; do not add app-local READMEs, progress ledgers,
  phase archives, or architecture-history collections.

## Open decisions requiring approval

Implementation must not begin until the decisions relevant to its milestone are
approved:

1. Confirm the invite-only, operator-created community/channel wedge.
2. Define the first community's purpose and membership eligibility.
3. Choose native sign-in methods and whether a system-browser OAuth/PKCE flow is
   required in the technology proof.
4. Confirm development identifiers, callback schemes, and available physical
   Android/iOS devices.
5. Decide whether a Shaamil-specific handle or persona is necessary.
6. Approve message retention, deletion recovery window, export scope, and
   moderation-evidence retention.
7. Approve minimum age, jurisdiction, terms, privacy notice, and report/appeal
   policy before external beta.
8. Approve target community/member scale, availability objective, and monthly
   operating-cost ceiling.
9. Choose push/crash/analytics providers only after their data-processing and
   privacy contracts are reviewed.
10. Decide whether and when direct messages, public discovery, desktop clients,
    or end-to-end encryption enter product discovery; none is implied by the
    current architecture.

The absence of an answer keeps the affected capability blocked; it does not
authorize an implementation default.
