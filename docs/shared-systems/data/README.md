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

The current snapshots contain 28 application tables: one in `jg_account`, 15
in `jg_app`, and 12 in `portfolio`. See the [schema
catalog](schema-catalog.md) for table purpose, access model, database functions,
and Storage ownership.

## Repository sources

- `supabase/migrations/*.sql`: ordered forward database changes.
- `supabase/schemas/jg_account.sql`: canonical account schema snapshot.
- `supabase/schemas/jg_app.sql`: canonical product schema snapshot.
- `supabase/schemas/portfolio.sql`: canonical Portfolio schema snapshot.
- `supabase/config.toml`: local CLI services and Auth/API parity.

Never edit an applied migration. Historical migrations may contain historical
content and paths; current production data changes belong in a new reviewed
migration.

In particular, migration history contains experiments that were later rolled
back or decommissioned, including jobs, commerce, broader messaging, file
sharing, custom calculator templates, and media conversion. Their historical
`CREATE TABLE` statements do not make those current capabilities. Use the
canonical schema snapshots and current application code to determine what
exists now.

## Runtime access modes

| Mode                   | Credential                       | Boundary                                                   |
| ---------------------- | -------------------------------- | ---------------------------------------------------------- |
| Public content read    | Supabase anonymous key           | Public RLS policies and explicit selected columns          |
| User-owned workspace   | Authenticated session            | `auth.uid()` RLS plus route/object validation              |
| Admin content write    | Authenticated admin session      | Admin authorization plus table/payload allowlists          |
| Service-role operation | Server-only service-role key     | Live user and role authorization before client creation    |
| Storage upload/read    | User/admin session or signed URL | Bucket policy, object ownership, MIME/size/path validation |

The service role bypasses RLS and is therefore never a substitute for an
authorization check. Portfolio and Auth do not use it.

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

## Schema change definition of done

A database change is not complete until the SQL is reviewed, the exact linked
project is verified, migration history is inspected, the approved migration is
applied through the disposable workflow, all three schema snapshots are
refreshed and reviewed, generated pooler data is removed, application
contracts/tests pass, and the schema catalog is updated.

## Local parity

Local PostgREST exposes `public`, `graphql_public`, `jg_account`, `jg_app`, and
`portfolio`. Local database reset applies migrations without a nonexistent seed
file. Auth redirects cover the four local web clients; anonymous sign-in and
TOTP configuration must remain aligned with the product flows they exercise.
