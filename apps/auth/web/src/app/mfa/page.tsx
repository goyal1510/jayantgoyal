import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { MfaForm } from "@/components/auth/mfa-form";
import { AUTH_ORIGIN, resolveAuthReturnTarget } from "@/lib/auth/returns";
import { requestOriginFromHeaders } from "@/lib/auth/origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthWelcomeShell } from "@/components/auth/auth-welcome-shell";

export const metadata: Metadata = { title: "Verify MFA" };
export const dynamic = "force-dynamic";

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>;
}) {
  const [params, cookieStore, headerStore, supabase] = await Promise.all([
    searchParams,
    cookies(),
    headers(),
    createSupabaseServerClient(),
  ]);
  const requestOrigin = requestOriginFromHeaders(headerStore, AUTH_ORIGIN);
  const returnTo = resolveAuthReturnTarget(
    cookieStore.get("auth_return_to")?.value ?? params.return_to,
    requestOrigin,
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/welcome?return_to=${encodeURIComponent(returnTo)}`);

  const [{ data: factors }, { data: assurance }] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (!factors?.totp.some((factor) => factor.status === "verified")) {
    redirect(returnTo);
  }
  if (assurance?.currentLevel === "aal2") redirect(returnTo);

  return (
    <AuthWelcomeShell>
      <MfaForm returnTo={returnTo} />
    </AuthWelcomeShell>
  );
}
