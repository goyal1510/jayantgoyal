import type { Metadata } from "next"

import { OnlineTicTacToeRoom } from "@/components/games/OnlineTicTacToeRoom"

export const metadata: Metadata = {
  title: "Tic Tac Toe Online Room",
  description: "Play Tic Tac Toe online with a shared room code.",
}

export default async function TicTacToeRoomPage({
  params,
}: {
  params: Promise<{ roomCode: string }>
}) {
  const { roomCode } = await params

  return (
    <div className="p-4">
      <OnlineTicTacToeRoom roomCode={roomCode.toUpperCase()} />
    </div>
  )
}
