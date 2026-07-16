import { NextRequest, NextResponse } from "next/server";

import { resolvePlatformSessionConfig } from "@repo/auth/cookies";
import { createSupabaseProxyClient } from "@repo/auth/proxy";

function noStoreHeaders() {
  return { "cache-control": "no-store" };
}

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url);
  if (request.headers.get("origin") !== requestUrl.origin) {
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

  return response;
}
