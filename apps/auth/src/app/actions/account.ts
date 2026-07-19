"use server";

import { redirect } from "next/navigation";

import {
  actionContext,
  rawStringField,
  rememberReturnTarget,
  stringField,
  validPassword,
  type AuthActionState,
} from "@/lib/auth/action-support";
import { hasRecentSignIn } from "@/lib/auth/policy";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function changePasswordAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const context = await actionContext();
  if ("error" in context) return context;

  const currentPassword = rawStringField(formData, "current_password");
  const password = rawStringField(formData, "password");
  const confirmation = rawStringField(formData, "confirmation");
  if (!validPassword(password)) {
    return {
      error:
        "Use at least 8 characters with an uppercase letter, number, and symbol.",
    };
  }
  if (password !== confirmation) return { error: "Passwords do not match." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "Sign in again before changing your password." };
  }
  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2") {
    return { error: "Complete multi-factor verification before continuing." };
  }

  const { error: reauthenticationError } =
    await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
  if (reauthenticationError) return { error: "Current password is incorrect." };
  const { error } = await supabase.auth.updateUser({ password });
  return error
    ? { error: "Unable to update the password right now." }
    : { success: "Password updated." };
}

export async function updateProfileAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const context = await actionContext();
  if ("error" in context) return context;

  const firstName = stringField(formData, "first_name");
  const lastName = stringField(formData, "last_name");
  if (firstName.length > 80 || lastName.length > 80) {
    return { error: "Names must be 80 characters or fewer." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again before updating your profile." };

  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2") {
    return { error: "Complete multi-factor verification before continuing." };
  }

  const { error } = await supabase
    .schema("jg_account")
    .from("profiles")
    .update({ first_name: firstName, last_name: lastName })
    .eq("user_id", user.id);
  return error
    ? { error: "Unable to update your profile right now." }
    : { success: "Profile updated." };
}

async function requireProviderMutation(returnTo: string) {
  const context = await actionContext();
  if ("error" in context) redirect("/error?code=invalid_origin");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/welcome?return_to=${encodeURIComponent(returnTo)}`);
  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2") {
    redirect(`/mfa?return_to=${encodeURIComponent(returnTo)}`);
  }
  if (
    assurance?.nextLevel !== "aal2" &&
    !hasRecentSignIn(user.last_sign_in_at)
  ) {
    redirect(`/welcome?return_to=${encodeURIComponent(returnTo)}`);
  }
  return { context, supabase, user };
}

export async function linkGoogleAction(): Promise<void> {
  const { context, supabase } =
    await requireProviderMutation("/account/providers");
  const { data, error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: {
      redirectTo: `${context.requestOrigin}/callback`,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) redirect("/error?code=provider_unavailable");
  await rememberReturnTarget("/account/providers", context.requestOrigin);
  redirect(data.url);
}

export async function unlinkIdentityAction(formData: FormData): Promise<void> {
  const { supabase, user } =
    await requireProviderMutation("/account/providers");
  const identityId = stringField(formData, "identity_id");
  const identities = user.identities ?? [];
  const identity = identities.find((item) => item.id === identityId);
  if (!identity || identities.length < 2) {
    redirect("/error?code=identity_required");
  }
  const { error } = await supabase.auth.unlinkIdentity(identity);
  redirect(error ? "/error?code=provider_unavailable" : "/account/providers");
}
