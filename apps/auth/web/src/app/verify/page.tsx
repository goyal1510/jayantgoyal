import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@jayant/web-ui/auth-presentation";
import { AuthWelcomeShell } from "@/components/auth/auth-welcome-shell";
import { Button } from "@jayant/web-ui/button";

export const metadata: Metadata = { title: "Verify email" };

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  return (
    <AuthWelcomeShell>
      <AuthCard bare>
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">
            {status === "confirmed" ? "Email verified" : "Check your email"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {status === "confirmed"
              ? "Your email is verified and the account is ready."
              : "Open the verification link sent to your email address."}
          </p>
          <Button asChild className="w-full">
            <Link href="/welcome">Continue to sign in</Link>
          </Button>
        </div>
      </AuthCard>
    </AuthWelcomeShell>
  );
}
