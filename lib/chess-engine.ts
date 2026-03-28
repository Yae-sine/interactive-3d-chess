// Chess game types and shared state
import { Chess, Square, Move, Piece } from 'chess.js'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'master'

export interface CoachMessage {
  id: string
  type: 'info' | 'blunder' | 'hint' | 'good' | 'analysis'
  title: string
  content: string
  move?: string
  betterMove?: string
  timestamp: number
}

export interface GameState {
  fen: string
  history: Move[]
  capturedWhite: Piece[]
  capturedBlack: Piece[]
  turn: 'w' | 'b'
  isCheck: boolean
  isCheckmate: boolean
  isDraw: boolean
  isGameOver: boolean
  selectedSquare: Square | null
  validMoves: Square[]
  lastMove: { from: Square; to: Square } | null
  parallelFen: string | null
  parallelMoves: Move[]
  isExploringParallel: boolean
  difficulty: Difficulty
  coachMessages: CoachMessage[]
  isThinking: boolean
  hintMove: { from: Square; to: Square } | null
  moveCount: number
}

export const DIFFICULTY_DEPTH: Record<Difficulty, number> = {
  beginner: 1,
  intermediate: 3,
  advanced: 5,
  master: 7,
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  master: 'Master',
}

export const INITIAL_STATE: GameState = {
  fen: new Chess().fen(),
  history: [],
  capturedWhite: [],
  capturedBlack: [],
  turn: 'w',
  isCheck: false,
  isCheckmate: false,
  isDraw: false,
  isGameOver: false,
  selectedSquare: null,
  validMoves: [],
  lastMove: null,
  parallelFen: null,
  parallelMoves: [],
  isExploringParallel: false,
  difficulty: 'intermediate',
  coachMessages: [],
  isThinking: false,
  hintMove: null,
  moveCount: 0,
}

// Minimax-based AI engine (runs client-side)
const PIECE_VALUES: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
}

const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0,
]

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
]

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
]

const ROOK_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0,
]

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
]

function squareIndex(sq: Square): number {
  const col = sq.charCodeAt(0) - 97
  const row = parseInt(sq[1]) - 1
  return (7 - row) * 8 + col
}

function evalPiece(type: string, color: string, sq: Square): number {
  const base = PIECE_VALUES[type] || 0
  const idx = color === 'w' ? squareIndex(sq) : 63 - squareIndex(sq)
  let bonus = 0
  if (type === 'p') bonus = PAWN_TABLE[idx]
  else if (type === 'n') bonus = KNIGHT_TABLE[idx]
  else if (type === 'b') bonus = BISHOP_TABLE[idx]
  else if (type === 'r') bonus = ROOK_TABLE[idx]
  else if (type === 'q') bonus = QUEEN_TABLE[idx]
  return base + bonus
}

export function evaluateBoard(chess: Chess): number {
  let score = 0
  const board = chess.board()
  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue
      const val = evalPiece(cell.type, cell.color, cell.square)
      score += cell.color === 'b' ? val : -val
    }
  }
  return score
}

export function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean
): number {
  if (depth === 0 || chess.isGameOver()) {
    if (chess.isCheckmate()) return maximizing ? -Infinity : Infinity
    if (chess.isDraw()) return 0
    return evaluateBoard(chess)
  }

  const moves = chess.moves({ verbose: true })
  if (maximizing) {
    let maxEval = -Infinity
    for (const move of moves) {
      chess.move(move)
      const val = minimax(chess, depth - 1, alpha, beta, false)
      chess.undo()
      maxEval = Math.max(maxEval, val)
      alpha = Math.max(alpha, val)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const move of moves) {
      chess.move(move)
      const val = minimax(chess, depth - 1, alpha, beta, true)
      chess.undo()
      minEval = Math.min(minEval, val)
      beta = Math.min(beta, val)
      if (beta <= alpha) break
    }
    return minEval
  }
}

export function getBestMove(chess: Chess, depth: number): Move | null {
  const moves = chess.moves({ verbose: true })
  if (!moves.length) return null

  let bestMove: Move | null = null
  let bestVal = Infinity

  // Add a little randomness for beginner
  const shuffled = depth <= 1
    ? [...moves].sort(() => Math.random() - 0.5)
    : moves

  for (const move of shuffled) {
    chess.move(move)
    const val = minimax(chess, depth - 1, -Infinity, Infinity, true)
    chess.undo()
    if (val < bestVal) {
      bestVal = val
      bestMove = move
    }
  }
  return bestMove
}

export function getMoveDelta(fen: string, move: Move): number {
  const before = new Chess(fen)
  const evalBefore = evaluateBoard(before)
  const after = new Chess(fen)
  after.move(move)
  const evalAfter = evaluateBoard(after)
  return evalAfter - evalBefore
}
