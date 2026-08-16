import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthWelcomeShell } from "@/components/auth/auth-welcome-shell";
import { WelcomeForm } from "@/components/auth/welcome-form";
import { buildAuthLandingMetadata } from "@/lib/seo/metadata";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildAuthLandingMetadata("/");

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/account/security");

  return (
    <AuthWelcomeShell>
      <WelcomeForm returnTo="/account/security" />
    </AuthWelcomeShell>
  );
}
