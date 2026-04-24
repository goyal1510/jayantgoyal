import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Auth callback route - handles token exchange from email verification links.
 * Supabase sends users here with a code/token that needs to be exchanged for a session.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  // Redirect destination: prefer the auth_redirect cookie (set by server actions
  // to avoid query params in Supabase redirect URLs), fall back to the next query param.
  const authRedirect = request.cookies.get("auth_redirect")?.value;
  const next = authRedirect || requestUrl.searchParams.get("next") || "/";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/welcome?error=config", request.url));
  }

  // Prepare response for cookie setting
  const redirectUrl = new URL(next, request.url);
  const response = NextResponse.redirect(redirectUrl);

  // Clear the auth_redirect cookie now that we've consumed it
  if (authRedirect) {
    response.cookies.set("auth_redirect", "", { path: "/", maxAge: 0 });
  }

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

  // Handle PKCE flow (code-based) — used by Google OAuth and email verification
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Auth callback error (code):", error.message);
      return NextResponse.redirect(new URL(`/welcome?error=${encodeURIComponent(error.message)}`, request.url));
    }

    // For OAuth users signing in for the first time, populate profile with name from provider
    if (data?.user) {
      const { data: existingProfile } = await supabase
        .schema("jg_account")
        .from("profiles")
        .select("first_name")
        .eq("user_id", data.user.id)
        .single();

      // Only update if profile exists but has no name set (created by DB trigger)
      if (existingProfile && !existingProfile.first_name) {
        const metadata = (data.user.user_metadata ?? {}) as Record<string, unknown>;
        const fullName = String(metadata.full_name || metadata.name || "");
        const [firstName = "", ...rest] = fullName.split(" ");
        const lastName = rest.join(" ");

        if (firstName) {
          await supabase
            .schema("jg_account")
            .from("profiles")
            .update({ first_name: firstName, last_name: lastName })
            .eq("user_id", data.user.id);
        }
      }
    }

    // Check if user has MFA enrolled — redirect to /mfa-verify instead of target URL.
    // This catches MFA immediately at session creation rather than relying on the proxy
    // (which can miss it due to AAL timing on freshly created sessions).
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const hasVerifiedFactor = factorsData?.totp.some((f) => f.status === "verified");
    if (hasVerifiedFactor) {
      const mfaUrl = new URL("/mfa-verify", request.url);
      if (next !== "/") {
        mfaUrl.searchParams.set("redirect", next);
      }
      const mfaResponse = NextResponse.redirect(mfaUrl);
      response.cookies.getAll().forEach(({ name, value, ...options }) => {
        mfaResponse.cookies.set(name, value, options);
      });
      return mfaResponse;
    }

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
      return NextResponse.redirect(new URL(`/welcome?error=${encodeURIComponent(friendlyMessage)}`, request.url));
    }

    // For recovery flow, set a cookie to lock navigation to /reset-password.
    // MFA check happens here too — user must verify TOTP before resetting password.
    if (isRecovery) {
      const { data: recoveryFactors } = await supabase.auth.mfa.listFactors();
      const recoveryHasMfa = recoveryFactors?.totp.some((f) => f.status === "verified");
      const recoveryTarget = recoveryHasMfa ? "/mfa-verify?redirect=/reset-password" : "/reset-password";
      const recoveryResponse = NextResponse.redirect(new URL(recoveryTarget, request.url));
      response.cookies.getAll().forEach(({ name, value, ...options }) => {
        recoveryResponse.cookies.set(name, value, options);
      });
      recoveryResponse.cookies.set("recovery_mode", "true", {
        path: "/",
        maxAge: 3600,
        sameSite: "lax",
      });
      return recoveryResponse;
    }

    return response;
  }

  // No valid token provided
  return NextResponse.redirect(new URL("/welcome?error=invalid_token", request.url));
}
