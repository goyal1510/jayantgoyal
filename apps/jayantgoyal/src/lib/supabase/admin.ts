import { createSupabaseAdminClient as createSharedAdminClient } from "@repo/auth/admin";

/**
 * Creates a Supabase admin client using the service role key.
 * Use ONLY in server-side API routes for admin operations (e.g., deleting users, managing MFA factors).
 * Never expose to the client.
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role configuration.");
  }

  return createSharedAdminClient({
    supabaseUrl,
    serviceRoleKey,
  });
}
