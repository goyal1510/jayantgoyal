# Supabase

Supabase provides authentication, Postgres, Realtime, and Storage. The
canonical hosted project is `jayantgoyal` with reference
`orwfvyditlguqvxvztkw`; verify both before every linked operation.

Shaamil uses this existing project and Auth identity boundary. No second hosted
Supabase project is approved for Shaamil. The IAM/product ownership
normalization is deployed; Shaamil backend work must extend it without
duplicating identity or placing communication data in another product schema.

## Ownership

| Schema        | Ownership                                                              |
| ------------- | ---------------------------------------------------------------------- |
| `foundation`  | Private reusable database primitives                                   |
| `iam`         | Profiles, product/workforce access, roles, capabilities, policy, audit |
| `iam_private` | Private authorization predicates and provisioning helpers              |
| `studio`      | Studio workspaces, games, personalization, and file metadata           |
| `portfolio`   | Portfolio CMS, Writing, LinkedIn planning, and contact-abuse state     |

Shaamil receives a product-owned `shaamil` schema only with its approved
backend milestone.

Canonical storage buckets are `studio-files`, `portfolio-assets`, and
`profile-avatars`. Code must select the intended schema explicitly, handle
every query error, and preserve RLS or an equivalent server authorization
boundary.

The current snapshots contain 41 application tables: 13 in `iam`, 14 in
`studio`, and 14 in `portfolio`. `foundation` and `iam_private` contain only
functions. See the [schema
catalog](schema-catalog.md) for table purpose, access model, database functions,
and Storage ownership.

## Repository sources

- `supabase/migrations/*.sql`: ordered forward database changes.
- `supabase/schemas/foundation.sql`: private shared database primitives.
- `supabase/schemas/iam.sql`: IAM tables and caller-facing functions.
- `supabase/schemas/iam_private.sql`: private authorization helpers.
- `supabase/schemas/studio.sql`: Studio schema snapshot.
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

| Mode                   | Credential                       | Boundary                                                      |
| ---------------------- | -------------------------------- | ------------------------------------------------------------- |
| Public content read    | Supabase anonymous key           | Public RLS policies and explicit selected columns             |
| User-owned workspace   | Authenticated session            | `auth.uid()` RLS plus route/object validation                 |
| Admin content write    | Authenticated Admin membership   | Operation capability plus table/payload allowlists            |
| Service-role operation | Server-only service-role key     | Live user and capability authorization before client creation |
| Storage upload/read    | User/admin session or signed URL | Bucket policy, object ownership, MIME/size/path validation    |

The service role bypasses RLS and is therefore never a substitute for an
authorization check. Portfolio and Auth do not use it.

## Safe workflow

1. Verify the authenticated account, project name, and project reference.
2. Run `pnpm db:migrations:check` and inspect local/remote history.
3. Review each proposed SQL statement, access policy, and data mutation.
4. For an approved remote apply, use the dedicated clean disposable migration
   workflow. Do not apply from the protected source clone or an ordinary dirty
   worktree.
5. After a successful apply, dump every application schema, review the diffs
   for schema-only content and secrets, and commit the refreshed snapshots with
   the migration.

`supabase/.temp` is machine-local state and must never be committed or copied
between worktrees. Remove any generated pooler URL after linked checks.

`pnpm test:db:linked` performs remote test writes as part of its boundary
verification. Run it only when the current task explicitly authorizes that
external mutation.

## Schema change definition of done

A database change is not complete until the SQL is reviewed, the exact linked
project is verified, migration history is inspected, the approved migration is
applied through the disposable workflow, every affected schema snapshot is
refreshed and reviewed, generated pooler data is removed, application
contracts/tests pass, and the schema catalog and ownership page are updated.

## Local parity

The local and hosted Data API configuration exposes `public`,
`graphql_public`, `iam`, `studio`, and `portfolio`. `foundation` and
`iam_private` remain private.

A fresh `supabase db reset` over the complete historical migration directory is
currently blocked by the oldest retained migration, which assumes predecessor
tables rather than creating them. Current-schema changes must therefore be
validated in a disposable local project reconstructed from the canonical
snapshots. Establishing a reset-safe baseline requires a separately reviewed
migration-history strategy; never edit already-applied history to hide this
drift. Auth redirects cover the four local web clients; anonymous sign-in and
TOTP configuration must remain aligned with the product flows they exercise.
