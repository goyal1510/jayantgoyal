# Database Rules

## Supabase Clients
- **Browser**: `createSupabaseBrowserClient()` from `@/lib/supabase/client.ts`
- **Server**: `createSupabaseServerClient()` from `@/lib/supabase/server.ts` (wrapped in React `cache()`)

## Schemas
- `jg_account` — user profiles, auth-related tables
- `portfolio` — portfolio content (hero, about, skills, projects, etc.)
- `jg_app` — consolidated app data (activity tracker, calculator, file manager, game hub, messenger, blog)

## Table Naming in `jg_app`
Tables are prefixed by feature: `activity_tracker_*`, `currency_calculator_*`, `file_manager_*`, `game_hub_*`, `messenger_*`, `blog_posts`

## UUID Convention
- Use `jg_app.uuid_v7()` as default for all new UUID primary keys (time-based, better B-tree performance)
- Shared trigger: `jg_app.update_updated_at()` for auto-updating `updated_at` columns

## Conventions
- Always specify schema when querying: `supabase.schema("schema_name").from("table")`
- Use RLS policies — never bypass with service role key in client code.
- Handle errors from every Supabase call.
