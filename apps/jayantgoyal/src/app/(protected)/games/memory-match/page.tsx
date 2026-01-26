import type { Metadata } from "next"
import { GAME_META } from "@/lib/games/config"
import { MemoryMatch } from "@/components/games/MemoryMatch"

export const metadata: Metadata = {
  title: `${GAME_META["memory-match"].name} | Jayant Goyal`,
  description: GAME_META["memory-match"].description,
}

export default function MemoryMatchPage() {
  return (
    <div className="p-4">
      <MemoryMatch />
    </div>
  )
}
