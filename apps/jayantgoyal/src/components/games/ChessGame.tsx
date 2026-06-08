"use client"

import * as React from "react"
import { Chess } from "chess.js"
import { useRouter } from "next/navigation"
import { Bot, Crown, Globe2, Loader2, RotateCcw, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import { cn } from "@repo/ui/lib/utils"

import {
  CHESS_PIECES,
  createChessState,
  getChessCompletion,
  type ChessSquare,
} from "@/lib/games/chess"

function ChessBoard({
  chess,
  selected,
  legalTargets,
  onSquareClick,
  disabled,
}: {
  chess: Chess
  selected: ChessSquare | null
  legalTargets: Set<string>
  onSquareClick: (square: ChessSquare) => void
  disabled?: boolean
}) {
  const board = chess.board()

  return (
    <div className="grid aspect-square w-full max-w-[min(86vw,620px)] grid-cols-8 overflow-hidden rounded-xl border border-stone-950/20 bg-stone-900 shadow-2xl shadow-stone-950/20">
      {board.flat().map((piece, index) => {
        const row = Math.floor(index / 8)
        const col = index % 8
        const file = "abcdefgh"[col]!
        const rank = String(8 - row)
        const square = `${file}${rank}` as ChessSquare
        const light = (row + col) % 2 === 0
        const isSelected = selected === square
        const isLegal = legalTargets.has(square)
        const pieceName = piece
          ? `${piece.color === "w" ? "White" : "Black"} ${piece.type}`
          : "Empty"
        const label = `${square}: ${pieceName}`

        return (
          <button
            key={square}
            type="button"
            onClick={() => onSquareClick(square)}
            disabled={disabled}
            className={cn(
              "relative flex items-center justify-center text-3xl font-semibold transition sm:text-5xl",
              light ? "bg-[#e8d7b2]" : "bg-[#8b5f3c]",
              isSelected && "ring-4 ring-amber-400 ring-inset",
              isLegal && "after:absolute after:h-4 after:w-4 after:rounded-full after:bg-emerald-500/70 sm:after:h-5 sm:after:w-5",
              disabled && "cursor-not-allowed"
            )}
            aria-label={label}
            title={label}
          >
            <span className={piece?.color === "w" ? "text-stone-50 drop-shadow-[0_2px_2px_rgba(0,0,0,0.45)]" : "text-stone-950 drop-shadow-[0_1px_1px_rgba(255,255,255,0.35)]"}>
              {piece ? CHESS_PIECES[`${piece.color}${piece.type}`] : ""}
            </span>
            {(row === 7 || col === 0) && (
              <span className="absolute bottom-1 left-1 text-[10px] font-bold text-black/45">
                {col === 0 ? rank : ""}
                {row === 7 ? file : ""}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

type ChessMode = "local_pvp" | "vs_computer"

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
}

function chooseComputerMove(chess: Chess) {
  const moves = chess.moves({ verbose: true })
  if (moves.length === 0) return null

  const scoredMoves = moves.map((move) => {
    const next = new Chess(chess.fen())
    next.move(move)

    let score = 0
    if (next.isCheckmate()) score += 100000
    if (next.inCheck()) score += 45
    if (move.captured) score += (PIECE_VALUES[move.captured] ?? 0) + 20
    if (move.promotion) score += PIECE_VALUES[move.promotion] ?? 0
    if (["d4", "e4", "d5", "e5"].includes(move.to)) score += 8
    score += Math.random() * 10

    return { move, score }
  })

  scoredMoves.sort((a, b) => b.score - a.score)
  return scoredMoves[0]?.move ?? null
}

export function ChessGame() {
  const router = useRouter()
  const [chess, setChess] = React.useState(() => new Chess())
  const [selected, setSelected] = React.useState<ChessSquare | null>(null)
  const [lastSan, setLastSan] = React.useState<string | null>(null)
  const [moveHistory, setMoveHistory] = React.useState<string[]>([])
  const [mode, setMode] = React.useState<ChessMode>("vs_computer")
  const [computerThinking, setComputerThinking] = React.useState(false)
  const [onlineName, setOnlineName] = React.useState("White Player")
  const [joinCode, setJoinCode] = React.useState("")
  const [creating, setCreating] = React.useState(false)

  const legalTargets = React.useMemo(() => {
    if (!selected) return new Set<string>()
    return new Set(chess.moves({ square: selected, verbose: true }).map((move) => move.to))
  }, [chess, selected])

  const reset = () => {
    setChess(new Chess())
    setSelected(null)
    setLastSan(null)
    setMoveHistory([])
    setComputerThinking(false)
  }

  const applyMove = React.useCallback((next: Chess, san: string) => {
    setChess(next)
    setLastSan(san)
    setMoveHistory((current) => [...current, san])
    setSelected(null)
  }, [])

  const isComputerTurn =
    mode === "vs_computer" &&
    chess.turn() === "b" &&
    !getChessCompletion(chess, null)

  React.useEffect(() => {
    if (!isComputerTurn) return

    setComputerThinking(true)
    const timeoutId = window.setTimeout(() => {
      const next = new Chess(chess.fen())
      const move = chooseComputerMove(next)

      if (move) {
        const result = next.move(move)
        applyMove(next, result.san)
      }

      setComputerThinking(false)
    }, 650)

    return () => window.clearTimeout(timeoutId)
  }, [applyMove, chess, isComputerTurn])

  const onSquareClick = (square: ChessSquare) => {
    if (computerThinking || isComputerTurn) return

    const piece = chess.get(square)

    if (!selected) {
      if (piece?.color === chess.turn()) setSelected(square)
      return
    }

    if (selected === square) {
      setSelected(null)
      return
    }

    const next = new Chess(chess.fen())
    const move = (() => {
      try {
        return next.move({ from: selected, to: square, promotion: "q" })
      } catch {
        return null
      }
    })()

    if (!move) {
      if (piece?.color === chess.turn()) setSelected(square)
      return
    }

    applyMove(next, move.san)
  }

  const createOnlineRoom = async () => {
    setCreating(true)
    const response = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameSlug: "chess",
        displayName: onlineName,
        settings: { initialState: createChessState(new Chess()) },
      }),
    })
    setCreating(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      toast.error(data.error ?? "Unable to create chess room")
      return
    }

    const data = await response.json()
    const roomCode = data?.session?.session?.room_code
    if (typeof roomCode !== "string") {
      toast.error("Room created, but no room code was returned")
      return
    }

    router.push(`/games/chess/room/${roomCode}`)
  }

  const joinOnlineRoom = () => {
    const roomCode = joinCode.trim().toUpperCase()
    if (!/^[A-Z0-9]{6,10}$/.test(roomCode)) {
      toast.error("Enter a valid room code")
      return
    }
    router.push(`/games/chess/room/${roomCode}`)
  }

  const completion = getChessCompletion(chess, null)
  const status = completion
    ? chess.isCheckmate()
      ? "Checkmate"
      : "Draw"
    : computerThinking
      ? "Computer thinking"
    : chess.inCheck()
      ? "Check"
      : `${chess.turn() === "w" ? "White" : "Black"} to move`

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="overflow-hidden border-stone-200 bg-[radial-gradient(circle_at_top_left,#fff7ed,transparent_34%),linear-gradient(135deg,#fafaf9,#f5f5f4)] dark:border-stone-800 dark:bg-[linear-gradient(135deg,#1c1917,#0c0a09)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-600" />
            Chess
          </CardTitle>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <ChessBoard
            chess={chess}
            selected={selected}
            legalTargets={legalTargets}
            onSquareClick={onSquareClick}
            disabled={computerThinking}
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Table</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
              <div className="text-lg font-semibold">{status}</div>
              <div className="text-xs text-muted-foreground">
                {mode === "vs_computer"
                  ? "You play White. Computer plays Black."
                  : "Local players alternate turns."}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Last move</div>
              <div className="font-mono text-lg">{lastSan ?? "—"}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === "vs_computer" ? "secondary" : "outline"}
                onClick={() => {
                  setMode("vs_computer")
                  reset()
                }}
              >
                <Bot className="mr-2 h-4 w-4" />
                Vs Computer
              </Button>
              <Button
                type="button"
                variant={mode === "local_pvp" ? "secondary" : "outline"}
                onClick={() => {
                  setMode("local_pvp")
                  reset()
                }}
              >
                <Users className="mr-2 h-4 w-4" />
                Local PvP
              </Button>
            </div>
            <div className="rounded-lg border p-3">
              <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Move list
              </div>
              {moveHistory.length === 0 ? (
                <div className="text-sm text-muted-foreground">No moves yet.</div>
              ) : (
                <div className="max-h-36 overflow-y-auto font-mono text-sm">
                  {Array.from(
                    { length: Math.ceil(moveHistory.length / 2) },
                    (_, index) => (
                      <div key={index} className="grid grid-cols-[32px_1fr_1fr] gap-2 py-0.5">
                        <span className="text-muted-foreground">{index + 1}.</span>
                        <span>{moveHistory[index * 2] ?? ""}</span>
                        <span>{moveHistory[index * 2 + 1] ?? ""}</span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe2 className="h-4 w-4" />
              Online room
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="chess-online-name">Your display name</Label>
              <Input id="chess-online-name" value={onlineName} onChange={(event) => setOnlineName(event.target.value)} />
            </div>
            <Button onClick={createOnlineRoom} disabled={creating} className="w-full">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create chess room"}
            </Button>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] xl:grid-cols-1">
              <Input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="Room code" maxLength={10} />
              <Button variant="outline" onClick={joinOnlineRoom}>
                Join
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
