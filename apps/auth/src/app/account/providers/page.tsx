import type { Metadata } from "next";

import {
  linkGoogleAction,
  unlinkIdentityAction,
} from "@/app/actions/account";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GoogleIcon } from "@repo/ui/auth-presentation";
import { Button } from "@repo/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";

export const metadata: Metadata = { title: "Connected providers" };
export const dynamic = "force-dynamic";

export default async function ProvidersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const identities = user?.identities ?? [];
  const google = identities.find((identity) => identity.provider === "google");

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Connected providers</h1>
        <p className="text-muted-foreground text-sm">
          Manage the sign-in methods attached to this account.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GoogleIcon className="size-5" /> Google
          </CardTitle>
          <CardDescription>
            {google ? "Connected" : "Not connected"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {google ? (
            <form action={unlinkIdentityAction}>
              <input type="hidden" name="identity_id" value={google.id} />
              <Button
                type="submit"
                variant="destructive"
                disabled={identities.length < 2}
              >
                Disconnect Google
              </Button>
              {identities.length < 2 && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Add another sign-in method before disconnecting the last
                  identity.
                </p>
              )}
            </form>
          ) : (
            <form action={linkGoogleAction}>
              <Button type="submit">Connect Google</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );
}
