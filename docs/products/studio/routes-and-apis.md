# Studio routes and APIs

This page catalogs Studio's route tree by access and capability. Route groups
such as `(protected)` do not appear in public URLs.

## Public discovery and utility pages

| Route                | Purpose                                 |
| -------------------- | --------------------------------------- |
| `/`                  | Studio home and featured inventory      |
| `/products`          | Complete product catalog                |
| `/products/[slug]`   | Product detail generated from inventory |
| `/tools`             | Tool catalog                            |
| `/weather`           | Current conditions and forecast         |
| `/github-stats`      | Public GitHub profile statistics        |
| `/custom-calculator` | Calculator Builder beta                 |
| `/terms-conditions`  | Studio account terms                    |

All 87 `/tools/<category>/<slug>` pages are listed in the [capability
catalog](capability-catalog.md) and generated into Studio's sitemap. The proxy
and client AuthGate must classify the same public routes.

## Account workspace pages

| Route                          | Capability                        |
| ------------------------------ | --------------------------------- |
| `/activity-tracker/dashboard`  | Activity statistics               |
| `/activity-tracker/management` | Activity definitions              |
| `/activity-tracker/tracker`    | Daily activity entries            |
| `/calculator/new`              | New cash-denomination calculation |
| `/calculator/history`          | Saved calculation history         |
| `/files/[[...path]]`           | Private file/folder tree          |
| `/scratchpad`                  | Realtime private entries          |

## Game pages

| Game                | Base route                   | Online room route                            |
| ------------------- | ---------------------------- | -------------------------------------------- |
| Hub                 | `/games`                     | —                                            |
| Chess               | `/games/chess`               | `/games/chess/room/[roomCode]`               |
| Connect Four        | `/games/connect-four`        | `/games/connect-four/room/[roomCode]`        |
| Dare X              | `/games/dare-x`              | `/games/dare-x/room/[roomCode]`              |
| Ludo                | `/games/ludo`                | `/games/ludo/room/[roomCode]`                |
| Memory Match        | `/games/memory-match`        | `/games/memory-match/room/[roomCode]`        |
| Rock Paper Scissors | `/games/rock-paper-scissors` | `/games/rock-paper-scissors/room/[roomCode]` |
| Tic Tac Toe         | `/games/tic-tac-toe`         | `/games/tic-tac-toe/room/[roomCode]`         |
| Typing Speed        | `/games/typing-speed`        | —                                            |
| Wordle              | `/games/wordle`              | `/games/wordle/room/[roomCode]`              |

Game pages require an account. Unauthenticated page requests can reach the
layout for SEO-safe rendering, but the AuthGate replaces protected content
with an Auth entry CTA.

## Auth compatibility and internal pages

| Route              | Status                                                        |
| ------------------ | ------------------------------------------------------------- |
| `/welcome`         | Redirect to Auth welcome with `redirect` return path          |
| `/forgot-password` | Redirect to Auth forgot-password                              |
| `/mfa-verify`      | Redirect to Auth MFA                                          |
| `/auth/callback`   | Compatibility callback exchange                               |
| `/reset-password`  | Compatibility completion for previously issued recovery links |
| `/loader-preview`  | Internal visual loading preview; not a product capability     |

## Account APIs

| Methods and route                | Access                     | Operation                      |
| -------------------------------- | -------------------------- | ------------------------------ |
| `GET /api/account/init`          | auth-aware/exempt          | Initialize profile/terms state |
| `POST /api/account/accept-terms` | authenticated/exempt       | Record terms acceptance        |
| `DELETE /api/account/delete`     | authenticated current user | Delete the caller's account    |

The init and terms endpoints are exempt from terms/MFA blocking only so the
account can reach the state required by later APIs.

## Activity Tracker APIs

| Methods and route                    | Operation                              |
| ------------------------------------ | -------------------------------------- |
| `GET /api/activity-tracker`          | List user activities and related state |
| `POST /api/activity-tracker`         | Create an activity                     |
| `PATCH /api/activity-tracker/[id]`   | Update an owned activity               |
| `DELETE /api/activity-tracker/[id]`  | Delete an owned activity               |
| `GET /api/activity-tracker/entries`  | List owned daily entries               |
| `POST /api/activity-tracker/entries` | Create/update daily entry state        |
| `GET /api/activity-tracker/stats`    | Compute user dashboard statistics      |

## Currency Calculator APIs

| Methods and route             | Operation                                        |
| ----------------------------- | ------------------------------------------------ |
| `GET /api/calculator`         | List owned calculations and denominations        |
| `POST /api/calculator`        | Validate and persist one calculation transaction |
| `DELETE /api/calculator/[id]` | Delete an owned calculation                      |

## File Manager APIs

| Methods and route                   | Operation                                         |
| ----------------------------------- | ------------------------------------------------- |
| `GET /api/files`                    | List directory contents                           |
| `GET /api/files/[id]`               | Read owned metadata/detail                        |
| `PATCH /api/files/[id]`             | Rename/update owned metadata                      |
| `DELETE /api/files/[id]`            | Soft-delete owned file/folder                     |
| `POST /api/files/folder`            | Create an owned directory path                    |
| `POST /api/files/[id]/copy`         | Copy an owned object/tree                         |
| `POST /api/files/[id]/move`         | Move an owned object/tree                         |
| `POST /api/files/upload/signed-url` | Validate metadata and create signed upload target |
| `POST /api/files/upload/complete`   | Verify uploaded object and finalize metadata      |

File APIs authorize the current user, validate paths/conflicts, coordinate
`jg_app.file_manager_files` with `private-files`, and remove storage objects
when a partially completed operation must be rolled back.

## Scratchpad and tool APIs

| Methods and route             | Operation                                    |
| ----------------------------- | -------------------------------------------- |
| `GET /api/scratchpad`         | List private entries                         |
| `POST /api/scratchpad`        | Create a private entry                       |
| `PATCH /api/scratchpad/[id]`  | Update an owned entry                        |
| `DELETE /api/scratchpad/[id]` | Delete an owned entry                        |
| `GET /api/tools/usage`        | Read favorites/recent history when signed in |
| `POST /api/tools/usage`       | Favorite or record usage                     |
| `DELETE /api/tools/usage`     | Remove favorite/history state                |
| `GET /api/typing-test`        | List owned typing results                    |
| `POST /api/typing-test`       | Save an owned result                         |

`/api/tools/usage` is auth-aware public: anonymous tool use is allowed, while a
verified account can persist personalization.

## Online game APIs

| Methods and route                                      | Operation                          |
| ------------------------------------------------------ | ---------------------------------- |
| `GET /api/games/sessions`                              | Read a joinable/joined room        |
| `POST /api/games/sessions`                             | Create a room and host participant |
| `POST /api/games/sessions/[roomCode]/join`             | Join a valid room as current user  |
| `POST /api/games/sessions/[roomCode]/moves`            | Generic validated move transition  |
| `POST /api/games/chess/[roomCode]/moves`               | Chess legal move                   |
| `POST /api/games/dare-x/[roomCode]/actions`            | Dare X action                      |
| `POST /api/games/ludo/[roomCode]/actions`              | Ludo dice/token action             |
| `POST /api/games/memory-match/[roomCode]/flips`        | Memory Match flip                  |
| `POST /api/games/rock-paper-scissors/[roomCode]/moves` | RPS selection                      |
| `POST /api/games/tic-tac-toe/[roomCode]/moves`         | Tic Tac Toe move                   |
| `POST /api/games/wordle/[roomCode]/guesses`            | Wordle guess with server seed      |

Connect Four uses `POST /api/games/sessions/[roomCode]/moves`; there is no
game-specific Connect Four route file. All actions still verify active
membership and current session state before recording the transition.

## Public provider APIs

| Method and route        | Cost class           | Operation                            |
| ----------------------- | -------------------- | ------------------------------------ |
| `GET /api/github-loc`   | zero-cost proxy path | GitHub code statistics               |
| `GET /api/github-stats` | zero-cost proxy path | GitHub profile/repository statistics |

The endpoints are public but still validate usernames, bound cache/error
behavior, and keep `GITHUB_TOKEN` server-only.

## Discovery and machine-readable routes

| Method and route                            | Purpose                              |
| ------------------------------------------- | ------------------------------------ |
| `GET /.well-known/agent-skills/index.json`  | Machine-readable Studio skills index |
| `GET /.well-known/api-catalog`              | Studio API capability catalog        |
| `GET /.well-known/mcp.json`                 | MCP discovery metadata               |
| `GET /.well-known/oauth-protected-resource` | OAuth protected-resource metadata    |
| `GET /.well-known/openid-configuration`     | OpenID discovery metadata            |
| `GET /robots.txt`                           | Robots policy                        |

Discovery output must describe implemented and safely exposed capabilities; it
must not advertise private APIs as anonymous or imply unimplemented services.

## Request policy sequence

```text
Static/zero-cost path
  → immediate pass-through

Public page
  → public marker without getUser()
  → layout/AuthGate public classification

Protected/API request
  → shared cookie detection
  → Supabase getUser()
  → route guard
  → MFA guard
  → recovery guard
  → terms guard
  → verified route handler or page
```

When adding a route, update this catalog and every executable classifier that
applies. A page's route group name alone does not define its public policy.
