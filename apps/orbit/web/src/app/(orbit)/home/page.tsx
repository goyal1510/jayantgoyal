import { WorkspacePanel } from "@/features/home/workspace-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listWorkspaceBoards } from "@/server/queries/boards";
import {
  listFavoriteBoardIds,
  listWorkspaceBoardTemplates,
} from "@/server/queries/lifecycle";
import { listMyWorkspaces } from "@/server/queries/workspaces";

export default async function OrbitHomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const workspaces = await listMyWorkspaces(supabase);

  const boardEntries = await Promise.all(
    workspaces.map(async (workspace) => [
      workspace.id,
      await listWorkspaceBoards(supabase, workspace.id),
    ] as const),
  );

  const favoriteEntries = user
    ? await Promise.all(
        workspaces.map(async (workspace) => [
          workspace.id,
          await listFavoriteBoardIds(supabase, workspace.id, user.id),
        ] as const),
      )
    : [];

  const templateEntries = await Promise.all(
    workspaces.map(async (workspace) => [
      workspace.id,
      await listWorkspaceBoardTemplates(supabase, workspace.id),
    ] as const),
  );

  const boardsByWorkspace = Object.fromEntries(boardEntries);
  const favoriteBoardIdsByWorkspace = Object.fromEntries(favoriteEntries);
  const templatesByWorkspace = Object.fromEntries(templateEntries);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-background to-background p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Your workspaces, boards, and active work. Open a board to drag cards,
          assign teammates, and track progress.
        </p>
      </div>
      <WorkspacePanel
        workspaces={workspaces}
        boardsByWorkspace={boardsByWorkspace}
        favoriteBoardIdsByWorkspace={favoriteBoardIdsByWorkspace}
        templatesByWorkspace={templatesByWorkspace}
      />
    </div>
  );
}
