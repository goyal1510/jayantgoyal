import type { Metadata } from "next"
import { GAME_META } from "@/lib/games/config"
import { MemoryMatch } from "@/components/games/MemoryMatch"
import { GamePageFrame } from "@/components/games/game-page-frame"

export const metadata: Metadata = {
  title: `${GAME_META["memory-match"].name}`,
  description: GAME_META["memory-match"].description,
}

export default function MemoryMatchPage() {
  return (
    <GamePageFrame game="memory-match">
      <MemoryMatch />
    </GamePageFrame>
  )
}
