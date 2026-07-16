import Link from "next/link";

import { AuthShell } from "@/app/auth-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <AuthShell
        title="Sign in required"
        description="Sign in before opening account security."
      >
        <Link
          className="block rounded-lg bg-slate-950 px-4 py-2.5 text-center font-medium text-white"
          href="/login?next=/account/security"
        >
          Continue to sign in
        </Link>
      </AuthShell>
    );
  }
  return (
    <AuthShell
      title="Account security"
      description={`Signed in as ${user.email ?? "your account"}.`}
    >
      <div className="space-y-3">
        <Link
          className="block rounded-lg bg-slate-950 px-4 py-2.5 text-center font-medium text-white"
          href="/mfa"
        >
          Verify an authenticator factor
        </Link>
        <Link
          className="block rounded-lg border border-slate-300 px-4 py-2.5 text-center font-medium text-slate-800"
          href="/account/providers"
        >
          Connected providers
        </Link>
        <Link
          className="block text-center text-sm text-slate-600 underline"
          href="/logout"
        >
          Sign out
        </Link>
      </div>
    </AuthShell>
  );
}
