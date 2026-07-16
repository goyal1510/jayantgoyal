import { cookies, headers } from "next/headers";
import { cache } from "react";

import { resolvePlatformSessionConfig } from "@repo/auth/cookies";
import { createSupabaseServerClient as createSharedServerClient } from "@repo/auth/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const createSupabaseServerClient = cache(
  async (): Promise<SupabaseClient> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables.");
    }

    const requestHeaders = await headers();
    const hostname = requestHeaders.get("host")?.split(":")[0] ?? "";

    return createSharedServerClient({
      supabaseUrl,
      supabaseAnonKey,
      cookieStore: await cookies(),
      platformSession: resolvePlatformSessionConfig({
        enabled: process.env.PLATFORM_SESSION_ENABLED === "true",
        hostname,
        supabaseUrl,
      }),
    });
  },
);
