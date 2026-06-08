export type GameSlug = "rock-paper-scissors" | "tic-tac-toe" | "dare-x" | "connect-four" | "memory-match" | "wordle" | "typing-speed" | "chess" | "ludo"

export const GAME_META: Record<
  GameSlug,
  {
    name: string
    description: string
    modes: ("local_pvp" | "vs_computer")[]
    onlineReady?: boolean
    modeLabel?: string
  }
> = {
  "rock-paper-scissors": {
    name: "Rock Paper Scissors",
    description: "Fast rounds against the computer or an online player.",
    modes: ["local_pvp", "vs_computer"],
    onlineReady: true,
  },
  "tic-tac-toe": {
    name: "Tic Tac Toe",
    description: "3x3 grid, play locally or versus computer.",
    modes: ["local_pvp", "vs_computer"],
    onlineReady: true,
  },
  "dare-x": {
    name: "Dare X",
    description: "Multi-player dare challenge for local, computer, or online rooms.",
    modes: ["local_pvp", "vs_computer"],
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
    description: "Classic strategy with legal moves, computer play, notation, and online rooms.",
    modes: ["local_pvp", "vs_computer"],
    onlineReady: true,
  },
  ludo: {
    name: "Ludo",
    description: "Roll, race, capture, and bring every token home locally, against the computer, or online.",
    modes: ["local_pvp", "vs_computer"],
    onlineReady: true,
  },
}
