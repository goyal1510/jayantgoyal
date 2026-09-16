import Link from "next/link";
import { notFound } from "next/navigation";

import { BoardP2Panel } from "@/features/boards/board-p2-panel";
import { BoardSettingsPanel } from "@/features/boards/board-settings-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadBoardView, listWorkspaceLabels } from "@/server/queries/boards";
import {
  getPublishedBoardForBoard,
  listBoardAutomationRules,
  loadBoardReports,
} from "@/server/queries/p2";

type SettingsPageProps = {
  params: Promise<{ boardId: string }>;
};

export default async function BoardSettingsPage({ params }: SettingsPageProps) {
  const { boardId } = await params;
  const supabase = await createSupabaseServerClient();
  const { board, columns } = await loadBoardView(supabase, boardId);
  if (!board) notFound();

  const [labels, automationRules, publishedBoard, reports] = await Promise.all([
    listWorkspaceLabels(supabase, board.workspaceId),
    listBoardAutomationRules(supabase, boardId),
    getPublishedBoardForBoard(supabase, boardId),
    loadBoardReports(supabase, boardId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Board settings</h1>
          <p className="text-sm text-muted-foreground">{board.name}</p>
        </div>
        <Link href={`/boards/${boardId}`} className="text-sm text-primary underline">
          Back to board
        </Link>
      </div>
      <BoardSettingsPanel board={board} columns={columns} />
      <BoardP2Panel
        boardId={boardId}
        columns={columns}
        labels={labels}
        automationRules={automationRules}
        publishedBoard={publishedBoard}
        reports={reports}
      />
    </div>
  );
}
