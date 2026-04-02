# Database Rules

## Supabase Clients
- **Browser**: `createSupabaseBrowserClient()` from `@/lib/supabase/client.ts`
- **Server**: `createSupabaseServerClient()` from `@/lib/supabase/server.ts` (wrapped in React `cache()`)

## Schemas
- `jg_account` — user profiles, auth-related tables
- `portfolio` — portfolio content (hero, about, skills, projects, etc.)
- `activity_tracker` — daily activity tracking
- `currency_calculator` — cash denomination data
- `fmanager` — file manager storage
- `messenger` — real-time messaging

## Conventions
- Always specify schema when querying: `supabase.schema("schema_name").from("table")`
- Use RLS policies — never bypass with service role key in client code.
- Handle errors from every Supabase call.
