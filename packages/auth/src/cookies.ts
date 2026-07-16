import type { CookieMethodsServer } from "@supabase/ssr";

import type { ResponseCookieStore, ServerCookieStore } from "./types";

/**
 * Adapt a framework request cookie store for page/server Supabase clients.
 * Response headers are intentionally ignored here because Next's page cookie
 * store cannot mutate response headers; middleware owns response promotion.
 */
export function createServerCookieMethods(
  cookieStore: ServerCookieStore,
): CookieMethodsServer {
  return {
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      } catch {
        // The cookies API can be read-only in edge/server-component contexts.
      }
    },
  };
}

/** Adapt middleware/route response cookies and cache-control headers. */
export function createResponseCookieMethods(
  responseStore: ResponseCookieStore,
): CookieMethodsServer {
  return {
    getAll: () => responseStore.getAll(),
    setAll: (cookiesToSet, headers) => {
      cookiesToSet.forEach(({ name, value, options }) => {
        responseStore.setCookie(name, value, options);
      });
      Object.entries(headers).forEach(([name, value]) => {
        responseStore.setHeader(name, value);
      });
    },
  };
}
