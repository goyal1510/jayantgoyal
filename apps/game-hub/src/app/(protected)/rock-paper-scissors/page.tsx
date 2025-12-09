import { RockPaperScissors } from "@/components/games/RockPaperScissors"

export default function RockPaperScissorsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Rock Paper Scissors</h1>
        <p className="text-sm text-muted-foreground">
          Player vs computer. Rounds are saved to your account automatically.
        </p>
      </div>
      <RockPaperScissors />
    </div>
  )
}
