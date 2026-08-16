import { NextResponse } from "next/server";

import { buildAuthLoginUrl } from "@jayant/web-auth/entry";

import type { ProxyContext } from "./types";

/**
 * Route guard middleware.
 * Redirect unauthenticated protected requests to the canonical Auth owner.
 */
export async function routeGuardMiddleware(
  ctx: ProxyContext,
): Promise<NextResponse | null> {
  // Unauthenticated on protected route → redirect to welcome
  if (!ctx.isAuthed && !ctx.isPublic) {
    return NextResponse.redirect(
      buildAuthLoginUrl({
        requestUrl: ctx.request.url,
        requestHeaders: ctx.request.headers,
        returnPath: `${ctx.pathname}${ctx.request.nextUrl.search}`,
      }),
    );
  }

  return null;
}
