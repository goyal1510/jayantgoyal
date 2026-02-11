import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest|pdf|ico)$).*)",
  ],
};

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
  const publicPaths = [
    "/",              // Portfolio / root (public)
    "/tools",         // Tech Tools is public
    "/weather",       // Weather is public
    "/custom-calculator", // Custom Calculator is public
    "/terms-conditions",  // Terms & Conditions is public
    "/github-stats",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/auth/callback", // Auth callback for email verification token exchange
    "/api/guest-login",
    "/api/contact",   // Contact form API
    "/api/github-loc", // GitHub LOC stats (public)
    "/api/account/terms-status", // Terms status check (returns safe defaults for unauthenticated)
    "/api/account/accept-terms", // Terms acceptance
    "/favicon_io/site.webmanifest",
    "/assets/",           // Static assets (favicons, images, etc.)
  ];

  const isPublic = publicPaths.some((path) => {
    if (path === "/" || path === "/weather" || path === "/custom-calculator" || path === "/terms-conditions") {
      // Exact match for these routes
      return pathname === path;
    }
    return pathname.startsWith(path);
  });

  // If Supabase config is missing, allow public pages and block protected ones.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublic) {
      return response;
    }
    // Redirect to login with return URL
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthed = Boolean(user);
  // Use Supabase's built-in anonymous user detection
  const isAnonymous = user?.is_anonymous === true;
  const termsAccepted = isAnonymous || user?.user_metadata?.terms_accepted === true;

  response.headers.set("x-auth-status", isAuthed ? "authed" : "anon");
  response.headers.set("x-terms-accepted", termsAccepted ? "true" : "false");

  // Block protected API routes if terms not accepted (except terms-related APIs)
  if (isAuthed && !termsAccepted && pathname.startsWith("/api/")) {
    const allowedApis = [
      "/api/account/terms-status",
      "/api/account/accept-terms",
      "/api/account/profile",
      "/api/account/mfa-cleanup",
    ];
    const isAllowedApi = allowedApis.some((api) => pathname.startsWith(api));
    if (!isAllowedApi) {
      return NextResponse.json(
        { error: "You must accept the Terms and Conditions to use this feature." },
        { status: 403 }
      );
    }
  }

  if (!isAuthed && !isPublic) {
    // Redirect to login with return URL
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthed && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
    // Allow anonymous users to access signup page to convert to permanent account
    if (isAnonymous && pathname.startsWith("/signup")) {
      return response;
    }

    // Allow users who just verified their email to access signup page to set password
    // This happens when anonymous user verifies email - they're no longer anonymous but need to set password
    const isVerified = request.nextUrl.searchParams.get("verified") === "true";
    if (isVerified && pathname.startsWith("/signup")) {
      return response;
    }

    // Check if there's a redirect URL
    const redirectUrl = request.nextUrl.searchParams.get("redirect");
    if (redirectUrl && redirectUrl.startsWith("/")) {
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}
