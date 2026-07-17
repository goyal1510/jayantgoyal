import type { Metadata } from "next"

import { OnlineWordleRoom } from "@/components/games/OnlineWordleRoom"

export const metadata: Metadata = {
  title: "Wordle Online Room",
  description: "Race a friend to solve the same hidden Wordle answer.",
}

export default async function WordleRoomPage({
  params,
}: {
  params: Promise<{ roomCode: string }>
}) {
  const { roomCode } = await params

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <OnlineWordleRoom roomCode={roomCode.toUpperCase()} />
    </div>
  )
}
