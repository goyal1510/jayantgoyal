import Link from "next/link";
import { notFound } from "next/navigation";

import { BoardSettingsShell } from "@/features/boards/board-settings-shell";
import { OrbitPageHeader } from "@/features/orbit/orbit-page-header";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadBoardView, listWorkspaceLabels } from "@/server/queries/boards";
import { toJobStatusRows } from "@/lib/orbit/job-rows";
import {
  getPublishedBoardForBoard,
  listBoardAutomationRules,
  listBoardImportJobs,
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

  const [labels, automationRules, publishedBoard, reports, importJobs] = await Promise.all([
    listWorkspaceLabels(supabase, board.workspaceId),
    listBoardAutomationRules(supabase, boardId),
    getPublishedBoardForBoard(supabase, boardId),
    loadBoardReports(supabase, boardId),
    listBoardImportJobs(supabase, boardId),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <OrbitPageHeader
        eyebrow={board.key}
        title="Board settings"
        description="Manage columns, automation, reporting, publication, and imports."
        actions={
          <Link
            href={`/boards/${boardId}`}
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted"
          >
            Back to board
          </Link>
        }
      />
      <BoardSettingsShell
        board={board}
        columns={columns}
        labels={labels}
        automationRules={automationRules}
        publishedBoard={publishedBoard}
        reports={reports}
        importJobs={toJobStatusRows(importJobs)}
      />
    </div>
  );
}
