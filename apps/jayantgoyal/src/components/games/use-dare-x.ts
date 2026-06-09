"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react"
import { toast } from "sonner"

export type DareSource = "built-in" | "custom" | "mixed"
export type AttemptStatus = "done" | "not_done"

export type Player = { id: string; name: string }

export type Attempt = {
  id: string
  dare: string
  status: AttemptStatus
  playerId: string
  playerName: string
  createdAt: string
}

export type CustomDare = {
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

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 5

const DEFAULT_PLAYERS: Player[] = Array.from({ length: MAX_PLAYERS }).map(
  (_, idx) => ({
    id: `p${idx + 1}`,
    name: `Player ${idx + 1}`,
  })
)

export function useDareX() {
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
  const [showSetupSheet, setShowSetupSheet] = useState(false)
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

  return {
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
  }
}
