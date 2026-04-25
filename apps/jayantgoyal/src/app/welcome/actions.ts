"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthFormState = {
  error?: string;
  success?: string;
};

/**
 * Unified auth action — tries sign-in first, falls back to sign-up if user doesn't exist.
 */
export async function authenticate(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectUrl = formData.get("redirect");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();

  // Try sign-in first
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: String(email),
    password: String(password),
  });

  if (!loginError) {
    const targetUrl =
      redirectUrl && String(redirectUrl).startsWith("/")
        ? String(redirectUrl)
        : "/";

    // Check if user has MFA enrolled — redirect to /mfa-verify directly.
    // Proxy redirects don't work reliably for server action soft navigations.
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const hasVerifiedFactor = factorsData?.totp.some(
      (f) => f.status === "verified"
    );

    if (hasVerifiedFactor) {
      const mfaUrl = targetUrl !== "/"
        ? `/mfa-verify?redirect=${encodeURIComponent(targetUrl)}`
        : "/mfa-verify";
      redirect(mfaUrl);
    }

    revalidatePath("/", "layout");

    const url = new URL(targetUrl, "http://n");
    url.searchParams.set("login_success", "true");
    redirect(url.pathname + url.search);
  }

  // Sign-in failed — try creating an account
  const origin =
    (await headers()).get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://jayantgoyal.com";

  const { error: signupError } = await supabase.auth.signUp({
    email: String(email),
    password: String(password),
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (!signupError) {
    return {
      success:
        "Account created! Check your email for the verification link.",
    };
  }

  // Both failed — existing user with wrong password
  return { error: loginError.message };
}
