import { NextRequest, NextResponse } from "next/server";

import { safeReturnPath } from "@jayant/web-auth/redirects";
import {
  copyAuthCacheHeaders,
  createSupabaseRequestClient,
} from "@jayant/web-auth/server";
import { createSupabaseServiceRoleClient } from "@jayant/web-auth/service-role";
import { syncProfileNamesFromIdentities } from "@jayant/web-auth/profile";


/** Check MFA via Admin API — no cookie dependency */
async function userHasMfa(userId: string): Promise<boolean> {
  try {
    const adminClient = createSupabaseServiceRoleClient();
    const { data, error } = await adminClient.auth.admin.mfa.listFactors({
      userId,
    });
    if (error || !data) return false;
    return data.factors.some(
      (factor) => factor.factor_type === "totp" && factor.status === "verified",
    );
  } catch {
    return false;
  }
}

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
    return NextResponse.redirect(new URL("/welcome?error=config", request.url));
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
      console.error("Auth callback error (code):", error.message);
      const errorResponse = NextResponse.redirect(
        new URL(
          `/welcome?error=${encodeURIComponent(error.message)}`,
          request.url,
        ),
      );
      response.cookies.getAll().forEach(({ name, value, ...options }) => {
        errorResponse.cookies.set(name, value, options);
      });
      copyAuthCacheHeaders(response.headers, errorResponse.headers);
      return errorResponse;
    }

    if (data?.user) {
      await syncProfileNamesFromIdentities(supabase, data.user);

      // Check MFA — only redirect to /mfa-verify if user actually has MFA enabled.
      // This avoids an unnecessary redirect (and spinner flash) for users without MFA.
      if (await userHasMfa(data.user.id)) {
        const mfaUrl = new URL("/mfa-verify", request.url);
        mfaUrl.searchParams.set("redirect", next);
        const mfaResponse = NextResponse.redirect(mfaUrl);
        response.cookies.getAll().forEach(({ name, value, ...options }) => {
          mfaResponse.cookies.set(name, value, options);
        });
        copyAuthCacheHeaders(response.headers, mfaResponse.headers);
        return mfaResponse;
      }
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
      console.error("Auth callback error (token_hash):", error.message);
      const friendlyMessage = isRecovery
        ? "This password reset link is invalid or has expired. Please request a new one."
        : error.message;
      const errorResponse = NextResponse.redirect(
        new URL(
          `/welcome?error=${encodeURIComponent(friendlyMessage)}`,
          request.url,
        ),
      );
      response.cookies.getAll().forEach(({ name, value, ...options }) => {
        errorResponse.cookies.set(name, value, options);
      });
      copyAuthCacheHeaders(response.headers, errorResponse.headers);
      return errorResponse;
    }

    if (isRecovery) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const hasMfa = user ? await userHasMfa(user.id) : false;
      const recoveryTarget = hasMfa
        ? "/mfa-verify?redirect=/reset-password"
        : "/reset-password";
      const recoveryResponse = NextResponse.redirect(
        new URL(recoveryTarget, request.url),
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

  return NextResponse.redirect(
    new URL("/welcome?error=invalid_token", request.url),
  );
}
