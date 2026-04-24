"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthFormState = {
  error?: string;
  success?: string;
  mfaRequired?: boolean;
  redirectUrl?: string;
};

/**
 * Unified auth action — tries sign-in first, falls back to sign-up if user doesn't exist.
 */
export async function authenticate(
  prevState: AuthFormState,
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
    // Sign-in succeeded — check MFA
    const { data: aalData, error: aalError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    const targetUrl =
      redirectUrl && String(redirectUrl).startsWith("/")
        ? String(redirectUrl)
        : "/";

    if (
      !aalError &&
      aalData &&
      aalData.currentLevel === "aal1" &&
      aalData.nextLevel === "aal2"
    ) {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const verifiedFactors = factorsData?.totp.filter(
        (f) => f.status === "verified"
      );

      if (verifiedFactors && verifiedFactors.length > 0) {
        return { mfaRequired: true, redirectUrl: targetUrl };
      }
    }

    revalidatePath("/", "layout");

    const loginUrl = new URL(targetUrl, "http://n");
    loginUrl.searchParams.set("login_success", "true");
    redirect(loginUrl.pathname + loginUrl.search);
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
    // Account created — user needs to verify email
    return {
      success:
        "Account created! Check your email for the verification link.",
    };
  }

  // Both failed — existing user with wrong password (signUp returns "User already registered")
  return { error: loginError.message };
}
