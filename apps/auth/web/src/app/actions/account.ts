"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
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
import {
  PROFILE_AVATAR_BUCKET,
  PROFILE_AVATAR_MAX_BYTES,
  PROFILE_AVATAR_MIME_TYPES,
} from "@jayant/web-auth/profile";

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

const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function requireProfileMutation() {
  const context = await actionContext();
  if ("error" in context) return context;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again before updating your avatar." };

  const { data: assurance } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2") {
    return { error: "Complete multi-factor verification before continuing." };
  }

  return { context, supabase, user };
}

export async function uploadAvatarAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const auth = await requireProfileMutation();
  if ("error" in auth) return auth;

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Choose an image to upload." };
  if (
    !PROFILE_AVATAR_MIME_TYPES.includes(
      file.type as (typeof PROFILE_AVATAR_MIME_TYPES)[number],
    )
  ) {
    return { error: "Use a JPG, PNG, or WebP image." };
  }
  if (file.size > PROFILE_AVATAR_MAX_BYTES) {
    return { error: "Avatar images must be 5 MB or smaller." };
  }

  const { data: currentProfile } = await auth.supabase
    .schema("jg_account")
    .from("profiles")
    .select("avatar_storage_path")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const path = `${auth.user.id}/${randomUUID()}.${AVATAR_EXTENSIONS[file.type]}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await auth.supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
  if (uploadError) return { error: "Unable to upload the avatar right now." };

  const { error: profileError } = await auth.supabase
    .schema("jg_account")
    .from("profiles")
    .update({
      avatar_mode: "upload",
      avatar_provider: null,
      avatar_storage_path: path,
      avatar_url: null,
      avatar_updated_at: new Date().toISOString(),
    })
    .eq("user_id", auth.user.id);
  if (profileError) {
    await auth.supabase.storage.from(PROFILE_AVATAR_BUCKET).remove([path]);
    return { error: "Unable to save the avatar right now." };
  }

  if (currentProfile?.avatar_storage_path) {
    await auth.supabase.storage
      .from(PROFILE_AVATAR_BUCKET)
      .remove([currentProfile.avatar_storage_path]);
  }

  revalidatePath("/account/profile");
  revalidatePath("/account/security");
  return { success: "Avatar updated." };
}

export async function removeAvatarAction(
  _previous: AuthActionState,
  _formData: FormData,
): Promise<AuthActionState> {
  void _previous;
  void _formData;
  const auth = await requireProfileMutation();
  if ("error" in auth) return auth;

  const { data: profile } = await auth.supabase
    .schema("jg_account")
    .from("profiles")
    .select("avatar_storage_path")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const { error } = await auth.supabase
    .schema("jg_account")
    .from("profiles")
    .update({
      avatar_mode: "provider",
      avatar_provider: null,
      avatar_storage_path: null,
      avatar_url: null,
      avatar_updated_at: new Date().toISOString(),
    })
    .eq("user_id", auth.user.id);
  if (error) return { error: "Unable to remove the avatar right now." };

  if (profile?.avatar_storage_path) {
    await auth.supabase.storage
      .from(PROFILE_AVATAR_BUCKET)
      .remove([profile.avatar_storage_path]);
  }

  revalidatePath("/account/profile");
  revalidatePath("/account/security");
  return { success: "Avatar removed." };
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

export async function linkGithubAction(): Promise<void> {
  const { context, supabase } =
    await requireProviderMutation("/account/providers");
  const { data, error } = await supabase.auth.linkIdentity({
    provider: "github",
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
