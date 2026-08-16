# Database schema catalog

This catalog describes the current canonical schema snapshots, not every table
that ever appeared in migration history. The verified hosted project is
`jayantgoyal` (`orwfvyditlguqvxvztkw`).

## Ownership summary

| Schema       | Tables | Product/domain owner                   | Default access model                              |
| ------------ | -----: | -------------------------------------- | ------------------------------------------------- |
| `jg_account` |      1 | Auth/account policy                    | User self-service plus admin/super-admin policies |
| `jg_app`     |     15 | Studio, except Portfolio-owned Writing | User-owned RLS; public published Writing          |
| `portfolio`  |     12 | Portfolio                              | Public selected reads; authorized Admin writes    |

## Account schema

### `jg_account.profiles`

One row per Supabase Auth identity. It stores names, `user_role` (`user`,
`admin`, `super_admin`), terms acceptance, avatar selection/storage metadata,
and timestamps. Users can read/update their own permitted profile fields.
Admins can read profiles; super admins have the broader managed-write policies
used by Admin operations.

Important helpers:

- `jg_account.handle_new_user`: creates/synchronizes a profile from Auth.
- `jg_account.handle_updated_at`: maintains timestamps.
- `jg_account.is_admin`: reusable database authorization predicate.
- `jg_account.count_my_sessions`: account-session information for security UI.

Supabase Auth, not this table, owns passwords, email verification, identities,
refresh tokens, sessions, and MFA factors.

## Studio and Writing schema

### Activity Tracker

| Table                                | Purpose                                   | Relationship/access               |
| ------------------------------------ | ----------------------------------------- | --------------------------------- |
| `jg_app.activity_tracker_activities` | User-defined activities and display order | Owner CRUD by `user_id`           |
| `jg_app.activity_tracker_entries`    | Dated completion/notes for an activity    | Owner CRUD; activity relationship |

Deleting an activity and its entry behavior must remain consistent with the
foreign key and API transaction semantics. Statistics are computed from these
canonical rows rather than stored as a second source of truth.

### Currency Calculator

| Table                                      | Purpose                                  | Relationship/access           |
| ------------------------------------------ | ---------------------------------------- | ----------------------------- |
| `jg_app.currency_calculator_calculations`  | One saved calculation, date, total, note | Owner CRUD                    |
| `jg_app.currency_calculator_denominations` | Denomination/count/amount rows           | Child of an owned calculation |

The API persists the calculation and denomination set as one user operation.
Generated PDF/detail output is derived from stored rows.

### File Manager

| Table                                 | Purpose                                                                         | Relationship/access                      |
| ------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------- |
| `jg_app.file_manager_files`           | File/folder metadata, paths, parent, object path, version and soft-delete state | Owner CRUD; private Storage coordination |
| `jg_app.file_manager_type_categories` | Shared file-type classification                                                 | Authenticated read                       |

`file_manager_files` represents the root and directory tree as rows. File bytes
live in `private-files`; directories have no Storage object. Relevant helpers
include `create_directory_path`, `generate_storage_path`, `get_directory_tree`,
`get_file_by_path`, `list_directory`, `copy_file`, `move_file`,
`soft_delete_file`, child-count maintenance, and file-type validation.

### Game Hub

| Table                                  | Purpose                                                       | Relationship/access                                      |
| -------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| `jg_app.game_hub_sessions`             | Room code, game slug, state, turn owner, status, host, winner | Joinable/joined read; participant-controlled transitions |
| `jg_app.game_hub_session_participants` | User/seat/symbol/player state in a session                    | User joins as self; participant reads                    |
| `jg_app.game_hub_session_moves`        | Ordered action payload and resulting state                    | Participants read; actor inserts through validated flow  |
| `jg_app.game_hub_session_results`      | Final outcome and summary                                     | Participants read/insert through completion flow         |
| `jg_app.game_hub_typing_speed_results` | User typing speed and accuracy history                        | Owner read/insert                                        |

`jg_app.game_hub_session_status` is `waiting`, `active`, `completed`, or
`abandoned`. `jg_app.record_game_hub_action` locks the current session,
validates the active participant and move number, records the move, updates the
session, and optionally records the result atomically.

### Sync Scratchpad

`jg_app.scratchpad_entries` stores user-owned text or code content, optional
language, read state, and timestamps. Owner CRUD policies isolate accounts.
The table participates in Supabase Realtime for synchronized active clients.

### Tool personalization

| Table                   | Purpose                            | Relationship/access      |
| ----------------------- | ---------------------------------- | ------------------------ |
| `jg_app.tool_favorites` | Unique favorite tool keys per user | Owner read/insert/delete |
| `jg_app.tool_history`   | Recent tool use and timestamps     | Owner CRUD               |

Tool execution remains public/browser-local. These tables add optional account
personalization rather than gating the utilities.

### Writing

`jg_app.writing_posts` stores slug, title, excerpt, Markdown content, tags,
publication/visibility state, timestamps, optional cover metadata, and display
fields. Public RLS exposes only published and visible rows. Admin-authorized
writes use the Portfolio-owned Writing contract and revalidate public pages.

Writing is a Portfolio product capability even though its table remains in the
existing `jg_app` schema. A future schema move would need a reviewed migration
and is not implied by product ownership alone.

### Shared database helpers

`jg_app.uuid_v7` is the standard application UUID default.
`jg_app.update_updated_at` is the standard timestamp trigger.
`jg_app.is_nonblank_text_array` is used by current constraints across schemas.

## Portfolio schema

### Singleton presentation records

| Table               | Purpose                                                 | Access                   |
| ------------------- | ------------------------------------------------------- | ------------------------ |
| `portfolio.hero`    | Person/hero identity, actions, social/personal metadata | Public read; Admin write |
| `portfolio.about`   | About narrative, principles, supporting profile data    | Public read; Admin write |
| `portfolio.contact` | Public contact presentation and destination             | Public read; Admin write |

Unique singleton indexes prevent multiple competing rows for these core
records. Portfolio loaders fail when required singleton data is missing.

### Ordered editorial collections

| Table                        | Purpose                                           | Key rules                                              |
| ---------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| `portfolio.education`        | School, degree, period, location, detail          | Visibility and non-negative sort order                 |
| `portfolio.experience`       | Company, role, period, outcomes and company links | Visibility, validated URLs/arrays, sort order          |
| `portfolio.certificates`     | Credential title, issuer, date, links/assets      | Visibility and sort order                              |
| `portfolio.skill_categories` | Named skill groups and descriptions               | Unique normalized title, sort order                    |
| `portfolio.skills`           | Skill, proficiency, evidence                      | Category FK, allowed proficiency, unique category/name |
| `portfolio.work`             | Work summaries, links, tags, images, case studies | Unique slug, case-study shape/publication constraints  |

Public policies expose visible records; Admin policies permit authorized CMS
operations. The public loader also selects only the contract's public columns.

### Navigation and section presentation

| Table                       | Purpose                                        | Key rules                        |
| --------------------------- | ---------------------------------------------- | -------------------------------- |
| `portfolio.nav_items`       | Ordered section labels/targets                 | Unique section ID and visibility |
| `portfolio.section_content` | Eyebrow/headline/accent/copy per known section | Unique allowed section key       |

`portfolio.save_section_presentation` atomically saves section copy and its
navigation representation. Both payload halves are validated by the shared
Portfolio contract and database constraints.

### Contact abuse state

`portfolio.contact_rate_limits` stores a secret-keyed hash, request count, and
reset time for the public contact endpoint. `portfolio.consume_contact_rate_limit`
performs the atomic decision. The endpoint fails closed when this function is
unavailable.

### Portfolio functions

- `portfolio.update_updated_at_column`: standard timestamp maintenance.
- `portfolio.is_exact_text_object_array`: JSON content constraint helper.
- `portfolio.is_work_case_study_shape` and
  `portfolio.is_complete_work_case_study`: Work case-study integrity.
- `portfolio.save_section_presentation`: transactional CMS presentation save.
- `portfolio.consume_contact_rate_limit`: public contact abuse control.

## Storage buckets

| Bucket             | Visibility               | Owner        | Current use                                                           |
| ------------------ | ------------------------ | ------------ | --------------------------------------------------------------------- |
| `private-files`    | private                  | Studio       | File Manager objects under user ownership                             |
| `portfolio-assets` | public read, Admin write | Portfolio    | Work images, credential files/previews, Writing covers, Resume assets |
| `profile-avatars`  | private                  | Auth/account | User avatar uploads under user-ID prefixes                            |

Bucket policies and application validation are both required. A public bucket
does not authorize arbitrary uploads. Signed uploads must be finalized against
expected metadata, size, MIME type, and owner.

## Current versus historical objects

Old migrations include jobs, commerce/subscription, messaging-conversation,
custom-calculator-template, file-share, and media-conversion objects that later
migrations removed or rolled back. They are not in the canonical snapshots and
must not be documented or used as current APIs. If a future product implements
one of those capabilities, design it from current requirements and add a new
reviewed migration; do not revive historical tables by assumption.
