import Link from "next/link";

import { APP_BRANDS } from "@repo/brand";
import { applicationOrigin } from "@repo/platform";
import { Button } from "@repo/ui/button";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-6 py-4">
          <Link
            href="/account/security"
            className="mr-auto text-lg font-semibold"
          >
            {APP_BRANDS.auth.name}
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/account/security">Security</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/account/providers">Providers</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/logout">Sign out</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a
              href={applicationOrigin(
                "studio",
                process.env.NEXT_PUBLIC_STUDIO_URL,
              )}
            >
              Studio
            </a>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">{children}</main>
    </div>
  );
}
