import Link from "next/link";

import { AuthCard, AuthPageShell } from "@repo/ui/auth-presentation";
import { Button } from "@repo/ui/button";

export default function NotFound() {
  return (
    <AuthPageShell>
      <AuthCard>
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">Page not found</h1>
          <Button asChild className="w-full">
            <Link href="/">Return to Auth</Link>
          </Button>
        </div>
      </AuthCard>
    </AuthPageShell>
  );
}
