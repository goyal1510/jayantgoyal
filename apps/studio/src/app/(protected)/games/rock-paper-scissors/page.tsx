import type { Metadata } from "next"
import { GAME_META } from "@/lib/games/config"
import { RockPaperScissors } from "@/components/games/RockPaperScissors"
import { GamePageFrame } from "@/components/games/game-page-frame"

export const metadata: Metadata = {
  title: `${GAME_META["rock-paper-scissors"].name}`,
  description: GAME_META["rock-paper-scissors"].description,
}

export default function RockPaperScissorsPage() {
  return (
    <GamePageFrame game="rock-paper-scissors">
      <RockPaperScissors />
    </GamePageFrame>
  )
}
