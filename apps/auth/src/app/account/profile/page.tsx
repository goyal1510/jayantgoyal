import type { Metadata } from "next";

import { AccountWorkspaceHeader } from "@/components/account/account-workspace-header";
import { ProfileForm } from "@/components/account/profile-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";

export const metadata: Metadata = { title: "Profile" };

export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .schema("jg_account")
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .single()
    : { data: null };

  return (
    <div className="space-y-6">
      <AccountWorkspaceHeader workspace="profile" />
      <Card>
        <CardHeader>
          <CardTitle>Public identity</CardTitle>
          <CardDescription>
            This is the name displayed across your connected workspaces.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            firstName={profile?.first_name ?? ""}
            lastName={profile?.last_name ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
