import { createBrowserClient } from "@supabase/ssr";

import { requireSupabasePublicConfig } from "./session";
import type { SupabasePublicConfig } from "./types";

export function createSupabaseBrowserClient(config: SupabasePublicConfig) {
  const { supabaseUrl, supabaseAnonKey } = requireSupabasePublicConfig(config);

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
