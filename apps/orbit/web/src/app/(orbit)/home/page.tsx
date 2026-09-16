import { OrbitPageHeader } from "@/features/orbit/orbit-page-header";
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
      <OrbitPageHeader
        title="Home"
        description="Your workspaces, boards, and active work. Use ⌘K to jump anywhere quickly."
      />
      <WorkspacePanel
        workspaces={workspaces}
        boardsByWorkspace={boardsByWorkspace}
        favoriteBoardIdsByWorkspace={favoriteBoardIdsByWorkspace}
        templatesByWorkspace={templatesByWorkspace}
      />
    </div>
  );
}
