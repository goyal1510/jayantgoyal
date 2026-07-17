import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseRequestClient } from "@repo/auth/server";
import {
  hasAuthSessionCookie,
  resolveAuthSessionMode,
} from "@repo/auth/cookies";
import { buildAuthLoginUrl, resolveAuthFlowOwner } from "@repo/auth/entry";

import { runMiddleware } from "@/proxy/runner";
import { mfaMiddleware } from "@/proxy/mfa";
import { recoveryMiddleware } from "@/proxy/recovery";
import { termsMiddleware } from "@/proxy/terms";
import { routeGuardMiddleware } from "@/proxy/route-guard";
import type { ProxyContext } from "@/proxy/types";
import { matchesPathOrChild } from "@/lib/seo/config";

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
  "/api/github-stats",
  "/api/resume",
  "/favicon_io/site.webmanifest",
  "/assets/",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
  "/opengraph-image",
  "/twitter-image",
  "/.well-known/",
  "/llms.txt",
];

/** Public pages — viewable without auth. Skip getUser(), use fast cookie check. */
const PUBLIC_PAGES = [
  "/",
  "/about",
  "/products",
  "/tools",
  "/blogs",
  "/blog",
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
  "/api/account/accept-terms",
  "/api/account/init",
  "/api/tools/usage",
];

const EXACT_MATCH = new Set([
  "/",
  "/about",
  "/weather",
  "/custom-calculator",
  "/terms-conditions",
]);

function matchPath(pathname: string, paths: string[]): boolean {
  return paths.some((p) => {
    if (EXACT_MATCH.has(p)) return pathname === p;
    return matchesPathOrChild(pathname, p);
  });
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/welcome" && resolveAuthFlowOwner() === "auth") {
    return NextResponse.redirect(
      buildAuthLoginUrl({
        requestUrl: request.url,
        returnPath: request.nextUrl.searchParams.get("redirect"),
      }),
    );
  }

  // Static assets — skip entirely
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|pdf|ico)$/i.test(pathname)) {
    return NextResponse.next();
  }

  // Markdown for Agents: when Accept: text/markdown, serve llms.txt
  if (request.headers.get("accept")?.includes("text/markdown")) {
    const res = NextResponse.rewrite(new URL("/llms.txt", request.url));
    res.headers.set("Content-Type", "text/markdown; charset=utf-8");
    return res;
  }

  // Zero-cost paths — instant pass-through
  if (ZERO_COST_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authSessionMode = resolveAuthSessionMode();
  const requestHeaders = new Headers(request.headers);
  // Strip internal headers to prevent client forgery
  requestHeaders.delete("x-page-public");
  requestHeaders.delete("x-user-id");
  requestHeaders.delete("x-user-email");
  requestHeaders.delete("x-pathname");
  requestHeaders.set("x-pathname", pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (!supabaseUrl || !supabaseAnonKey) {
    const isPublic =
      matchPath(pathname, PUBLIC_PAGES) ||
      matchPath(pathname, AUTH_PUBLIC_PATHS);
    if (isPublic) return response;
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  const isPublicPage = matchPath(pathname, PUBLIC_PAGES);

  // ──────────────────────────────────────────────────────────────
  // PUBLIC PAGES — fast path. No getUser() call (~800ms saved).
  // Just check if auth cookies exist for sidebar login/logout state.
  // ──────────────────────────────────────────────────────────────
  if (isPublicPage) {
    requestHeaders.set("x-page-public", "true");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ──────────────────────────────────────────────────────────────
  // PAGE ROUTES (non-API) — allow unauthenticated access for SEO.
  // Auth gate is handled at the layout level, not the proxy.
  // Skip getUser() entirely when no auth cookie exists.
  // ──────────────────────────────────────────────────────────────
  if (
    !pathname.startsWith("/api/") &&
    !hasAuthSessionCookie({
      supabaseUrl,
      hostname: request.nextUrl.hostname,
      mode: authSessionMode,
      cookies: request.cookies.getAll(),
    })
  ) {
    return response;
  }

  // ──────────────────────────────────────────────────────────────
  // PROTECTED PAGES + AUTH PATHS — full auth check with getUser()
  // ──────────────────────────────────────────────────────────────
  const supabase = await createSupabaseRequestClient({
    supabaseUrl,
    supabaseAnonKey,
    requestCookies: request.cookies,
    responseCookies: response.cookies,
    responseHeaders: response.headers,
    hostname: request.nextUrl.hostname,
    sessionMode: authSessionMode,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = Boolean(user);

  // Trust httpOnly cookie as cache; fall back to DB check for API routes
  const termsCookie = request.cookies.get("terms_accepted")?.value === "true";
  let termsAccepted = isAuthed ? termsCookie : false;
  if (isAuthed && !termsAccepted && pathname.startsWith("/api/")) {
    const { data: profile } = await supabase
      .schema("jg_account")
      .from("profiles")
      .select("terms_accepted")
      .eq("user_id", user!.id)
      .single();
    termsAccepted = profile?.terms_accepted === true;
    if (termsAccepted) {
      response.cookies.set("terms_accepted", "true", {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  }

  const { data: aalData } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const aalLevel = aalData?.currentLevel ?? null;

  if (user) {
    requestHeaders.set("x-user-id", user.id);
    if (user.email) requestHeaders.set("x-user-email", user.email);
  }

  const isPublic =
    !pathname.startsWith("/api/") || matchPath(pathname, AUTH_PUBLIC_PATHS);

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
