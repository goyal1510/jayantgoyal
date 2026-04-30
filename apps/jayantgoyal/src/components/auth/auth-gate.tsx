"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@repo/ui/button";

export function AuthGate() {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="max-w-md space-y-4 text-center">
        <Lock className="mx-auto size-12 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Sign in to access this page</h2>
        <p className="text-muted-foreground">
          This feature requires authentication. Sign in to continue.
        </p>
        <Button asChild>
          <Link href={`/welcome?redirect=${encodeURIComponent(pathname)}`}>
            Sign In
          </Link>
        </Button>
      </div>
    </div>
  );
}
