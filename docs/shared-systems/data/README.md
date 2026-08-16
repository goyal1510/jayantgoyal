# Supabase

Supabase provides authentication, Postgres, Realtime, and Storage. The
canonical hosted project is `jayantgoyal` with reference
`orwfvyditlguqvxvztkw`; verify both before every linked operation.

## Ownership

| Schema       | Ownership                                                           |
| ------------ | ------------------------------------------------------------------- |
| `jg_account` | Profiles, roles, terms acceptance, and account helpers              |
| `portfolio`  | Public Portfolio CMS data and contact rate limiting                 |
| `jg_app`     | Studio workspaces, games, usage data, and Portfolio Writing records |

Canonical storage buckets are `private-files`, `portfolio-assets`, and
`profile-avatars`. Code must select the intended schema explicitly, handle
every query error, and preserve RLS or an equivalent server authorization
boundary.

## Repository sources

- `supabase/migrations/*.sql`: ordered forward database changes.
- `supabase/schemas/jg_account.sql`: canonical account schema snapshot.
- `supabase/schemas/jg_app.sql`: canonical product schema snapshot.
- `supabase/schemas/portfolio.sql`: canonical Portfolio schema snapshot.
- `supabase/config.toml`: local CLI services and Auth/API parity.

Never edit an applied migration. Historical migrations may contain historical
content and paths; current production data changes belong in a new reviewed
migration.

## Safe workflow

1. Verify the authenticated account, project name, and project reference.
2. Run `pnpm db:migrations:check` and inspect local/remote history.
3. Review each proposed SQL statement, access policy, and data mutation.
4. For an approved remote apply, use the dedicated clean disposable migration
   workflow. Do not apply from the protected source clone or an ordinary dirty
   worktree.
5. After a successful apply, dump all three schemas, review the diffs for
   schema-only content and secrets, and commit the refreshed snapshots with the
   migration.

`supabase/.temp` is machine-local state and must never be committed or copied
between worktrees. Remove any generated pooler URL after linked checks.

`pnpm test:db:linked` performs remote test writes as part of its boundary
verification. Run it only when the current task explicitly authorizes that
external mutation.

## Local parity

Local PostgREST exposes `public`, `graphql_public`, `jg_account`, `jg_app`, and
`portfolio`. Local database reset applies migrations without a nonexistent seed
file. Auth redirects cover the four local web clients; anonymous sign-in and
TOTP configuration must remain aligned with the product flows they exercise.
