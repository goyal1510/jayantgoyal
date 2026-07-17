import { cookies, headers } from "next/headers";
import { cache } from "react";

import { createSupabaseServerComponentClient } from "@repo/auth/server";

export const createSupabaseServerClient = cache(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  return createSupabaseServerComponentClient(cookieStore, {
    hostname: headerStore.get("host"),
  });
});

/**
 * Create Supabase admin client with service role key
 * Use this for operations that need to bypass RLS
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js");
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
