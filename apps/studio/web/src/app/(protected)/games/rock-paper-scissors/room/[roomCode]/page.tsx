import type { Metadata } from "next"

import { OnlineRockPaperScissorsRoom } from "@/components/games/OnlineRockPaperScissorsRoom"

export const metadata: Metadata = {
  title: "Rock Paper Scissors Online Room",
  description: "Play Rock Paper Scissors online with a shared room code.",
}

export default async function RockPaperScissorsRoomPage({
  params,
}: {
  params: Promise<{ roomCode: string }>
}) {
  const { roomCode } = await params

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <OnlineRockPaperScissorsRoom roomCode={roomCode.toUpperCase()} />
    </div>
  )
}
