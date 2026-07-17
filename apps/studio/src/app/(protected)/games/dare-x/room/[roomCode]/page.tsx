import type { Metadata } from "next"

import { OnlineDareXRoom } from "@/components/games/OnlineDareXRoom"

export const metadata: Metadata = {
  title: "Dare X Online Room",
  description: "Play Dare X online with a shared room code.",
}

export default async function DareXRoomPage({
  params,
}: {
  params: Promise<{ roomCode: string }>
}) {
  const { roomCode } = await params

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <OnlineDareXRoom roomCode={roomCode.toUpperCase()} />
    </div>
  )
}
