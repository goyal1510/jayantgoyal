# Supabase Manager

Application for managing multiple Supabase projects with a unified interface.

## Features
- Multi-project support (jayantgoyal, sujago, charge-capture-healthcare)
- Project selector dropdown in header
- User management (create, update, delete, import)
- Sidebar navigation
- Theme toggle (light/dark/system)
- Clean, minimal UI

## Run locally
From the repo root:
```bash
pnpm dev --filter smanager
```

## Environment Variables

Create `.env.local` in `apps/supabase-manager` (or the repo root) with:

```bash
# Jayant Goyal Project
NEXT_PUBLIC_JAYANTGOYAL_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_JAYANTGOYAL_SUPABASE_ANON_KEY=your-anon-key-here
JAYANTGOYAL_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Sujago Project
NEXT_PUBLIC_SUJAGO_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUJAGO_SUPABASE_ANON_KEY=your-anon-key-here
SUJAGO_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Charge Capture Healthcare Project
NEXT_PUBLIC_CHARGE_CAPTURE_HEALTHCARE_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_CHARGE_CAPTURE_HEALTHCARE_SUPABASE_ANON_KEY=your-anon-key-here
CHARGE_CAPTURE_HEALTHCARE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important Notes:**
- `NEXT_PUBLIC_*` variables are exposed to the browser (for client-side Supabase clients)
- `*_SERVICE_ROLE_KEY` variables are server-only (for admin operations like user management)
- Never commit `.env.local` files to version control

## Usage

1. **Select a project** from the dropdown in the header
2. The selected project's Supabase configuration will be used throughout the app
3. **User Management**: Navigate to `/users` to manage users for the selected project
   - Create individual users
   - Import users from JSON
   - Update user emails and passwords
   - Delete users (single or batch)
4. Use `useSupabaseClient()` hook in client components to get the Supabase client for the selected project
5. Use `createSupabaseServerAdminClient()` in API routes (automatically uses selected project from cookie)
