import { createBrowserClient } from "@supabase/ssr";

import {
  resolveAuthSessionMode,
  resolveSessionCookieOptions,
} from "./cookies";

function currentHostname(): string | undefined {
  if (typeof window !== "undefined") return window.location.hostname;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return undefined;

  try {
    return new URL(siteUrl).hostname;
  } catch {
    return undefined;
  }
}

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const mode = resolveAuthSessionMode();
  const cookieOptions = resolveSessionCookieOptions({
    hostname: currentHostname(),
    mode,
  });

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    ...(cookieOptions ? { cookieOptions } : {}),
  });
}
