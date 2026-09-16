# Orbit routes and APIs

This page catalogs the Orbit web client route tree by access posture. Route
groups such as `(orbit)` do not appear in public URLs.

## Public and entry routes

| Route              | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `/`                | Product introduction and Auth continue entry         |
| `/welcome`         | Redirect alias to Auth login                         |
| `/no-access`       | Signed-in user without Orbit product entitlement     |
| `/auth/callback`   | OAuth/session exchange and MFA handoff               |
| `GET /robots.txt`  | Disallow indexing                                    |

## Protected application routes

All routes below require an active Auth session and active Orbit product
membership enforced by `src/proxy.ts`.

| Route                 | Purpose                                      |
| --------------------- | -------------------------------------------- |
| `/home`               | Workspace list, board discovery, creation    |
| `/boards/[boardId]`   | Board columns, cards, comments, move actions |
| `/inbox`              | In-app notification inbox                    |

## Database command entrypoints

Mutations use reviewed `orbit` schema RPCs from server actions:

- `orbit.create_workspace`
- `orbit.create_board`
- `orbit.create_card`
- `orbit.move_card`
- `orbit.add_comment`

Direct table writes from the browser are not part of the supported contract.
