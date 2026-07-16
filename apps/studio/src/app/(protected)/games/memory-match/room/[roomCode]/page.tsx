import type { Metadata } from "next"

import { OnlineMemoryMatchRoom } from "@/components/games/OnlineMemoryMatchRoom"

export const metadata: Metadata = {
  title: "Memory Match Online Room",
  description: "Play Memory Match online with a shared room code.",
}

export default async function MemoryMatchRoomPage({
  params,
}: {
  params: Promise<{ roomCode: string }>
}) {
  const { roomCode } = await params

  return (
    <div className="p-4">
      <OnlineMemoryMatchRoom roomCode={roomCode.toUpperCase()} />
    </div>
  )
}
