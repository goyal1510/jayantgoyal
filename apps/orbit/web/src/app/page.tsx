import Link from "next/link";
import { Orbit } from "lucide-react";

import { APP_BRANDS } from "@jayantgoyal/web-brand";
import { buildAuthLoginUrl } from "@jayantgoyal/web-auth/entry";
import { Button } from "@jayantgoyal/web-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";
import { headers } from "next/headers";

export default async function OrbitLandingPage() {
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3004";
  const protocol = host.includes("localhost") ? "http" : "https";
  const continueUrl = buildAuthLoginUrl({
    requestUrl: `${protocol}://${host}/home`,
    requestHeaders: headerStore,
    returnPath: "/home",
  }).toString();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 p-6">
      <Card className="w-full max-w-lg border-border/60 shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Orbit className="h-7 w-7" aria-hidden />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl">{APP_BRANDS.orbit.defaultTitle}</CardTitle>
            <CardDescription className="text-base">
              {APP_BRANDS.orbit.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-center text-sm text-muted-foreground">
            Keep work moving with focused boards, cards, and team progress.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link href={continueUrl}>Continue with your account</Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Orbit is invite-only during private alpha. Sign in through Auth to
            check your access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
