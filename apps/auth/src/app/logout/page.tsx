import { AuthShell } from "@/app/auth-shell";

export default function LogoutPage() {
  return (
    <AuthShell title="Sign out" description="Sign out of this browser session.">
      <form action="/api/logout" method="post">
        <button
          className="w-full rounded-lg bg-slate-950 px-4 py-2.5 font-medium text-white"
          type="submit"
        >
          Sign out
        </button>
      </form>
    </AuthShell>
  );
}
