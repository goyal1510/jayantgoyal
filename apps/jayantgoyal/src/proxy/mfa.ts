import { NextResponse } from "next/server";
import type { ProxyContext } from "./types";

/** APIs that are safe to call without completing MFA */
const MFA_EXEMPT_APIS = [
  "/api/account/terms-status",
  "/api/account/accept-terms",
  "/api/account/profile",
  "/api/account/mfa-cleanup",
];

/**
 * MFA enforcement middleware.
 * If user has TOTP enrolled but hasn't verified (AAL1 → AAL2), block everything
 * except the MFA verify page and essential APIs.
 */
export async function mfaMiddleware(ctx: ProxyContext): Promise<NextResponse | null> {
  if (!ctx.isAuthed) return null;

  // Skip MFA check for auth callback — the route handler needs to
  // exchange the OAuth code before any MFA redirect can happen
  if (ctx.pathname.startsWith("/auth/callback")) return null;

  const { data: aalData } = await ctx.supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (aalData?.currentLevel !== "aal1" || aalData?.nextLevel !== "aal2") {
    return null;
  }

  const { data: factorsData } = await ctx.supabase.auth.mfa.listFactors();
  const hasVerifiedFactor = factorsData?.totp.some((f) => f.status === "verified");

  if (!hasVerifiedFactor) return null;

  // Allow MFA verify page
  if (ctx.pathname.startsWith("/mfa-verify")) return null;

  // Allow only essential APIs
  if (ctx.pathname.startsWith("/api/")) {
    const isAllowed = MFA_EXEMPT_APIS.some((api) => ctx.pathname.startsWith(api));
    if (isAllowed) return null;

    return NextResponse.json(
      { error: "MFA verification required." },
      { status: 403 }
    );
  }

  // Block everything else — redirect to MFA verify
  const mfaUrl = new URL("/mfa-verify", ctx.request.url);
  if (ctx.pathname !== "/") {
    mfaUrl.searchParams.set("redirect", ctx.pathname);
  }
  return NextResponse.redirect(mfaUrl);
}
