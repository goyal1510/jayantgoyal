"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@jayantgoyal/web-ui/button";

import {
  restoreCardAction,
  unarchiveCardAction,
} from "@/server/commands/lifecycle-actions";
import type { CardSummary } from "@/lib/orbit/types";

type BoardArchivePanelProps = {
  boardId: string;
  boardKey: string;
  mode: "archived" | "trashed";
  cards: CardSummary[];
};

export function BoardArchivePanel({
  boardId,
  boardKey,
  mode,
  cards,
}: BoardArchivePanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function restore(card: CardSummary) {
    startTransition(async () => {
      const result =
        mode === "trashed"
          ? await restoreCardAction({ boardId, cardId: card.id })
          : await unarchiveCardAction({
              boardId,
              cardId: card.id,
              expectedVersion: card.version,
            });
      if (!result.ok) toast.error(result.error);
      else {
        toast.success("Card restored");
        router.refresh();
      }
    });
  }

  if (cards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No {mode} cards in this board.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {cards.map((card) => (
        <div
          key={card.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {boardKey}-{card.number}
            </p>
            <p className="font-medium">{card.title}</p>
          </div>
          <Button size="sm" disabled={pending} onClick={() => restore(card)}>
            Restore
          </Button>
        </div>
      ))}
    </div>
  );
}
