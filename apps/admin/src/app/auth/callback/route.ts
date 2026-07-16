import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !code) {
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

  // Always redirect through /mfa-verify after OAuth — the page checks
  // if MFA is actually needed and redirects through if not.
  const mfaUrl = new URL("/mfa-verify", request.url);
  mfaUrl.searchParams.set("redirect", next);
  const mfaResponse = NextResponse.redirect(mfaUrl);
  response.cookies.getAll().forEach(({ name, value, ...options }) => {
    mfaResponse.cookies.set(name, value, options);
  });
  return mfaResponse;
}
