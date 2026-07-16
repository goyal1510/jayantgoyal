import { cookies } from "next/headers";
import { cache } from "react";

import { createSupabaseServerClient as createSharedServerClient } from "@repo/auth/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const createSupabaseServerClient = cache(
  async (): Promise<SupabaseClient> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables.");
    }

    return createSharedServerClient({
      supabaseUrl,
      supabaseAnonKey,
      cookieStore: await cookies(),
    });
  },
);
