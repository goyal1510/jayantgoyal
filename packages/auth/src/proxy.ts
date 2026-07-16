import { createServerClient } from "@supabase/ssr";

import { createResponseCookieMethods } from "./cookies";
import { requireSupabasePublicConfig } from "./session";
import type { ResponseCookieStore, SupabasePublicConfig } from "./types";

export function createSupabaseProxyClient(
  config: SupabasePublicConfig & { responseStore: ResponseCookieStore },
) {
  const { supabaseUrl, supabaseAnonKey } = requireSupabasePublicConfig(config);

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: createResponseCookieMethods(config.responseStore),
  });
}
