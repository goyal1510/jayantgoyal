import { NextResponse } from "next/server";
import type { ProxyContext } from "./types";

/**
 * Route guard middleware.
 * - Redirect unauthenticated users to /welcome on protected routes.
 * - Redirect authenticated users away from /welcome.
 */
export async function routeGuardMiddleware(ctx: ProxyContext): Promise<NextResponse | null> {
  // Unauthenticated on protected route → redirect to welcome
  if (!ctx.isAuthed && !ctx.isPublic) {
    const loginUrl = new URL("/welcome", ctx.request.url);
    loginUrl.searchParams.set("redirect", ctx.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated on welcome page → redirect away
  const isRecoveryMode = ctx.request.cookies.get("recovery_mode")?.value === "true";
  if (ctx.isAuthed && !isRecoveryMode && ctx.pathname.startsWith("/welcome")) {
    const redirectUrl = ctx.request.nextUrl.searchParams.get("redirect");
    if (redirectUrl && redirectUrl.startsWith("/")) {
      return NextResponse.redirect(new URL(redirectUrl, ctx.request.url));
    }
    return NextResponse.redirect(new URL("/", ctx.request.url));
  }

  return null;
}
