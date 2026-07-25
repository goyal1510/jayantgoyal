# Supabase migration workflow

This repository now has one guarded workflow for linked Supabase migrations.
It exists because the remote project has a long, valid migration history and
Supabase rejects a temporary project that contains only the newest migration
file. The fix is to always compare and apply with the complete local history.

## Commands

```bash
# Read-only alignment check
pnpm db:migrations:check

# Apply pending migrations after review
pnpm db:migrations:apply
```

The workflow reads the linked project reference from
`supabase/.temp/linked-project.json` (or `SUPABASE_PROJECT_REF`), copies
`supabase/config.toml` and every reviewed migration into a disposable directory,
links that directory to the same project, and then:

1. compares every remote migration version with the local file set;
2. refuses to continue if a remote migration is missing locally or versions
   disagree;
3. applies pending migrations only when the history is safe; and
4. verifies that no migration remains pending afterward.

No environment files, database passwords, service-role keys, pooler URLs, or
schema dumps are copied into the disposable directory. The directory is removed
after each run.

## Drift policy

Do not run `supabase migration repair` or `supabase db pull` as a generic fix.
Those commands mutate or reinterpret migration history and require a separate
review of the exact remote state. If `db:migrations:check` reports a real
remote-only migration, restore the exact migration file first. If the SQL is
unavailable, stop and review the project history rather than marking it
reverted or applied by guesswork.

Schema snapshots are refreshed separately after a successful remote apply:

```bash
supabase db dump --linked --schema jg_account --file /tmp/jg_account.sql
supabase db dump --linked --schema jg_app --file /tmp/jg_app.sql
supabase db dump --linked --schema portfolio --file /tmp/portfolio.sql
```

Review the diffs before replacing `supabase/schemas/*.sql`; confirm the dumps
contain schema only and remove any temporary output afterward.
