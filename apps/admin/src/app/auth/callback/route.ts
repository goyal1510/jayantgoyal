import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/welcome?error=config", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/welcome?error=auth", request.url));
  }

  const redirectUrl = new URL(next, request.url);
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/welcome?error=auth", request.url));
  }

  // Check MFA using a client that reads from RESPONSE cookies (where the new session lives)
  const postAuthSupabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return response.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: factorsData } = await postAuthSupabase.auth.mfa.listFactors();
  const hasVerifiedFactor = factorsData?.totp.some((f) => f.status === "verified");
  if (hasVerifiedFactor) {
    const mfaUrl = new URL(next !== "/" ? `/mfa-verify?redirect=${encodeURIComponent(next)}` : "/mfa-verify", request.url);
    const mfaResponse = NextResponse.redirect(mfaUrl);
    response.cookies.getAll().forEach(({ name, value, ...options }) => {
      mfaResponse.cookies.set(name, value, options);
    });
    return mfaResponse;
  }

  return response;
}
