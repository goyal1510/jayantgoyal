import Link from "next/link";
import { notFound } from "next/navigation";

import { BoardReportsPanel } from "@/features/boards/board-reports-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadBoardView } from "@/server/queries/boards";
import { loadBoardReports } from "@/server/queries/p2";

type ReportsPageProps = {
  params: Promise<{ boardId: string }>;
};

export default async function BoardReportsPage({ params }: ReportsPageProps) {
  const { boardId } = await params;
  const supabase = await createSupabaseServerClient();
  const { board } = await loadBoardView(supabase, boardId);
  if (!board) notFound();

  const reports = await loadBoardReports(supabase, boardId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex justify-end">
        <Link
          href={`/boards/${boardId}`}
          className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted"
        >
          Back to board
        </Link>
      </div>
      <BoardReportsPanel boardId={board.id} boardKey={board.key} reports={reports} />
    </div>
  );
}
