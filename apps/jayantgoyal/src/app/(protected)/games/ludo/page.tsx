import type { Metadata } from "next"
import { GAME_META } from "@/lib/games/config"
import { Ludo } from "@/components/games/Ludo"

export const metadata: Metadata = {
  title: `${GAME_META["ludo"].name} | Jayant`,
  description: GAME_META["ludo"].description,
}

export default function LudoPage() {
  return (
    <div className="p-4">
      <Ludo />
    </div>
  )
}
