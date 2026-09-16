"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { buildAuthLoginUrl } from "@jayantgoyal/web-auth/entry";
import { Button } from "@jayantgoyal/web-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";

import { acceptWorkspaceInvitationAction } from "@/server/commands/actions";

export function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) setError("This invitation link is missing a token.");
  }, [token]);

  function handleAccept() {
    if (!token) return;

    startTransition(async () => {
      const result = await acceptWorkspaceInvitationAction({ token });
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Invitation accepted");
      router.replace("/home");
      router.refresh();
    });
  }

  const signInUrl = buildAuthLoginUrl({
    requestUrl:
      typeof window === "undefined"
        ? "http://localhost:3004/invite/accept"
        : window.location.href,
    returnPath: `/invite/accept?token=${encodeURIComponent(token)}`,
  }).toString();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join workspace</CardTitle>
          <CardDescription>
            Accept your Orbit invitation to join the shared workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <Button
            className="w-full"
            disabled={pending || !token}
            onClick={handleAccept}
          >
            Accept invitation
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <a href={signInUrl}>Sign in with another account</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
