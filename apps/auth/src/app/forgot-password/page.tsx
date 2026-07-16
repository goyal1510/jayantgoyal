import { AuthShell } from "@/app/auth-shell";
import { RecoveryForm } from "@/app/auth-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="We will send a time-limited recovery link if the account exists."
    >
      <RecoveryForm />
    </AuthShell>
  );
}
