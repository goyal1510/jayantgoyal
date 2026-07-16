import { createClient } from "@supabase/supabase-js";

import { requireSupabaseServiceConfig } from "./session";
import type { SupabaseServiceConfig } from "./types";

/** Create a server-only service-role client. Never import this subpath in a browser bundle. */
export function createSupabaseAdminClient(config: SupabaseServiceConfig) {
  const { supabaseUrl, serviceRoleKey } = requireSupabaseServiceConfig(config);

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
