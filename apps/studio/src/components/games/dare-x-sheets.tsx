"use client"

import type { ChangeEvent, RefObject } from "react"
import {
  Download,
  Loader2,
  Upload,
  X,
} from "lucide-react"

import { Button } from "@repo/ui/button"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import { Separator } from "@repo/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/sheet"
import { cn } from "@repo/ui/lib/utils"

import type {
  Attempt,
  CustomDare,
  DareSource,
  Player,
} from "@/components/games/use-dare-x"
import { MIN_PLAYERS, MAX_PLAYERS } from "@/components/games/use-dare-x"

interface SetupSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playerCount: number
  handleCountChange: (value: number) => void
  configLocked: boolean
  players: Player[]
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>
  dareSource: DareSource
  setDareSource: (source: DareSource) => void
  customDares: CustomDare[]
  handleExport: () => void
  isImporting: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  handleImport: (event: ChangeEvent<HTMLInputElement>) => void
  newCustomDare: string
  setNewCustomDare: (value: string) => void
  addCustomDare: (value: string) => void
  setShowCustomListSheet: (show: boolean) => void
  handleStartGame: () => void
  isSpinning: boolean
  resetSession: (unlock?: boolean) => void
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
}: SetupSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader className="pb-2">
          <SheetTitle>Setup Dare X</SheetTitle>
          <SheetDescription>
            Choose players and dare source. Once started, dares are locked for the session.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Players ({MIN_PLAYERS}-{MAX_PLAYERS})</Label>
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
            <div className="space-y-2">
              {players.map((player, idx) => {
                const isActive = idx < playerCount
                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="w-24 text-xs text-muted-foreground">
                      Player {idx + 1}:
                    </span>
                    <Input
                      value={player.name}
                      onChange={(event) => {
                        const value = event.target.value
                        setPlayers((prev) =>
                          prev.map((p) =>
                            p.id === player.id ? { ...p, name: value } : p
                          )
                        )
                      }}
                      disabled={configLocked || !isActive}
                      className={!isActive ? "opacity-70" : undefined}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Dare source</Label>
            <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
              {[
                { value: "built-in", label: "Built-in", disabled: false },
                { value: "custom", label: "Custom", disabled: customDares.length === 0 },
                { value: "mixed", label: "Custom + Built-in", disabled: customDares.length === 0 },
              ].map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm",
                    dareSource === option.value && "border-primary",
                    (configLocked || option.disabled) && "cursor-not-allowed opacity-70"
                  )}
                >
                  <input
                    type="radio"
                    className="h-4 w-4 border"
                    checked={dareSource === option.value}
                    onChange={() => {
                      if (configLocked || option.disabled) return
                      setDareSource(option.value as DareSource)
                    }}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Dares lock after you start. Add custom dares before starting.
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
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

            <div className="flex gap-2">
              <Input
                placeholder="Add a custom dare..."
                value={newCustomDare}
                onChange={(event) => setNewCustomDare(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    addCustomDare(newCustomDare)
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
                {customDares.length} custom dare{customDares.length === 1 ? "" : "s"}
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
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 p-4">
          <Button onClick={handleStartGame} disabled={isSpinning}>
            {configLocked ? "Restart game" : "Start game"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              resetSession(true)
            }}
          >
            New session (unlock)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface CustomListSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customDares: CustomDare[]
  deleteCustomDare: (id: string) => void
  configLocked: boolean
}

export function DareXCustomListSheet({
  open,
  onOpenChange,
  customDares,
  deleteCustomDare,
  configLocked,
}: CustomListSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader className="pb-2">
          <SheetTitle>Custom dares</SheetTitle>
          <SheetDescription>
            Manage your custom dares. Built-in dares are not shown here.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 p-4">
          <div className="rounded-lg border bg-muted/30 p-3 max-h-[480px] overflow-y-auto space-y-2 text-sm">
            {customDares.length === 0 ? (
              <div className="text-muted-foreground text-xs">
                No custom dares yet.
              </div>
            ) : (
              customDares.map((dare) => (
                <div
                  key={dare.id}
                  className="flex items-center justify-between gap-2 rounded-md bg-background p-2"
                >
                  <span className="text-sm">{dare.text}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteCustomDare(dare.id)}
                    disabled={configLocked}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface HistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  historyPlayerId: string | null
  setHistoryPlayerId: (id: string) => void
  players: Player[]
  selectedHistoryPlayer: Player | undefined
  completed: Record<string, { done: string[]; skipped: string[] }>
  history: Attempt[]
}

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
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl">
        <SheetHeader className="pb-2">
          <SheetTitle>Detailed history</SheetTitle>
          <SheetDescription>
            Review completed and skipped dares per player.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Player</Label>
            <Select
              value={historyPlayerId ?? undefined}
              onValueChange={(value) => setHistoryPlayerId(value)}
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
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Done</span>
                <span className="text-xs text-muted-foreground">
                  {completed[selectedHistoryPlayer?.id ?? ""]?.done.length ?? 0}
                </span>
              </div>
              <div className="mt-2 space-y-2 max-h-[320px] overflow-y-auto text-sm">
                {(history
                  .filter((h) => h.playerId === selectedHistoryPlayer?.id && h.status === "done")
                  .map((attempt) => (
                    <div
                      key={attempt.id}
                      className="rounded-md border bg-background p-2"
                    >
                      <div className="text-xs text-muted-foreground">
                        {new Date(attempt.createdAt).toLocaleString()}
                      </div>
                      <div className="font-medium">{attempt.dare}</div>
                    </div>
                  ))).slice(0, Number.POSITIVE_INFINITY)}
                {history.filter((h) => h.playerId === selectedHistoryPlayer?.id && h.status === "done").length === 0 ? (
                  <div className="text-xs text-muted-foreground">No done dares yet.</div>
                ) : null}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Skipped</span>
                <span className="text-xs text-muted-foreground">
                  {completed[selectedHistoryPlayer?.id ?? ""]?.skipped.length ?? 0}
                </span>
              </div>
              <div className="mt-2 space-y-2 max-h-[320px] overflow-y-auto text-sm">
                {(history
                  .filter((h) => h.playerId === selectedHistoryPlayer?.id && h.status === "not_done")
                  .map((attempt) => (
                    <div
                      key={attempt.id}
                      className="rounded-md border bg-background p-2"
                    >
                      <div className="text-xs text-muted-foreground">
                        {new Date(attempt.createdAt).toLocaleString()}
                      </div>
                      <div className="font-medium">{attempt.dare}</div>
                    </div>
                  ))).slice(0, Number.POSITIVE_INFINITY)}
                {history.filter((h) => h.playerId === selectedHistoryPlayer?.id && h.status === "not_done").length === 0 ? (
                  <div className="text-xs text-muted-foreground">No skipped dares yet.</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
