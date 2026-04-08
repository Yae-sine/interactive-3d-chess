'use client'

import type { Piece } from 'chess.js'

const PIECE_SYMBOLS: Record<string, Record<string, string>> = {
  b: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  w: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
}

const PIECE_VALUES: Record<string, number> = {
  q: 9, r: 5, b: 3, n: 3, p: 1, k: 0
}

interface CapturedPiecesProps {
  fen: string
  capturedWhite: Piece[]  // white pieces captured by black
  capturedBlack: Piece[]  // black pieces captured by white
}

function PieceRow({ pieces, label, advantage }: { pieces: Piece[]; label: string; advantage: number }) {
  const sorted = [...pieces].sort((a, b) => PIECE_VALUES[b.type] - PIECE_VALUES[a.type])

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-12">{label}</span>
      <div className="flex flex-wrap gap-0.5 flex-1">
        {sorted.map((p, i) => (
          <span key={i} className="text-base leading-none" title={p.type.toUpperCase()}>
            {PIECE_SYMBOLS[p.color][p.type]}
          </span>
        ))}
      </div>
      {advantage > 0 && (
        <span className="text-xs text-green-400 font-mono">+{advantage}</span>
      )}
    </div>
  )
}

export default function CapturedPieces({ fen, capturedWhite, capturedBlack }: CapturedPiecesProps) {
  // Calculate material from board state so promotions affect score correctly
  const advantage = getMaterialAdvantageFromFen(fen)

  if (capturedWhite.length === 0 && capturedBlack.length === 0 && advantage === 0) return null

  return (
    <div className="rounded-xl border border-border/40 bg-card px-3 py-2 space-y-1.5">
      <p className="text-xs text-muted-foreground font-medium mb-2">Captured Pieces</p>
      {(capturedBlack.length > 0 || advantage > 0) && (
        <PieceRow pieces={capturedBlack} label="You" advantage={advantage > 0 ? advantage : 0} />
      )}
      {(capturedWhite.length > 0 || advantage < 0) && (
        <PieceRow pieces={capturedWhite} label="AI" advantage={advantage < 0 ? -advantage : 0} />
      )}
    </div>
  )
}

function getMaterialAdvantageFromFen(fen: string): number {
  const board = fen.split(' ')[0] ?? ''
  let white = 0
  let black = 0

  for (const ch of board) {
    if (ch === '/' || /\d/.test(ch)) continue

    const type = ch.toLowerCase()
    const value = PIECE_VALUES[type] ?? 0
    if (ch === ch.toUpperCase()) white += value
    else black += value
  }

  return white - black
}
