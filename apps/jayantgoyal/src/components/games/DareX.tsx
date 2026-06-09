"use client"

import { useEffect, useState } from "react"
import {
  Bot,
  Check,
  Globe2,
  Loader2,
  RefreshCcw,
  Settings,
  Users,
  X,
  Zap,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import { Separator } from "@repo/ui/separator"

import { useDareX } from "@/components/games/use-dare-x"
import { GameSetupShell } from "@/components/games/game-setup-shell"
import {
  DareXSetupSheet,
  DareXCustomListSheet,
  DareXHistorySheet,
} from "@/components/games/dare-x-sheets"
import { createDareXState } from "@/lib/games/dare-x"

type DareXMode = "local_pvp" | "vs_computer"

function isActionableDare(value: string | null | undefined) {
  return Boolean(value) &&
    !value?.startsWith("Open setup") &&
    !value?.startsWith("Generating")
}

export function DareX() {
  const router = useRouter()
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
  const [mode, setMode] = useState<DareXMode>("local_pvp")
  const [onlineName, setOnlineName] = useState("Player 1")
  const [joinCode, setJoinCode] = useState("")
  const [creatingRoom, setCreatingRoom] = useState(false)

  useEffect(() => {
    if (
      mode !== "vs_computer" ||
      !configLocked ||
      isSpinning ||
      currentPlayer?.id !== "p2" ||
      !isActionableDare(currentDare)
    ) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      recordAttempt(Math.random() > 0.35 ? "done" : "not_done")
    }, 900)

    return () => window.clearTimeout(timeoutId)
  }, [configLocked, currentDare, currentPlayer?.id, isSpinning, mode, recordAttempt])

  const switchMode = (nextMode: DareXMode) => {
    setMode(nextMode)
    if (nextMode === "vs_computer") {
      handleCountChange(2)
      setPlayers((current) =>
        current.map((player, index) =>
          index === 0
            ? { ...player, name: player.name.trim() || "You" }
            : index === 1
              ? { ...player, name: "Computer" }
              : player
        )
      )
    }
    resetSession(true)
  }

  const createOnlineRoom = async () => {
    setCreatingRoom(true)
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
    })
    setCreatingRoom(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      toast.error(data.error ?? "Unable to create Dare X room")
      return
    }

    const data = await response.json()
    const roomCode = data?.session?.session?.room_code
    if (typeof roomCode !== "string") {
      toast.error("Room created, but no room code was returned")
      return
    }

    router.push(`/games/dare-x/room/${roomCode}`)
  }

  const joinOnlineRoom = () => {
    const roomCode = joinCode.trim().toUpperCase()
    if (!/^[A-Z0-9]{6,10}$/.test(roomCode)) {
      toast.error("Enter a valid room code")
      return
    }
    router.push(`/games/dare-x/room/${roomCode}`)
  }

  if (!configLocked) {
    return (
      <>
        <GameSetupShell
          title="Dare X"
          description="Choose players, mode, and dare source before the first dare is generated."
          onStart={handleStartGame}
          disabled={isSpinning}
        >
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === "local_pvp" ? "secondary" : "outline"}
              onClick={() => {
                switchMode("local_pvp")
                setShowSetupSheet(false)
              }}
              disabled={isSpinning}
            >
              <Users className="mr-2 h-4 w-4" />
              Local PvP
            </Button>
            <Button
              type="button"
              variant={mode === "vs_computer" ? "secondary" : "outline"}
              onClick={() => {
                switchMode("vs_computer")
                setShowSetupSheet(false)
              }}
              disabled={isSpinning}
            >
              <Bot className="mr-2 h-4 w-4" />
              Vs Computer
            </Button>
          </div>

          <div className="rounded-lg border bg-background/70 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-medium">Players and dares</div>
                <div className="text-xs text-muted-foreground">
                  {playerCount} player{playerCount === 1 ? "" : "s"} · {activeDares.length} active dare{activeDares.length === 1 ? "" : "s"}
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowSetupSheet(true)}>
                Advanced setup
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {activePlayers.map((player) => (
                <div key={player.id} className="rounded-md border bg-muted/20 p-2 text-sm">
                  {player.name}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe2 className="h-4 w-4" />
              Online room
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="dare-online-name">Your display name</Label>
                <Input
                  id="dare-online-name"
                  value={onlineName}
                  onChange={(event) => setOnlineName(event.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={createOnlineRoom} disabled={creatingRoom || activeDares.length === 0} className="w-full">
                  {creatingRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create online room"}
                </Button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="Room code"
                maxLength={10}
              />
              <Button variant="outline" onClick={joinOnlineRoom}>
                Join
              </Button>
            </div>
          </div>
        </GameSetupShell>

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
      </>
    )
  }

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
            <span className="rounded-md border px-2 py-1">
              {mode === "vs_computer" ? "Vs Computer" : "Local PvP"}
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
            <div className="mb-3 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === "local_pvp" ? "secondary" : "outline"}
                onClick={() => switchMode("local_pvp")}
                disabled={isSpinning}
              >
                <Users className="mr-2 h-4 w-4" />
                Local PvP
              </Button>
              <Button
                type="button"
                variant={mode === "vs_computer" ? "secondary" : "outline"}
                onClick={() => switchMode("vs_computer")}
                disabled={isSpinning}
              >
                <Bot className="mr-2 h-4 w-4" />
                Vs Computer
              </Button>
            </div>
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
            {mode === "vs_computer" && currentPlayer?.id === "p2" && (
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Computer is deciding...
              </div>
            )}
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
              disabled={isSpinning || !configLocked || (mode === "vs_computer" && currentPlayer?.id === "p2")}
              className="flex-1 min-w-[140px]"
            >
              <Zap className="mr-2 h-4 w-4" />
              Get dare
            </Button>
            <Button
              variant="outline"
              onClick={() => recordAttempt("done")}
              disabled={isSpinning || !configLocked || (mode === "vs_computer" && currentPlayer?.id === "p2")}
              className="flex-1 min-w-[140px]"
            >
              <Check className="mr-2 h-4 w-4" />
              Done
            </Button>
            <Button
              variant="outline"
              onClick={() => recordAttempt("not_done")}
              disabled={isSpinning || !configLocked || (mode === "vs_computer" && currentPlayer?.id === "p2")}
              className="flex-1 min-w-[140px]"
            >
              <X className="mr-2 h-4 w-4" />
              Not done
            </Button>
          </div>

          <Separator />

          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe2 className="h-4 w-4" />
              Online room
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="dare-online-name">Your display name</Label>
                <Input
                  id="dare-online-name"
                  value={onlineName}
                  onChange={(event) => setOnlineName(event.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={createOnlineRoom} disabled={creatingRoom || activeDares.length === 0} className="w-full">
                  {creatingRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create online room"}
                </Button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="Room code"
                maxLength={10}
              />
              <Button variant="outline" onClick={joinOnlineRoom}>
                Join
              </Button>
            </div>
          </div>

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
