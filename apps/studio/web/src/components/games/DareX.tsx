"use client";

import { useState } from "react";
import {
  Check,
  Loader2,
  RefreshCcw,
  Settings,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@jayantgoyal/web-ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@jayantgoyal/web-ui/card";

import type { GameSetupPath } from "@/components/games/game-setup-sheet";
import { useDareX } from "@/components/games/use-dare-x";
import { DareXSetupSheet } from "@/components/games/dare-x-sheets";
import {
  DareXCustomListSheet,
  DareXHistorySheet,
} from "@/components/games/dare-x-history-sheets";
import { createDareXState } from "@/lib/games/dare-x";

export function DareX() {
  const router = useRouter();
  const {
    fileInputRef,
    customDares,
    dareSource,
    setDareSource,
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
  } = useDareX();
  const [setupPath, setSetupPath] = useState<GameSetupPath>("local");
  const [onlineName, setOnlineName] = useState("Player 1");
  const [joinCode, setJoinCode] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);

  const createOnlineRoom = async () => {
    setCreatingRoom(true);
    const response = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameSlug: "dare-x",
        displayName: onlineName,
        settings: {
          maxPlayers: playerCount,
          initialState: createDareXState({
            dares: activeDares,
            currentSeat: "P1",
            targetRounds: Math.max(playerCount * 3, 6),
          }),
        },
      }),
    });
    setCreatingRoom(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast.error(data.error ?? "Unable to create Dare X room");
      return;
    }

    const data = await response.json();
    const roomCode = data?.session?.session?.room_code;
    if (typeof roomCode !== "string") {
      toast.error("Room created, but no room code was returned");
      return;
    }

    router.push(`/games/dare-x/room/${roomCode}`);
  };

  const joinOnlineRoom = () => {
    const roomCode = joinCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6,10}$/.test(roomCode)) {
      toast.error("Enter a valid room code");
      return;
    }
    router.push(`/games/dare-x/room/${roomCode}`);
  };

  return (
    <>
      <Card className="overflow-hidden rounded-[1.75rem] border-border/80 bg-card shadow-none">
        <CardHeader className="flex flex-col gap-3 border-b border-border/70 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-[family-name:var(--font-ibm-plex-mono)] text-[0.7rem] uppercase tracking-[0.15em] text-muted-foreground">
                Current session
              </p>
              <CardTitle className="mt-1 text-2xl tracking-[-0.035em]">
                {configLocked
                  ? (currentPlayer?.name ?? "In progress")
                  : "Ready to configure"}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSetupSheet(true);
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
                <span className="sr-only">Start a new setup</span>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="flex flex-wrap items-center gap-2 font-[family-name:var(--font-ibm-plex-mono)] text-[0.7rem] uppercase tracking-[0.13em] text-muted-foreground">
            <Users className="size-3.5" />
            {playerCount} players · {activeDares.length} dares ·{" "}
            {dareSource === "mixed" ? "Custom + built-in" : dareSource}
          </p>
        </CardHeader>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[0.65fr_1.35fr]">
            <div className="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Current player</span>
                <span>
                  {playerCount} player{playerCount === 1 ? "" : "s"} •{" "}
                  {activeDares.length} dares
                </span>
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                {currentPlayer?.name ?? "—"}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[#cfc0e4] bg-[#e8dcf5] p-5 text-[#211512] dark:border-[#5c5068] dark:bg-[#2f2938] dark:text-[#fff8ef]">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>Current dare</span>
                <span>Dares locked after start</span>
              </div>
              <div className="mt-3 min-h-[72px] text-xl font-semibold leading-8 tracking-[-0.02em]">
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

          <div className="rounded-[1.5rem] border border-border/70 bg-muted/25 p-4">
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
                const doneCount = completed[player.id]?.done.length ?? 0;
                const skippedCount = completed[player.id]?.skipped.length ?? 0;
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-background p-3 text-sm"
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
                );
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
        players={activePlayers}
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
        setupPath={setupPath}
        setSetupPath={setSetupPath}
        onlineName={onlineName}
        setOnlineName={setOnlineName}
        joinCode={joinCode}
        setJoinCode={setJoinCode}
        creatingRoom={creatingRoom}
        createOnlineRoom={createOnlineRoom}
        joinOnlineRoom={joinOnlineRoom}
        canCreateOnlineRoom={activeDares.length > 0}
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
        players={activePlayers}
        selectedHistoryPlayer={selectedHistoryPlayer}
        completed={completed}
        history={history}
      />
    </>
  );
}
