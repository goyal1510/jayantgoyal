import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { resolveAuthReturnTarget } from "@/lib/auth/returns";
import { AuthPageShell } from "@repo/ui/auth-presentation";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>;
}) {
  const { return_to: returnTo } = await searchParams;
  return (
    <AuthPageShell>
      <RegisterForm returnTo={resolveAuthReturnTarget(returnTo)} />
    </AuthPageShell>
  );
}
