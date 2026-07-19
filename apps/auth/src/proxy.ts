import { NextResponse, type NextRequest } from "next/server";

import {
  hasAuthSessionCookie,
  resolveAuthSessionMode,
} from "@repo/auth/cookies";
import {
  copyAuthCacheHeaders,
  createSupabaseRequestClient,
} from "@repo/auth/server";

import {
  hasRecentSignIn,
  isProtectedAuthPath,
  requiresAccountMfaStepUp,
} from "@/lib/auth/policy";

function copyAuthState(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    target.cookies.set(name, value, options);
  });
  copyAuthCacheHeaders(source.headers, target.headers);
  return target;
}

export default async function proxy(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/callback" ||
    request.nextUrl.pathname === "/auth/callback" ||
    request.nextUrl.pathname === "/callback/auth/callback"
  ) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const protectedRoute = isProtectedAuthPath(request.nextUrl.pathname);
  if (!supabaseUrl || !supabaseAnonKey) {
    return protectedRoute
      ? NextResponse.redirect(new URL("/error?code=configuration", request.url))
      : NextResponse.next();
  }

  const response = NextResponse.next();
  const mode = resolveAuthSessionMode();
  const hasSession = hasAuthSessionCookie({
    supabaseUrl,
    hostname: request.nextUrl.hostname,
    mode,
    cookies: request.cookies.getAll(),
  });
  if (!hasSession) {
    if (!protectedRoute) return response;
    const login = new URL("/welcome", request.url);
    login.searchParams.set(
      "return_to",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(login);
  }

  const supabase = await createSupabaseRequestClient({
    supabaseUrl,
    supabaseAnonKey,
    requestCookies: request.cookies,
    responseCookies: response.cookies,
    responseHeaders: response.headers,
    hostname: request.nextUrl.hostname,
    sessionMode: mode,
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (protectedRoute && !user) {
    const login = new URL("/welcome", request.url);
    login.searchParams.set(
      "return_to",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return copyAuthState(response, NextResponse.redirect(login));
  }

  if (user && request.nextUrl.pathname.startsWith("/account/")) {
    const { data: assurance } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (
      requiresAccountMfaStepUp({
        pathname: request.nextUrl.pathname,
        hasUser: true,
        currentLevel: assurance?.currentLevel,
        nextLevel: assurance?.nextLevel,
      })
    ) {
      const mfa = new URL("/mfa", request.url);
      mfa.searchParams.set(
        "return_to",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
      return copyAuthState(response, NextResponse.redirect(mfa));
    }
    if (
      assurance?.nextLevel !== "aal2" &&
      !hasRecentSignIn(user.last_sign_in_at)
    ) {
      const login = new URL("/welcome", request.url);
      login.searchParams.set(
        "return_to",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );
      return copyAuthState(response, NextResponse.redirect(login));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
