import { NextRequest, NextResponse } from "next/server";

import { safeReturnPath } from "@jayant/web-auth/redirects";
import {
  copyAuthCacheHeaders,
  createSupabaseRequestClient,
} from "@jayant/web-auth/server";
import { syncProfileNamesFromIdentities } from "@jayant/web-auth/profile";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeReturnPath(searchParams.get("next"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !code) {
    return NextResponse.redirect(new URL("/welcome?error=auth", request.url));
  }

  const redirectUrl = new URL(next, request.url);
  const response = NextResponse.redirect(redirectUrl);

  const supabase = await createSupabaseRequestClient({
    supabaseUrl,
    supabaseAnonKey,
    requestCookies: request.cookies,
    responseCookies: response.cookies,
    responseHeaders: response.headers,
    hostname: request.nextUrl.hostname,
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const errorResponse = NextResponse.redirect(
      new URL("/welcome?error=auth", request.url),
    );
    copyAuthCacheHeaders(response.headers, errorResponse.headers);
    response.cookies.getAll().forEach(({ name, value, ...options }) => {
      errorResponse.cookies.set(name, value, options);
    });
    return errorResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) await syncProfileNamesFromIdentities(supabase, user);

  // Always redirect through /mfa-verify after OAuth — the page checks
  // if MFA is actually needed and redirects through if not.
  const mfaUrl = new URL("/mfa-verify", request.url);
  mfaUrl.searchParams.set("redirect", next);
  const mfaResponse = NextResponse.redirect(mfaUrl);
  response.cookies.getAll().forEach(({ name, value, ...options }) => {
    mfaResponse.cookies.set(name, value, options);
  });
  copyAuthCacheHeaders(response.headers, mfaResponse.headers);
  return mfaResponse;
}
