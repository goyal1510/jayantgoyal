import type { Metadata } from "next";

import { AuthWelcomeShell } from "@/components/auth/auth-welcome-shell";
import { WelcomeForm } from "@/components/auth/welcome-form";
import { resolveAuthReturnTarget } from "@/lib/auth/returns";

export const metadata: Metadata = {
  title: "Welcome",
  description:
    "Secure access to Jayant's Studio, Admin, and connected workspaces.",
};

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{
    return_to?: string;
    redirect?: string;
  }>;
}) {
  const params = await searchParams;
  const returnTo = resolveAuthReturnTarget(
    params.return_to ?? params.redirect,
  );

  return (
    <AuthWelcomeShell>
      <WelcomeForm returnTo={returnTo} />
    </AuthWelcomeShell>
  );
}
