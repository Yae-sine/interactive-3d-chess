'use client'

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Chess, type Square } from 'chess.js'
import { PieceGlyph, PieceDefs, type PieceType } from './pieces'

// ─── Types ────────────────────────────────────────────────────────────────────
interface BoardProps {
  fen: string
  parallelFen: string | null
  selectedSquare: Square | null
  validMoves: Square[]
  lastMove: { from: Square; to: Square } | null
  hintMove: { from: Square; to: Square } | null
  isExploringParallel: boolean
  pendingPromotion: { from: Square; to: Square; isParallel: boolean } | null
  onSquareClick: (sq: Square) => void
  onPromotion: (piece: 'q' | 'r' | 'b' | 'n') => void
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const

const SQ_INDEX: Record<string, number> = {}
FILES.forEach((f, fi) => RANKS.forEach((r, ri) => { SQ_INDEX[`${f}${r}`] = ri * 8 + fi }))

/** Parse the FEN board field into 64 squares of { type, color } | null */
function parseFen(fen: string): Array<{ type: PieceType; color: 'w' | 'b' } | null> {
  const field = fen.split(' ')[0] ?? ''
  const cells: Array<{ type: PieceType; color: 'w' | 'b' } | null> = []
  for (const ch of field) {
    if (ch === '/') continue
    if (/\d/.test(ch)) {
      for (let i = 0; i < Number(ch); i++) cells.push(null)
    } else {
      cells.push({
        type: ch.toLowerCase() as PieceType,
        color: ch === ch.toUpperCase() ? 'w' : 'b',
      })
    }
  }
  return cells
}

/** Piece at a square from the FEN board field (for capture detection) */
function fenPieceAt(fen: string, sq: Square): { type: PieceType; color: 'w' | 'b' } | null {
  const idx = SQ_INDEX[sq]
  if (idx === undefined) return null
  return parseFen(fen)[idx] ?? null
}

// ─── Single square ────────────────────────────────────────────────────────────
interface SquareProps {
  sq: Square
  fileIdx: number
  rankIdx: number
  pieceType: PieceType | null
  pieceColor: 'w' | 'b' | null
  isSelected: boolean
  isValid: boolean
  isLastMove: boolean
  isHint: boolean
  isInCheck: boolean
  isParallel: boolean
  hasBurst: boolean
}

const Square3D = React.memo(function Square3D({
  sq, fileIdx, rankIdx, pieceType, pieceColor,
  isSelected, isValid, isLastMove, isHint, isInCheck, isParallel, hasBurst,
}: SquareProps) {
  const [hovered, setHovered] = useState(false)
  const isLight = (fileIdx + rankIdx) % 2 === 0

  let bg = isLight ? 'var(--sq-light)' : 'var(--sq-dark)'
  if (isInCheck) bg = 'var(--sq-check)'
  else if (isSelected) bg = 'var(--sq-select)'
  else if (isHint) bg = 'var(--sq-hint)'
  else if (isLastMove) bg = isLight ? 'var(--sq-last)' : 'var(--sq-last)'
  else if (isParallel) bg = isLight ? 'var(--sq-parallel-light)' : 'var(--sq-parallel-dark)'

  const stateClass =
    isSelected ? 'sq-selected' :
    isHint && !isLastMove ? 'sq-hint' :
    isInCheck ? 'sq-check' : ''

  return (
    <div
      data-sq={sq}
      role="gridcell"
      tabIndex={0}
      aria-label={`${sq}${pieceType ? ` ${pieceColor === 'w' ? 'white' : 'black'} ${pieceType}` : ''}`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          const target = e.currentTarget.closest('[data-board]')
          target?.dispatchEvent(new CustomEvent('squarepick', { detail: sq }))
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`${stateClass} focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#e8c98a]`}
      style={{
        backgroundColor: bg,
        position: 'relative',
        aspectRatio: '1',
        cursor: 'pointer',
        userSelect: 'none',
        boxShadow: isLight
          ? 'inset 0 1px 0 rgba(255,244,214,0.55), inset 1px 0 0 rgba(255,244,214,0.35), inset 0 -1px 0 rgba(80,42,10,0.28), inset -1px 0 0 rgba(80,42,10,0.22)'
          : 'inset 0 1px 0 rgba(255,214,150,0.22), inset 0 -1px 0 rgba(40,18,4,0.5), inset -1px 0 0 rgba(40,18,4,0.35), inset 1px 0 0 rgba(255,214,150,0.12)',
      }}
    >
      {/* Wood grain on light squares */}
      {isLight && !isSelected && !isHint && !isInCheck && !isLastMove && (
        <div className="absolute inset-0 wood-grain pointer-events-none opacity-50" aria-hidden="true" />
      )}

      {/* Valid move dot / capture ring */}
      {isValid && !pieceType && (
        <div className="w-[30%] h-[30%] rounded-full pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ background: 'rgba(20,14,8,0.28)' }} />
      )}
      {isValid && pieceType && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ boxShadow: 'inset 0 0 0 5px rgba(20,14,8,0.32)' }} />
      )}

      {/* Capture burst */}
      {hasBurst && (
        <div className="absolute inset-0 capture-burst pointer-events-none rounded-full"
          style={{ boxShadow: 'inset 0 0 0 3px rgba(217,171,98,0.9)' }} aria-hidden="true" />
      )}

      {/* Piece (static layer; motion handled by the piece host) */}
      {pieceType && pieceColor && (
        <div
          className="absolute pointer-events-none"
          style={{
            inset: '3%',
            transform: hovered && !isSelected ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 100ms ease',
            filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.5))',
          }}
        >
          <PieceGlyph type={pieceType} color={pieceColor} />
        </div>
      )}

      {/* Coordinates (decorative — real names come from aria-label) */}
      {fileIdx === 0 && (
        <span aria-hidden="true" className="absolute top-0.5 left-0.5 text-[8px] font-bold leading-none pointer-events-none"
          style={{ color: isLight ? '#9a6a3c' : '#eccfa3', opacity: 0.85 }}>
          {RANKS[rankIdx]}
        </span>
      )}
      {rankIdx === 7 && (
        <span aria-hidden="true" className="absolute bottom-0.5 right-1 text-[8px] font-bold leading-none pointer-events-none"
          style={{ color: isLight ? '#9a6a3c' : '#eccfa3', opacity: 0.85 }}>
          {FILES[fileIdx]}
        </span>
      )}
    </div>
  )
})

// ─── Promotion picker ─────────────────────────────────────────────────────────
const PROMOTION_PIECES: Array<'q' | 'r' | 'b' | 'n'> = ['q', 'r', 'b', 'n']

function PromotionPicker({ isWhite, onPick }: { isWhite: boolean; onPick: (p: 'q' | 'r' | 'b' | 'n') => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(10,8,6,0.72)', backdropFilter: 'blur(6px)' }}>
      <div className="brass-border rounded-xl p-5 flex flex-col items-center gap-4 shadow-2xl">
        <p className="label-caps">Choose a promotion piece</p>
        <div className="flex gap-3">
          {PROMOTION_PIECES.map(p => (
            <button
              key={p}
              onClick={() => onPick(p)}
              aria-label={`Promote to ${p === 'q' ? 'queen' : p === 'r' ? 'rook' : p === 'b' ? 'bishop' : 'knight'}`}
              className="w-16 h-16 rounded-lg flex items-center justify-center transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-brass"
              style={{
                background: 'linear-gradient(180deg, #1c1610, #12100c)',
                border: '1px solid rgba(201,164,92,0.35)',
                boxShadow: '0 6px 18px rgba(0,0,0,0.55)',
              }}
            >
              <PieceGlyph type={p} color={isWhite ? 'w' : 'b'} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main board ───────────────────────────────────────────────────────────────
export default function Board3D({
  fen, parallelFen, selectedSquare, validMoves, lastMove, hintMove,
  isExploringParallel, pendingPromotion, onSquareClick, onPromotion,
}: BoardProps) {
  const displayFen = isExploringParallel && parallelFen ? parallelFen : fen

  // Parse board + check state (deterministic, memoized on FEN)
  const { cells, turn, checkSquare, inCheck } = useMemo(() => {
    const cells = parseFen(displayFen)
    const turn = (displayFen.split(' ')[1] ?? 'w') as 'w' | 'b'
    let checkSquare: Square | null = null
    for (let i = 0; i < 64; i++) {
      const c = cells[i]
      if (c?.type === 'k' && c.color === turn) {
        checkSquare = (FILES[i % 8] + RANKS[Math.floor(i / 8)]) as Square
        break
      }
    }
    const inCheck = checkSquare ? new Chess(displayFen).isCheck() : false
    return { cells, turn, checkSquare, inCheck }
  }, [displayFen])

  // ── Piece motion ────────────────────────────────────────────────────────────
  const [slideAnim, setSlideAnim] = useState<{ from: Square; to: Square; phase: 'start' | 'go'; token: number } | null>(null)
  const [captureSq, setCaptureSq] = useState<Square | null>(null)
  const prevFenRef = useRef(displayFen)
  const prevLastMoveRef = useRef(lastMove)

  useEffect(() => {
    const prevFen = prevFenRef.current
    const prevLastMove = prevLastMoveRef.current
    if (prevFen === displayFen) return
    prevFenRef.current = displayFen

    if (isExploringParallel || !lastMove) return
    if (prevLastMove === lastMove) return
    prevLastMoveRef.current = lastMove

    // Capture detection: an opponent piece sat on the destination square
    const before = fenPieceAt(prevFen, lastMove.to)
    const after = fenPieceAt(displayFen, lastMove.to)
    if (before && after && before.color !== after.color) {
      setCaptureSq(lastMove.to)
      const t = setTimeout(() => setCaptureSq(null), 460)
      return () => clearTimeout(t)
    }

    // Promotion: piece type changed at destination → skip slide
    const moverBefore = fenPieceAt(prevFen, lastMove.from)
    if (!after || !moverBefore) return
    if (moverBefore.type !== after.type) return

    const token = Date.now()
    setSlideAnim({ from: lastMove.from, to: lastMove.to, phase: 'start', token })
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setSlideAnim(cur => (cur?.token === token ? { ...cur, phase: 'go' } : cur))
    }))
  }, [displayFen, isExploringParallel, lastMove])

  // ── Interaction (event delegation keeps squares memoized) ──────────────────
  const handleBoardClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const el = target.closest('[data-sq]') as HTMLElement | null
    if (!el?.dataset.sq) return
    onSquareClick(el.dataset.sq as Square)
  }, [onSquareClick])

  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const handler = (e: Event) => onSquareClick((e as CustomEvent).detail as Square)
    el.addEventListener('squarepick', handler)
    return () => el.removeEventListener('squarepick', handler)
  }, [onSquareClick])

  const boardRef = useRef<HTMLDivElement>(null)

  const tilt = { x: 24, y: 0 }
  const boardSize = 'min(78vmin, 500px, calc(100svh - 190px))'

  // The moving piece rendered on top of the grid (slide + land)
  const slideHost = !isExploringParallel && slideAnim && cells[SQ_INDEX[slideAnim.to]]
    ? (() => {
        const moving = cells[SQ_INDEX[slideAnim.to]]!
        const dx = ((slideAnim.from.charCodeAt(0) - 97) - (slideAnim.to.charCodeAt(0) - 97)) * 100
        const dy = (parseInt(slideAnim.to[1]) - parseInt(slideAnim.from[1])) * 100
        return (
          <div
            key={`slide-${slideAnim.token}`}
            className="absolute pointer-events-none"
            style={{
              left: `${(slideAnim.to.charCodeAt(0) - 97) * 12.5}%`,
              top: `${(8 - parseInt(slideAnim.to[1])) * 12.5}%`,
              width: '12.5%', height: '12.5%',
              zIndex: 30,
              transform: slideAnim.phase === 'start'
                ? `translate(${dx}%, ${dy}%) scale(1.06)`
                : 'translate(0%, 0%) scale(1)',
              transition: slideAnim.phase === 'go' ? 'transform 230ms cubic-bezier(0.34,1.4,0.5,1)' : 'none',
              filter: 'drop-shadow(0 8px 6px rgba(0,0,0,0.45))',
            }}
          >
            <div
              className={slideAnim.phase === 'go' ? 'piece-land' : ''}
              style={{
                position: 'absolute', inset: '3%',
                animationDelay: slideAnim.phase === 'go' ? '230ms' : undefined,
              }}
            >
              <PieceGlyph type={moving.type} color={moving.color} />
            </div>
          </div>
        )
      })()
    : null

  return (
    <div
      ref={boardRef}
      data-board="true"
      className="w-full h-full relative flex items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 90% 70% at 50% 30%, #14100b 0%, #0a0806 62%, #070604 100%)' }}
    >
      <PieceDefs />

      {/* Room spotlight */}
      <div className="absolute pointer-events-none" aria-hidden="true"
        style={{
          width: '64%', height: '46%', top: '30%', left: '18%',
          background: 'radial-gradient(ellipse, rgba(201,164,92,0.10) 0%, transparent 68%)',
          filter: 'blur(24px)',
        }} />

      {/* 3D scene */}
      <div style={{ pointerEvents: 'none' }}>
        <div style={{
          transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
          transformOrigin: '50% 40%',
          pointerEvents: 'none',
        }}>
          {/* Contact shadow */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: '-36px', borderRadius: '14px',
            background: 'radial-gradient(ellipse at 50% 62%, rgba(0,0,0,0.78) 0%, transparent 70%)',
            filter: 'blur(28px)',
            transform: 'translateZ(-26px)',
            pointerEvents: 'none',
          }} />

          {/* Felt pedestal */}
          <div aria-hidden="true" className="felt-texture" style={{
            position: 'absolute', inset: '-26px', borderRadius: '16px',
            background: 'linear-gradient(160deg, #1d3126 0%, #16261d 45%, #0d1711 100%)',
            border: '1px solid rgba(138,111,63,0.28)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -3px 10px rgba(0,0,0,0.5)',
            transform: 'translateZ(-10px)',
            pointerEvents: 'none',
          }} />

          {/* Walnut frame */}
          <div style={{
            padding: '16px', borderRadius: '8px',
            background: 'linear-gradient(150deg, #6b3d1c 0%, #4a2813 30%, #7a4520 62%, #3a1e0c 100%)',
            boxShadow: [
              '0 0 0 1px rgba(240,217,166,0.14)',
              '0 0 0 2.5px #1d0f05',
              'inset 0 1px 0 rgba(255,214,140,0.22)',
              'inset 0 -2px 0 rgba(0,0,0,0.55)',
              '0 34px 90px rgba(0,0,0,0.85)',
              '0 6px 26px rgba(201,164,92,0.14)',
            ].join(', '),
            pointerEvents: 'none',
          }}>
            {/* Wood grain */}
            <div className="absolute inset-0 wood-grain rounded pointer-events-none opacity-45" aria-hidden="true" />

            {/* Brass bevel */}
            <div style={{
              padding: '2px', borderRadius: '4px',
              background: 'linear-gradient(135deg, rgba(240,217,166,0.5) 0%, rgba(138,111,63,0.85) 42%, rgba(201,164,92,0.35) 72%, rgba(240,217,166,0.55) 100%)',
              boxShadow: 'inset 0 1px 2px rgba(255,244,214,0.35)',
              pointerEvents: 'none',
            }}>
              {/* Grid */}
              <div
                onClick={handleBoardClick}
                role="grid"
                aria-label="Chess board"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8,1fr)',
                  gridTemplateRows: 'repeat(8,1fr)',
                  width: boardSize,
                  height: boardSize,
                  position: 'relative',
                  transformStyle: 'flat',
                  pointerEvents: 'auto',
                  boxShadow: 'inset 0 0 34px rgba(40,18,4,0.45)',
                }}
              >
                {RANKS.map((rank, ri) =>
                  <div role="row" key={rank} style={{ display: 'contents' }}>
                    {FILES.map((file, fi) => {
                      const sq = `${file}${rank}` as Square
                      const cell = cells[ri * 8 + fi] ?? null
                      const isSelected = selectedSquare === sq
                      const isHint = !!hintMove && (hintMove.from === sq || hintMove.to === sq)
                      return (
                        <Square3D
                          key={sq}
                          sq={sq} fileIdx={fi} rankIdx={ri}
                          pieceType={cell?.type ?? null}
                          pieceColor={cell?.color ?? null}
                          isSelected={isSelected}
                          isValid={validMoves.includes(sq)}
                          isLastMove={!!lastMove && (lastMove.from === sq || lastMove.to === sq) && !isSelected}
                          isHint={isHint}
                          isInCheck={inCheck && checkSquare === sq}
                          isParallel={isExploringParallel}
                          hasBurst={captureSq === sq}
                        />
                      )
                    })}
                  </div>
                )}

                {/* Piece motion host */}
                <div role="row" aria-hidden="true" style={{ display: 'contents' }}>
                  {slideHost}
                </div>
              </div>
            </div>
          </div>

          {/* Frame thickness */}
          <div aria-hidden="true" style={{
            position: 'absolute', bottom: 0, left: '16px', right: '16px', height: '16px',
            background: 'linear-gradient(to right, #1d0f05, #4a2813, #1d0f05)',
            transform: 'translateY(100%) rotateX(-90deg)',
            transformOrigin: 'top center',
            pointerEvents: 'none',
          }} />
        </div>
      </div>

      {/* Explorer chip */}
      {isExploringParallel && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 pl-4 pr-2 py-1.5 rounded-full pointer-events-none select-none"
          style={{
            background: 'rgba(20,14,10,0.82)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(110,149,173,0.4)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}>
          <span className="text-xs font-medium" style={{ color: '#9fb8c8' }}>Parallel line — tap squares to explore</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(110,149,173,0.18)', color: '#c4d8e6' }}>
            ESC to exit
          </span>
        </div>
      )}

      {/* Promotion */}
      {pendingPromotion && (
        <PromotionPicker isWhite={turn === 'w'} onPick={onPromotion} />
      )}
    </div>
  )
}
