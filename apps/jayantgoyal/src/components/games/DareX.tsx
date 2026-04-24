"use client"

import {
  Check,
  Loader2,
  RefreshCcw,
  Settings,
  Users,
  X,
  Zap,
} from "lucide-react"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Separator } from "@repo/ui/separator"

import { useDareX } from "@/components/games/use-dare-x"
import {
  DareXSetupSheet,
  DareXCustomListSheet,
  DareXHistorySheet,
} from "@/components/games/dare-x-sheets"

export function DareX() {
  const {
    fileInputRef,
    customDares,
    dareSource,
    setDareSource,
    players,
    setPlayers,
    playerCount,
    currentPlayer,
    currentDare,
    history,
    completed,
    newCustomDare,
    setNewCustomDare,
    showSetupSheet,
    setShowSetupSheet,
    showCustomListSheet,
    setShowCustomListSheet,
    showHistorySheet,
    setShowHistorySheet,
    configLocked,
    isSpinning,
    isImporting,
    historyPlayerId,
    setHistoryPlayerId,
    activeDares,
    activePlayers,
    selectedHistoryPlayer,
    spinNextDare,
    resetSession,
    handleStartGame,
    recordAttempt,
    addCustomDare,
    deleteCustomDare,
    handleImport,
    handleExport,
    handleCountChange,
  } = useDareX()

  return (
    <>
      <Card className="bg-card">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-xl">Dare X</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSetupSheet(true)
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Setup
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => resetSession(true)}
                title="New setup"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
              <Users className="h-3.5 w-3.5" />
              {playerCount} player{playerCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-md border px-2 py-1">
              Source: {dareSource === "mixed" ? "Custom + Built-in" : dareSource}
            </span>
            {configLocked ? (
              <span className="rounded-md border border-green-500/50 bg-green-500/5 px-2 py-1 text-green-500">
                Locked for this session
              </span>
            ) : (
              <span className="rounded-md border px-2 py-1">
                Configure then start
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Current player</span>
              <span>
                {playerCount} player{playerCount === 1 ? "" : "s"} •{" "}
                {activeDares.length} dares
              </span>
            </div>
            <div className="mt-2 text-lg font-semibold">
              {currentPlayer?.name ?? "—"}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Current dare</span>
              <span>Dares locked after start</span>
            </div>
            <div className="mt-2 min-h-[80px] text-base font-medium leading-relaxed">
              {isSpinning ? (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating new dare...
                </div>
              ) : (
                currentDare
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => currentPlayer && spinNextDare(currentPlayer.id)}
              disabled={isSpinning || !configLocked}
              className="flex-1 min-w-[140px]"
            >
              <Zap className="mr-2 h-4 w-4" />
              Get dare
            </Button>
            <Button
              variant="outline"
              onClick={() => recordAttempt("done")}
              disabled={isSpinning || !configLocked}
              className="flex-1 min-w-[140px]"
            >
              <Check className="mr-2 h-4 w-4" />
              Done
            </Button>
            <Button
              variant="outline"
              onClick={() => recordAttempt("not_done")}
              disabled={isSpinning || !configLocked}
              className="flex-1 min-w-[140px]"
            >
              <X className="mr-2 h-4 w-4" />
              Not done
            </Button>
          </div>

          <Separator />

          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">History</div>
                <div className="text-xs text-muted-foreground">
                  {history.length} record{history.length === 1 ? "" : "s"}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistorySheet(true)}
                disabled={history.length === 0}
              >
                Detailed history
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {activePlayers.map((player) => {
                const doneCount = completed[player.id]?.done.length ?? 0
                const skippedCount = completed[player.id]?.skipped.length ?? 0
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-md border bg-background p-3 text-sm"
                  >
                    <div className="font-medium">{player.name}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-green-500">
                        <Check className="h-3.5 w-3.5" />
                        {doneCount} done
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-red-500">
                        <X className="h-3.5 w-3.5" />
                        {skippedCount} skipped
                      </span>
                    </div>
                  </div>
                )
              })}
              {activePlayers.length === 0 ? (
                <div className="text-xs text-muted-foreground">
                  Add players in setup to track history.
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <DareXSetupSheet
        open={showSetupSheet}
        onOpenChange={setShowSetupSheet}
        playerCount={playerCount}
        handleCountChange={handleCountChange}
        configLocked={configLocked}
        players={players}
        setPlayers={setPlayers}
        dareSource={dareSource}
        setDareSource={setDareSource}
        customDares={customDares}
        handleExport={handleExport}
        isImporting={isImporting}
        fileInputRef={fileInputRef}
        handleImport={handleImport}
        newCustomDare={newCustomDare}
        setNewCustomDare={setNewCustomDare}
        addCustomDare={addCustomDare}
        setShowCustomListSheet={setShowCustomListSheet}
        handleStartGame={handleStartGame}
        isSpinning={isSpinning}
        resetSession={resetSession}
      />

      <DareXCustomListSheet
        open={showCustomListSheet}
        onOpenChange={setShowCustomListSheet}
        customDares={customDares}
        deleteCustomDare={deleteCustomDare}
        configLocked={configLocked}
      />

      <DareXHistorySheet
        open={showHistorySheet}
        onOpenChange={setShowHistorySheet}
        historyPlayerId={historyPlayerId}
        setHistoryPlayerId={setHistoryPlayerId}
        players={players}
        selectedHistoryPlayer={selectedHistoryPlayer}
        completed={completed}
        history={history}
      />
    </>
  )
}
