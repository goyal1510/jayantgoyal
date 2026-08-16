"use client";

import type { ChangeEvent, RefObject } from "react";
import { Download, Globe2, Loader2, Upload, Users } from "lucide-react";

import { Button } from "@jayant/web-ui/button";
import { Input } from "@jayant/web-ui/input";
import { Label } from "@jayant/web-ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jayant/web-ui/select";
import { Separator } from "@jayant/web-ui/separator";
import { cn } from "@jayant/web-ui/lib/utils";

import {
  GameSetupPathPicker,
  GameSetupSheet,
  type GameSetupPath,
} from "@/components/games/game-setup-sheet";
import type {
  CustomDare,
  DareSource,
  Player,
} from "@/components/games/use-dare-x";
import { MIN_PLAYERS, MAX_PLAYERS } from "@/components/games/use-dare-x";

interface SetupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerCount: number;
  handleCountChange: (value: number) => void;
  configLocked: boolean;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  dareSource: DareSource;
  setDareSource: (source: DareSource) => void;
  customDares: CustomDare[];
  handleExport: () => void;
  isImporting: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleImport: (event: ChangeEvent<HTMLInputElement>) => void;
  newCustomDare: string;
  setNewCustomDare: (value: string) => void;
  addCustomDare: (value: string) => void;
  setShowCustomListSheet: (show: boolean) => void;
  handleStartGame: () => void;
  isSpinning: boolean;
  resetSession: (unlock?: boolean) => void;
  setupPath: GameSetupPath;
  setSetupPath: (path: GameSetupPath) => void;
  onlineName: string;
  setOnlineName: (name: string) => void;
  joinCode: string;
  setJoinCode: (code: string) => void;
  creatingRoom: boolean;
  createOnlineRoom: () => void;
  joinOnlineRoom: () => void;
  canCreateOnlineRoom: boolean;
}

export function DareXSetupSheet({
  open,
  onOpenChange,
  playerCount,
  handleCountChange,
  configLocked,
  players,
  setPlayers,
  dareSource,
  setDareSource,
  customDares,
  handleExport,
  isImporting,
  fileInputRef,
  handleImport,
  newCustomDare,
  setNewCustomDare,
  addCustomDare,
  setShowCustomListSheet,
  handleStartGame,
  isSpinning,
  resetSession,
  setupPath,
  setSetupPath,
  onlineName,
  setOnlineName,
  joinCode,
  setJoinCode,
  creatingRoom,
  createOnlineRoom,
  joinOnlineRoom,
  canCreateOnlineRoom,
}: SetupSheetProps) {
  return (
    <GameSetupSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Set up Dare X"
      description="Choose local or online play, then configure the players and dare deck for that session."
      footer={
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={
              setupPath === "online" ? createOnlineRoom : handleStartGame
            }
            disabled={
              isSpinning ||
              creatingRoom ||
              (setupPath === "online" && !canCreateOnlineRoom)
            }
            className="flex-[1.35]"
          >
            {creatingRoom ? (
              <Loader2 className="size-4 animate-spin" />
            ) : setupPath === "online" ? (
              "Create room"
            ) : configLocked ? (
              "Restart local game"
            ) : (
              "Start local game"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-7">
        <section className="space-y-3">
          <Label className="text-sm font-semibold">
            How do you want to play?
          </Label>
          <GameSetupPathPicker
            value={setupPath}
            onValueChange={setSetupPath}
            options={[
              {
                value: "local",
                label: "Local",
                description: "Pass one device around.",
                icon: <Users className="size-4" />,
              },
              {
                value: "online",
                label: "Online",
                description: "Create or join a room.",
                icon: <Globe2 className="size-4" />,
              },
            ]}
          />
        </section>

        {setupPath === "online" ? (
          <section className="space-y-5 rounded-2xl border border-border/70 bg-muted/25 p-4">
            <div className="space-y-2">
              <Label htmlFor="dare-online-name">Your display name</Label>
              <Input
                id="dare-online-name"
                value={onlineName}
                onChange={(event) => setOnlineName(event.target.value)}
              />
            </div>
            <div className="space-y-2 border-t border-border/70 pt-4">
              <Label htmlFor="dare-room-code">Already have a room?</Label>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  id="dare-room-code"
                  value={joinCode}
                  onChange={(event) =>
                    setJoinCode(event.target.value.toUpperCase())
                  }
                  placeholder="Room code"
                  maxLength={10}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={joinOnlineRoom}
                >
                  Join room
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="space-y-3">
          <div>
            <Label className="text-sm font-semibold">
              Players ({MIN_PLAYERS}-{MAX_PLAYERS})
            </Label>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {setupPath === "online"
                ? "Set the room capacity and the local display names used to seed it."
                : "Only active player fields are shown."}
            </p>
          </div>
          <Select
            value={String(playerCount)}
            onValueChange={(value) => handleCountChange(Number(value))}
            disabled={configLocked}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select players" />
            </SelectTrigger>
            <SelectContent>
              {[2, 3, 4, 5].map((count) => (
                <SelectItem key={count} value={String(count)}>
                  {count} player{count === 1 ? "" : "s"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid gap-3 sm:grid-cols-2">
            {players.slice(0, playerCount).map((player, idx) => (
              <div key={player.id} className="space-y-2">
                <Label htmlFor={`dare-player-${player.id}`}>
                  Player {idx + 1}
                </Label>
                <Input
                  id={`dare-player-${player.id}`}
                  value={player.name}
                  onChange={(event) => {
                    const value = event.target.value;
                    setPlayers((prev) =>
                      prev.map((p) =>
                        p.id === player.id ? { ...p, name: value } : p,
                      ),
                    );
                  }}
                  disabled={configLocked}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <Label className="text-sm font-semibold">Dare source</Label>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
            {[
              { value: "built-in", label: "Built-in", disabled: false },
              {
                value: "custom",
                label: "Custom",
                disabled: customDares.length === 0,
              },
              {
                value: "mixed",
                label: "Custom + Built-in",
                disabled: customDares.length === 0,
              },
            ].map((option) => (
              <button
                type="button"
                key={option.value}
                role="radio"
                aria-checked={dareSource === option.value}
                disabled={configLocked || option.disabled}
                onClick={() => setDareSource(option.value as DareSource)}
                className={cn(
                  "min-h-12 rounded-xl border p-3 text-left text-sm font-medium transition",
                  dareSource === option.value
                    ? "border-primary bg-primary/40"
                    : "border-border/80 bg-background hover:bg-muted/50",
                  (configLocked || option.disabled) &&
                    "cursor-not-allowed opacity-60",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Dares lock after you start. Add custom dares before starting.
          </p>
        </section>

        <Separator />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Custom dares</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleExport}
                disabled={!customDares.length}
                title="Download custom dares (built-in cannot be downloaded)"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting || configLocked}
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImport}
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              placeholder="Add a custom dare..."
              value={newCustomDare}
              onChange={(event) => setNewCustomDare(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustomDare(newCustomDare);
                }
              }}
              disabled={configLocked}
            />
            <Button
              variant="secondary"
              onClick={() => addCustomDare(newCustomDare)}
              disabled={configLocked}
            >
              Add
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              {customDares.length} custom dare
              {customDares.length === 1 ? "" : "s"}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowCustomListSheet(true)}
            >
              View custom dares
            </Button>
          </div>
        </section>

        {configLocked ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => resetSession(true)}
            className="w-full"
          >
            Unlock and clear this session
          </Button>
        ) : null}
      </div>
    </GameSetupSheet>
  );
}
