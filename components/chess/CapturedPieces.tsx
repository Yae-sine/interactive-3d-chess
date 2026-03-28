'use client'

import type { Piece } from 'chess.js'

const PIECE_SYMBOLS: Record<string, Record<string, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
}

const PIECE_VALUES: Record<string, number> = {
  q: 9, r: 5, b: 3, n: 3, p: 1, k: 0
}

interface CapturedPiecesProps {
  capturedWhite: Piece[]  // white pieces captured by black
  capturedBlack: Piece[]  // black pieces captured by white
}

function PieceRow({ pieces, label }: { pieces: Piece[]; label: string }) {
  const sorted = [...pieces].sort((a, b) => PIECE_VALUES[b.type] - PIECE_VALUES[a.type])
  const totalValue = pieces.reduce((s, p) => s + PIECE_VALUES[p.type], 0)

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
      {totalValue > 0 && (
        <span className="text-xs text-muted-foreground font-mono">+{totalValue}</span>
      )}
    </div>
  )
}

export default function CapturedPieces({ capturedWhite, capturedBlack }: CapturedPiecesProps) {
  if (capturedWhite.length === 0 && capturedBlack.length === 0) return null

  return (
    <div className="rounded-xl border border-border/40 bg-card px-3 py-2 space-y-1.5">
      <p className="text-xs text-muted-foreground font-medium mb-2">Captured Pieces</p>
      {capturedBlack.length > 0 && (
        <PieceRow pieces={capturedBlack} label="You" />
      )}
      {capturedWhite.length > 0 && (
        <PieceRow pieces={capturedWhite} label="AI" />
      )}
    </div>
  )
}
