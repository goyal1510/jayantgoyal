import type { Metadata } from "next"
import { GAME_META } from "@/lib/games/config"
import { Wordle } from "@/components/games/Wordle"

export const metadata: Metadata = {
  title: `${GAME_META["wordle"].name}`,
  description: GAME_META["wordle"].description,
}

export default function WordlePage() {
  return (
    <div className="p-4">
      <Wordle />
    </div>
  )
}
