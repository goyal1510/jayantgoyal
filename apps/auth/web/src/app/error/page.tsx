import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@jayantgoyal/web-ui/auth-presentation";
import { AuthWelcomeShell } from "@/components/auth/auth-welcome-shell";
import { Button } from "@jayantgoyal/web-ui/button";

const MESSAGES: Record<string, string> = {
  configuration: "Authentication is not configured for this deployment.",
  expired_link: "This link is invalid or has expired. Request a new one.",
  identity_required:
    "Keep at least one sign-in method connected to your account.",
  invalid_callback: "The sign-in response could not be verified. Start again.",
  invalid_origin:
    "The request origin could not be verified. Refresh and try again.",
  provider_cancelled:
    "Provider sign-in was cancelled or could not be completed.",
  provider_unavailable:
    "The provider is unavailable right now. Try again later.",
};

export const metadata: Metadata = { title: "Authentication error" };

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code = "invalid_callback" } = await searchParams;
  const message = MESSAGES[code] ?? MESSAGES.invalid_callback;
  return (
    <AuthWelcomeShell>
      <AuthCard bare>
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">Unable to continue</h1>
          <p className="text-muted-foreground text-sm">{message}</p>
          <Button asChild className="w-full">
            <Link href="/welcome">Try again</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/forgot-password">Recover account</Link>
          </Button>
        </div>
      </AuthCard>
    </AuthWelcomeShell>
  );
}
