import { Chess } from "chess.js"

export type ChessSeat = "W" | "B"
export type ChessColor = "w" | "b"
export type ChessSquare = `${"a" | "b" | "c" | "d" | "e" | "f" | "g" | "h"}${"1" | "2" | "3" | "4" | "5" | "6" | "7" | "8"}`

export type ChessState = {
  fen: string
  pgn: string
  turn: ChessColor
  status: "active" | "check" | "checkmate" | "draw" | "stalemate"
  lastMove: { from: ChessSquare; to: ChessSquare; san: string } | null
}

export const INITIAL_CHESS_STATE: ChessState = {
  fen: new Chess().fen(),
  pgn: "",
  turn: "w",
  status: "active",
  lastMove: null,
}

export const CHESS_PIECES: Record<`${ChessColor}${string}`, string> = {
  wk: "♔",
  wq: "♕",
  wr: "♖",
  wb: "♗",
  wn: "♘",
  wp: "♙",
  bk: "♚",
  bq: "♛",
  br: "♜",
  bb: "♝",
  bn: "♞",
  bp: "♟",
}

export function seatToColor(seat: string | null | undefined): ChessColor | null {
  if (seat === "W") return "w"
  if (seat === "B") return "b"
  return null
}

export function colorToSeat(color: ChessColor): ChessSeat {
  return color === "w" ? "W" : "B"
}

export function getChessStatus(chess: Chess): ChessState["status"] {
  if (chess.isCheckmate()) return "checkmate"
  if (chess.isStalemate()) return "stalemate"
  if (chess.isDraw()) return "draw"
  if (chess.inCheck()) return "check"
  return "active"
}

export function createChessState(chess: Chess, lastMove: ChessState["lastMove"] = null): ChessState {
  return {
    fen: chess.fen(),
    pgn: chess.pgn(),
    turn: chess.turn(),
    status: getChessStatus(chess),
    lastMove,
  }
}

export function parseChessState(value: unknown): ChessState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return INITIAL_CHESS_STATE
  const state = value as Partial<ChessState>

  try {
    const chess = new Chess(typeof state.fen === "string" ? state.fen : undefined)
    return {
      fen: chess.fen(),
      pgn: typeof state.pgn === "string" ? state.pgn : chess.pgn(),
      turn: chess.turn(),
      status: getChessStatus(chess),
      lastMove: state.lastMove ?? null,
    }
  } catch {
    return INITIAL_CHESS_STATE
  }
}

export function getChessCompletion(chess: Chess, winnerParticipantId: string | null) {
  if (chess.isCheckmate()) {
    return { outcome: "win", winnerParticipantId }
  }

  if (chess.isDraw() || chess.isStalemate()) {
    return { outcome: "draw" }
  }

  return undefined
}
