import { AuthShell } from "@/app/auth-shell";
import { LoginForm } from "@/app/auth-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Use your account to continue to Jayant's products."
    >
      <LoginForm />
    </AuthShell>
  );
}
