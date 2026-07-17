import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthPageShell } from "@repo/ui/auth-presentation";

export const metadata: Metadata = { title: "Reset password" };

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  const [cookieStore, supabase] = await Promise.all([
    cookies(),
    createSupabaseServerClient(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (cookieStore.get("auth_recovery")?.value !== "verified" || !user) {
    redirect("/error?code=expired_link");
  }
  return (
    <AuthPageShell>
      <ResetPasswordForm />
    </AuthPageShell>
  );
}
