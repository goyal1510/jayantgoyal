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
    return NextResponse.redirect(new URL("/login?error=config", request.url));
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

  // Handle PKCE flow (code-based)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Auth callback error (code):", error.message);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
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
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(friendlyMessage)}`, request.url));
    }

    // For recovery flow, set a cookie to lock navigation to /reset-password
    if (isRecovery) {
      const recoveryResponse = NextResponse.redirect(new URL("/reset-password", request.url));
      // Copy over Supabase auth cookies from the original response
      response.cookies.getAll().forEach(({ name, value, ...options }) => {
        recoveryResponse.cookies.set(name, value, options);
      });
      recoveryResponse.cookies.set("recovery_mode", "true", {
        path: "/",
        maxAge: 3600, // 1 hour
        sameSite: "lax",
      });
      return recoveryResponse;
    }

    return response;
  }

  // No valid token provided
  return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
}
