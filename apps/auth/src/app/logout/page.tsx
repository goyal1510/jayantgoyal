import type { Metadata } from "next";

import { logoutAction } from "@/app/actions/logout";
import { AuthCard, AuthPageShell } from "@repo/ui/auth-presentation";
import { Button } from "@repo/ui/button";

export const metadata: Metadata = { title: "Sign out" };

export default function LogoutPage() {
  return (
    <AuthPageShell>
      <AuthCard>
        <div className="space-y-5 text-center">
          <h1 className="text-2xl font-bold">Sign out</h1>
          <p className="text-muted-foreground text-sm">
            Choose whether to end this session or every session.
          </p>
          <form action={logoutAction}>
            <input type="hidden" name="scope" value="local" />
            <Button type="submit" className="w-full">
              Sign out this session
            </Button>
          </form>
          <form action={logoutAction}>
            <input type="hidden" name="scope" value="global" />
            <Button type="submit" variant="destructive" className="w-full">
              Sign out everywhere
            </Button>
          </form>
        </div>
      </AuthCard>
    </AuthPageShell>
  );
}
