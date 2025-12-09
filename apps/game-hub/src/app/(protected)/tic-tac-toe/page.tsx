import { TicTacToe } from "@/components/games/TicTacToe"

export default function TicTacToePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Tic Tac Toe</h1>
        <p className="text-sm text-muted-foreground">
          Play locally or against the computer. Moves and results are stored in your session.
        </p>
      </div>
      <TicTacToe />
    </div>
  )
}
