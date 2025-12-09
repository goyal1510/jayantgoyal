export type GameSlug = "rock-paper-scissors" | "tic-tac-toe" | "dare-x"

export const GAME_META: Record<
  GameSlug,
  { name: string; description: string; modes: ("local_pvp" | "vs_computer")[] }
> = {
  "rock-paper-scissors": {
    name: "Rock Paper Scissors",
    description: "Fast rounds against the computer.",
    modes: ["vs_computer"],
  },
  "tic-tac-toe": {
    name: "Tic Tac Toe",
    description: "3x3 grid, play locally or versus computer.",
    modes: ["local_pvp", "vs_computer"],
  },
  "dare-x": {
    name: "Dare X",
    description: "Two-player local dare challenge.",
    modes: ["local_pvp"],
  },
}
