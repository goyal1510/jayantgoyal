export type GameSlug = "rock-paper-scissors" | "tic-tac-toe" | "dare-x" | "connect-four" | "memory-match"

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
    description: "Multi-player local dare challenge.",
    modes: ["local_pvp"],
  },
  "connect-four": {
    name: "Connect Four",
    description: "Drop pieces to connect four in a row.",
    modes: ["local_pvp", "vs_computer"],
  },
  "memory-match": {
    name: "Memory Match",
    description: "Find matching pairs of cards.",
    modes: ["local_pvp", "vs_computer"],
  },
}
