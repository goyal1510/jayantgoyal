"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginFormState = {
  error?: string;
  mfaRequired?: boolean;
  redirectUrl?: string;
};

export async function loginWithPassword(
  prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectUrl = formData.get("redirect");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(email),
    password: String(password),
  });

  if (error) {
    return { error: error.message };
  }

  // Check if user has MFA enrolled and needs to verify
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
    return { mfaRequired: true, redirectUrl: targetUrl };
  }

  revalidatePath("/", "layout");
  redirect(targetUrl);
}
