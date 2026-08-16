import Link from "next/link";

import { AuthCard } from "@jayant/web-ui/auth-presentation";
import { AuthWelcomeShell } from "@/components/auth/auth-welcome-shell";
import { Button } from "@jayant/web-ui/button";

export default function NotFound() {
  return (
    <AuthWelcomeShell>
      <AuthCard bare>
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">Page not found</h1>
          <Button asChild className="w-full">
            <Link href="/">Return to Auth</Link>
          </Button>
        </div>
      </AuthCard>
    </AuthWelcomeShell>
  );
}
