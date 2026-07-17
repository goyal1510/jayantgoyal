import type { Metadata } from "next"
import { GAME_META } from "@/lib/games/config"
import { ConnectFour } from "@/components/games/ConnectFour"
import { GamePageFrame } from "@/components/games/game-page-frame"

export const metadata: Metadata = {
  title: `${GAME_META["connect-four"].name}`,
  description: GAME_META["connect-four"].description,
}

export default function ConnectFourPage() {
  return (
    <GamePageFrame game="connect-four">
      <ConnectFour />
    </GamePageFrame>
  )
}
