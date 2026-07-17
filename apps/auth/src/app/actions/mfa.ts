"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  actionContext,
  RETURN_COOKIE,
  stringField,
  type AuthActionState,
  type MfaEnrollmentResult,
} from "@/lib/auth/action-support";
import { hasRecentSignIn } from "@/lib/auth/policy";
import { resolveAuthReturnTarget } from "@/lib/auth/returns";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function verifyMfaAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const context = await actionContext();
  if ("error" in context) return context;
  const code = stringField(formData, "code");
  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code." };

  const cookieStore = await cookies();
  const returnTo = resolveAuthReturnTarget(
    cookieStore.get(RETURN_COOKIE)?.value ?? stringField(formData, "return_to"),
    context.requestOrigin,
  );
  const supabase = await createSupabaseServerClient();
  const { data: factors, error: factorError } =
    await supabase.auth.mfa.listFactors();
  const factor = factors?.totp.find((item) => item.status === "verified");
  if (factorError || !factor) {
    return { error: "No verified authenticator is available." };
  }
  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId: factor.id });
  if (challengeError) return { error: "Unable to start verification." };
  const { error } = await supabase.auth.mfa.verify({
    factorId: factor.id,
    challengeId: challenge.id,
    code,
  });
  if (error) return { error: "The verification code is invalid or expired." };
  cookieStore.delete(RETURN_COOKIE);
  redirect(returnTo);
}

export async function startMfaEnrollmentAction(): Promise<MfaEnrollmentResult> {
  const context = await actionContext();
  if ("error" in context) return context;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !hasRecentSignIn(user.last_sign_in_at)) {
    return { error: "Sign in again before changing MFA." };
  }

  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (factors?.totp.length) {
    return { error: "An authenticator is already enabled." };
  }
  for (const factor of factors?.all ?? []) {
    if (factor.factor_type === "totp" && factor.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
  });
  return error
    ? { error: "Unable to begin MFA enrollment." }
    : {
        enrollment: {
          factorId: data.id,
          qrCode: data.totp.qr_code,
          secret: data.totp.secret,
        },
      };
}

export async function cancelMfaEnrollmentAction(
  factorId: string,
): Promise<AuthActionState> {
  const context = await actionContext();
  if ("error" in context) return context;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const factor = data?.all.find(
    (item) =>
      item.id === factorId &&
      item.factor_type === "totp" &&
      item.status === "unverified",
  );
  if (!factor) return { error: "The enrollment is no longer active." };
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  return error ? { error: "Unable to cancel enrollment." } : {};
}

export async function verifyMfaEnrollmentAction({
  factorId,
  code,
}: {
  factorId: string;
  code: string;
}): Promise<AuthActionState> {
  const context = await actionContext();
  if ("error" in context) return context;
  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code." };
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const factor = data?.all.find(
    (item) => item.id === factorId && item.factor_type === "totp",
  );
  if (!factor) return { error: "The enrollment is no longer active." };
  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) return { error: "Unable to start verification." };
  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  return error
    ? { error: "The verification code is invalid or expired." }
    : { success: "Multi-factor authentication is enabled." };
}

export async function disableMfaAction({
  factorId,
  code,
}: {
  factorId: string;
  code: string;
}): Promise<AuthActionState> {
  const context = await actionContext();
  if ("error" in context) return context;
  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code." };
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.mfa.listFactors();
  if (!data?.totp.some((factor) => factor.id === factorId)) {
    return { error: "The authenticator is no longer available." };
  }
  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) return { error: "Unable to start verification." };
  const { error: verificationError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  if (verificationError) {
    return { error: "The verification code is invalid or expired." };
  }
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  return error
    ? { error: "Unable to disable MFA." }
    : { success: "Multi-factor authentication is disabled." };
}
