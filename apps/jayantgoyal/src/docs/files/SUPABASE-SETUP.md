# Supabase Setup Instructions

## ⚠️ IMPORTANT: Expose the `fmanager` Schema

For RPC functions in the `fmanager` schema to work, you **MUST** expose the schema in Supabase API settings. Without this, Supabase will only search in the `public` schema and won't find your functions.

### Steps (REQUIRED):

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Scroll down to **Exposed schemas** section
4. Add `fmanager` to the list of exposed schemas (comma-separated if there are multiple)
5. **Save the changes**
6. Wait a few seconds for the schema cache to refresh

### Grant Permissions via SQL (REQUIRED)

After exposing the schema, you also need to grant execute permissions. Run the following in your Supabase SQL Editor:

```sql
-- Grant usage on schema
GRANT USAGE ON SCHEMA fmanager TO anon, authenticated, service_role;

-- Grant execute on all functions in fmanager schema
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA fmanager TO anon, authenticated, service_role;

-- Set default privileges for future functions
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA fmanager
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
```

### How RPC Calls Work

The code uses fully qualified function names like:
- `fmanager.list_directory`
- `fmanager.create_directory_path`
- `fmanager.get_directory_tree`
- etc.

This tells Supabase exactly which schema to look in. However, **the schema must be exposed** in the API settings for this to work.

### Troubleshooting

If you still get errors like "Could not find the function public.fmanager.list_directory":
1. ✅ Verify `fmanager` is in the **Exposed schemas** list in Settings → API
2. ✅ Verify you ran the GRANT SQL statements above
3. ✅ Wait a few seconds after saving (schema cache needs to refresh)
4. ✅ Try refreshing your browser/restarting your dev server
5. ✅ Check that your functions actually exist in the `fmanager` schema (run `\df fmanager.*` in psql or check in Supabase SQL Editor)

### Verify Setup

After completing the steps above, test by calling the `/api/files` endpoint. It should successfully list directory contents without errors.
