import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|webmanifest)$).*)",
  ],
};

export default async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const response = NextResponse.next({ request: { headers: request.headers } });
  const pathname = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = [
    "/",              // Root redirect (public)
    "/portfolio",     // Portfolio is public
    "/tools",         // Tech Tools is public
    "/weather",       // Weather is public
    "/custom-calculator", // Custom Calculator is public
    "/terms-conditions",  // Terms & Conditions is public
    "/login",
    "/signup",
    "/api/guest-login",
    "/api/contact",   // Contact form API
    "/api/account/terms-status", // Terms status check (returns safe defaults for unauthenticated)
    "/api/account/accept-terms", // Terms acceptance
    "/favicon_io/site.webmanifest",
  ];

  const isPublic = publicPaths.some((path) => {
    if (path === "/" || path === "/portfolio" || path === "/weather" || path === "/custom-calculator" || path === "/terms-conditions") {
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
  const guestEmail = process.env.GUEST_EMAIL_LOGIN;
  const isGuest = guestEmail && user?.email === guestEmail;
  const termsAccepted = isGuest || user?.user_metadata?.terms_accepted === true;

  response.headers.set("x-auth-status", isAuthed ? "authed" : "anon");
  response.headers.set("x-terms-accepted", termsAccepted ? "true" : "false");

  // Block protected API routes if terms not accepted (except terms-related APIs)
  if (isAuthed && !termsAccepted && pathname.startsWith("/api/")) {
    const allowedApis = [
      "/api/account/terms-status",
      "/api/account/accept-terms",
      "/api/account/profile",
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
    // Allow guest users to access signup page to create a real account
    if (isGuest && pathname.startsWith("/signup")) {
      return response;
    }

    // Check if there's a redirect URL
    const redirectUrl = request.nextUrl.searchParams.get("redirect");
    if (redirectUrl && redirectUrl.startsWith("/")) {
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    return NextResponse.redirect(new URL("/portfolio", request.url));
  }

  return response;
}
