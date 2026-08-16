import type { Metadata } from "next"

import { OnlineConnectFourRoom } from "@/components/games/OnlineConnectFourRoom"

export const metadata: Metadata = {
  title: "Connect Four Online Room",
  description: "Play Connect Four online with a shared room code.",
}

export default async function ConnectFourRoomPage({
  params,
}: {
  params: Promise<{ roomCode: string }>
}) {
  const { roomCode } = await params

  return (
    <div className="mx-auto w-full max-w-[1280px]">
      <OnlineConnectFourRoom roomCode={roomCode.toUpperCase()} />
    </div>
  )
}
