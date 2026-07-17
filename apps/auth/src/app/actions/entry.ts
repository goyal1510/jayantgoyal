"use server";

import { redirect } from "next/navigation";

import {
  actionContext,
  rawStringField,
  rememberReturnTarget,
  stringField,
  validEmail,
  validPassword,
  type AuthActionState,
} from "@/lib/auth/action-support";
import { resolveAuthReturnTarget } from "@/lib/auth/returns";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(
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
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email or password is incorrect." };

  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (factors?.totp.some((factor) => factor.status === "verified")) {
    await rememberReturnTarget(returnTo, context.requestOrigin);
    redirect("/mfa");
  }
  redirect(returnTo);
}

export async function registerAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const context = await actionContext();
  if ("error" in context) return context;

  const email = stringField(formData, "email");
  const password = rawStringField(formData, "password");
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  if (!validPassword(password)) {
    return {
      error:
        "Use at least 8 characters with an uppercase letter, number, and symbol.",
    };
  }

  const returnTo = resolveAuthReturnTarget(
    stringField(formData, "return_to"),
    context.requestOrigin,
  );
  await rememberReturnTarget(returnTo, context.requestOrigin);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${context.requestOrigin}/callback` },
  });
  if (error) {
    return {
      error: "Unable to create the account right now. Try again later.",
    };
  }
  if (data.session) redirect(returnTo);
  return {
    success:
      "Check your email for a verification link. If the address is registered, a message has been sent.",
  };
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
