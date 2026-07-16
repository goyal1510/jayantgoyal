import { NextRequest, NextResponse } from "next/server";

import { resolvePlatformSessionConfig } from "@repo/auth/cookies";
import { createSupabaseProxyClient } from "@repo/auth/proxy";
import { safeRedirectPath } from "@repo/auth/redirects";

function copyResponseState(source: NextResponse, target: NextResponse) {
  source.cookies
    .getAll()
    .forEach(({ name, value, ...options }) =>
      target.cookies.set(name, value, options),
    );
  source.headers.forEach((value, name) => {
    if (name !== "location") target.headers.set(name, value);
  });
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = safeRedirectPath(requestUrl.searchParams.get("next"), "/");
  const code = requestUrl.searchParams.get("code");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !code) {
    return NextResponse.redirect(
      new URL(
        `/login?error=invalid_callback&next=${encodeURIComponent(next)}`,
        request.url,
      ),
    );
  }

  const response = NextResponse.redirect(new URL(next, request.url));
  const supabase = createSupabaseProxyClient({
    supabaseUrl,
    supabaseAnonKey,
    platformSession: resolvePlatformSessionConfig({
      enabled: process.env.PLATFORM_SESSION_ENABLED === "true",
      hostname: requestUrl.hostname,
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
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const errorResponse = NextResponse.redirect(
      new URL(
        `/login?error=callback_failed&next=${encodeURIComponent(next)}`,
        request.url,
      ),
    );
    copyResponseState(response, errorResponse);
    return errorResponse;
  }
  return response;
}
