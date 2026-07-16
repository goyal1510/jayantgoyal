import Link from "next/link";

import { AuthShell } from "@/app/auth-shell";

export default function VerifyPage() {
  return (
    <AuthShell
      title="Check your email"
      description="Open the verification message in your inbox, then return here to continue."
    >
      <Link
        className="block rounded-lg bg-slate-950 px-4 py-2.5 text-center font-medium text-white"
        href="/login"
      >
        Back to sign in
      </Link>
    </AuthShell>
  );
}
