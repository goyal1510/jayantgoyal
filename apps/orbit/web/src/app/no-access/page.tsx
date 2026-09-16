"use client";

import { ShieldX } from "lucide-react";
import { buildAuthLogoutUrl } from "@jayantgoyal/web-auth/entry";
import { applicationUrl } from "@jayantgoyal/web-urls";
import { Button } from "@jayantgoyal/web-ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";

export default function NoAccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ShieldX className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Orbit access required</CardTitle>
          <CardDescription>
            You are signed in, but Orbit is invite-only. An operator must grant
            Orbit access before you can open workspaces.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button variant="outline" asChild>
            <a href={applicationUrl("auth", "/account/security")}>
              Manage account
            </a>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              window.location.href = buildAuthLogoutUrl({
                requestUrl: window.location.href,
              }).toString();
            }}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
