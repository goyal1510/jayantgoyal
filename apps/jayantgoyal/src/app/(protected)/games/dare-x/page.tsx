import type { Metadata } from "next"
import { GAME_META } from "@/lib/games/config"
import { DareX } from "@/components/games/DareX"

export const metadata: Metadata = {
  title: `${GAME_META["dare-x"].name} | Jayant Goyal`,
  description: GAME_META["dare-x"].description,
}

export default function DareXPage() {
  return (
    <div className="p-4">
      <DareX />
    </div>
  )
}
