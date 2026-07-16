import { AuthShell } from "@/app/auth-shell";
import { RegisterForm } from "@/app/auth-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description="One account for the platform, with security controls kept in one place."
    >
      <RegisterForm />
    </AuthShell>
  );
}
