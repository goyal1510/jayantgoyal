import { AuthShell } from "@/app/auth-shell";
import { PasswordUpdateForm } from "@/app/auth-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      description="Use a strong password you do not reuse elsewhere."
    >
      <PasswordUpdateForm />
    </AuthShell>
  );
}
