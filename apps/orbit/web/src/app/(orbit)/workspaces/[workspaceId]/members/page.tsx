import Link from "next/link";
import { notFound } from "next/navigation";

import { InvitePanel } from "@/features/home/invite-panel";
import { OrbitPageHeader } from "@/features/orbit/orbit-page-header";
import { MembersPanel } from "@/features/workspaces/members-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listWorkspaceBoards } from "@/server/queries/boards";
import { listWorkspaceMembersDetailed } from "@/server/queries/lifecycle";
import { listMyWorkspaces } from "@/server/queries/workspaces";

type MembersPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function WorkspaceMembersPage({ params }: MembersPageProps) {
  const { workspaceId } = await params;
  const supabase = await createSupabaseServerClient();
  const workspaces = await listMyWorkspaces(supabase);
  const workspace = workspaces.find((entry) => entry.id === workspaceId);
  if (!workspace) notFound();

  const [members, boards] = await Promise.all([
    listWorkspaceMembersDetailed(supabase, workspaceId),
    listWorkspaceBoards(supabase, workspaceId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <OrbitPageHeader
        title="Members"
        description={`Manage roles and invitations for ${workspace.name}.`}
        actions={
          <Link
            href={`/workspaces/${workspaceId}/settings`}
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted"
          >
            Workspace settings
          </Link>
        }
      />
      <MembersPanel workspaceId={workspaceId} members={members} />
      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Invitations
        </summary>
        <div className="mt-3">
          <InvitePanel workspaceId={workspaceId} boards={boards} />
        </div>
      </details>
    </div>
  );
}
