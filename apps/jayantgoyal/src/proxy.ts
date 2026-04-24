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

/** Public paths that don't require authentication */
const PUBLIC_PATHS = [
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
  "/api/contact",
  "/api/github-loc",
  "/api/account/terms-status",
  "/api/account/accept-terms",
  "/favicon_io/site.webmanifest",
  "/assets/",
];

/** Paths that require exact match instead of prefix match */
const EXACT_MATCH_PATHS = new Set(["/", "/weather", "/custom-calculator", "/terms-conditions"]);

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => {
    if (EXACT_MATCH_PATHS.has(path)) return pathname === path;
    return pathname.startsWith(path);
  });
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip proxy for static asset files
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|pdf|ico)$/i.test(pathname)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const response = NextResponse.next({ request: { headers: request.headers } });
  const isPublic = isPublicPath(pathname);

  // If Supabase config is missing, allow public pages and block protected ones
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublic) return response;
    const loginUrl = new URL("/welcome", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Create Supabase client
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

  // Resolve auth state
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthed = Boolean(user);

  // Resolve terms state
  let termsAccepted = false;
  if (isAuthed) {
    const { data: profile } = await supabase
      .schema("jg_account")
      .from("profiles")
      .select("terms_accepted")
      .eq("user_id", user!.id)
      .single();
    termsAccepted = profile?.terms_accepted === true;
  }

  // Set response headers
  response.headers.set("x-auth-status", isAuthed ? "authed" : "anon");
  response.headers.set("x-terms-accepted", termsAccepted ? "true" : "false");

  // Build context and run middleware chain
  const ctx: ProxyContext = {
    request,
    response,
    supabase,
    user,
    pathname,
    isAuthed,
    termsAccepted,
    isPublic,
  };

  return runMiddleware(ctx, [
    routeGuardMiddleware,   // 1. Redirect unauthenticated to /welcome, authed away from /welcome
    mfaMiddleware,          // 2. MFA enforcement — block pages + APIs at AAL1
    recoveryMiddleware,     // 3. Recovery mode — lock to /reset-password + essential APIs
    termsMiddleware,        // 4. Terms — block APIs if not accepted
  ]);
}
