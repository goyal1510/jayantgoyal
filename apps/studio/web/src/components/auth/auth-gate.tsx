"use client";

import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@jayantgoyal/web-ui/button";
import { matchesPathOrChild } from "@/lib/seo/config";

/** Public paths that don't require auth — must match proxy PUBLIC_PAGES */
const PUBLIC_PREFIXES = [
  "/products",
  "/tools",
  "/blogs",
  "/blog",
  "/writing",
  "/weather",
  "/custom-calculator",
  "/github-stats",
];
const PUBLIC_EXACT = new Set(["/", "/about", "/terms-conditions"]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => matchesPathOrChild(pathname, p));
}

export function AuthGateWrapper({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (isAuthenticated || isPublicPath(pathname)) return children;
  return <AuthGateCTA />;
}

function AuthGateCTA() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const returnPath = `${pathname}${query ? `?${query}` : ""}`;

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="max-w-md space-y-4 text-center">
        <Lock className="mx-auto size-12 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Sign in to access this page</h2>
        <p className="text-muted-foreground">
          This feature requires authentication. Sign in to continue.
        </p>
        <Button asChild>
          <Link href={`/welcome?redirect=${encodeURIComponent(returnPath)}`}>
            Sign In
          </Link>
        </Button>
      </div>
    </div>
  );
}
