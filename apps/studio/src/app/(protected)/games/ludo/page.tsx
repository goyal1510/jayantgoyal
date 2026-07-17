import type { Metadata } from "next"

import { Ludo } from "@/components/games/Ludo"
import { GamePageFrame } from "@/components/games/game-page-frame"
import { GAME_META } from "@/lib/games/config"

export const metadata: Metadata = {
  title: GAME_META.ludo.name,
  description: GAME_META.ludo.description,
}

export default function LudoPage() {
  return (
    <GamePageFrame game="ludo">
      <Ludo />
    </GamePageFrame>
  )
}
