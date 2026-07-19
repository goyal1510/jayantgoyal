import type { Metadata } from "next";

import { AccountWorkspaceHeader } from "@/components/account/account-workspace-header";
import { AvatarForm } from "@/components/account/avatar-form";
import { ProfileForm } from "@/components/account/profile-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { profileDisplayName, resolveProfileAvatar } from "@repo/auth/profile";
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
        .select(
          "first_name, last_name, avatar_url, avatar_mode, avatar_storage_path",
        )
        .eq("user_id", user.id)
        .single()
    : { data: null };
  const currentAvatarUrl = user
    ? await resolveProfileAvatar(supabase, user, profile ?? {})
    : null;

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
      <Card>
        <CardHeader>
          <CardTitle>Avatar</CardTitle>
          <CardDescription>
            Keep a personal avatar or use the provider avatar for the current
            sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarForm
            displayName={profileDisplayName(profile ?? {})}
            currentAvatarUrl={currentAvatarUrl}
            hasUploadedAvatar={profile?.avatar_mode === "upload"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
