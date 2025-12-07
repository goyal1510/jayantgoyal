"use server";

import { headers } from "next/headers";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type SignUpFormState = {
  error?: string;
  success?: string;
};

export async function signupWithEmail(
  prevState: SignUpFormState,
  formData: FormData
): Promise<SignUpFormState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    return { error: "Email and password are required." };
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
    },
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: "Check your email for the verification link to finish signing up.",
  };
}
