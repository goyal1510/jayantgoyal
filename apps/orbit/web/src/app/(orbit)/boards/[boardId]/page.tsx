import { notFound } from "next/navigation";

import { BoardView } from "@/features/boards/board-view";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listBoardAssigneeIds,
  listBoardAttachments,
  listBoardCardLabelIds,
  listCardComments,
  listWorkspaceLabels,
  listWorkspaceMembers,
  loadBoardView,
} from "@/server/queries/boards";

type BoardPageProps = {
  params: Promise<{ boardId: string }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;
  const supabase = await createSupabaseServerClient();
  const { board, columns, cards } = await loadBoardView(supabase, boardId);

  if (!board) notFound();

  const [
    labels,
    members,
    labelIdsByCard,
    assigneeIdsByCard,
    attachmentsByCard,
  ] = await Promise.all([
    listWorkspaceLabels(supabase, board.workspaceId),
    listWorkspaceMembers(supabase, board.workspaceId),
    listBoardCardLabelIds(supabase, boardId),
    listBoardAssigneeIds(supabase, boardId),
    listBoardAttachments(supabase, boardId),
  ]);

  const commentsByCard: Record<
    string,
    Awaited<ReturnType<typeof listCardComments>>
  > = {};

  await Promise.all(
    cards.map(async (card) => {
      commentsByCard[card.id] = await listCardComments(supabase, card.id);
    }),
  );

  return (
    <BoardView
      board={board}
      columns={columns}
      cards={cards}
      commentsByCard={commentsByCard}
      labels={labels}
      labelIdsByCard={labelIdsByCard}
      members={members}
      assigneeIdsByCard={assigneeIdsByCard}
      attachmentsByCard={attachmentsByCard}
    />
  );
}
