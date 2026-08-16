export type GameSlug = "rock-paper-scissors" | "tic-tac-toe" | "dare-x" | "connect-four" | "memory-match" | "wordle" | "typing-speed" | "chess" | "ludo"

export const GAME_META: Record<
  GameSlug,
  {
    name: string
    description: string
    modes: ("local_pvp" | "vs_computer")[]
    onlineReady?: boolean
  }
> = {
  "rock-paper-scissors": {
    name: "Rock Paper Scissors",
    description: "Fast rounds against the computer or an online player.",
    modes: ["vs_computer"],
    onlineReady: true,
  },
  "tic-tac-toe": {
    name: "Tic Tac Toe",
    description: "3x3 grid, play locally, online, or versus computer.",
    modes: ["local_pvp", "vs_computer"],
    onlineReady: true,
  },
  "dare-x": {
    name: "Dare X",
    description: "Multi-player dare challenge for local or online rooms.",
    modes: ["local_pvp"],
    onlineReady: true,
  },
  "connect-four": {
    name: "Connect Four",
    description: "Drop pieces to connect four in a row.",
    modes: ["local_pvp", "vs_computer"],
    onlineReady: true,
  },
  "memory-match": {
    name: "Memory Match",
    description: "Find matching pairs of cards locally or in online rooms.",
    modes: ["local_pvp", "vs_computer"],
    onlineReady: true,
  },
  "wordle": {
    name: "Wordle",
    description: "Guess the 5-letter word solo or race a friend online.",
    modes: ["vs_computer"],
    onlineReady: true,
  },
  "typing-speed": {
    name: "Typing Speed",
    description: "Test your typing speed and accuracy.",
    modes: ["vs_computer"],
  },
  chess: {
    name: "Chess",
    description: "Classic strategy with legal moves, notation, and online rooms.",
    modes: ["local_pvp"],
    onlineReady: true,
  },
  ludo: {
    name: "Ludo",
    description: "Roll, race, capture, and bring every token home in an online room.",
    modes: [],
    onlineReady: true,
  },
}
