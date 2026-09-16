"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
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
import {
  bulkArchiveCardsAction,
  bulkMoveCardsAction,
  bulkTrashCardsAction,
} from "@/server/commands/lifecycle-actions";
import { createSavedViewAction } from "@/server/commands/feature-actions";
import { loadCardCommentsAction } from "@/server/queries/load-card-comments";
import type {
  AttachmentSummary,
  BoardSummary,
  CardSummary,
  ChecklistSummary,
  ColumnSummary,
  CommentSummary,
  DependencySummary,
  LabelSummary,
  MemberSummary,
  SavedViewSummary,
} from "@/lib/orbit/types";

type BoardViewProps = {
  board: BoardSummary;
  columns: ColumnSummary[];
  cards: CardSummary[];
  labels: LabelSummary[];
  labelIdsByCard: Record<string, string[]>;
  members: MemberSummary[];
  assigneeIdsByCard: Record<string, string[]>;
  attachmentsByCard: Record<string, AttachmentSummary[]>;
  checklistsByCard: Record<string, ChecklistSummary[]>;
  dependenciesByCard: Record<string, DependencySummary[]>;
  watchedCardIds: string[];
  savedViews: SavedViewSummary[];
};

export function BoardView({
  board,
  columns,
  cards: initialCards,
  labels,
  labelIdsByCard,
  members,
  assigneeIdsByCard,
  attachmentsByCard,
  checklistsByCard,
  dependenciesByCard,
  watchedCardIds,
  savedViews,
}: BoardViewProps) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [pending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [newTitles, setNewTitles] = useState<Record<string, string>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [commentsByCard, setCommentsByCard] = useState<
    Record<string, CommentSummary[]>
  >({});
  const loadingComments = useRef(new Set<string>());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [viewName, setViewName] = useState("");

  useBoardRealtime(board.id);

  useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);

  const labelById = useMemo(
    () => new Map(labels.map((label) => [label.id, label])),
    [labels],
  );
  const watchedSet = useMemo(() => new Set(watchedCardIds), [watchedCardIds]);

  const visibleCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return cards;
    return cards.filter((card) => card.title.toLowerCase().includes(query));
  }, [cards, searchQuery]);

  const cardsByColumn = useMemo(() => {
    const grouped: Record<string, CardSummary[]> = {};
    for (const column of columns) grouped[column.id] = [];
    for (const card of visibleCards) grouped[card.columnId]?.push(card);
    return grouped;
  }, [visibleCards, columns]);

  const activeCard = cards.find((card) => card.id === activeCardId) ?? null;

  async function ensureComments(cardId: string) {
    if (commentsByCard[cardId] || loadingComments.current.has(cardId)) return;
    loadingComments.current.add(cardId);
    const result = await loadCardCommentsAction(cardId);
    loadingComments.current.delete(cardId);
    if (result.ok) {
      setCommentsByCard((current) => ({
        ...current,
        [cardId]: result.comments,
      }));
    }
  }

  useEffect(() => {
    if (activeCardId) void ensureComments(activeCardId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per opened card
  }, [activeCardId]);

  const cardPicker = cards.map((card) => ({
    id: card.id,
    number: card.number,
    title: card.title,
  }));

  function toggleSelected(cardId: string) {
    setSelectedIds((current) =>
      current.includes(cardId)
        ? current.filter((id) => id !== cardId)
        : [...current, cardId],
    );
  }

  function handleCreateCard(columnId: string) {
    const title = newTitles[columnId]?.trim();
    if (!title) return;
    startTransition(async () => {
      const result = await createCardAction({ boardId: board.id, columnId, title });
      if (!result.ok) toast.error(result.error);
      else {
        toast.success("Card created");
        setNewTitles((current) => ({ ...current, [columnId]: "" }));
        router.refresh();
      }
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
            ? { ...entry, columnId: targetColumnId, version: entry.version + 1 }
            : entry,
        ),
      );
    });
  }

  function handleBulkMove(targetColumnId: string) {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      const result = await bulkMoveCardsAction({
        boardId: board.id,
        cardIds: selectedIds,
        targetColumnId,
      });
      if (!result.ok) toast.error(result.error);
      else {
        toast.success("Cards moved");
        setSelectedIds([]);
        router.refresh();
      }
    });
  }

  function handleBulkArchive() {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      const result = await bulkArchiveCardsAction({
        boardId: board.id,
        cardIds: selectedIds,
      });
      if (!result.ok) toast.error(result.error);
      else {
        toast.success("Cards archived");
        setSelectedIds([]);
        router.refresh();
      }
    });
  }

  function handleBulkTrash() {
    if (selectedIds.length === 0) return;
    startTransition(async () => {
      const result = await bulkTrashCardsAction({
        boardId: board.id,
        cardIds: selectedIds,
      });
      if (!result.ok) toast.error(result.error);
      else {
        toast.success("Cards trashed");
        setSelectedIds([]);
        router.refresh();
      }
    });
  }

  function handleAddComment(cardId: string) {
    const body = commentDrafts[cardId]?.trim();
    if (!body) return;
    startTransition(async () => {
      const result = await addCommentAction({ boardId: board.id, cardId, body });
      if (!result.ok) toast.error(result.error);
      else {
      toast.success("Comment added");
      setCommentDrafts((current) => ({ ...current, [cardId]: "" }));
      setCommentsByCard((current) => {
        const next = { ...current };
        delete next[cardId];
        return next;
      });
      void ensureComments(cardId);
      }
    });
  }

  function saveView() {
    if (!viewName.trim()) return;
    startTransition(async () => {
      const result = await createSavedViewAction({
        workspaceId: board.workspaceId,
        boardId: board.id,
        name: viewName.trim(),
        filters: { query: searchQuery },
      });
      if (!result.ok) toast.error(result.error);
      else {
        toast.success("View saved");
        setViewName("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-muted/20 p-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {board.key}
          </p>
          <h1 className="text-2xl font-semibold">{board.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {cards.length} cards · {columns.length} columns
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href={`/boards/${board.id}/settings`} className="underline">
            Settings
          </Link>
          <Link href={`/boards/${board.id}/archive`} className="underline">
            Archive
          </Link>
          <Link href={`/workspaces/${board.workspaceId}/members`} className="underline">
            Members
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search cards"
          className="max-w-sm"
        />
        <Input
          value={viewName}
          onChange={(event) => setViewName(event.target.value)}
          placeholder="Save view name"
          className="max-w-xs"
        />
        <Button variant="secondary" disabled={pending} onClick={saveView}>
          Save view
        </Button>
        {savedViews.length > 0 ? (
          <select
            className="h-10 rounded-md border bg-background px-2 text-sm"
            defaultValue=""
            onChange={(event) => {
              const view = savedViews.find((entry) => entry.id === event.target.value);
              const query = view?.filters.query;
              if (typeof query === "string") setSearchQuery(query);
            }}
          >
            <option value="">Saved views</option>
            {savedViews.map((view) => (
              <option key={view.id} value={view.id}>
                {view.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border p-2">
          <span className="text-sm">{selectedIds.length} selected</span>
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) handleBulkMove(event.target.value);
            }}
          >
            <option value="">Bulk move to…</option>
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.name}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" disabled={pending} onClick={handleBulkArchive}>
            Archive
          </Button>
          <Button variant="destructive" size="sm" disabled={pending} onClick={handleBulkTrash}>
            Trash
          </Button>
        </div>
      ) : null}

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
          checklists={checklistsByCard[activeCard.id] ?? []}
          dependencies={dependenciesByCard[activeCard.id] ?? []}
          watched={watchedSet.has(activeCard.id)}
          allCards={cardPicker}
          onClose={() => setActiveCardId(null)}
        />
      ) : null}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="min-w-[280px] max-w-[320px] flex-1"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!draggedCardId) return;
              const card = cards.find((entry) => entry.id === draggedCardId);
              if (card && card.columnId !== column.id) handleMoveCard(card, column.id);
              setDraggedCardId(null);
            }}
          >
            <Card className="h-full border-muted-foreground/10 bg-muted/20 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  <span>{column.name}</span>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                    {(cardsByColumn[column.id] ?? []).length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(cardsByColumn[column.id] ?? []).map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => setDraggedCardId(card.id)}
                    onDragEnd={() => setDraggedCardId(null)}
                    className="cursor-grab rounded-lg border bg-background p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md active:cursor-grabbing"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(card.id)}
                            onChange={() => toggleSelected(card.id)}
                          />
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {board.key}-{card.number}
                          </p>
                        </div>
                        <p className="font-medium">{card.title}</p>
                        {watchedSet.has(card.id) ? (
                          <Badge variant="outline">Watching</Badge>
                        ) : null}
                        {(labelIdsByCard[card.id] ?? []).map((labelId) => {
                          const label = labelById.get(labelId);
                          return label ? (
                            <Badge key={labelId} variant="secondary">
                              {label.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const next = activeCardId === card.id ? null : card.id;
                          setActiveCardId(next);
                          if (next) void ensureComments(next);
                        }}
                      >
                        Open
                      </Button>
                    </div>
                    <select
                      className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                      value={card.columnId}
                      disabled={pending}
                      onChange={(event) => handleMoveCard(card, event.target.value)}
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
                          <p key={comment.id} className="rounded-md bg-muted/50 p-2 text-xs">
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
                        <Button size="sm" disabled={pending} onClick={() => handleAddComment(card.id)}>
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
