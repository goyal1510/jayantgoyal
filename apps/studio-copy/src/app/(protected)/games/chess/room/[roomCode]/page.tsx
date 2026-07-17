import type { Metadata } from "next"

import { OnlineChessRoom } from "@/components/games/OnlineChessRoom"

export const metadata: Metadata = {
  title: "Chess Online Room",
  description: "Play Chess online with a shared room code.",
}

export default async function ChessRoomPage({
  params,
}: {
  params: Promise<{ roomCode: string }>
}) {
  const { roomCode } = await params

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <OnlineChessRoom roomCode={roomCode.toUpperCase()} />
    </div>
  )
}
