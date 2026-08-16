"use client";

import { X } from "lucide-react";

import { Button } from "@jayant/web-ui/button";
import { Label } from "@jayant/web-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jayant/web-ui/select";

import { GameSetupSheet } from "@/components/games/game-setup-sheet";
import type {
  Attempt,
  CustomDare,
  Player,
} from "@/components/games/use-dare-x";

interface CustomListSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customDares: CustomDare[];
  deleteCustomDare: (id: string) => void;
  configLocked: boolean;
}

/** Manage the custom prompt deck separately from the main Dare X setup flow. */
export function DareXCustomListSheet({
  open,
  onOpenChange,
  customDares,
  deleteCustomDare,
  configLocked,
}: CustomListSheetProps) {
  return (
    <GameSetupSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Custom dares"
      description="Manage the custom prompts available to Dare X. Built-in dares are not shown here."
      className="sm:max-w-lg"
    >
      <div className="space-y-2 text-sm">
        {customDares.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            No custom dares yet. Add one from the setup sheet.
          </div>
        ) : (
          customDares.map((dare) => (
            <div
              key={dare.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background p-3"
            >
              <span className="text-sm leading-6">{dare.text}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteCustomDare(dare.id)}
                disabled={configLocked}
              >
                <span className="sr-only">Delete dare</span>
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))
        )}
      </div>
    </GameSetupSheet>
  );
}

interface HistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historyPlayerId: string | null;
  setHistoryPlayerId: (id: string) => void;
  players: Player[];
  selectedHistoryPlayer: Player | undefined;
  completed: Record<string, { done: string[]; skipped: string[] }>;
  history: Attempt[];
}

/** Present completed and skipped dares for the selected player. */
export function DareXHistorySheet({
  open,
  onOpenChange,
  historyPlayerId,
  setHistoryPlayerId,
  players,
  selectedHistoryPlayer,
  completed,
  history,
}: HistorySheetProps) {
  const completedAttempts = history.filter(
    (attempt) =>
      attempt.playerId === selectedHistoryPlayer?.id &&
      attempt.status === "done",
  );
  const skippedAttempts = history.filter(
    (attempt) =>
      attempt.playerId === selectedHistoryPlayer?.id &&
      attempt.status === "not_done",
  );

  return (
    <GameSetupSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Dare history"
      description="Review completed and skipped dares for each active player."
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Player</Label>
          <Select
            value={historyPlayerId ?? undefined}
            onValueChange={setHistoryPlayerId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select player" />
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <HistoryColumn
            title="Done"
            count={completed[selectedHistoryPlayer?.id ?? ""]?.done.length ?? 0}
            attempts={completedAttempts}
            emptyMessage="No done dares yet."
          />
          <HistoryColumn
            title="Skipped"
            count={
              completed[selectedHistoryPlayer?.id ?? ""]?.skipped.length ?? 0
            }
            attempts={skippedAttempts}
            emptyMessage="No skipped dares yet."
          />
        </div>
      </div>
    </GameSetupSheet>
  );
}

/** Render one status column in the Dare X history sheet. */
function HistoryColumn({
  title,
  count,
  attempts,
  emptyMessage,
}: {
  title: string;
  count: number;
  attempts: Attempt[];
  emptyMessage: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/25 p-4">
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{title}</span>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <div className="mt-2 max-h-[320px] space-y-2 overflow-y-auto text-sm">
        {attempts.map((attempt) => (
          <div key={attempt.id} className="rounded-md border bg-background p-2">
            <div className="text-xs text-muted-foreground">
              {new Date(attempt.createdAt).toLocaleString()}
            </div>
            <div className="font-medium">{attempt.dare}</div>
          </div>
        ))}
        {attempts.length === 0 ? (
          <div className="text-xs text-muted-foreground">{emptyMessage}</div>
        ) : null}
      </div>
    </div>
  );
}
