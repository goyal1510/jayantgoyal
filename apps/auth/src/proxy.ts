import { NextResponse, type NextRequest } from "next/server";

import { resolvePlatformSessionConfig } from "@repo/auth/cookies";
import { createSupabaseProxyClient } from "@repo/auth/proxy";
import { safeRedirectPath } from "@repo/auth/redirects";

export const config = { matcher: ["/account/:path*", "/mfa/:path*"] };

export default async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/login?error=config", request.url));
  }
  const response = NextResponse.next();
  const supabase = createSupabaseProxyClient({
    supabaseUrl,
    supabaseAnonKey,
    platformSession: resolvePlatformSessionConfig({
      enabled: process.env.PLATFORM_SESSION_ENABLED === "true",
      hostname: request.nextUrl.hostname,
      supabaseUrl,
    }),
    responseStore: {
      getAll: () => request.cookies.getAll(),
      setCookie: (name, value, options) => {
        response.cookies.set(name, value, options);
      },
      setHeader: (name, value) => response.headers.set(name, value),
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      safeRedirectPath(request.nextUrl.pathname, "/"),
    );
    return NextResponse.redirect(loginUrl);
  }
  return response;
}
