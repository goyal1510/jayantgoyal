import { NextResponse } from "next/server";
import type { ProxyContext } from "./types";

/** APIs allowed during recovery mode */
const RECOVERY_APIS = ["/api/account/init"];

/** Pages allowed during recovery mode */
const RECOVERY_PAGES = [
  "/reset-password",
  "/welcome",
  "/forgot-password",
  "/auth/callback",
];

/**
 * Recovery mode middleware.
 * When the recovery_mode cookie is set (password reset flow), lock the user
 * to only the reset-password page and essential APIs.
 */
export async function recoveryMiddleware(
  ctx: ProxyContext,
): Promise<NextResponse | null> {
  if (!ctx.isAuthed) return null;

  const isRecoveryMode =
    ctx.request.cookies.get("recovery_mode")?.value === "true";
  if (!isRecoveryMode) return null;

  // Block non-essential APIs
  if (ctx.pathname.startsWith("/api/")) {
    const isAllowed = RECOVERY_APIS.some((api) => ctx.pathname.startsWith(api));
    if (isAllowed) return null;

    return NextResponse.json(
      { error: "Complete your password reset first." },
      { status: 403 },
    );
  }

  // Allow recovery pages
  const isRecoveryPage = RECOVERY_PAGES.some((p) => ctx.pathname.startsWith(p));
  if (isRecoveryPage) return null;

  // Block everything else
  return NextResponse.redirect(new URL("/reset-password", ctx.request.url));
}
