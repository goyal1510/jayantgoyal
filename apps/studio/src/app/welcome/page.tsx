import type { Metadata } from "next";
import { Suspense } from "react";
import { WelcomeForm } from "@/components/auth/welcome-form";
import { CircularLoader } from "@repo/ui/circular-loader";
import { AuthPageShell } from "@repo/ui/auth-presentation";

export const metadata: Metadata = {
  title: "Welcome",
  description: "Sign in or create your account on jayantgoyal.com",
};

export default function WelcomePage() {
  return (
    <AuthPageShell>
      <Suspense fallback={<CircularLoader />}>
        <WelcomeForm />
      </Suspense>
    </AuthPageShell>
  );
}
