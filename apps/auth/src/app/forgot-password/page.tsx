import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthWelcomeShell } from "@/components/auth/auth-welcome-shell";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthWelcomeShell>
      <ForgotPasswordForm />
    </AuthWelcomeShell>
  );
}
