import type { Metadata } from "next";

import { logoutAction } from "@/app/actions/logout";
import { resolveAuthReturnTarget } from "@/lib/auth/returns";
import { AuthCard } from "@jayant/web-ui/auth-presentation";
import { AuthWelcomeShell } from "@/components/auth/auth-welcome-shell";
import { Button } from "@jayant/web-ui/button";

export const metadata: Metadata = { title: "Sign out" };

export default async function LogoutPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string }>;
}) {
  const { return_to: returnTo } = await searchParams;
  const safeReturnTo = resolveAuthReturnTarget(returnTo, undefined, "/welcome");
  return (
    <AuthWelcomeShell>
      <AuthCard bare>
        <div className="space-y-5 text-center">
          <h1 className="text-2xl font-bold">Sign out</h1>
          <p className="text-muted-foreground text-sm">
            Choose whether to end this session or every session.
          </p>
          <form action={logoutAction}>
            <input type="hidden" name="scope" value="local" />
            <input type="hidden" name="return_to" value={safeReturnTo} />
            <Button type="submit" className="w-full">
              Sign out this session
            </Button>
          </form>
          <form action={logoutAction}>
            <input type="hidden" name="scope" value="global" />
            <input type="hidden" name="return_to" value={safeReturnTo} />
            <Button type="submit" variant="destructive" className="w-full">
              Sign out everywhere
            </Button>
          </form>
        </div>
      </AuthCard>
    </AuthWelcomeShell>
  );
}
