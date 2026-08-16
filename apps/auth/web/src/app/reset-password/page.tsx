import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthWelcomeShell } from "@/components/auth/auth-welcome-shell";
import { hasVerifiedTotpFactor, requiresRecoveryMfa } from "@/lib/auth/policy";

export const metadata: Metadata = { title: "Reset password" };

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const [cookieStore, supabase] = await Promise.all([
    cookies(),
    createSupabaseServerClient(),
  ]);
  const [{ data: userData }, { data: factors }, { data: assurance }] =
    await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
  const user = userData.user;
  if (cookieStore.get("auth_recovery")?.value !== "verified" || !user) {
    redirect("/error?code=expired_link");
  }
  if (
    requiresRecoveryMfa({
      hasVerifiedFactor: hasVerifiedTotpFactor(factors),
      currentLevel: assurance?.currentLevel,
    })
  ) {
    redirect(`/mfa?return_to=${encodeURIComponent("/reset-password")}`);
  }
  return (
    <AuthWelcomeShell>
      <ResetPasswordForm />
    </AuthWelcomeShell>
  );
}
