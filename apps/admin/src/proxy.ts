import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseProxyClient } from "@repo/auth/proxy";
import { isAdminRole } from "@repo/auth/permissions";
import { safeRedirectPath } from "@repo/auth/redirects";

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|pdf|ico)$).*)",
  ],
};

// APIs safe to call without completing MFA
const UNRESTRICTED_APIS = ["/api/account/profile", "/api/account/mfa-cleanup"];

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip proxy for static asset files (matcher regex may not catch all cases)
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|pdf|ico)$/i.test(pathname)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const response = NextResponse.next({ request: { headers: request.headers } });

  // Public paths that don't require authentication
  const publicPaths = ["/welcome", "/unauthorized", "/auth/callback"];

  const isPublic = publicPaths.some((path) => pathname.startsWith(path));

  // If Supabase config is missing, allow public pages and block protected ones.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublic) {
      return response;
    }
    const loginUrl = new URL("/welcome", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createSupabaseProxyClient({
    supabaseUrl,
    supabaseAnonKey,
    responseStore: {
      getAll: () => request.cookies.getAll(),
      setCookie: (name, value, options) => {
        response.cookies.set(name, value, options);
      },
      setHeader: (name, value) => {
        response.headers.set(name, value);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthed = Boolean(user);

  response.headers.set("x-auth-status", isAuthed ? "authed" : "anon");

  // --- Unauthenticated users ---
  if (!isAuthed) {
    if (!isPublic) {
      const loginUrl = new URL("/welcome", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // --- Everything below requires authentication ---

  // MFA enforcement: if user has TOTP enrolled but is at AAL1, block everything except
  // the MFA verify page, auth callback, and essential APIs.
  if (pathname.startsWith("/auth/callback")) return response;

  const { data: aalData } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const needsMfaLevel =
    aalData?.currentLevel === "aal1" && aalData?.nextLevel === "aal2";
  if (needsMfaLevel) {
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const hasVerifiedFactor = factorsData?.totp.some(
      (f) => f.status === "verified",
    );
    if (hasVerifiedFactor) {
      if (pathname.startsWith("/mfa-verify")) {
        return response;
      }

      if (pathname.startsWith("/api/")) {
        const isAllowed = UNRESTRICTED_APIS.some((api) =>
          pathname.startsWith(api),
        );
        if (!isAllowed) {
          return NextResponse.json(
            { error: "MFA verification required." },
            { status: 403 },
          );
        }
        return response;
      }

      const mfaUrl = new URL("/mfa-verify", request.url);
      if (pathname !== "/") {
        mfaUrl.searchParams.set("redirect", pathname);
      }
      return NextResponse.redirect(mfaUrl);
    }
  }

  // Redirect authenticated users away from welcome page
  if (pathname.startsWith("/welcome")) {
    const redirectUrl = request.nextUrl.searchParams.get("redirect");
    const safeRedirect = safeRedirectPath(redirectUrl, "/", request.url);
    if (safeRedirect !== "/") {
      return NextResponse.redirect(new URL(safeRedirect, request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Admin role check (skip for unauthorized page and MFA verify)
  if (
    !isPublic &&
    pathname !== "/unauthorized" &&
    !pathname.startsWith("/mfa-verify")
  ) {
    const { data: profile } = await supabase
      .schema("jg_account")
      .from("profiles")
      .select("role")
      .eq("user_id", user!.id)
      .single();

    if (!profile || !isAdminRole(profile.role)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    response.headers.set("x-user-role", profile.role);
  }

  return response;
}
