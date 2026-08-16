import type { NextResponse } from "next/server";

import { copyAuthCacheHeaders } from "@jayant/web-auth/server";

import type { ProxyContext, ProxyMiddleware } from "./types";

/**
 * Runs middleware functions in sequence. Returns the first non-null response
 * (redirect or block), or the pass-through response if all middleware pass.
 */
export async function runMiddleware(
  ctx: ProxyContext,
  middlewares: ProxyMiddleware[]
): Promise<NextResponse> {
  for (const middleware of middlewares) {
    const result = await middleware(ctx);
    if (result) {
      ctx.response.cookies.getAll().forEach(({ name, value, ...options }) => {
        result.cookies.set(name, value, options);
      });
      copyAuthCacheHeaders(ctx.response.headers, result.headers);
      return result;
    }
  }
  return ctx.response;
}
