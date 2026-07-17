import type { Metadata } from "next"
import { GAME_META } from "@/lib/games/config"
import { TicTacToe } from "@/components/games/TicTacToe"
import { GamePageFrame } from "@/components/games/game-page-frame"

export const metadata: Metadata = {
  title: `${GAME_META["tic-tac-toe"].name}`,
  description: GAME_META["tic-tac-toe"].description,
}

export default function TicTacToePage() {
  return (
    <GamePageFrame game="tic-tac-toe">
      <TicTacToe />
    </GamePageFrame>
  )
}
