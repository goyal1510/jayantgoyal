import { NextRequest, NextResponse } from "next/server";
import { createSupabaseProxyClient } from "@repo/auth/proxy";
import { resolvePlatformSessionConfig } from "@repo/auth/cookies";
import { safeRedirectPath } from "@repo/auth/redirects";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Check MFA via Admin API — no cookie dependency */
async function userHasMfa(userId: string): Promise<boolean> {
  try {
    const adminClient = createSupabaseAdminClient();
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

function copyResponseState(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach(({ name, value, ...options }) => {
    target.cookies.set(name, value, options);
  });
  source.headers.forEach((value, name) => {
    if (name !== "location") target.headers.set(name, value);
  });
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  const authRedirect = request.cookies.get("auth_redirect")?.value;
  const rawNext = authRedirect || requestUrl.searchParams.get("next") || "/";
  // Prevent open redirect — only allow relative paths
  const next = safeRedirectPath(rawNext, "/");

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
      setHeader: (name, value) => {
        response.headers.set(name, value);
      },
    },
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
      copyResponseState(response, errorResponse);
      return errorResponse;
    }

    // For OAuth users signing in for the first time, populate profile with name from provider
    if (data?.user) {
      const { data: existingProfile } = await supabase
        .schema("jg_account")
        .from("profiles")
        .select("first_name")
        .eq("user_id", data.user.id)
        .single();

      if (existingProfile && !existingProfile.first_name) {
        const metadata = (data.user.user_metadata ?? {}) as Record<
          string,
          unknown
        >;
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

      // Check MFA — only redirect to /mfa-verify if user actually has MFA enabled.
      // This avoids an unnecessary redirect (and spinner flash) for users without MFA.
      if (await userHasMfa(data.user.id)) {
        const mfaUrl = new URL("/mfa-verify", request.url);
        mfaUrl.searchParams.set("redirect", next);
        const mfaResponse = NextResponse.redirect(mfaUrl);
        copyResponseState(response, mfaResponse);
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
      copyResponseState(response, errorResponse);
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
      copyResponseState(response, recoveryResponse);
      recoveryResponse.cookies.set("recovery_mode", "true", {
        path: "/",
        maxAge: 3600,
        sameSite: "lax",
      });
      return recoveryResponse;
    }

    return response;
  }

  const invalidResponse = NextResponse.redirect(
    new URL("/welcome?error=invalid_token", request.url),
  );
  copyResponseState(response, invalidResponse);
  return invalidResponse;
}
