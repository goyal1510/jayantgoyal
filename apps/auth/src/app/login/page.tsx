import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { resolveAuthReturnTarget } from "@/lib/auth/returns";
import { AuthPageShell } from "@repo/ui/auth-presentation";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>;
}) {
  const { return_to: returnTo } = await searchParams;
  return (
    <AuthPageShell>
      <LoginForm returnTo={resolveAuthReturnTarget(returnTo)} />
    </AuthPageShell>
  );
}
