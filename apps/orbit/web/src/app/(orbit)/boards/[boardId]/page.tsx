import { notFound } from "next/navigation";

import { BoardView } from "@/features/boards/board-view";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  listBoardAssigneeIds,
  listBoardAttachments,
  listBoardCardLabelIds,
  listWorkspaceLabels,
  listWorkspaceMembers,
  loadBoardView,
} from "@/server/queries/boards";
import {
  listBoardChecklistsByCard,
  listBoardDependenciesByCard,
  listBoardSavedViews,
  listWatchedCardIds,
} from "@/server/queries/features";

type BoardPageProps = {
  params: Promise<{ boardId: string }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { board, columns, cards } = await loadBoardView(supabase, boardId);
  if (!board || !user) notFound();

  const [
    labels,
    members,
    labelIdsByCard,
    assigneeIdsByCard,
    attachmentsByCard,
    checklistsByCard,
    dependenciesByCard,
    watchedCardIds,
    savedViews,
  ] = await Promise.all([
    listWorkspaceLabels(supabase, board.workspaceId),
    listWorkspaceMembers(supabase, board.workspaceId),
    listBoardCardLabelIds(supabase, boardId),
    listBoardAssigneeIds(supabase, boardId),
    listBoardAttachments(supabase, boardId),
    listBoardChecklistsByCard(supabase, boardId),
    listBoardDependenciesByCard(supabase, boardId),
    listWatchedCardIds(supabase, boardId, user.id),
    listBoardSavedViews(supabase, boardId, user.id),
  ]);

  return (
    <BoardView
      board={board}
      columns={columns}
      cards={cards}
      labels={labels}
      labelIdsByCard={labelIdsByCard}
      members={members}
      assigneeIdsByCard={assigneeIdsByCard}
      attachmentsByCard={attachmentsByCard}
      checklistsByCard={checklistsByCard}
      dependenciesByCard={dependenciesByCard}
      watchedCardIds={watchedCardIds}
      savedViews={savedViews}
    />
  );
}
