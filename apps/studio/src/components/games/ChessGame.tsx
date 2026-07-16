"use client"

import * as React from "react"
import { Chess } from "chess.js"
import { useRouter } from "next/navigation"
import { Crown, Globe2, Loader2, RotateCcw } from "lucide-react"
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
}: {
  chess: Chess
  selected: ChessSquare | null
  legalTargets: Set<string>
  onSquareClick: (square: ChessSquare) => void
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

        return (
          <button
            key={square}
            type="button"
            onClick={() => onSquareClick(square)}
            className={cn(
              "relative flex items-center justify-center text-3xl font-semibold transition sm:text-5xl",
              light ? "bg-[#e8d7b2]" : "bg-[#8b5f3c]",
              isSelected && "ring-4 ring-amber-400 ring-inset",
              isLegal && "after:absolute after:h-4 after:w-4 after:rounded-full after:bg-emerald-500/70 sm:after:h-5 sm:after:w-5"
            )}
            aria-label={square}
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

export function ChessGame() {
  const router = useRouter()
  const [chess, setChess] = React.useState(() => new Chess())
  const [selected, setSelected] = React.useState<ChessSquare | null>(null)
  const [lastSan, setLastSan] = React.useState<string | null>(null)
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
  }

  const onSquareClick = (square: ChessSquare) => {
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

    setChess(next)
    setLastSan(move.san)
    setSelected(null)
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

  const status = getChessCompletion(chess, null)
    ? chess.isCheckmate()
      ? "Checkmate"
      : "Draw"
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
          <ChessBoard chess={chess} selected={selected} legalTargets={legalTargets} onSquareClick={onSquareClick} />
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
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Last move</div>
              <div className="font-mono text-lg">{lastSan ?? "—"}</div>
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
