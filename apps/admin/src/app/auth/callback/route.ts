import { NextRequest, NextResponse } from "next/server";
import { createSupabaseProxyClient } from "@repo/auth/proxy";
import { safeRedirectPath } from "@repo/auth/redirects";

function copyResponseState(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    target.cookies.set(name, value, options);
  });
  source.headers.forEach((value, name) => {
    if (name !== "location") target.headers.set(name, value);
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"), "/", request.url);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !code) {
    return NextResponse.redirect(new URL("/welcome?error=auth", request.url));
  }

  const redirectUrl = new URL(next, request.url);
  const response = NextResponse.redirect(redirectUrl);

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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const errorResponse = NextResponse.redirect(
      new URL("/welcome?error=auth", request.url),
    );
    copyResponseState(response, errorResponse);
    return errorResponse;
  }

  // Always redirect through /mfa-verify after OAuth — the page checks
  // if MFA is actually needed and redirects through if not.
  const mfaUrl = new URL("/mfa-verify", request.url);
  mfaUrl.searchParams.set("redirect", next);
  const mfaResponse = NextResponse.redirect(mfaUrl);
  copyResponseState(response, mfaResponse);
  return mfaResponse;
}
