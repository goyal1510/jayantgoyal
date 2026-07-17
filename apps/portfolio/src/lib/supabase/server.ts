import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let publicClient: SupabaseClient | null = null;

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Public Supabase configuration is unavailable");
  }

  publicClient ??= createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return publicClient;
}
