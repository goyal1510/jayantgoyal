import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OrbitNavSnapshot } from "@/lib/config/orbit-nav-config";

import { listWorkspaceBoards } from "./boards";
import { listMyWorkspaces } from "./workspaces";

type OrbitSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Builds sidebar, breadcrumb, and command-palette navigation data. */
export async function loadOrbitNavSnapshot(
  supabase: OrbitSupabaseClient,
): Promise<OrbitNavSnapshot> {
  const workspaces = await listMyWorkspaces(supabase);
  const boardEntries = await Promise.all(
    workspaces.map(async (workspace) => {
      const boards = await listWorkspaceBoards(supabase, workspace.id);
      return {
        id: workspace.id,
        name: workspace.name,
        boards: boards.map((board) => ({
          id: board.id,
          name: board.name,
          key: board.key,
          workspaceId: workspace.id,
        })),
      };
    }),
  );

  return { workspaces: boardEntries };
}
