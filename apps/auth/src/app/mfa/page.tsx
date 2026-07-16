import { AuthShell } from "@/app/auth-shell";
import { MfaForm } from "@/app/mfa-form";

export default function MfaPage() {
  return (
    <AuthShell
      title="Verify your identity"
      description="Complete your enrolled authenticator step before opening a protected product."
    >
      <MfaForm />
    </AuthShell>
  );
}
