import { cookies } from "next/headers";
import { cache } from "react";

import { createSupabaseServerClient as createSharedServerClient } from "@repo/auth/server";

export const createSupabaseServerClient = cache(async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const cookieStore = await cookies();

  return createSharedServerClient({
    supabaseUrl,
    supabaseAnonKey,
    cookieStore,
  });
});
