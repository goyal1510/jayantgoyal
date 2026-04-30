# Supabase Rules

## Project Setup
- Supabase CLI is linked in project root (`supabase/` directory)
- Project ref: `orwfvyditlguqvxvztkw` (jayantgoyal, Mumbai region)
- Schema dumps are in `supabase/schemas/` (ground truth, tracked in git)
- Migrations are in `supabase/migrations/` (gitignored, applied via CLI only)
- Config is in `supabase/config.toml` (tracked in git)

## After Applying Migrations
**Every time a migration is applied** (`supabase db push`), immediately refresh the schema dumps:

```bash
supabase db dump --schema jg_account -f supabase/schemas/jg_account.sql
supabase db dump --schema portfolio -f supabase/schemas/portfolio.sql
supabase db dump --schema jg_app -f supabase/schemas/jg_app.sql
```

This keeps the committed schema dumps in sync with the live database.

## Writing Migrations
- Create migration files in `supabase/migrations/` with timestamp prefix: `YYYYMMDDHHMMSS_description.sql`
- Always wrap migrations in `BEGIN; ... COMMIT;` for atomicity
- Use `jg_app.uuid_v7()` as default for all new UUID primary keys
- Use `jg_app.update_updated_at()` as the shared trigger for `updated_at` columns
- After pushing, dump fresh schemas (see above)

## Schema Reference
- `jg_account` — user profiles, auth, roles
- `portfolio` — portfolio content (hero, about, skills, projects, etc.)
- `jg_app` — app features (prefixed tables: `activity_tracker_*`, `currency_calculator_*`, `file_manager_*`, `game_hub_*`, `messenger_*`, `blog_posts`)
