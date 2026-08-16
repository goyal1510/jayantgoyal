import { NextResponse } from "next/server";
import { buildAuthMfaUrl } from "@jayantgoyal/web-auth/entry";
import type { ProxyContext } from "./types";

/** APIs that are safe to call without completing MFA */
const MFA_EXEMPT_APIS = ["/api/account/init", "/api/account/accept-terms"];

/**
 * MFA enforcement middleware.
 * Reads AAL from the JWT (no network call). Only calls listFactors()
 * when the user is at AAL1 (rare — only right after login before MFA verify).
 */
export async function mfaMiddleware(
  ctx: ProxyContext,
): Promise<NextResponse | null> {
  if (!ctx.isAuthed) return null;

  // Skip auth callback — route handler needs to exchange OAuth code first
  if (ctx.pathname.startsWith("/auth/callback")) return null;

  // If AAL2 already achieved, no MFA check needed (fast path — no network call)
  if (ctx.aalLevel === "aal2") return null;

  // AAL1 — check if user has MFA factors enrolled (one API call, only happens once per session)
  const { data: factorsData } = await ctx.supabase.auth.mfa.listFactors();
  const hasVerifiedFactor = factorsData?.totp.some(
    (f) => f.status === "verified",
  );

  if (!hasVerifiedFactor) return null;

  if (ctx.pathname.startsWith("/api/")) {
    const isAllowed = MFA_EXEMPT_APIS.some((api) =>
      ctx.pathname.startsWith(api),
    );
    if (isAllowed) return null;
    return NextResponse.json(
      { error: "MFA verification required." },
      { status: 403 },
    );
  }

  return NextResponse.redirect(
    buildAuthMfaUrl({
      requestUrl: ctx.request.url,
      requestHeaders: ctx.request.headers,
      returnPath: `${ctx.pathname}${ctx.request.nextUrl.search}`,
    }),
  );
}
