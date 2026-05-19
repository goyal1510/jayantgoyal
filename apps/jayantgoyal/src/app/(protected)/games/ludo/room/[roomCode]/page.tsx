import type { Metadata } from "next"

import { OnlineLudoRoom } from "@/components/games/OnlineLudoRoom"

export const metadata: Metadata = {
  title: "Ludo Online Room",
  description: "Play Ludo online with a shared room code.",
}

export default async function LudoRoomPage({
  params,
}: {
  params: Promise<{ roomCode: string }>
}) {
  const { roomCode } = await params

  return (
    <div className="p-4">
      <OnlineLudoRoom roomCode={roomCode.toUpperCase()} />
    </div>
  )
}
