# Shaamil

Shaamil is the approved name for an independent communication and community
product owned in this monorepo. Its technical slug is `shaamil`. The name is
public product identity; `jayantgoyal` remains only the repository, domain, and
package namespace.

Shaamil is currently a defined product boundary, not an implemented runtime.
There is no Shaamil client, package, database schema, Storage bucket, Edge
Function, environment contract, distribution configuration, or production
host yet. Those artifacts are created only with an approved implementation
milestone.

## Product boundary

Shaamil will provide focused, private communication for communities owned and
operated by Jayant. It is not a Portfolio demonstration, a Studio utility, a
generic chat application, a public social network, or a clone of another
communication product.

The recommended initial adoption wedge is an invite-only, operator-created private
community. Its first reliable communication surface is one text channel with
authenticated membership, deterministic message ordering, bounded offline
recovery, access revocation, and a minimum reporting/moderation path.

Primary users are invited community members. Jayant is the initial operator;
moderator access is explicit product authorization rather than an automatic
consequence of an ecosystem account role.

## Initial client direction

Shaamil is mobile-first and has no planned initial web client. The current
technology recommendation is React Native with Expo development builds for iOS
and Android, conditional on a physical-device reliability proof and explicit
implementation approval. A platform client is added only when work on that
client begins.

Windows and macOS remain later independent clients. Their current direction is
WinUI 3 and SwiftUI respectively, but neither path exists until mobile product
value and operating reliability are demonstrated.

Shaamil native clients must not import `@jayantgoyal/web-auth` or
`@jayantgoyal/web-ui`. Native authentication, local persistence, navigation,
accessibility, background behavior, packaging, and distribution remain
client-owned. Product contracts move to `apps/shaamil/contracts` only after a
second real consumer needs a stable boundary.

## Data and IAM boundary

Shaamil will use the existing canonical Supabase project, `jayantgoyal`
(`orwfvyditlguqvxvztkw`), and its existing `auth.users` identity boundary. No
second hosted Supabase project is currently approved, and Shaamil will not
duplicate ecosystem accounts.

Supabase Auth owns credentials, identities, MFA factors, and sessions. The
approved `iam` domain owns the canonical profile, product entitlement,
workforce membership, and cross-product role/capability assignments. Shaamil
owns communities, community membership and roles, communication, safety,
privacy, product settings, and device-notification state.

Shaamil does not duplicate the canonical user profile by default. It references
the same `auth.users`/IAM user and adds a product persona only if an approved
handle, display name, avatar override, biography, or privacy requirement must
differ from the canonical profile. Product access and community membership are
separate: an IAM Shaamil entitlement permits product entry, while Shaamil RLS
still requires membership in the requested community or channel.

When backend implementation begins, Shaamil receives a product-owned
`shaamil` schema rather than adding communication tables to `studio` or
reviving historical Messenger migrations. The schema is exposed to the Data
API only for operations that are intentionally client-accessible, with
explicit grants and RLS. Ordering-sensitive, privileged, transactional,
abuse-sensitive, invite, moderation, push, and attachment-finalization
operations use a trusted product boundary.

The current and target Supabase ownership model is documented in [Database
schema ownership and evolution](../../shared-systems/data/schema-ownership.md).

## First implementation boundary

The recommended first implementation milestone is a two-person private-room
reliability proof:

- physical iOS and Android development builds;
- native authentication and invite redemption;
- one operator-created private community and one text channel;
- fixed owner/member authorization;
- idempotent ordered text messages;
- a bounded SQLite cache and text-only outbox;
- private Realtime delivery with cursor reconciliation;
- read state, member removal, cache purge, and a minimal report action;
- adversarial RLS, reconnection, accessibility, performance, and log-redaction
  verification.

The proof excludes production distribution, multiple channels, direct or group
messages, custom roles, reactions, mentions, search, attachments, push,
presence, typing, desktop clients, and placeholder future abstractions.

## Explicit non-goals

- Voice/video calls, conferencing, phone calling, and screen sharing.
- Bots, plugins, public developer APIs, marketplaces, and webhooks.
- Public discovery and anonymous participation.
- Ads, sales, checkout, purchases, subscriptions, and billing.
- Self-service community creation in the initial product.
- A web client or browser-rendered desktop application.
- Full offline mutation support.
- End-to-end encryption claims without a separately approved product and
  moderation decision.
- Empty future client directories, provider packages, schemas, tables, or
  adapters.

## Naming and repository contract

Use these values only when their corresponding implementation exists:

| Responsibility              | Value                            | Status                                   |
| --------------------------- | -------------------------------- | ---------------------------------------- |
| Product name                | Shaamil                          | Approved                                 |
| Product slug                | `shaamil`                        | Approved                                 |
| Future mobile path          | `apps/shaamil/mobile`            | Derived; create only with implementation |
| Future mobile workspace     | `@jayantgoyal/shaamil-mobile`    | Derived; create only with implementation |
| Future product contracts    | `@jayantgoyal/shaamil-contracts` | Conditional on a second real consumer    |
| Future database schema      | `shaamil`                        | Recommended target; not created          |
| Candidate production app ID | `com.jayantgoyal.shaamil`        | Requires distribution clearance          |
| Candidate product host      | `shaamil.jayantgoyal.com`        | Requires domain and link approval        |

The candidate app ID and host still require distribution, link, domain, and
trademark clearance before production configuration. Their documentation does
not claim that either currently exists.

## Extension rules

- Keep Shaamil business rules and contracts with Shaamil.
- Do not generalize messaging, Realtime, permissions, storage, notifications,
  moderation, search, or sync into cross-product packages without genuine
  stable reuse.
- Keep native code out of `packages/web` and do not import another client's
  source.
- Treat PostgreSQL as durable message authority and Realtime as delivery; a
  client reconciles by durable cursor after gaps or reconnects.
- Keep offline behavior bounded. Revoked access wins over queued client work.
- Never expose service-role or other privileged credentials to a native
  client.
- Add durable behavior to this page and the smallest relevant central
  architecture, client, data, security, testing, and operations pages when it
  becomes current.
