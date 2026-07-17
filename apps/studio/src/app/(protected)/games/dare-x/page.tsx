import type { Metadata } from "next"
import { GAME_META } from "@/lib/games/config"
import { DareX } from "@/components/games/DareX"
import { GamePageFrame } from "@/components/games/game-page-frame"

export const metadata: Metadata = {
  title: `${GAME_META["dare-x"].name}`,
  description: GAME_META["dare-x"].description,
}

export default function DareXPage() {
  return (
    <GamePageFrame game="dare-x">
      <DareX />
    </GamePageFrame>
  )
}
