import Link from "next/link";
import { notFound } from "next/navigation";

import { InvitePanel } from "@/features/home/invite-panel";
import { MembersPanel } from "@/features/workspaces/members-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

  const members = await listWorkspaceMembersDetailed(supabase, workspaceId);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Members</h1>
          <p className="text-sm text-muted-foreground">{workspace.name}</p>
        </div>
        <Link href="/home" className="text-sm text-primary underline">
          Back to home
        </Link>
      </div>
      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Invitations (test separately)
        </summary>
        <div className="mt-3">
          <InvitePanel workspaceId={workspaceId} />
        </div>
      </details>
      <MembersPanel workspaceId={workspaceId} members={members} />
    </div>
  );
}
