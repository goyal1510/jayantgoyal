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

/** Zero-cost paths — instant pass-through, no Supabase at all */
const ZERO_COST_PATHS = [
  "/api/contact",
  "/api/github-loc",
  "/favicon_io/site.webmanifest",
  "/assets/",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
  "/opengraph-image",
  "/twitter-image",
];

/** Public pages — viewable without auth. Skip getUser(), use fast cookie check. */
const PUBLIC_PAGES = [
  "/",
  "/tools",
  "/weather",
  "/custom-calculator",
  "/terms-conditions",
  "/github-stats",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

/** Auth-gated public paths — still public but need auth state for redirect logic */
const AUTH_PUBLIC_PATHS = [
  "/welcome",
  "/mfa-verify",
  "/api/account/terms-status",
  "/api/account/accept-terms",
  "/api/account/init",
];

const EXACT_MATCH = new Set(["/", "/weather", "/custom-calculator", "/terms-conditions"]);

function matchPath(pathname: string, paths: string[]): boolean {
  return paths.some((p) => {
    if (EXACT_MATCH.has(p)) return pathname === p;
    return pathname.startsWith(p);
  });
}

/** Decode AAL from JWT in auth cookie. No network call. */
function getAalFromCookie(request: NextRequest, supabaseUrl: string): string | null {
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const tokenName = `sb-${projectRef}-auth-token`;
  const cookie = request.cookies.get(tokenName)?.value
    ?? request.cookies.get(`${tokenName}.0`)?.value;
  if (!cookie) return null;
  try {
    const raw = cookie.startsWith("base64-") ? atob(cookie.slice(7)) : cookie;
    const parsed = JSON.parse(raw) as { access_token?: string } | string;
    const token = typeof parsed === "string" ? parsed : parsed.access_token;
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]!)) as { aal?: string };
    return payload.aal ?? null;
  } catch {
    return null;
  }
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Static assets — skip entirely
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|pdf|ico)$/i.test(pathname)) {
    return NextResponse.next();
  }

  // Zero-cost paths — instant pass-through
  if (ZERO_COST_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const requestHeaders = new Headers(request.headers);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (!supabaseUrl || !supabaseAnonKey) {
    const isPublic = matchPath(pathname, PUBLIC_PAGES) || matchPath(pathname, AUTH_PUBLIC_PATHS);
    if (isPublic) return response;
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  const isPublicPage = matchPath(pathname, PUBLIC_PAGES);

  // ──────────────────────────────────────────────────────────────
  // PUBLIC PAGES — fast path. No getUser() call (~800ms saved).
  // Just check if auth cookies exist for sidebar login/logout state.
  // ──────────────────────────────────────────────────────────────
  if (isPublicPage) {
    return response;
  }

  // ──────────────────────────────────────────────────────────────
  // PROTECTED PAGES + AUTH PATHS — full auth check with getUser()
  // ──────────────────────────────────────────────────────────────
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

  const { data: { user } } = await supabase.auth.getUser();
  const isAuthed = Boolean(user);

  const termsAccepted = isAuthed
    ? request.cookies.get("terms_accepted")?.value === "true"
    : false;

  const aalLevel = getAalFromCookie(request, supabaseUrl);

  if (user) {
    requestHeaders.set("x-user-id", user.id);
  }

  const isPublic = matchPath(pathname, AUTH_PUBLIC_PATHS);

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
