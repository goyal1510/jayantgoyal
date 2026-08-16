import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Protected Studio requests are authenticated by the proxy. It strips
 * client-supplied identity headers before attaching the verified user ID.
 *
 * The fallback keeps route handlers usable in focused tests and direct
 * development calls that bypass the proxy.
 */
export async function getVerifiedRequestUserId(
  request: NextRequest,
  supabase: SupabaseClient,
): Promise<string | null> {
  const proxyVerifiedUserId = request.headers.get("x-user-id")?.trim();
  if (proxyVerifiedUserId) return proxyVerifiedUserId;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return error || !user ? null : user.id;
}
