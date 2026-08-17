import type { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface ProxyContext {
  request: NextRequest;
  response: NextResponse;
  supabase: SupabaseClient;
  user: User | null;
  pathname: string;
  isAuthed: boolean;
  productAccess: boolean;
  termsAccepted: boolean;
  isPublic: boolean;
  /** AAL level from the JWT — "aal1" or "aal2". No network call needed. */
  aalLevel: string | null;
}

/**
 * A middleware function in the proxy chain.
 * Return a NextResponse to short-circuit (redirect/block).
 * Return null to pass through to the next middleware.
 */
export type ProxyMiddleware = (
  ctx: ProxyContext,
) => Promise<NextResponse | null>;
