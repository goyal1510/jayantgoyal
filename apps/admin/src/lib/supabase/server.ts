import { cookies, headers } from "next/headers";
import { cache } from "react";
import { resolvePlatformSessionConfig } from "@repo/auth/cookies";
import { createSupabaseServerClient as createSharedServerClient } from "@repo/auth/server";
import { createSupabaseAdminClient as createSharedAdminClient } from "@repo/auth/admin";

export const createSupabaseServerClient = cache(async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const hostname = requestHeaders.get("host")?.split(":")[0] ?? "";

  return createSharedServerClient({
    supabaseUrl,
    supabaseAnonKey,
    cookieStore,
    platformSession: resolvePlatformSessionConfig({
      enabled: process.env.PLATFORM_SESSION_ENABLED === "true",
      hostname,
      supabaseUrl,
    }),
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

  return createSharedAdminClient({
    supabaseUrl,
    serviceRoleKey: supabaseServiceKey,
  });
}
