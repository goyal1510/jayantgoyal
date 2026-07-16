import { NextRequest, NextResponse } from "next/server";

import { createSupabaseProxyClient } from "@repo/auth/proxy";
import { safeRedirectPath } from "@repo/auth/redirects";

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin !== requestUrl.origin) {
    return NextResponse.json(
      { error: "invalid_origin" },
      { status: 403, headers: { "cache-control": "no-store" } },
    );
  }

  const next = safeRedirectPath(requestUrl.searchParams.get("next"), "/login");
  const response = NextResponse.redirect(new URL(next, request.url), {
    status: 303,
  });
  response.headers.set("cache-control", "no-store");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/login?error=config", request.url), {
      status: 303,
    });
  }

  const supabase = createSupabaseProxyClient({
    supabaseUrl,
    supabaseAnonKey,
    responseStore: {
      getAll: () => request.cookies.getAll(),
      setCookie: (name, value, options) => {
        response.cookies.set(name, value, options);
      },
      setHeader: (name, value) => response.headers.set(name, value),
    },
  });
  await supabase.auth.signOut({ scope: "local" });
  return response;
}
