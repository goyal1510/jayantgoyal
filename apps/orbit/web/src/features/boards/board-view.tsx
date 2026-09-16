"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@jayantgoyal/web-ui/badge";
import { Button } from "@jayantgoyal/web-ui/button";
import { Input } from "@jayantgoyal/web-ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";

import { CardDetailPanel } from "@/features/boards/card-detail-panel";
import { useBoardRealtime } from "@/lib/orbit/use-board-realtime";
import {
  addCommentAction,
  createCardAction,
  moveCardAction,
} from "@/server/commands/actions";
import type {
  AttachmentSummary,
  BoardSummary,
  CardSummary,
  ColumnSummary,
  CommentSummary,
  LabelSummary,
  MemberSummary,
} from "@/lib/orbit/types";

type BoardViewProps = {
  board: BoardSummary;
  columns: ColumnSummary[];
  cards: CardSummary[];
  commentsByCard: Record<string, CommentSummary[]>;
  labels: LabelSummary[];
  labelIdsByCard: Record<string, string[]>;
  members: MemberSummary[];
  assigneeIdsByCard: Record<string, string[]>;
  attachmentsByCard: Record<string, AttachmentSummary[]>;
};

export function BoardView({
  board,
  columns,
  cards: initialCards,
  commentsByCard,
  labels,
  labelIdsByCard,
  members,
  assigneeIdsByCard,
  attachmentsByCard,
}: BoardViewProps) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [pending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [newTitles, setNewTitles] = useState<Record<string, string>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {},
  );
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  useBoardRealtime(board.id);

  useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);

  const labelById = useMemo(
    () => new Map(labels.map((label) => [label.id, label])),
    [labels],
  );

  const visibleCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return cards;
    return cards.filter((card) => card.title.toLowerCase().includes(query));
  }, [cards, searchQuery]);

  const cardsByColumn = useMemo(() => {
    const grouped: Record<string, CardSummary[]> = {};
    for (const column of columns) grouped[column.id] = [];
    for (const card of visibleCards) {
      grouped[card.columnId]?.push(card);
    }
    return grouped;
  }, [visibleCards, columns]);

  const activeCard = cards.find((card) => card.id === activeCardId) ?? null;

  function handleCreateCard(columnId: string) {
    const title = newTitles[columnId]?.trim();
    if (!title) return;

    startTransition(async () => {
      const result = await createCardAction({
        boardId: board.id,
        columnId,
        title,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Card created");
      setNewTitles((current) => ({ ...current, [columnId]: "" }));
      router.refresh();
    });
  }

  function handleMoveCard(card: CardSummary, targetColumnId: string) {
    startTransition(async () => {
      const result = await moveCardAction({
        boardId: board.id,
        cardId: card.id,
        targetColumnId,
        rank: card.rank,
        expectedVersion: card.version,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCards((current) =>
        current.map((entry) =>
          entry.id === card.id
            ? {
                ...entry,
                columnId: targetColumnId,
                version: entry.version + 1,
              }
            : entry,
        ),
      );
    });
  }

  function handleAddComment(cardId: string) {
    const body = commentDrafts[cardId]?.trim();
    if (!body) return;

    startTransition(async () => {
      const result = await addCommentAction({
        boardId: board.id,
        cardId,
        body,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Comment added");
      setCommentDrafts((current) => ({ ...current, [cardId]: "" }));
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {board.key}
        </p>
        <h1 className="text-2xl font-semibold">{board.name}</h1>
      </div>

      <Input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search cards"
        className="max-w-sm"
      />

      {activeCard ? (
        <CardDetailPanel
          boardId={board.id}
          workspaceId={board.workspaceId}
          boardKey={board.key}
          card={activeCard}
          labels={labels}
          labelIds={labelIdsByCard[activeCard.id] ?? []}
          members={members}
          assigneeIds={assigneeIdsByCard[activeCard.id] ?? []}
          attachments={attachmentsByCard[activeCard.id] ?? []}
          onClose={() => setActiveCardId(null)}
        />
      ) : null}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="min-w-[280px] max-w-[320px] flex-1">
            <Card className="h-full bg-muted/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {column.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(cardsByColumn[column.id] ?? []).map((card) => (
                  <div
                    key={card.id}
                    className="rounded-lg border bg-background p-3 shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {board.key}-{card.number}
                        </p>
                        <p className="font-medium">{card.title}</p>
                        {card.dueDate ? (
                          <p className="text-xs text-muted-foreground">
                            Due {card.dueDate.slice(0, 10)}
                          </p>
                        ) : null}
                        {(labelIdsByCard[card.id] ?? []).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {(labelIdsByCard[card.id] ?? []).map((labelId) => {
                              const label = labelById.get(labelId);
                              if (!label) return null;
                              return (
                                <Badge key={labelId} variant="secondary">
                                  {label.name}
                                </Badge>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setActiveCardId(
                            activeCardId === card.id ? null : card.id,
                          )
                        }
                      >
                        Open
                      </Button>
                    </div>
                    <label className="sr-only" htmlFor={`move-${card.id}`}>
                      Move {card.title}
                    </label>
                    <select
                      id={`move-${card.id}`}
                      className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                      value={card.columnId}
                      disabled={pending}
                      onChange={(event) =>
                        handleMoveCard(card, event.target.value)
                      }
                    >
                      {columns.map((option) => (
                        <option key={option.id} value={option.id}>
                          Move to {option.name}
                        </option>
                      ))}
                    </select>

                    {activeCardId === card.id ? (
                      <div className="mt-3 space-y-2 border-t pt-3">
                        {(commentsByCard[card.id] ?? []).map((comment) => (
                          <p
                            key={comment.id}
                            className="rounded-md bg-muted/50 p-2 text-xs"
                          >
                            {comment.body}
                          </p>
                        ))}
                        <Input
                          value={commentDrafts[card.id] ?? ""}
                          onChange={(event) =>
                            setCommentDrafts((current) => ({
                              ...current,
                              [card.id]: event.target.value,
                            }))
                          }
                          placeholder="Add a comment"
                        />
                        <Button
                          size="sm"
                          disabled={pending}
                          onClick={() => handleAddComment(card.id)}
                        >
                          Comment
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}

                <div className="space-y-2">
                  <Input
                    value={newTitles[column.id] ?? ""}
                    onChange={(event) =>
                      setNewTitles((current) => ({
                        ...current,
                        [column.id]: event.target.value,
                      }))
                    }
                    placeholder="New card title"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    disabled={pending}
                    onClick={() => handleCreateCard(column.id)}
                  >
                    Add card
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
