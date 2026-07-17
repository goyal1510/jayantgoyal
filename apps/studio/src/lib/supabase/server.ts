import { cookies } from "next/headers";
import { cache } from "react";

import { createSupabaseServerComponentClient } from "@repo/auth/server";

export const createSupabaseServerClient = cache(async () => {
  const cookieStore = await cookies();
  return createSupabaseServerComponentClient(cookieStore);
});
