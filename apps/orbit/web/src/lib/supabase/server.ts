import { cookies, headers } from "next/headers";
import { cache } from "react";

import { createSupabaseServerComponentClient } from "@jayantgoyal/web-auth/server";

/** Returns a request-scoped Supabase client for Orbit server components and actions. */
export const createSupabaseServerClient = cache(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  return createSupabaseServerComponentClient(cookieStore, {
    hostname: headerStore.get("host"),
  });
});
