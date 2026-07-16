# PLATFORM-00 Data and Persistence Inventory

## Browser-persisted state

The current main application owns nine durable browser-storage keys and one
session-only recovery key. Admin has no separately named persisted client store.

| Storage          | Key                               | Current feature                                          | Target owner | Compatibility requirement                                                |
| ---------------- | --------------------------------- | -------------------------------------------------------- | ------------ | ------------------------------------------------------------------------ |
| `localStorage`   | `calculator-storage`              | Custom calculator layout and theme                       | Studio       | Preserve key and hydration behavior across host migration                |
| `localStorage`   | `tools-usage-storage` (version 1) | Tool favorites/history cache with server synchronization | Studio       | Preserve version/migration behavior and reconcile with server data       |
| `localStorage`   | `darex:custom-dares`              | Dare X custom entries                                    | Studio       | Preserve exact key                                                       |
| `localStorage`   | `darex:source`                    | Dare X source selection                                  | Studio       | Preserve exact key                                                       |
| `localStorage`   | `darex:players`                   | Dare X player names/configuration                        | Studio       | Preserve exact key                                                       |
| `localStorage`   | `darex:player-count`              | Dare X player count                                      | Studio       | Preserve exact key                                                       |
| `localStorage`   | `wordle-stats`                    | Wordle local statistics                                  | Studio       | Preserve exact key                                                       |
| `localStorage`   | `fileManagerViewMode`             | File Manager display mode                                | Studio       | Preserve exact key                                                       |
| `localStorage`   | `recentCities`                    | Weather search history                                   | Studio       | Preserve exact key                                                       |
| `sessionStorage` | `reset_password_visited`          | Recovery-loop protection                                 | Auth         | Keep session-only semantics; may be replaced only with tested equivalent |

Moving product pages from `www` to `studio` changes the browser storage origin.
PLATFORM-06 must therefore provide a reviewed one-time transfer or explicit
compatibility mechanism before redirecting durable-state users. A redirect alone
does not migrate `localStorage`.

## Canonical schema snapshots

The verified linked Supabase project is `jayantgoyal`
(`orwfvyditlguqvxvztkw`). Read-only dumps of `jg_account`, `jg_app`, and
`portfolio` were compared with the repository snapshots at PLATFORM-00; their
table lists match. The linked migration history contains 23 older remote-only
records plus four local/remote matching records. No migration was applied and no
history repair was attempted.

### `jg_account`

| Table      | Current capability                             | Approved runtime owner                                                       |
| ---------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| `profiles` | User profile, role, and terms-acceptance state | Auth for identity/account contract; Admin for authorized role administration |

### `jg_app`

| Table                               | Current feature               | Approved runtime owner                          |
| ----------------------------------- | ----------------------------- | ----------------------------------------------- |
| `activity_tracker_activities`       | Activity definitions          | Studio                                          |
| `activity_tracker_entries`          | Activity log entries          | Studio                                          |
| `blog_posts`                        | Public blog content           | Portfolio read path; Admin authoring/management |
| `currency_calculator_calculations`  | Saved calculations            | Studio                                          |
| `currency_calculator_denominations` | Calculation denomination rows | Studio                                          |
| `file_manager_files`                | User file/folder metadata     | Studio                                          |
| `file_manager_type_categories`      | File type classification      | Studio                                          |
| `game_hub_session_moves`            | Shared game moves             | Studio                                          |
| `game_hub_session_participants`     | Shared game participants      | Studio                                          |
| `game_hub_session_results`          | Shared game results           | Studio                                          |
| `game_hub_sessions`                 | Shared game sessions          | Studio                                          |
| `game_hub_typing_speed_results`     | Typing-speed results          | Studio                                          |
| `messenger_messages`                | Realtime messages             | Studio                                          |
| `tool_favorites`                    | User tool favorites           | Studio                                          |
| `tool_history`                      | User tool history             | Studio                                          |

### `portfolio`

All Portfolio tables are publicly consumed by Portfolio and managed through
authorized Admin APIs.

| Table              | Content capability      |
| ------------------ | ----------------------- |
| `about`            | About/career content    |
| `certificates`     | Certificates            |
| `contact`          | Contact/profile details |
| `education`        | Education history       |
| `experience`       | Work experience         |
| `hero`             | Portfolio hero content  |
| `nav_items`        | Portfolio navigation    |
| `projects`         | Project catalog         |
| `skill_categories` | Skill grouping          |
| `skills`           | Skill entries           |
| `tech_icons`       | Icon registry           |

## Data-boundary rules frozen at PLATFORM-00

- One Supabase project remains authoritative during the restructure.
- Application extraction does not imply schema renaming or data duplication.
- Every query continues to select its intended schema explicitly.
- RLS-backed user operations remain user-scoped; service-role operations remain
  server-only and require handler-level identity, role, and domain validation.
- No table ownership is undecided. Any newly discovered production-only table or
  browser-storage key reopens PLATFORM-00 ownership review before its consumer is
  cut over.
- Any future reviewed migration must use the clean disposable remote-apply
  workflow, account for the known history drift, and refresh all three canonical
  schema snapshots after a successful apply.
