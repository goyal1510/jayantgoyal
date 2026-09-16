import Link from "next/link";
import { notFound } from "next/navigation";

import { BoardArchivePanel } from "@/features/boards/board-archive-panel";
import { OrbitPageHeader } from "@/features/orbit/orbit-page-header";
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
    <div className="mx-auto max-w-3xl space-y-6">
      <OrbitPageHeader
        eyebrow={board.key}
        title={`${mode === "trashed" ? "Trashed" : "Archived"} cards`}
        description={board.name}
        actions={
          <Link
            href={`/boards/${boardId}`}
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted"
          >
            Back to board
          </Link>
        }
      />
      <div className="flex gap-2">
        <Link
          href={`/boards/${boardId}/archive?mode=archived`}
          className={`rounded-md px-3 py-1.5 text-sm ${
            mode === "archived" ? "bg-primary text-primary-foreground" : "border hover:bg-muted"
          }`}
        >
          Archived
        </Link>
        <Link
          href={`/boards/${boardId}/archive?mode=trashed`}
          className={`rounded-md px-3 py-1.5 text-sm ${
            mode === "trashed" ? "bg-primary text-primary-foreground" : "border hover:bg-muted"
          }`}
        >
          Trashed
        </Link>
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
