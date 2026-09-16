import { NextResponse, type NextRequest } from "next/server";

import {
  buildAuthLoginUrl,
  buildAuthMfaUrl,
} from "@jayantgoyal/web-auth/entry";
import { checkProductAccess } from "@jayantgoyal/web-auth/authorization";
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

const PUBLIC_PATHS = new Set(["/", "/welcome", "/no-access", "/auth/callback"]);

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith("/public/");
}
const AUTHENTICATED_ENTRY_PATHS = new Set(["/invite/accept"]);

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

  if (/\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|pdf|ico)$/i.test(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/robots.txt") {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const response = NextResponse.next({ request: { headers: request.headers } });
  const isPublic = isPublicPath(pathname);

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublic) return response;
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

  if (!isAuthed) {
    if (isPublic) return response;
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

  if (pathname.startsWith("/auth/callback")) return response;

  const { data: aalData } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const needsMfa =
    aalData?.currentLevel === "aal1" && aalData?.nextLevel === "aal2";

  if (needsMfa) {
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const hasVerifiedFactor = factorsData?.totp.some(
      (factor) => factor.status === "verified",
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

  const productAccess = (await checkProductAccess(supabase, "orbit")).allowed;
  response.headers.set(
    "x-orbit-access",
    productAccess ? "granted" : "denied",
  );

  if (
    isAuthed &&
    AUTHENTICATED_ENTRY_PATHS.has(pathname) &&
    !productAccess
  ) {
    return response;
  }

  if (!isPublic && !productAccess) {
    if (pathname.startsWith("/api/")) {
      return withAuthState(
        response,
        NextResponse.json(
          { error: "Orbit access is not assigned." },
          { status: 403 },
        ),
      );
    }

    if (pathname !== "/no-access") {
      return withAuthState(
        response,
        NextResponse.redirect(new URL("/no-access", request.url)),
      );
    }
  }

  if (productAccess && (pathname === "/" || pathname === "/no-access")) {
    return withAuthState(
      response,
      NextResponse.redirect(new URL("/home", request.url)),
    );
  }

  return response;
}
