import { WorkspacePanel } from "@/features/home/workspace-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listWorkspaceBoards } from "@/server/queries/boards";
import { listMyWorkspaces } from "@/server/queries/workspaces";

export default async function OrbitHomePage() {
  const supabase = await createSupabaseServerClient();
  const workspaces = await listMyWorkspaces(supabase);

  const boardsByWorkspace: Record<
    string,
    Awaited<ReturnType<typeof listWorkspaceBoards>>
  > = {};

  for (const workspace of workspaces) {
    boardsByWorkspace[workspace.id] = await listWorkspaceBoards(
      supabase,
      workspace.id,
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <p className="text-sm text-muted-foreground">
          Your workspaces, boards, and active work.
        </p>
      </div>
      <WorkspacePanel
        workspaces={workspaces}
        boardsByWorkspace={boardsByWorkspace}
      />
    </div>
  );
}
