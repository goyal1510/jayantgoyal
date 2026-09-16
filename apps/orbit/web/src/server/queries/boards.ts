import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  BoardSummary,
  CardSummary,
  ColumnSummary,
  CommentSummary,
} from "@/lib/orbit/types";

type OrbitSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Lists boards visible to the current user within a workspace. */
export async function listWorkspaceBoards(
  supabase: OrbitSupabaseClient,
  workspaceId: string,
): Promise<BoardSummary[]> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("boards")
    .select("id, workspace_id, key, name, visibility")
    .eq("workspace_id", workspaceId)
    .eq("lifecycle", "active")
    .order("rank", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((board) => ({
    id: board.id,
    workspaceId: board.workspace_id,
    key: board.key,
    name: board.name,
    visibility: board.visibility,
  }));
}

/** Loads a board shell with columns and active cards for rendering. */
export async function loadBoardView(
  supabase: OrbitSupabaseClient,
  boardId: string,
): Promise<{
  board: BoardSummary | null;
  columns: ColumnSummary[];
  cards: CardSummary[];
}> {
  const { data: board, error: boardError } = await supabase
    .schema("orbit")
    .from("boards")
    .select("id, workspace_id, key, name, visibility")
    .eq("id", boardId)
    .maybeSingle();

  if (boardError) throw boardError;
  if (!board) return { board: null, columns: [], cards: [] };

  const [{ data: columns, error: columnsError }, { data: cards, error: cardsError }] =
    await Promise.all([
      supabase
        .schema("orbit")
        .from("columns")
        .select("id, board_id, name, category, rank")
        .eq("board_id", boardId)
        .order("rank", { ascending: true }),
      supabase
        .schema("orbit")
        .from("cards")
        .select(
          "id, board_id, column_id, number, title, description, priority, rank, version, due_date",
        )
        .eq("board_id", boardId)
        .is("deleted_at", null)
        .order("rank", { ascending: true }),
    ]);

  if (columnsError) throw columnsError;
  if (cardsError) throw cardsError;

  return {
    board: {
      id: board.id,
      workspaceId: board.workspace_id,
      key: board.key,
      name: board.name,
      visibility: board.visibility,
    },
    columns: (columns ?? []).map((column) => ({
      id: column.id,
      boardId: column.board_id,
      name: column.name,
      category: column.category,
      rank: column.rank,
    })),
    cards: (cards ?? []).map((card) => ({
      id: card.id,
      boardId: card.board_id,
      columnId: card.column_id,
      number: card.number,
      title: card.title,
      description: card.description,
      priority: card.priority,
      rank: card.rank,
      version: card.version,
      dueDate: card.due_date,
    })),
  };
}

/** Lists non-deleted comments for a card ordered oldest first. */
export async function listCardComments(
  supabase: OrbitSupabaseClient,
  cardId: string,
): Promise<CommentSummary[]> {
  const { data, error } = await supabase
    .schema("orbit")
    .from("comments")
    .select("id, card_id, author_id, body, created_at")
    .eq("card_id", cardId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((comment) => ({
    id: comment.id,
    cardId: comment.card_id,
    authorId: comment.author_id,
    body: comment.body,
    createdAt: comment.created_at,
  }));
}
