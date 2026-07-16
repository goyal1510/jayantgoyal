import { NextRequest, NextResponse } from "next/server";

import {
  promoteValidatedSessionCookies,
  resolvePlatformSessionConfig,
} from "@repo/auth/cookies";
import { createSupabaseProxyClient } from "@repo/auth/proxy";

function noStoreHeaders() {
  return { "cache-control": "no-store" };
}

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host : null;
  } catch {
    originHost = null;
  }
  const requestHost = request.headers.get("host") ?? requestUrl.host;
  if (!originHost || originHost !== requestHost) {
    return NextResponse.json(
      { error: "invalid_origin" },
      { status: 403, headers: noStoreHeaders() },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "config" },
      { status: 503, headers: noStoreHeaders() },
    );
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: noStoreHeaders() },
  );
  const platformSession = resolvePlatformSessionConfig({
    enabled: process.env.PLATFORM_SESSION_ENABLED === "true",
    hostname: requestUrl.hostname,
    supabaseUrl,
  });
  const supabase = createSupabaseProxyClient({
    supabaseUrl,
    supabaseAnonKey,
    platformSession,
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
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json(
      { error: "unauthenticated" },
      { status: 401, headers: noStoreHeaders() },
    );
  }

  if (platformSession) {
    promoteValidatedSessionCookies(
      request.cookies.getAll(),
      platformSession,
    ).forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
  }

  return response;
}
