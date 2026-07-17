import type { Metadata } from "next"

import { ChessGame } from "@/components/games/ChessGame"
import { GAME_META } from "@/lib/games/config"

export const metadata: Metadata = {
  title: GAME_META.chess.name,
  description: GAME_META.chess.description,
}

export default function ChessPage() {
  return (
    <div className="p-4">
      <ChessGame />
    </div>
  )
}
