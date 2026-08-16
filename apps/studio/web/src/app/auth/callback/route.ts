import { NextRequest, NextResponse } from "next/server";

import { buildAuthMfaUrl } from "@jayantgoyal/web-auth/entry";
import { safeReturnPath } from "@jayantgoyal/web-auth/redirects";
import {
  copyAuthCacheHeaders,
  createSupabaseRequestClient,
} from "@jayantgoyal/web-auth/server";
import { syncProfileNamesFromIdentities } from "@jayantgoyal/web-auth/profile";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  const authRedirect = request.cookies.get("auth_redirect")?.value;
  const rawNext = authRedirect || requestUrl.searchParams.get("next") || "/";
  const next = safeReturnPath(rawNext);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  const redirectUrl = new URL(next, request.url);
  redirectUrl.searchParams.set("login_success", "true");
  const response = NextResponse.redirect(redirectUrl);

  if (authRedirect) {
    response.cookies.set("auth_redirect", "", { path: "/", maxAge: 0 });
  }

  const supabase = await createSupabaseRequestClient({
    supabaseUrl,
    supabaseAnonKey,
    requestCookies: request.cookies,
    responseCookies: response.cookies,
    responseHeaders: response.headers,
    hostname: request.nextUrl.hostname,
  });

  // Handle PKCE flow (code-based) — used by Google OAuth and email verification
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const errorResponse = NextResponse.redirect(
        new URL("/welcome", request.url),
      );
      response.cookies.getAll().forEach(({ name, value, ...options }) => {
        errorResponse.cookies.set(name, value, options);
      });
      copyAuthCacheHeaders(response.headers, errorResponse.headers);
      return errorResponse;
    }

    if (data?.user) {
      await syncProfileNamesFromIdentities(supabase, data.user);

      const mfaResponse = NextResponse.redirect(
        buildAuthMfaUrl({
          requestUrl: request.url,
          requestHeaders: request.headers,
          returnPath: next,
        }),
      );
      response.cookies.getAll().forEach(({ name, value, ...options }) => {
        mfaResponse.cookies.set(name, value, options);
      });
      copyAuthCacheHeaders(response.headers, mfaResponse.headers);
      return mfaResponse;
    }

    // No MFA — redirect directly to target (single redirect, no spinner flash)
    return response;
  }

  // Handle token_hash flow (magic link / email verification)
  if (token_hash && type) {
    const isRecovery = type === "recovery";
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "email_change" | "signup" | "recovery" | "invite",
    });
    if (error) {
      const errorResponse = NextResponse.redirect(
        new URL("/welcome", request.url),
      );
      response.cookies.getAll().forEach(({ name, value, ...options }) => {
        errorResponse.cookies.set(name, value, options);
      });
      copyAuthCacheHeaders(response.headers, errorResponse.headers);
      return errorResponse;
    }

    if (isRecovery) {
      const recoveryResponse = NextResponse.redirect(
        buildAuthMfaUrl({
          requestUrl: request.url,
          requestHeaders: request.headers,
          returnPath: "/reset-password",
        }),
      );
      response.cookies.getAll().forEach(({ name, value, ...options }) => {
        recoveryResponse.cookies.set(name, value, options);
      });
      copyAuthCacheHeaders(response.headers, recoveryResponse.headers);
      recoveryResponse.cookies.set("recovery_mode", "true", {
        path: "/",
        maxAge: 3600,
        sameSite: "lax",
      });
      return recoveryResponse;
    }

    return response;
  }

  return NextResponse.redirect(new URL("/welcome", request.url));
}
