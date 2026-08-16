import { NextResponse } from "next/server";
import type { ProxyContext } from "./types";

/** APIs allowed without accepting terms */
const TERMS_EXEMPT_APIS = [
  "/api/account/init",
  "/api/account/accept-terms",
];

/**
 * Terms acceptance middleware.
 * Block protected API routes if the user hasn't accepted terms.
 */
export async function termsMiddleware(ctx: ProxyContext): Promise<NextResponse | null> {
  if (!ctx.isAuthed || ctx.termsAccepted) return null;
  if (!ctx.pathname.startsWith("/api/")) return null;

  const isAllowed = TERMS_EXEMPT_APIS.some((api) => ctx.pathname.startsWith(api));
  if (isAllowed) return null;

  return NextResponse.json(
    { error: "You must accept the Terms and Conditions to use this feature." },
    { status: 403 }
  );
}
