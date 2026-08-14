'use client'

import type { Piece } from 'chess.js'
import { PieceGlyph, type PieceType } from './pieces'

const PIECE_VALUES: Record<string, number> = { q: 9, r: 5, b: 3, n: 3, p: 1, k: 0 }

interface CapturedPiecesProps {
  fen: string
  capturedWhite: Piece[]  // white pieces captured by black (engine's captures)
  capturedBlack: Piece[]  // black pieces captured by white (player's captures)
}

function PieceRow({ pieces, label, advantage }: { pieces: Piece[]; label: string; advantage: number }) {
  const sorted = [...pieces].sort((a, b) => PIECE_VALUES[b.type] - PIECE_VALUES[a.type])

  if (pieces.length === 0 && advantage <= 0) return null

  return (
    <div className="flex items-center gap-2.5 min-h-6">
      <span className="label-caps !text-[9px] w-[76px] shrink-0">{label}</span>
      <div className="flex flex-wrap gap-0.5 flex-1 items-center -my-1">
        {sorted.map((p, i) => (
          <span
            key={i}
            className="w-[18px] h-[18px] flex items-center justify-center"
            title={p.type.toUpperCase()}
          >
            <PieceGlyph type={p.type as PieceType} color={p.color} />
          </span>
        ))}
        {pieces.length === 0 && advantage > 0 && (
          <span className="text-muted-foreground/60 text-[11px] italic font-serif">clean position</span>
        )}
      </div>
      {advantage > 0 && (
        <span
          className="text-[11px] font-mono px-1.5 py-0.5 rounded-md shrink-0"
          style={{ background: 'rgba(135,160,138,0.12)', color: '#a9c2ab', border: '1px solid rgba(135,160,138,0.3)' }}
          title="Material advantage"
        >
          +{advantage}
        </span>
      )}
    </div>
  )
}

export default function CapturedPieces({ fen, capturedWhite, capturedBlack }: CapturedPiecesProps) {
  const advantage = getMaterialAdvantageFromFen(fen)

  if (capturedWhite.length === 0 && capturedBlack.length === 0 && advantage === 0) return null

  return (
    <section className="px-4 py-3 border-b border-border/70 bg-white/[0.015]">
      <h3 className="label-caps mb-2.5">Material</h3>
      <div className="space-y-2">
        <PieceRow pieces={capturedBlack} label="Your captures" advantage={advantage > 0 ? advantage : 0} />
        <PieceRow pieces={capturedWhite} label="Engine takes" advantage={advantage < 0 ? -advantage : 0} />
      </div>
    </section>
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