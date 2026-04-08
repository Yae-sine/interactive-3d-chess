// Chess types, evaluation utilities, and shared state
// Stockfish is handled via useStockfish hook — this module contains only types + local eval utils
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
  pendingPromotion: { from: Square; to: Square; isParallel: boolean } | null
}

export const DIFFICULTY_DEPTH: Record<Difficulty, number> = {
  beginner: 2,
  intermediate: 8,
  advanced: 14,
  master: 20,
}

export const DIFFICULTY_ELO: Record<Difficulty, number> = {
  beginner: 800,
  intermediate: 1500,
  advanced: 2000,
  master: 3000,
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  master: 'Master',
}

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export const INITIAL_STATE: GameState = {
  fen: INITIAL_FEN,
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
  pendingPromotion: null,
}

// ─── Local evaluation (for blunder detection only, lightweight) ────────────────

const PIECE_VALUES: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
}

function squareIndex(sq: Square): number {
  const col = sq.charCodeAt(0) - 97
  const row = parseInt(sq[1]) - 1
  return (7 - row) * 8 + col
}

const PST: Record<string, number[]> = {
  p: [0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
  n: [-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
  b: [-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
  r: [0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
  q: [-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
  k: [-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20],
}

function evalPiece(type: string, color: string, sq: Square): number {
  const base = PIECE_VALUES[type] ?? 0
  const table = PST[type]
  if (!table) return base
  const idx = color === 'w' ? squareIndex(sq) : 63 - squareIndex(sq)
  return base + (table[idx] ?? 0)
}

export function evaluateBoard(chess: Chess): number {
  let score = 0
  for (const row of chess.board()) {
    for (const cell of row) {
      if (!cell) continue
      const v = evalPiece(cell.type, cell.color, cell.square)
      score += cell.color === 'b' ? v : -v
    }
  }
  return score
}

/** Quick 1-ply evaluation for blunder detection (before Stockfish responds) */
export function quickEval(fen: string): number {
  return evaluateBoard(new Chess(fen))
}

/** Returns centipawn loss for a given move vs best 1-ply alternative */
export function getBlunderSeverity(fenBefore: string, playedMove: Move): { isBlunder: boolean; cpLoss: number; bestSan: string | null } {
  const c = new Chess(fenBefore)
  const allMoves = c.moves({ verbose: true }) as Move[]
  if (allMoves.length === 0) return { isBlunder: false, cpLoss: 0, bestSan: null }

  let bestVal = Infinity
  let bestSan: string | null = null
  for (const m of allMoves) {
    c.move(m)
    const v = evaluateBoard(c)
    c.undo()
    if (v < bestVal) { bestVal = v; bestSan = m.san }
  }

  c.move(playedMove)
  const playedVal = evaluateBoard(c)
  const cpLoss = playedVal - bestVal
  return {
    isBlunder: cpLoss > 120 && bestSan !== playedMove.san,
    cpLoss,
    bestSan,
  }
}
