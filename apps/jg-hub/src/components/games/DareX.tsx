"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react"
import {
  Check,
  Download,
  Loader2,
  RefreshCcw,
  Settings,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { playToastSound } from "@/lib/sound"
import { cn } from "@/lib/utils"

type DareSource = "built-in" | "custom" | "mixed"
type AttemptStatus = "done" | "not_done"

type Player = { id: string; name: string }

type Attempt = {
  id: string
  dare: string
  status: AttemptStatus
  playerId: string
  playerName: string
  createdAt: string
}

type CustomDare = {
  id: string
  text: string
}

const FALLBACK_DARES = [
  "Do 10 jumping jacks.",
  "Sing a line from your favorite song.",
  "Share a fun fact you know.",
  "Do a silly dance for 10 seconds.",
  "Tell a joke.",
  "Act like a robot for 15 seconds.",
  "Name three cities you want to visit.",
] as const

const STORAGE_KEYS = {
  custom: "darex:custom-dares",
  source: "darex:source",
  players: "darex:players",
  count: "darex:player-count",
} as const

const MIN_PLAYERS = 2
const MAX_PLAYERS = 5

const DEFAULT_PLAYERS: Player[] = Array.from({ length: MAX_PLAYERS }).map(
  (_, idx) => ({
    id: `p${idx + 1}`,
    name: `Player ${idx + 1}`,
  })
)

export function DareX() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [builtInDares, setBuiltInDares] = useState<string[]>([
    ...FALLBACK_DARES,
  ])
  const [customDares, setCustomDares] = useState<CustomDare[]>([])
  const [dareSource, setDareSource] = useState<DareSource>("built-in")

  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS)
  const [playerCount, setPlayerCount] = useState(2)
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)

  const [currentDare, setCurrentDare] = useState(
    "Open setup to start and lock your dares."
  )
  const [history, setHistory] = useState<Attempt[]>([])
  const [completed, setCompleted] = useState<
    Record<string, { done: string[]; skipped: string[] }>
  >(
    DEFAULT_PLAYERS.reduce<Record<string, { done: string[]; skipped: string[] }>>(
      (acc, player) => {
        acc[player.id] = { done: [], skipped: [] }
        return acc
      },
      {}
    )
  )

  const [newCustomDare, setNewCustomDare] = useState("")
  const [showSetupSheet, setShowSetupSheet] = useState(true)
  const [showCustomListSheet, setShowCustomListSheet] = useState(false)
  const [showHistorySheet, setShowHistorySheet] = useState(false)
  const [configLocked, setConfigLocked] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [historyPlayerId, setHistoryPlayerId] = useState<string | null>(null)

  const activeDares = useMemo(() => {
    if (dareSource === "custom") return customDares.map((dare) => dare.text)
    if (dareSource === "mixed") {
      return Array.from(
        new Set([...builtInDares, ...customDares.map((dare) => dare.text)])
      )
    }
    return builtInDares
  }, [builtInDares, customDares, dareSource])

  useEffect(() => {
    const loadBuiltIns = async () => {
      try {
        const response = await fetch("/assets/games/Dare-X/dares.json")
        if (!response.ok) throw new Error("Failed to load dares")
        const data = (await response.json()) as string[]
        if (Array.isArray(data) && data.length > 0) {
          setBuiltInDares(data)
        }
      } catch {
        // fallback already set
      }
    }
    void loadBuiltIns()
  }, [])

  useEffect(() => {
    try {
      const storedCustom = localStorage.getItem(STORAGE_KEYS.custom)
      const storedSource = localStorage.getItem(STORAGE_KEYS.source)
      const storedPlayers = localStorage.getItem(STORAGE_KEYS.players)
      const storedCountRaw = localStorage.getItem(STORAGE_KEYS.count)
      let inferredCount: number | null = null

      if (storedCustom) {
        const parsed = JSON.parse(storedCustom) as CustomDare[]
        if (Array.isArray(parsed)) {
          setCustomDares(parsed)
        }
      }
      if (
        storedSource === "custom" ||
        storedSource === "built-in" ||
        storedSource === "mixed"
      ) {
        setDareSource(storedSource)
      }
      if (storedPlayers) {
        const parsedPlayers = JSON.parse(storedPlayers) as Player[]
        if (Array.isArray(parsedPlayers)) {
          const sanitized = DEFAULT_PLAYERS.map((fallback, idx) => ({
            id: parsedPlayers[idx]?.id || fallback.id,
            name: parsedPlayers[idx]?.name?.trim() || fallback.name,
          }))
          setPlayers(sanitized)
          if (storedCountRaw) {
            const parsedCount = Number(storedCountRaw)
            if (!Number.isNaN(parsedCount)) {
              inferredCount = Math.min(Math.max(parsedCount, MIN_PLAYERS), MAX_PLAYERS)
            }
          }
        }
      }
      if (storedCountRaw) {
        const parsedCount = Number(storedCountRaw)
        if (!Number.isNaN(parsedCount)) {
          inferredCount = Math.min(Math.max(parsedCount, MIN_PLAYERS), MAX_PLAYERS)
        }
      }
      if (inferredCount !== null) {
        setPlayerCount(inferredCount)
      }
    } catch {
      // ignore corrupted storage
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.custom, JSON.stringify(customDares))
  }, [customDares])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.source, dareSource)
  }, [dareSource])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(players))
  }, [players])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.count, String(playerCount))
  }, [playerCount])

  const activePlayers = useMemo(
    () => players.slice(0, playerCount),
    [players, playerCount]
  )

  const currentPlayer = activePlayers[currentPlayerIndex] ?? activePlayers[0]
  const selectedHistoryPlayer =
    players.find((p) => p.id === historyPlayerId) ??
    activePlayers[0] ??
    players[0]

  useEffect(() => {
    if (activePlayers.length > 0) {
      setHistoryPlayerId((prev) => prev ?? activePlayers[0]!.id)
    }
  }, [activePlayers])

  const availableForPlayer = (playerId: string) =>
    activeDares.filter(
      (dare) =>
        !completed[playerId]?.done.includes(dare) &&
        !completed[playerId]?.skipped.includes(dare)
    )

  const everyoneFinished = () => {
    if (!activeDares.length) return false
    return activePlayers.every((player) =>
      activeDares.every(
        (dare) =>
          completed[player.id]?.done.includes(dare) ||
          completed[player.id]?.skipped.includes(dare)
      )
    )
  }

  const nextId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)

  const syncCompletionMap = (nextPlayers: Player[]) => {
    const next: Record<string, { done: string[]; skipped: string[] }> = {}
    nextPlayers.forEach((player) => {
      next[player.id] = completed[player.id] ?? { done: [], skipped: [] }
    })
    setCompleted(next)
  }

  const getRandomDare = (playerId: string) => {
    const pool = availableForPlayer(playerId)
    if (pool.length === 0) {
      if (everyoneFinished()) {
        const resetMap: Record<string, { done: string[]; skipped: string[] }> = {}
        players.forEach((p) => {
          resetMap[p.id] = { done: [], skipped: [] }
        })
        setCompleted(resetMap)
        return "All dares completed by every player! List reset—grab a new dare."
      }
      return `All dares are done for ${currentPlayer?.name ?? "this player"}.`
    }
    const index = Math.floor(Math.random() * pool.length)
    return pool[index] ?? "No dare available."
  }

  const spinNextDare = (playerId: string, opts?: { force?: boolean }) => {
    const allow = opts?.force ?? false
    if (!configLocked && !allow) {
      toast.error("Start the game from setup first.")
      return
    }
    if (isSpinning) return
    if (activeDares.length === 0) {
      toast.error("No dares available. Add custom dares in setup.")
      return
    }
    setIsSpinning(true)
    setCurrentDare("Generating new dare...")
    setTimeout(() => {
      const next = getRandomDare(playerId)
      setCurrentDare(next)
      setIsSpinning(false)
    }, 350)
  }

  const resetSession = (unlock = false) => {
    const resetMap: Record<string, { done: string[]; skipped: string[] }> = {}
    players.forEach((p) => {
      resetMap[p.id] = { done: [], skipped: [] }
    })
    setCompleted(resetMap)
    setHistory([])
    setCurrentDare("Open setup to start and lock your dares.")
    setCurrentPlayerIndex(0)
    if (unlock) {
      setConfigLocked(false)
      setShowSetupSheet(true)
    }
  }

  const handleStartGame = () => {
    if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
      toast.error(`Players must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}.`)
      return
    }
    const trimmed = players.map((p, idx) => ({
      ...p,
      name: (p.name || "").trim() || `Player ${idx + 1}`,
    }))
    setPlayers(trimmed)
    syncCompletionMap(trimmed)
    const activeList = trimmed.slice(0, playerCount)
    if (activeList.length === 0) {
      toast.error("Add at least two players.")
      return
    }
    setHistory([])
    setCurrentPlayerIndex(0)
    setConfigLocked(true)
    setShowSetupSheet(false)
    setCurrentDare("Generating new dare...")
    spinNextDare(activeList[0]!.id, { force: true })
  }

  const recordAttempt = (status: AttemptStatus) => {
    if (!configLocked) {
      toast.error("Start the game from setup first.")
      return
    }
    if (
      !currentDare ||
      currentDare.startsWith("Open setup") ||
      currentDare.startsWith("Generating")
    ) {
      toast.error("Get a dare first.")
      return
    }
    const player = activePlayers[currentPlayerIndex]
    if (!player) return

    const attempt: Attempt = {
      id: nextId(),
      dare: currentDare,
      status,
      playerId: player.id,
      playerName: player.name,
      createdAt: new Date().toISOString(),
    }

    setHistory((prev) => [attempt, ...prev])
    setCompleted((prev) => ({
      ...prev,
      [player.id]: {
        done:
          status === "done"
            ? [...(prev[player.id]?.done ?? []), currentDare]
            : prev[player.id]?.done ?? [],
        skipped:
          status === "not_done"
            ? [...(prev[player.id]?.skipped ?? []), currentDare]
            : prev[player.id]?.skipped ?? [],
      },
    }))

    if (status === "done") {
      toast.success(`${player.name} completed the dare!`)
    } else {
      toast("Skipped", { description: `${player.name} skipped this dare.` })
    }
    void playToastSound()

    const nextIndex =
      activePlayers.length === 0 ? 0 : (currentPlayerIndex + 1) % activePlayers.length
    setCurrentPlayerIndex(nextIndex)
    if (activePlayers[nextIndex]) {
      spinNextDare(activePlayers[nextIndex]!.id)
    }
  }

  const addCustomDare = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    if (configLocked) {
      toast.error("Dares are locked for this session.")
      return
    }
    setCustomDares((prev) => [...prev, { id: nextId(), text: trimmed }])
    setNewCustomDare("")
    toast.success("Custom dare added.")
  }

  const deleteCustomDare = (id: string) => {
    if (configLocked) {
      toast.error("Dares are locked for this session.")
      return
    }
    setCustomDares((prev) => prev.filter((dare) => dare.id !== id))
  }

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text) as { text?: string }[] | string[]
      const normalized =
        Array.isArray(data) && typeof data[0] === "string"
          ? (data as string[]).map((item, idx) => ({
              id: `${Date.now()}-${idx}`,
              text: String(item).trim(),
            }))
          : Array.isArray(data)
            ? (data as { text?: string }[])
                .map((item, idx) => ({
                  id: `${Date.now()}-${idx}`,
                  text: (item.text ?? "").trim(),
                }))
                .filter((item) => item.text.length > 0)
            : []
      if (!normalized.length) {
        throw new Error("No dares found in file.")
      }
      setCustomDares((prev) => [...prev, ...normalized])
      toast.success("Imported custom dares.")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to import file."
      toast.error(message)
    } finally {
      setIsImporting(false)
      event.target.value = ""
    }
  }

  const handleExport = () => {
    if (!customDares.length) {
      toast.error("No custom dares to download.")
      return
    }
    const blob = new Blob(
      [JSON.stringify(customDares.map((item) => ({ text: item.text })), null, 2)],
      { type: "application/json" }
    )
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "custom-dares.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleCountChange = (value: number) => {
    const nextCount = Math.min(Math.max(value, MIN_PLAYERS), MAX_PLAYERS)
    setPlayerCount(nextCount)
    setCurrentPlayerIndex(0)
    const updatedMap: Record<string, { done: string[]; skipped: string[] }> = {}
    players.forEach((player) => {
      updatedMap[player.id] = completed[player.id] ?? { done: [], skipped: [] }
    })
    setCompleted(updatedMap)
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

      <Sheet open={showSetupSheet} onOpenChange={setShowSetupSheet}>
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

      <Sheet open={showCustomListSheet} onOpenChange={setShowCustomListSheet}>
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

      <Sheet open={showHistorySheet} onOpenChange={setShowHistorySheet}>
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
    </>
  )
}
