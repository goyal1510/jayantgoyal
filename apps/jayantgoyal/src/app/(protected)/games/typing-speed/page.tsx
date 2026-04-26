import type { Metadata } from "next"
import { GAME_META } from "@/lib/games/config"
import { TypingSpeedTest } from "@/components/games/TypingSpeedTest"

export const metadata: Metadata = {
  title: `${GAME_META["typing-speed"].name}`,
  description: GAME_META["typing-speed"].description,
}

export default function TypingSpeedPage() {
  return (
    <div className="p-4">
      <TypingSpeedTest />
    </div>
  )
}
