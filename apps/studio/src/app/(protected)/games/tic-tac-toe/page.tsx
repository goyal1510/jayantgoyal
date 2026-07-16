import type { Metadata } from "next"
import { GAME_META } from "@/lib/games/config"
import { TicTacToe } from "@/components/games/TicTacToe"

export const metadata: Metadata = {
  title: `${GAME_META["tic-tac-toe"].name}`,
  description: GAME_META["tic-tac-toe"].description,
}

export default function TicTacToePage() {
  return (
    <div className="p-4">
      <TicTacToe />
    </div>
  )
}
