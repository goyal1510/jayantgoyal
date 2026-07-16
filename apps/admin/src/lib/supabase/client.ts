import { createSupabaseBrowserClient as createSharedBrowserClient } from "@repo/auth/browser";

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createSharedBrowserClient({ supabaseUrl, supabaseAnonKey });
}
