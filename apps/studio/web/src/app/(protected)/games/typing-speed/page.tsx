import type { Metadata } from "next"
import { GAME_META } from "@/lib/games/config"
import { TypingSpeedTest } from "@/components/games/TypingSpeedTest"
import { GamePageFrame } from "@/components/games/game-page-frame"

export const metadata: Metadata = {
  title: `${GAME_META["typing-speed"].name}`,
  description: GAME_META["typing-speed"].description,
}

export default function TypingSpeedPage() {
  return (
    <GamePageFrame game="typing-speed">
      <TypingSpeedTest />
    </GamePageFrame>
  )
}
