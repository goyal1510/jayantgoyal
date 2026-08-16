export type TicTacToeMark = "X" | "O"
export type TicTacToeCell = TicTacToeMark | ""

export type TicTacToeState = {
  board: TicTacToeCell[]
  currentPlayer: TicTacToeMark
  winner: TicTacToeMark | null
  isDraw: boolean
  lastMove: { cell: number; mark: TicTacToeMark } | null
  winningLine: number[]
}

const TIC_TAC_TOE_WIN_PATTERNS: ReadonlyArray<[number, number, number]> = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const

export const EMPTY_TIC_TAC_TOE_STATE: TicTacToeState = {
  board: Array<TicTacToeCell>(9).fill(""),
  currentPlayer: "X",
  winner: null,
  isDraw: false,
  lastMove: null,
  winningLine: [],
}

function createEmptyTicTacToeBoard(): TicTacToeCell[] {
  return Array<TicTacToeCell>(9).fill("")
}

export function getTicTacToeWinner(board: TicTacToeCell[]): {
  winner: TicTacToeMark
  winningLine: number[]
} | null {
  for (const pattern of TIC_TAC_TOE_WIN_PATTERNS) {
    const [a, b, c] = pattern
    const first = board[a]
    if (!first) continue
    if (first === board[b] && first === board[c]) {
      return { winner: first, winningLine: [...pattern] }
    }
  }

  return null
}

export function isTicTacToeBoardFull(board: TicTacToeCell[]): boolean {
  return board.every(Boolean)
}

export function parseTicTacToeState(value: unknown): TicTacToeState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY_TIC_TAC_TOE_STATE
  const state = value as Partial<TicTacToeState>
  const board = Array.isArray(state.board)
    ? state.board.map((cell) => (cell === "X" || cell === "O" ? cell : "")).slice(0, 9)
    : createEmptyTicTacToeBoard()

  while (board.length < 9) board.push("")

  const winner = getTicTacToeWinner(board)

  return {
    board,
    currentPlayer: state.currentPlayer === "O" ? "O" : "X",
    winner: winner?.winner ?? null,
    isDraw: !winner && isTicTacToeBoardFull(board),
    lastMove: state.lastMove ?? null,
    winningLine: winner?.winningLine ?? [],
  }
}

export function nextTicTacToeMark(mark: TicTacToeMark): TicTacToeMark {
  return mark === "X" ? "O" : "X"
}
