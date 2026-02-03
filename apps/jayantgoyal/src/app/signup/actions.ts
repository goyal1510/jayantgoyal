"use server";

import { cookies, headers } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type SignUpFormState = {
  error?: string;
  success?: string;
  redirectToLogin?: boolean;
  step?: "email_sent" | "password_set";
};

type SetPasswordFormState = {
  error?: string;
  success?: string;
};

/**
 * Main signup action - handles both:
 * 1. Anonymous user converting to permanent (two-step: email first)
 * 2. New user signing up (traditional: email + password)
 */
export async function signupWithEmail(
  prevState: SignUpFormState,
  formData: FormData
): Promise<SignUpFormState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const termsAccepted = formData.get("termsAccepted");

  if (!email) {
    return { error: "Email is required." };
  }

  if (termsAccepted !== "true") {
    return { error: "You must accept the Terms and Conditions to create an account." };
  }

  const origin =
    (await headers()).get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://jayantgoyal.com";

  const supabase = await createSupabaseServerClient();

  // Check if current user is anonymous
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const isAnonymous = currentUser?.is_anonymous === true;

  if (isAnonymous) {
    // Anonymous user converting to permanent account
    // Step 1: Link email (sends verification email)
    // Password will be set after email verification
    // Store the post-auth redirect destination in a cookie.
    // Query params in emailRedirectTo cause Supabase to reject the URL and fall back to the Site URL.
    const cookieStore = await cookies();
    cookieStore.set("auth_redirect", "/signup?verified=true", {
      path: "/",
      httpOnly: true,
      secure: origin.startsWith("https"),
      sameSite: "lax",
      maxAge: 3600,
    });
    const { error } = await supabase.auth.updateUser({
      email: String(email),
      data: {
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
      },
    }, {
      emailRedirectTo: `${origin}/auth/callback`,
    });

    if (error) {
      return { error: error.message };
    }

    return {
      success: "Verification email sent! Check your inbox and click the link, then come back here to set your password.",
      step: "email_sent",
    };
  }

  // New user (not logged in) - traditional signup with email + password
  if (!password) {
    return { error: "Password is required." };
  }

  // Store the post-auth redirect destination in a cookie.
  // Query params in emailRedirectTo cause Supabase to reject the URL and fall back to the Site URL.
  const cookieStore = await cookies();
  cookieStore.set("auth_redirect", "/", {
    path: "/",
    httpOnly: true,
    secure: origin.startsWith("https"),
    sameSite: "lax",
    maxAge: 3600,
  });
  const { error } = await supabase.auth.signUp({
    email: String(email),
    password: String(password),
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: "Check your email for the verification link to finish signing up.",
    redirectToLogin: true,
  };
}

/**
 * Set password action - used by anonymous users after email verification
 */
export async function setPassword(
  prevState: SetPasswordFormState,
  formData: FormData
): Promise<SetPasswordFormState> {
  const password = formData.get("password");

  if (!password) {
    return { error: "Password is required." };
  }

  if (String(password).length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createSupabaseServerClient();

  // Verify user is authenticated and email is confirmed
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to set a password." };
  }

  // Check if email is confirmed (user should have clicked verification link)
  if (!user.email_confirmed_at && !user.confirmed_at) {
    return { error: "Please verify your email first by clicking the link in your inbox." };
  }

  // Set the password
  const { error } = await supabase.auth.updateUser({
    password: String(password),
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: "Password set successfully! Your account is now complete.",
  };
}
