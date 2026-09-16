import Link from "next/link";
import { notFound } from "next/navigation";

import { OrbitPageHeader } from "@/features/orbit/orbit-page-header";
import { WorkspaceSettingsShell } from "@/features/workspaces/workspace-settings-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listWorkspaceBoardTemplates,
  listWorkspaceMembersDetailed,
} from "@/server/queries/lifecycle";
import { listWorkspaceIntegrations } from "@/server/queries/p2";
import { listMyWorkspaces } from "@/server/queries/workspaces";

type SettingsPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function WorkspaceSettingsPage({ params }: SettingsPageProps) {
  const { workspaceId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const workspaces = await listMyWorkspaces(supabase);
  const workspace = workspaces.find((entry) => entry.id === workspaceId);
  if (!workspace) notFound();

  const [members, templates, integrations, aiPreference] = await Promise.all([
    listWorkspaceMembersDetailed(supabase, workspaceId),
    listWorkspaceBoardTemplates(supabase, workspaceId),
    listWorkspaceIntegrations(supabase, workspaceId),
    supabase
      .schema("orbit")
      .from("ai_preferences")
      .select("enabled")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <OrbitPageHeader
        title="Workspace settings"
        description="Lifecycle, ownership, exports, templates, webhooks, API tokens, and AI preferences."
        actions={
          <Link
            href="/home"
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted"
          >
            Back to home
          </Link>
        }
      />
      <WorkspaceSettingsShell
        workspace={workspace}
        members={members}
        templates={templates}
        currentUserId={user.id}
        webhooks={integrations.webhooks}
        tokens={integrations.tokens}
        aiEnabled={aiPreference.data?.enabled ?? false}
      />
    </div>
  );
}
