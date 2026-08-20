# Database schema catalog

This catalog describes the current canonical schema snapshots for the hosted
`jayantgoyal` Supabase project (`orwfvyditlguqvxvztkw`). Historical migrations
are not current APIs.

## Ownership summary

| Schema        | Tables | Owner             | Default access model                                      |
| ------------- | -----: | ----------------- | --------------------------------------------------------- |
| `foundation`  |      0 | Shared data layer | Private primitives                                        |
| `iam`         |     13 | Cross-product IAM | Intentional self/read RPCs; privileged service operations |
| `iam_private` |      0 | Cross-product IAM | Private RLS and trusted authorization helpers             |
| `studio`      |     14 | Studio            | Active membership, capabilities, and resource attributes  |
| `portfolio`   |     14 | Portfolio         | Selected public reads; capability-authorized Admin writes |

## Foundation

`foundation` contains no product data. Its three private helpers are
`uuid_v7`, `set_updated_at`, and `is_nonblank_text_array`. Product schemas may
depend on them; native or web clients do not query this schema.

## IAM

Supabase Auth owns credentials, identities, factors, refresh tokens, and
sessions. IAM owns ecosystem identity and authorization state.

| Table                            | Responsibility                                                      |
| -------------------------------- | ------------------------------------------------------------------- |
| `iam.profiles`                   | Canonical profile and lifecycle state for one `auth.users` identity |
| `iam.products`                   | Implemented product registry                                        |
| `iam.product_memberships`        | Product entry entitlement, validity, and revocation                 |
| `iam.workforces`                 | Operator-owned workforce boundary                                   |
| `iam.workforce_memberships`      | User affiliation and status in a workforce                          |
| `iam.roles`                      | Product- or workforce-scoped role definitions                       |
| `iam.capabilities`               | Exact `product.resource.action` operations                          |
| `iam.role_capabilities`          | Capabilities bundled by a role                                      |
| `iam.product_role_assignments`   | User role assignments within a product membership                   |
| `iam.workforce_role_assignments` | User role assignments within a workforce membership                 |
| `iam.policy_versions`            | Versioned product policy documents                                  |
| `iam.policy_acceptances`         | Acceptance of an exact policy version                               |
| `iam.access_audit_events`        | Append-only evidence for privileged access changes                  |

New Auth users receive an IAM profile and Auth membership only. Admin and
Studio access require explicit active memberships and assignments.
`admin.full_access` covers current product CRUD; workforce ownership transfer
is granted separately through `operations.owner`.

Caller-facing helpers are `has_product_access`, `has_capability`,
`list_my_capabilities`, and `count_my_sessions`. `set_admin_access` and
`revoke_admin_access` are service-role-only transactional commands that
re-authorize the actor and write an audit event.

`iam_private` contains the caller-bound and trusted predicates used by RLS, the
new-user provisioning trigger, and the active-game-participant check. It is not
part of the Data API schema list.

## Studio

### Activity Tracker and calculator

| Table                                       | Purpose                                     |
| ------------------------------------------- | ------------------------------------------- |
| `studio.activity_tracker_activities`        | User-defined activities and display order   |
| `studio.activity_tracker_entries`           | Dated completion and notes for an activity  |
| `studio.currency_calculations`              | One user-owned saved calculation            |
| `studio.currency_calculation_denominations` | Validated denomination details for a result |

Activity entries use a composite owner relationship so an entry cannot point
to another user's activity. Calculator quantities enforce non-negative value
invariants.

### Files

| Table                         | Purpose                                                    |
| ----------------------------- | ---------------------------------------------------------- |
| `studio.file_entries`         | User-owned file/folder paths, metadata, and deletion state |
| `studio.file_type_categories` | Shared MIME/type classification                            |

File bytes live in the private `studio-files` bucket under the user's ID
prefix. Directories have no Storage object. Client-callable helpers bind the
requested user to `auth.uid()`. Copy, move, upload, and delete object
operations use the Storage API.

### Games and personal workspaces

| Table                              | Purpose                                           |
| ---------------------------------- | ------------------------------------------------- |
| `studio.game_sessions`             | Room, game, state, turn, host, status, and winner |
| `studio.game_session_participants` | User/seat/symbol state in a session               |
| `studio.game_session_moves`        | Ordered action payload and resulting state        |
| `studio.game_session_results`      | Final outcome and summary                         |
| `studio.typing_test_results`       | User typing speed and accuracy history            |
| `studio.scratchpad_entries`        | Realtime user-owned text or code content          |
| `studio.tool_favorites`            | Unique favorite tool keys per user                |
| `studio.tool_history`              | Recent user tool use                              |

`game_session_status` is `waiting`, `active`, `completed`, or `abandoned`.
`record_game_action` locks the session, validates capability, participant,
turn, ordering, next participant, winner, and result, then commits the
transition atomically. `scratchpad_entries` is explicitly published through
`supabase_realtime`.

Studio tables do not grant persistence to `anon`. Authenticated operations
require an active Studio membership/capability and then apply ownership or
participant attributes through RLS.

## Portfolio

### Presentation and editorial data

| Table                                                    | Purpose                                                   |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `portfolio.hero`, `portfolio.about`, `portfolio.contact` | Singleton public presentation records                     |
| `portfolio.education`, `portfolio.experience`            | Ordered professional history                              |
| `portfolio.certificates`                                 | Credentials and supporting assets                         |
| `portfolio.skill_categories`, `portfolio.skills`         | Grouped skill evidence                                    |
| `portfolio.work`                                         | Work summaries, links, images, and case studies           |
| `portfolio.nav_items`                                    | Ordered public section navigation                         |
| `portfolio.section_content`                              | Presentation copy for known sections                      |
| `portfolio.writing_posts`                                | Portfolio-owned Writing publication and editorial content |
| `portfolio.linkedin_posts`                               | Private LinkedIn queue and publication lifecycle ledger   |

Public policies expose only the intended visible data. Admin reads use
`portfolio.content.read`; create, update, and delete are independent
capabilities. The same operation split protects `portfolio-assets` mutations.

The LinkedIn ledger has no anonymous grants or public-read policy. Authenticated
operators use the existing Portfolio read/create/update capabilities. Rows are
retained across replacement and deletion so the publication record is durable;
planned timestamps do not imply an automatic scheduler.

`save_section_presentation` atomically saves presentation and navigation data.
Case-study and JSON helper functions enforce the Portfolio contract at the
database boundary.

### Contact abuse state

`portfolio.contact_rate_limits` stores a secret-keyed hash, request count, and reset
time. `consume_contact_rate_limit` performs the atomic public contact decision;
the endpoint fails closed when it is unavailable.

## Storage buckets

| Bucket             | Visibility               | Owner     | Current use                                        |
| ------------------ | ------------------------ | --------- | -------------------------------------------------- |
| `studio-files`     | Private                  | Studio    | User-owned File Manager objects                    |
| `portfolio-assets` | Public read, Admin write | Portfolio | Work, credential, Writing cover, and Resume assets |
| `profile-avatars`  | Private                  | IAM/Auth  | User avatar uploads under user-ID prefixes         |

Bucket policies and application validation are both required. A public bucket
does not authorize uploads. Uploads must validate owner, path, MIME type, size,
and final metadata.

## Current versus historical objects

The retired `jg_account` and `jg_app` schemas no longer exist. Older migrations
also contain jobs, commerce, messaging, file sharing, custom calculator
templates, and media conversion that were later removed. Do not revive those
objects by assumption; future capabilities require current product design and
new reviewed migrations.
