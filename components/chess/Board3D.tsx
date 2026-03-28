'use client'

import { useState, useCallback, useRef } from 'react'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'

interface ChessSceneProps {
  fen: string
  parallelFen: string | null
  selectedSquare: Square | null
  validMoves: Square[]
  lastMove: { from: Square; to: Square } | null
  hintMove: { from: Square; to: Square } | null
  isExploringParallel: boolean
  onSquareClick: (square: Square) => void
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const

// Unicode chess pieces with correct lookup — used for aria labels
const PIECE_NAMES: Record<string, string> = {
  k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn',
}

// Deterministic pseudo-random (no Math.random = no hydration mismatch)
function seededVal(i: number, seed: number) {
  return ((Math.sin(i * seed + seed * 7) * 233280) % 1 + 1) % 1
}

const STARS = Array.from({ length: 90 }, (_, i) => ({
  top: seededVal(i, 9301) * 100,
  left: seededVal(i, 7691) * 100,
  size: seededVal(i, 1234) * 2.5 + 0.8,
  opacity: seededVal(i, 4321) * 0.6 + 0.15,
}))

// SVG paths for realistic piece silhouettes
const PIECE_SVGS: Record<string, (isWhite: boolean) => JSX.Element> = {
  k: (w) => (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-lg">
      <g fill={w ? '#fff8e7' : '#1a1210'} stroke={w ? '#3d2800' : '#f0d9b5'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.5 11.63V6M20 8h5" strokeWidth="2"/>
        <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/>
        <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-3.5-6 1 3.5 4.5 3.5 4.5v4.5c-2 4 .5 7 1.5 7.5"/>
        <path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0"/>
      </g>
    </svg>
  ),
  q: (w) => (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-lg">
      <g fill={w ? '#fff8e7' : '#1a1210'} stroke={w ? '#3d2800' : '#f0d9b5'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="12" r="2.75"/>
        <circle cx="14" cy="9" r="2.75"/>
        <circle cx="22.5" cy="8" r="2.75"/>
        <circle cx="31" cy="9" r="2.75"/>
        <circle cx="39" cy="12" r="2.75"/>
        <path d="M9 26c8.5-8.5 15.5-4 18-2l-1.5 4h-13L9 26z"/>
        <path d="M9 26c0 2 1.5 2 2.5 4h21c1-2 2.5-2 2.5-4M11.5 30c0 1 1 1 1 1h20s1 0 1-1"/>
        <path d="M6 12.4C7.4 12 10 13.8 9 26M39 12.4C37.6 12 35 13.8 36 26M6 12c-1.5 8 3.5 14 5 16M39 12c1.5 8-3.5 14-5 16"/>
        <path d="M11.5 30c5.5 3.5 15.5 3.5 21 0M11.5 33.5c5.5 3.5 15.5 3.5 21 0M11.5 37c5.5 3.5 15.5 3.5 21 0"/>
        <path d="M11.5 37c5.5-3 15.5-3 21 0v-7c-5.5 3-15.5 3-21 0z"/>
      </g>
    </svg>
  ),
  r: (w) => (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-lg">
      <g fill={w ? '#fff8e7' : '#1a1210'} stroke={w ? '#3d2800' : '#f0d9b5'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5"/>
        <path d="M34 14l-3 3H14l-3-3"/>
        <path d="M31 17v12.5H14V17"/>
        <path d="M31 29.5l1.5 2.5h-19l1.5-2.5"/>
        <path d="M11 14h23"/>
      </g>
    </svg>
  ),
  b: (w) => (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-lg">
      <g fill={w ? '#fff8e7' : '#1a1210'} stroke={w ? '#3d2800' : '#f0d9b5'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/>
        <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
        <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
        <path d="M17.5 26h10M15 30h15M22.5 15.5v5M20 18h5" strokeWidth="1.5"/>
      </g>
    </svg>
  ),
  n: (w) => (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-lg">
      <g fill={w ? '#fff8e7' : '#1a1210'} stroke={w ? '#3d2800' : '#f0d9b5'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/>
        <path d="M24 18c.38 5.12-5.4 6.6-8 9.5-3 3-2.82 6.5-.5 7.5 9.5 3 12.5-4 12.5-4"/>
        <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill={w ? '#3d2800' : '#f0d9b5'}/>
        <path d="M14.933 15.75a5 5.52 0 1 1-10 1.04 5 5.52 0 0 1 10-1.04z"/>
        <path d="M15 15.5c.13 2.06-1.34 3.42-3.5 4-2.06.5-2.66 2.72-1.5 3"/>
      </g>
    </svg>
  ),
  p: (w) => (
    <svg viewBox="0 0 45 45" className="w-full h-full drop-shadow-lg">
      <g fill={w ? '#fff8e7' : '#1a1210'} stroke={w ? '#3d2800' : '#f0d9b5'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22.5 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
        <path d="M22.5 15.3h.01"/>
        <path d="M14.5 22.5a7.5 5.5 0 1 0 16 0"/>
        <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7c-5.5 3-15.5 3-21 0z"/>
        <path d="M11.5 30c5.5-3 15.5-3 21 0"/>
      </g>
    </svg>
  ),
}

interface SquareProps {
  square: Square
  fileIdx: number
  rankIdx: number
  piece: { type: string; color: string } | null
  isSelected: boolean
  isValidMove: boolean
  isLastMove: boolean
  isHint: boolean
  isParallel: boolean
  onClick: () => void
}

function BoardSquare({ square, fileIdx, rankIdx, piece, isSelected, isValidMove, isLastMove, isHint, isParallel, onClick }: SquareProps) {
  const [hovered, setHovered] = useState(false)
  const isLight = (fileIdx + rankIdx) % 2 === 0

  // Base square color — warm walnut tones
  let bg = isLight ? '#f0d9b5' : '#b58863'
  if (isSelected) bg = '#7fc97f'
  else if (isHint) bg = '#e6a817'
  else if (isLastMove) bg = isLight ? '#f6f669' : '#baca2b'
  else if (isParallel) bg = isLight ? '#a8d8ea' : '#3a7ebf'
  else if (hovered && piece) bg = isLight ? '#e8cfa0' : '#a07855'

  const PieceSvg = piece ? PIECE_SVGS[piece.type] : null

  return (
    <div
      role="button"
      aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${PIECE_NAMES[piece.type] ?? piece.type}` : ''}`}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ backgroundColor: bg, aspectRatio: '1 / 1', position: 'relative', transition: 'background-color 0.12s ease' }}
      className="flex items-center justify-center cursor-pointer select-none"
    >
      {/* Valid move indicator */}
      {isValidMove && !piece && (
        <div className="w-[34%] h-[34%] rounded-full pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.18)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12)' }} />
      )}
      {isValidMove && piece && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ boxShadow: 'inset 0 0 0 4px rgba(0,0,0,0.28)' }} />
      )}

      {/* Piece */}
      {PieceSvg && (
        <div
          className="absolute pointer-events-none select-none"
          style={{
            inset: '4%',
            transform: isSelected ? 'scale(1.12) translateY(-4%)' : hovered ? 'scale(1.06) translateY(-2%)' : 'scale(1)',
            transition: 'transform 0.12s ease',
            filter: isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))',
          }}
        >
          {PieceSvg(piece!.color === 'w')}
        </div>
      )}

      {/* Rank label */}
      {fileIdx === 0 && (
        <span className="absolute top-0.5 left-0.5 text-[8px] font-bold leading-none pointer-events-none"
          style={{ color: isLight ? '#b58863' : '#f0d9b5', opacity: 0.8 }}>
          {RANKS[rankIdx]}
        </span>
      )}
      {/* File label */}
      {rankIdx === 7 && (
        <span className="absolute bottom-0.5 right-1 text-[8px] font-bold leading-none pointer-events-none"
          style={{ color: isLight ? '#b58863' : '#f0d9b5', opacity: 0.8 }}>
          {FILES[fileIdx]}
        </span>
      )}
    </div>
  )
}

export default function ChessScene({ fen, parallelFen, selectedSquare, validMoves, lastMove, hintMove, isExploringParallel, onSquareClick }: ChessSceneProps) {
  const displayFen = isExploringParallel && parallelFen ? parallelFen : fen
  const chess = new Chess(displayFen)
  const board = chess.board()

  const [tilt, setTilt] = useState({ x: 22, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const drag = useRef<{ mx: number; my: number; tx: number; ty: number } | null>(null)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    drag.current = { mx: e.clientX, my: e.clientY, tx: tilt.x, ty: tilt.y }
    setIsDragging(true)
  }, [tilt])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.mx
    const dy = e.clientY - drag.current.my
    setTilt({
      x: Math.max(4, Math.min(52, drag.current.tx - dy * 0.28)),
      y: drag.current.ty + dx * 0.28,
    })
  }, [])

  const stopDrag = useCallback(() => {
    drag.current = null
    setIsDragging(false)
  }, [])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    drag.current = { mx: t.clientX, my: t.clientY, tx: tilt.x, ty: tilt.y }
    setIsDragging(true)
  }, [tilt])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!drag.current) return
    const t = e.touches[0]
    setTilt({
      x: Math.max(4, Math.min(52, drag.current.tx - (t.clientY - drag.current.my) * 0.28)),
      y: drag.current.ty + (t.clientX - drag.current.mx) * 0.28,
    })
  }, [])

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden relative"
      style={{ background: 'radial-gradient(ellipse at 50% 35%, #1c1535 0%, #0e0c1a 50%, #050408 100%)' }}
    >
      {/* Starfield */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {STARS.map((s, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{ width: s.size, height: s.size, top: `${s.top}%`, left: `${s.left}%`, opacity: s.opacity }} />
        ))}
      </div>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(180,130,60,0.08) 0%, transparent 70%)' }} />

      {/* 3D perspective wrapper */}
      <div
        style={{ perspective: '1100px', perspectiveOrigin: '50% 38%', cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={stopDrag}
      >
        <div
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: 'preserve-3d',
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
        >
          {/* Ambient board glow */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: '-20px',
              background: 'rgba(0,0,0,0.55)',
              filter: 'blur(30px)',
              transform: 'translateZ(-6px)',
              borderRadius: '6px',
            }}
          />

          {/* Wooden frame outer ring */}
          <div
            style={{
              padding: '16px',
              borderRadius: '6px',
              background: 'linear-gradient(145deg, #6b3410 0%, #8b4513 30%, #7a3c10 55%, #4a2008 100%)',
              boxShadow: [
                '0 0 0 1px rgba(255,200,80,0.12)',
                '0 0 0 2.5px #3d1e08',
                'inset 0 0 18px rgba(0,0,0,0.5)',
                '0 28px 90px rgba(0,0,0,0.9)',
                '0 4px 20px rgba(180,100,20,0.2)',
              ].join(', '),
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Inner bevel ring */}
            <div
              style={{
                padding: '3px',
                background: 'linear-gradient(135deg, rgba(255,200,80,0.25) 0%, rgba(100,50,10,0.8) 50%, rgba(255,200,80,0.1) 100%)',
                borderRadius: '2px',
              }}
            >
              {/* Board grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gridTemplateRows: 'repeat(8, 1fr)',
                  width: 'min(56vh, 496px)',
                  height: 'min(56vh, 496px)',
                  boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)',
                  overflow: 'hidden',
                }}
              >
                {RANKS.map((rank, rankIdx) =>
                  FILES.map((file, fileIdx) => {
                    const sq = `${file}${rank}` as Square
                    const cell = board[rankIdx][fileIdx]
                    return (
                      <BoardSquare
                        key={sq}
                        square={sq}
                        fileIdx={fileIdx}
                        rankIdx={rankIdx}
                        piece={cell ? { type: cell.type, color: cell.color } : null}
                        isSelected={selectedSquare === sq}
                        isValidMove={validMoves.includes(sq)}
                        isLastMove={!!(lastMove && (lastMove.from === sq || lastMove.to === sq))}
                        isHint={!!(hintMove && (hintMove.from === sq || hintMove.to === sq))}
                        isParallel={isExploringParallel}
                        onClick={() => onSquareClick(sq)}
                      />
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Board bottom thickness face */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', bottom: 0,
              left: '16px', right: '16px', height: '16px',
              background: 'linear-gradient(to right, #2a0e04, #3d1a08, #2a0e04)',
              transform: 'translateY(100%) rotateX(-90deg)',
              transformOrigin: 'top center',
            }}
          />
        </div>
      </div>

      {/* Drag hint */}
      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/20 text-xs pointer-events-none select-none tracking-wide">
        Drag to rotate &middot; Click piece to select
      </p>

      {/* Parallel explorer badge */}
      {isExploringParallel && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-semibold pointer-events-none select-none"
          style={{ background: 'rgba(59,130,246,0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(147,197,253,0.3)', color: '#dbeafe' }}>
          Parallel Explorer — exploring alternate line
        </div>
      )}
    </div>
  )
}
