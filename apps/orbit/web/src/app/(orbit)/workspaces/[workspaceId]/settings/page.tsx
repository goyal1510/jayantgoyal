import Link from "next/link";
import { notFound } from "next/navigation";

import { WorkspaceSettingsPanel } from "@/features/workspaces/workspace-settings-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listWorkspaceBoardTemplates,
  listWorkspaceMembersDetailed,
} from "@/server/queries/lifecycle";
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

  const [members, templates] = await Promise.all([
    listWorkspaceMembersDetailed(supabase, workspaceId),
    listWorkspaceBoardTemplates(supabase, workspaceId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Workspace settings</h1>
          <p className="text-sm text-muted-foreground">{workspace.name}</p>
        </div>
        <Link href="/home" className="text-sm text-primary underline">
          Back to home
        </Link>
      </div>
      <WorkspaceSettingsPanel
        workspace={workspace}
        members={members}
        templates={templates}
        currentUserId={user.id}
      />
    </div>
  );
}
