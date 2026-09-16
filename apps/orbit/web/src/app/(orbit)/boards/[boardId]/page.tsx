import { notFound } from "next/navigation";

import { BoardView } from "@/features/boards/board-view";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadBoardView, listCardComments } from "@/server/queries/boards";

type BoardPageProps = {
  params: Promise<{ boardId: string }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;
  const supabase = await createSupabaseServerClient();
  const { board, columns, cards } = await loadBoardView(supabase, boardId);

  if (!board) notFound();

  const commentsByCard: Record<
    string,
    Awaited<ReturnType<typeof listCardComments>>
  > = {};

  for (const card of cards) {
    commentsByCard[card.id] = await listCardComments(supabase, card.id);
  }

  return (
    <BoardView
      board={board}
      columns={columns}
      cards={cards}
      commentsByCard={commentsByCard}
    />
  );
}
