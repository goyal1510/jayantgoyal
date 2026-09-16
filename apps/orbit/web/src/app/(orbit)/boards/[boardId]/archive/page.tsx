import Link from "next/link";
import { notFound } from "next/navigation";

import { BoardArchivePanel } from "@/features/boards/board-archive-panel";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadBoardView } from "@/server/queries/boards";
import { listBoardLifecycleCards } from "@/server/queries/lifecycle";

type ArchivePageProps = {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ mode?: string }>;
};

export default async function BoardArchivePage({
  params,
  searchParams,
}: ArchivePageProps) {
  const { boardId } = await params;
  const { mode: rawMode } = await searchParams;
  const mode = rawMode === "trashed" ? "trashed" : "archived";

  const supabase = await createSupabaseServerClient();
  const { board } = await loadBoardView(supabase, boardId);
  if (!board) notFound();

  const cards = await listBoardLifecycleCards(supabase, boardId, mode);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold capitalize">{mode} cards</h1>
          <p className="text-sm text-muted-foreground">{board.name}</p>
        </div>
        <Link href={`/boards/${boardId}`} className="text-sm text-primary underline">
          Back to board
        </Link>
      </div>
      <div className="flex gap-2 text-sm">
        <Link href={`/boards/${boardId}/archive?mode=archived`}>Archived</Link>
        <Link href={`/boards/${boardId}/archive?mode=trashed`}>Trashed</Link>
      </div>
      <BoardArchivePanel
        boardId={boardId}
        boardKey={board.key}
        mode={mode}
        cards={cards}
      />
    </div>
  );
}
