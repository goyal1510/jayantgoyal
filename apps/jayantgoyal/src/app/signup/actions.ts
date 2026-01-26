"use server";

import { headers } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type SignUpFormState = {
  error?: string;
  success?: string;
  redirectToLogin?: boolean;
};

export async function signupWithEmail(
  prevState: SignUpFormState,
  formData: FormData
): Promise<SignUpFormState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const termsAccepted = formData.get("termsAccepted");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (termsAccepted !== "true") {
    return { error: "You must accept the Terms and Conditions to create an account." };
  }

  const origin =
    (await headers()).get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://jayantgoyal.com";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: String(email),
    password: String(password),
    options: {
      // Use the current domain (or a configured fallback) so verification emails
      // redirect back to the correct deployment.
      emailRedirectTo: origin,
      data: {
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Check if current user is a guest and sign them out
  const guestEmail = process.env.GUEST_EMAIL_LOGIN;
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const isGuest = guestEmail && currentUser?.email === guestEmail;

  if (isGuest) {
    await supabase.auth.signOut();
    return {
      success: "Account created! Check your email for verification, then login with your new account.",
      redirectToLogin: true,
    };
  }

  return {
    success: "Check your email for the verification link to finish signing up.",
  };
}
