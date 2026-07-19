import type { Metadata } from "next";

import { MfaManager } from "@/components/account/mfa-manager";
import { PasswordForm } from "@/components/account/password-form";
import { ProfileForm } from "@/components/account/profile-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";

export const metadata: Metadata = { title: "Account security" };

export const dynamic = "force-dynamic";

export default async function AccountSecurityPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: factors }, { data: profile }] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    user
      ? supabase
          .schema("jg_account")
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", user.id)
          .single()
      : Promise.resolve({ data: null }),
  ]);
  const factorId = factors?.totp[0]?.id ?? null;
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Account security</h1>
        <p className="text-muted-foreground text-sm">
          Manage password and multi-factor authentication.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Keep the name shown across the Studio and Admin applications up to
            date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            firstName={profile?.first_name ?? ""}
            lastName={profile?.last_name ?? ""}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Re-enter the current password before choosing a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Multi-factor authentication</CardTitle>
          <CardDescription>
            Use a time-based code from an authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MfaManager initialFactorId={factorId} />
        </CardContent>
      </Card>
    </>
  );
}
