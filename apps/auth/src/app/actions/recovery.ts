"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { signOutSession, type SignOutScope } from "@repo/auth/logout";

import {
  actionContext,
  rawStringField,
  rememberReturnTarget,
  RETURN_COOKIE,
  stringField,
  validEmail,
  validPassword,
  type AuthActionState,
} from "@/lib/auth/action-support";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasVerifiedTotpFactor, requiresRecoveryMfa } from "@/lib/auth/policy";

export async function forgotPasswordAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const context = await actionContext();
  if ("error" in context) return context;

  const email = stringField(formData, "email");
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  await rememberReturnTarget("/reset-password", context.requestOrigin);
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${context.requestOrigin}/callback`,
  });
  return {
    success:
      "If an account exists for that address, a password reset link has been sent.",
  };
}

export async function resetPasswordAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const context = await actionContext();
  if ("error" in context) return context;

  const password = rawStringField(formData, "password");
  const confirmation = rawStringField(formData, "confirmation");
  if (!validPassword(password)) {
    return {
      error:
        "Use at least 8 characters with an uppercase letter, number, and symbol.",
    };
  }
  if (password !== confirmation) return { error: "Passwords do not match." };

  const cookieStore = await cookies();
  if (cookieStore.get("auth_recovery")?.value !== "verified") {
    return { error: "This recovery session is invalid or has expired." };
  }
  const supabase = await createSupabaseServerClient();
  const [{ data: userData }, { data: assurance }, { data: factors }] =
    await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ]);
  if (!userData.user) return { error: "This recovery session has expired." };
  if (
    requiresRecoveryMfa({
      hasVerifiedFactor: hasVerifiedTotpFactor(factors),
      currentLevel: assurance?.currentLevel,
    })
  ) {
    redirect(`/mfa?return_to=${encodeURIComponent("/reset-password")}`);
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "Unable to update the password. Request a new link." };
  }
  cookieStore.delete("auth_recovery");
  cookieStore.delete(RETURN_COOKIE);
  const scope: SignOutScope =
    stringField(formData, "scope") === "global" ? "global" : "local";
  await signOutSession(supabase, scope);
  redirect("/welcome?message=password_changed");
}
