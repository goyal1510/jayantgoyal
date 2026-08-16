"use server";

import { redirect } from "next/navigation";

import {
  actionContext,
  clearReturnTarget,
  rawStringField,
  rememberReturnTarget,
  stringField,
  validEmail,
  type AuthActionState,
} from "@/lib/auth/action-support";
import { resolveAuthReturnTarget } from "@/lib/auth/returns";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Unified entry action: existing users sign in, while new users are created
 * after the same email/password submission.
 */
export async function authenticateAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const context = await actionContext();
  if ("error" in context) return context;

  const email = stringField(formData, "email");
  const password = rawStringField(formData, "password");
  if (!validEmail(email) || !password) {
    return { error: "Enter a valid email address and password." };
  }

  const returnTo = resolveAuthReturnTarget(
    stringField(formData, "return_to"),
    context.requestOrigin,
  );
  const supabase = await createSupabaseServerClient();
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!loginError) {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    if (factors?.totp.some((factor) => factor.status === "verified")) {
      await rememberReturnTarget(returnTo, context.requestOrigin);
      redirect(`/mfa?return_to=${encodeURIComponent(returnTo)}`);
    }
    await clearReturnTarget();
    redirect(returnTo);
  }

  const { data, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${context.requestOrigin}/callback` },
  });

  if (!signupError) {
    if (data.session) {
      await clearReturnTarget();
      redirect(returnTo);
    }
    await rememberReturnTarget(returnTo, context.requestOrigin);
    return {
      success:
        "Account created. Check your email for a verification link before signing in.",
    };
  }

  return { error: "Email or password is incorrect." };
}

export async function googleAction(formData: FormData): Promise<void> {
  const context = await actionContext();
  if ("error" in context) redirect("/error?code=invalid_origin");

  const returnTo = resolveAuthReturnTarget(
    stringField(formData, "return_to"),
    context.requestOrigin,
  );
  await rememberReturnTarget(returnTo, context.requestOrigin);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${context.requestOrigin}/callback`,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) redirect("/error?code=provider_unavailable");
  redirect(data.url);
}

export async function githubAction(formData: FormData): Promise<void> {
  const context = await actionContext();
  if ("error" in context) redirect("/error?code=invalid_origin");

  const returnTo = resolveAuthReturnTarget(
    stringField(formData, "return_to"),
    context.requestOrigin,
  );
  await rememberReturnTarget(returnTo, context.requestOrigin);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${context.requestOrigin}/callback`,
      skipBrowserRedirect: true,
    },
  });
  if (error || !data.url) redirect("/error?code=provider_unavailable");
  redirect(data.url);
}
