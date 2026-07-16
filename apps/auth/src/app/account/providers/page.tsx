import Link from "next/link";

import { AuthShell } from "@/app/auth-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthShell
        title="Sign in required"
        description="Sign in before opening connected providers."
      >
        <Link
          className="block rounded-lg bg-slate-950 px-4 py-2.5 text-center font-medium text-white"
          href="/login?next=/account/providers"
        >
          Continue to sign in
        </Link>
      </AuthShell>
    );
  }

  const { data, error } = await supabase.auth.getUserIdentities();
  const identities = data?.identities ?? [];

  return (
    <AuthShell
      title="Connected providers"
      description="Review the providers connected to your account."
    >
      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          We could not load connected providers. Please retry.
        </p>
      ) : (
        <ul className="space-y-2 text-sm text-slate-700">
          {identities.map((identity) => (
            <li
              className="rounded-lg border border-slate-200 px-3 py-2"
              key={identity.identity_id}
            >
              {identity.provider}
            </li>
          ))}
        </ul>
      )}
      <Link
        className="mt-5 block text-center text-sm text-slate-600 underline"
        href="/account/security"
      >
        Back to account security
      </Link>
    </AuthShell>
  );
}
