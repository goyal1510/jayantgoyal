import { createServerClient } from "@supabase/ssr";

import { createServerCookieMethods } from "./cookies";
import { requireSupabasePublicConfig } from "./session";
import type { ServerCookieStore, SupabasePublicConfig } from "./types";

export function createSupabaseServerClient(
  config: SupabasePublicConfig & { cookieStore: ServerCookieStore },
) {
  const { supabaseUrl, supabaseAnonKey } = requireSupabasePublicConfig(config);

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: createServerCookieMethods(config.cookieStore),
  });
}
