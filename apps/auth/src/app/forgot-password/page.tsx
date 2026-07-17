import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthPageShell } from "@repo/ui/auth-presentation";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell>
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}
