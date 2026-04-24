import type { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export interface ProxyContext {
  request: NextRequest;
  response: NextResponse;
  supabase: SupabaseClient;
  user: User | null;
  pathname: string;
  /** Whether the user is authenticated */
  isAuthed: boolean;
  /** Whether the user has accepted terms */
  termsAccepted: boolean;
  /** Whether the current path is public (no auth required) */
  isPublic: boolean;
}

/**
 * A middleware function in the proxy chain.
 * Return a NextResponse to short-circuit (redirect/block).
 * Return null to pass through to the next middleware.
 */
export type ProxyMiddleware = (ctx: ProxyContext) => Promise<NextResponse | null>;
