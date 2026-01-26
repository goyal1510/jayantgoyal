import type { Metadata } from "next"
import { GAME_META } from "@/lib/games/config"
import { RockPaperScissors } from "@/components/games/RockPaperScissors"

export const metadata: Metadata = {
  title: `${GAME_META["rock-paper-scissors"].name} | Jayant Goyal`,
  description: GAME_META["rock-paper-scissors"].description,
}

export default function RockPaperScissorsPage() {
  return (
    <div className="p-4">
      <RockPaperScissors />
    </div>
  )
}
