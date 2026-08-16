import { NextResponse, type NextRequest } from "next/server";

import {
  buildAuthLoginUrl,
  buildAuthMfaUrl,
} from "@jayantgoyal/web-auth/entry";
import {
  copyAuthCacheHeaders,
  createSupabaseRequestClient,
} from "@jayantgoyal/web-auth/server";

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|pdf|ico)$).*)",
  ],
};

function withAuthState(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    target.cookies.set(name, value, options);
  });
  copyAuthCacheHeaders(source.headers, target.headers);
  return target;
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === "/welcome") {
    return NextResponse.redirect(
      buildAuthLoginUrl({
        requestUrl: request.url,
        requestHeaders: request.headers,
        returnPath: request.nextUrl.searchParams.get("redirect"),
      }),
    );
  }

  if (pathname === "/mfa-verify") {
    return NextResponse.redirect(
      buildAuthMfaUrl({
        requestUrl: request.url,
        requestHeaders: request.headers,
        returnPath: request.nextUrl.searchParams.get("redirect"),
      }),
    );
  }

  // Skip proxy for static asset files (matcher regex may not catch all cases)
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|pdf|ico)$/i.test(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/robots.txt") {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const response = NextResponse.next({ request: { headers: request.headers } });

  // Public paths that don't require authentication
  const publicPaths = ["/unauthorized", "/auth/callback"];

  const isPublic = publicPaths.includes(pathname);

  // If Supabase config is missing, allow public pages and block protected ones.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublic) {
      return response;
    }
    return NextResponse.redirect(
      buildAuthLoginUrl({
        requestUrl: request.url,
        requestHeaders: request.headers,
        returnPath: `${pathname}${request.nextUrl.search}`,
      }),
    );
  }

  const supabase = await createSupabaseRequestClient({
    supabaseUrl,
    supabaseAnonKey,
    requestCookies: request.cookies,
    responseCookies: response.cookies,
    responseHeaders: response.headers,
    hostname: request.nextUrl.hostname,
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthed = Boolean(user);

  response.headers.set("x-auth-status", isAuthed ? "authed" : "anon");

  // --- Unauthenticated users ---
  if (!isAuthed) {
    if (!isPublic) {
      return withAuthState(
        response,
        NextResponse.redirect(
          buildAuthLoginUrl({
            requestUrl: request.url,
            requestHeaders: request.headers,
            returnPath: `${pathname}${request.nextUrl.search}`,
          }),
        ),
      );
    }
    return response;
  }

  // --- Everything below requires authentication ---

  // MFA enforcement: if user has TOTP enrolled but is at AAL1, block everything except
  // the MFA verify page, auth callback, and essential APIs.
  if (pathname.startsWith("/auth/callback")) return response;

  const { data: aalData } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const needsMfa =
    aalData?.currentLevel === "aal1" && aalData?.nextLevel === "aal2";

  if (needsMfa) {
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const hasVerifiedFactor = factorsData?.totp.some(
      (f) => f.status === "verified",
    );

    if (hasVerifiedFactor) {
      if (pathname.startsWith("/api/")) {
        return withAuthState(
          response,
          NextResponse.json(
            { error: "MFA verification required." },
            { status: 403 },
          ),
        );
      }

      return withAuthState(
        response,
        NextResponse.redirect(
          buildAuthMfaUrl({
            requestUrl: request.url,
            requestHeaders: request.headers,
            returnPath: `${pathname}${request.nextUrl.search}`,
          }),
        ),
      );
    }
  }

  // Admin role check (skip only for the unauthorized page).
  if (!isPublic && pathname !== "/unauthorized") {
    const { data: profile } = await supabase
      .schema("jg_account")
      .from("profiles")
      .select("role")
      .eq("user_id", user!.id)
      .single();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return withAuthState(
        response,
        NextResponse.redirect(new URL("/unauthorized", request.url)),
      );
    }

    response.headers.set("x-user-role", profile.role);
  }

  return response;
}
