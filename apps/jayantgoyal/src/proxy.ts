import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { runMiddleware } from "@/proxy/runner";
import { mfaMiddleware } from "@/proxy/mfa";
import { recoveryMiddleware } from "@/proxy/recovery";
import { termsMiddleware } from "@/proxy/terms";
import { routeGuardMiddleware } from "@/proxy/route-guard";
import type { ProxyContext } from "@/proxy/types";

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|pdf|ico)$).*)",
  ],
};

/** Truly public paths — no Supabase calls needed at all */
const STATIC_PUBLIC_PATHS = [
  "/api/contact",
  "/api/github-loc",
  "/favicon_io/site.webmanifest",
  "/assets/",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
];

/** Pages that need auth check but are publicly accessible */
const PUBLIC_PAGES = [
  "/",
  "/tools",
  "/weather",
  "/custom-calculator",
  "/terms-conditions",
  "/github-stats",
  "/welcome",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/api/account/terms-status",
  "/api/account/accept-terms",
];

const EXACT_MATCH = new Set(["/", "/weather", "/custom-calculator", "/terms-conditions"]);

function isStaticPublic(pathname: string): boolean {
  return STATIC_PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGES.some((p) => {
    if (EXACT_MATCH.has(p)) return pathname === p;
    return pathname.startsWith(p);
  });
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip proxy for static assets
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|pdf|ico)$/i.test(pathname)) {
    return NextResponse.next();
  }

  // Static public paths — zero Supabase calls, instant pass-through
  if (isStaticPublic(pathname)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Clone request headers so we can add x-user-id for downstream route handlers
  const requestHeaders = new Headers(request.headers);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const isPublic = isPublicPage(pathname);

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublic || isStaticPublic(pathname)) return response;
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // getUser() — authenticates against Supabase Auth server (secure).
  // This is the ONLY Supabase call in the proxy for most requests.
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthed = Boolean(user);

  // Terms: read from cookie (set by accept-terms API). No DB query.
  const termsAccepted = isAuthed
    ? request.cookies.get("terms_accepted")?.value === "true"
    : false;

  // AAL: decode from access token cookie (no API call).
  // The JWT is cryptographically signed — we only read the aal claim for routing.
  let aalLevel: string | null = null;
  const tokenCookieName = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
  const tokenCookie = request.cookies.get(tokenCookieName)?.value
    ?? request.cookies.get(`${tokenCookieName}.0`)?.value;
  if (tokenCookie) {
    try {
      const raw = tokenCookie.startsWith("base64-")
        ? atob(tokenCookie.slice(7))
        : tokenCookie;
      const parsed = JSON.parse(raw) as { access_token?: string } | string;
      const accessToken = typeof parsed === "string" ? parsed : parsed.access_token;
      if (accessToken) {
        const payload = JSON.parse(atob(accessToken.split(".")[1]!)) as { aal?: string };
        aalLevel = payload.aal ?? null;
      }
    } catch {
      aalLevel = null;
    }
  }

  // Pass verified user ID to downstream route handlers via request header.
  // Route handlers read request.headers.get("x-user-id") to skip redundant getUser().
  if (user) {
    requestHeaders.set("x-user-id", user.id);
  }

  const ctx: ProxyContext = {
    request,
    response,
    supabase,
    user,
    pathname,
    isAuthed,
    termsAccepted,
    isPublic,
    aalLevel,
  };

  return runMiddleware(ctx, [
    routeGuardMiddleware,
    mfaMiddleware,
    recoveryMiddleware,
    termsMiddleware,
  ]);
}
