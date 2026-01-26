import type { Metadata } from "next"
import { GAME_META } from "@/lib/games/config"
import { ConnectFour } from "@/components/games/ConnectFour"

export const metadata: Metadata = {
  title: `${GAME_META["connect-four"].name} | Jayant Goyal`,
  description: GAME_META["connect-four"].description,
}

export default function ConnectFourPage() {
  return (
    <div className="p-4">
      <ConnectFour />
    </div>
  )
}
