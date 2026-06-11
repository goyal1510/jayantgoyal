"use client"

import { useState } from "react"
import { Dice5, Loader2, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@repo/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"

import { createLudoState } from "@/lib/games/ludo"

export function Ludo() {
  const router = useRouter()
  const [roomCode, setRoomCode] = useState("")
  const [playerCount, setPlayerCount] = useState(2)
  const [targetTokens, setTargetTokens] = useState(4)
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

  const createRoom = async () => {
    setCreating(true)
    const response = await fetch("/api/games/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameSlug: "ludo",
        displayName: "Ludo P1",
        settings: {
          maxPlayers: playerCount,
          targetTokens,
          initialState: createLudoState(playerCount, targetTokens),
        },
      }),
    })
    setCreating(false)

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      toast.error(data.error ?? "Unable to create Ludo room")
      return
    }

    const data = await response.json()
    const nextRoomCode = data.session?.session?.room_code
    if (typeof nextRoomCode === "string") {
      router.push(`/games/ludo/room/${nextRoomCode}`)
    }
  }

  const joinRoom = () => {
    const normalized = roomCode.trim().toUpperCase()
    if (!normalized) {
      toast.error("Enter a room code")
      return
    }

    setJoining(true)
    router.push(`/games/ludo/room/${normalized}`)
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="overflow-hidden border-rose-200 bg-[radial-gradient(circle_at_top_left,#ffe4e6,transparent_36%),linear-gradient(135deg,#fff7ed,#fff1f2)] dark:border-rose-900/70 dark:bg-[linear-gradient(135deg,#111827,#4c0519)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dice5 className="h-5 w-5 text-rose-600" />
            Ludo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid aspect-square max-h-[560px] w-full max-w-[560px] grid-cols-2 gap-3 rounded-[2rem] border bg-background/70 p-4 shadow-inner">
            <div className="rounded-[1.5rem] border-4 border-red-400 bg-red-100 p-5 dark:bg-red-950/50">
              <div className="grid h-full grid-cols-2 gap-3 rounded-2xl bg-white/70 p-4 dark:bg-black/20">
                {Array.from({ length: 4 }, (_, index) => <div key={index} className="rounded-full bg-red-500 shadow" />)}
              </div>
            </div>
            <div className="rounded-[1.5rem] border-4 border-emerald-400 bg-emerald-100 p-5 dark:bg-emerald-950/50">
              <div className="grid h-full grid-cols-2 gap-3 rounded-2xl bg-white/70 p-4 dark:bg-black/20">
                {Array.from({ length: 4 }, (_, index) => <div key={index} className="rounded-full bg-emerald-500 shadow" />)}
              </div>
            </div>
            <div className="rounded-[1.5rem] border-4 border-sky-400 bg-sky-100 p-5 dark:bg-sky-950/50">
              <div className="grid h-full grid-cols-2 gap-3 rounded-2xl bg-white/70 p-4 dark:bg-black/20">
                {Array.from({ length: 4 }, (_, index) => <div key={index} className="rounded-full bg-sky-500 shadow" />)}
              </div>
            </div>
            <div className="rounded-[1.5rem] border-4 border-amber-400 bg-amber-100 p-5 dark:bg-amber-950/50">
              <div className="grid h-full grid-cols-2 gap-3 rounded-2xl bg-white/70 p-4 dark:bg-black/20">
                {Array.from({ length: 4 }, (_, index) => <div key={index} className="rounded-full bg-amber-400 shadow" />)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Online room
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Players</Label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((count) => (
                <Button
                  key={count}
                  type="button"
                  variant={playerCount === count ? "secondary" : "outline"}
                  onClick={() => setPlayerCount(count)}
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Finish target</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={targetTokens === 1 ? "secondary" : "outline"}
                onClick={() => setTargetTokens(1)}
              >
                Quick
              </Button>
              <Button
                type="button"
                variant={targetTokens === 4 ? "secondary" : "outline"}
                onClick={() => setTargetTokens(4)}
              >
                Classic
              </Button>
            </div>
          </div>
          <Button onClick={() => void createRoom()} disabled={creating} className="w-full">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Ludo room"}
          </Button>
          <div className="flex gap-2">
            <Input
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value)}
              placeholder="Room code"
              className="uppercase"
            />
            <Button variant="outline" onClick={joinRoom} disabled={joining}>
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
