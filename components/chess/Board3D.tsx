'use client'

import React, { useState, useMemo } from 'react'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'

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

const FILES = ['a','b','c','d','e','f','g','h'] as const
const RANKS = ['8','7','6','5','4','3','2','1'] as const


// ─── Staunton SVG pieces ──────────────────────────────────────────────────────
function PieceSVG({ type, isWhite }: { type: string; isWhite: boolean }) {
  const fill   = isWhite ? '#fdf6e3' : '#1c1410'
  const stroke = isWhite ? '#8b6914' : '#c9a96e'
  const sw = '1.3'

  const shapes: Record<string, React.ReactNode> = {
    k: (
      <svg viewBox="0 0 45 45" width="100%" height="100%">
        <g fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.5 11.63V6" strokeWidth="2"/>
          <path d="M20 8h5" strokeWidth="2"/>
          <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/>
          <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-3.5-6 1 3.5 4.5 3.5 4.5v4.5c-2 4 .5 7 1.5 7.5"/>
          <path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0"/>
        </g>
      </svg>
    ),
    q: (
      <svg viewBox="0 0 45 45" width="100%" height="100%">
        <g fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="12" r="2.5"/>
          <circle cx="14" cy="9" r="2.5"/>
          <circle cx="22.5" cy="8" r="2.5"/>
          <circle cx="31" cy="9" r="2.5"/>
          <circle cx="39" cy="12" r="2.5"/>
          <path d="M9 26c8.5-8.5 15.5-4 18-2l-1.5 4h-13L9 26z"/>
          <path d="M9 26c0 2 1.5 2 2.5 4h21c1-2 2.5-2 2.5-4"/>
          <path d="M11.5 30c0 1 1 1 1 1h20s1 0 1-1"/>
          <path d="M6 12.4C7.4 12 10 13.8 9 26M39 12.4C37.6 12 35 13.8 36 26M6 12c-1.5 8 3.5 14 5 16M39 12c1.5 8-3.5 14-5 16"/>
          <path d="M11.5 30c5.5 3.5 15.5 3.5 21 0M11.5 33.5c5.5 3.5 15.5 3.5 21 0"/>
          <path d="M11.5 37c5.5-3 15.5-3 21 0v-7c-5.5 3-15.5 3-21 0z"/>
        </g>
      </svg>
    ),
    r: (
      <svg viewBox="0 0 45 45" width="100%" height="100%">
        <g fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12z"/>
          <path d="M11 14V9h4v2h5V9h5v2h5V9h4v5"/>
          <path d="M34 14l-3 3H14l-3-3"/>
          <path d="M31 17v12.5H14V17"/>
          <path d="M31 29.5l1.5 2.5h-19l1.5-2.5"/>
          <path d="M11 14h23"/>
        </g>
      </svg>
    ),
    b: (
      <svg viewBox="0 0 45 45" width="100%" height="100%">
        <g fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 36c3.4-1 10.1.4 13.5-2 3.4 2.4 10.1 1 13.5 2 0 0 1.6.5 3 2-.7 1-1.7 1-3 .5-3.4-1-10.1.5-13.5-1-3.4 1.5-10.1 0-13.5 1-1.4.5-2.3.5-3-.5 1.4-1.9 3-2 3-2z"/>
          <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
          <circle cx="22.5" cy="8" r="2.5"/>
          <path d="M17.5 26h10M15 30h15M22.5 15.5v5M20 18h5" strokeWidth="1.5"/>
        </g>
      </svg>
    ),
    n: (
      <svg viewBox="0 0 45 45" width="100%" height="100%">
        <g fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21"/>
          <path d="M24 18c.38 5.12-5.4 6.6-8 9.5-3 3-2.82 6.5-.5 7.5 9.5 3 12.5-4 12.5-4"/>
          <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill={stroke}/>
          <path d="M14.933 15.75a5 5.52 0 1 1-10 1.04 5 5.52 0 0 1 10-1.04z"/>
        </g>
      </svg>
    ),
    p: (
      <svg viewBox="0 0 45 45" width="100%" height="100%">
        <g fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="22.5" cy="9.5" r="4.5"/>
          <path d="M14.5 22.5a7.5 5.5 0 1 0 16 0"/>
          <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7c-5.5 3-15.5 3-21 0z"/>
          <path d="M11.5 30c5.5-3 15.5-3 21 0"/>
        </g>
      </svg>
    ),
  }

  return shapes[type] ?? null
}

// ─── Single square component ───────────────────────────────────────────────
function Square3D({
  sq, fileIdx, rankIdx, piece, isSelected, isValid, isLastMove, isHint, isInCheck, isParallel, onClick,
}: {
  sq: Square; fileIdx: number; rankIdx: number
  piece: { type: string; color: string } | null
  isSelected: boolean; isValid: boolean; isLastMove: boolean
  isHint: boolean; isInCheck: boolean; isParallel: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const isLight = (fileIdx + rankIdx) % 2 === 0

  // Compute square background
  let bg: string
  if (isInCheck) bg = '#e84040'
  else if (isSelected) bg = '#7fc97f'
  else if (isHint) bg = '#e6a817'
  else if (isLastMove) bg = isLight ? '#f6f669cc' : '#baca2bcc'
  else if (isParallel) bg = isLight ? '#a8d8ea' : '#4a90c4'
  else bg = isLight ? '#f0d9b5' : '#b58863'

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${sq}${piece ? ` ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: bg,
        position: 'relative',
        aspectRatio: '1',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background-color 0.1s ease',
        boxShadow: isSelected ? 'inset 0 0 0 3px rgba(80,200,80,0.9)' :
                   isHint     ? 'inset 0 0 0 3px rgba(230,168,23,0.9)' : 'none',
        pointerEvents: 'auto',
      }}
      className="flex items-center justify-center"
    >
      {/* Wood grain micro-texture on light squares */}
      {isLight && !isSelected && !isHint && !isLastMove && (
        <div className="absolute inset-0 wood-grain pointer-events-none opacity-60" />
      )}

      {/* Valid-move dot */}
      {isValid && !piece && (
        <div className="w-[30%] h-[30%] rounded-full pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.22)' }} />
      )}
      {/* Valid capture ring */}
      {isValid && piece && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ boxShadow: 'inset 0 0 0 5px rgba(0,0,0,0.32)' }} />
      )}

      {/* Piece */}
      {piece && (
        <div
          className="absolute pointer-events-none"
          style={{
            inset: '3%',
            transform: isSelected
              ? 'scale(1.15) translateY(-5%)'
              : hovered ? 'scale(1.07) translateY(-3%)' : 'scale(1)',
            transition: 'transform 0.1s ease',
            filter: isSelected
              ? 'drop-shadow(0 6px 12px rgba(0,0,0,0.7))'
              : 'drop-shadow(0 3px 5px rgba(0,0,0,0.5))',
          }}
        >
          <PieceSVG type={piece.type} isWhite={piece.color === 'w'} />
        </div>
      )}

      {/* Coordinate labels */}
      {fileIdx === 0 && (
        <span className="absolute top-0.5 left-0.5 text-[8px] font-bold leading-none pointer-events-none"
          style={{ color: isLight ? '#b58863' : '#f0d9b5', opacity: 0.85 }}>
          {RANKS[rankIdx]}
        </span>
      )}
      {rankIdx === 7 && (
        <span className="absolute bottom-0.5 right-1 text-[8px] font-bold leading-none pointer-events-none"
          style={{ color: isLight ? '#b58863' : '#f0d9b5', opacity: 0.85 }}>
          {FILES[fileIdx]}
        </span>
      )}
    </div>
  )
}

// ─── Promotion picker ─────────────────────────────────────────────────────────
function PromotionPicker({ isWhite, onPick }: { isWhite: boolean; onPick: (p: 'q'|'r'|'b'|'n') => void }) {
  const pieces: Array<'q'|'r'|'b'|'n'> = ['q','r','b','n']
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(13,11,8,0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm font-semibold" style={{ color: '#f0ead8' }}>Choose promotion piece</p>
        <div className="flex gap-3">
          {pieces.map(p => (
            <button key={p} onClick={() => onPick(p)}
              className="w-16 h-16 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: '#1e1b14', border: '1px solid #c9922a44', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
              <PieceSVG type={p} isWhite={isWhite} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Board Scene ─────────────────────────────────────────────────────────
export default function Board3D({
  fen, parallelFen, selectedSquare, validMoves, lastMove, hintMove,
  isExploringParallel, pendingPromotion, onSquareClick, onPromotion,
}: BoardProps) {
  const displayFen = isExploringParallel && parallelFen ? parallelFen : fen

  // Memoize the chess instance to avoid recreating on every render
  const { board, isCheck, turn, checkSquare } = useMemo(() => {
    const chess = new Chess(displayFen)
    const board = chess.board()
    const isCheck = chess.isCheck()
    const turn = chess.turn()

    let checkSquare: Square | null = null
    if (isCheck) {
      outer: for (const row of board) {
        for (const cell of row) {
          if (cell?.type === 'k' && cell.color === turn) {
            checkSquare = cell.square as Square
            break outer
          }
        }
      }
    }

    return { board, isCheck, turn, checkSquare }
  }, [displayFen])

  // Fixed board angle - no dragging
  const tilt = { x: 24, y: 0 }

  const boardSize = 'min(60vmin, 520px)'

  return (
    <div className="w-full h-full relative flex items-center justify-center isolate"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1430 0%, #0d0b08 55%, #050305 100%)', overflow: 'visible' }}>


      {/* Ambient radial glow under board */}
      <div className="absolute pointer-events-none" aria-hidden="true"
        style={{ width: '60%', height: '40%', top: '38%', left: '20%',
          background: 'radial-gradient(ellipse, rgba(201,146,42,0.1) 0%, transparent 70%)',
          filter: 'blur(30px)' }} />

      {/* 3D perspective container */}
      <div style={{ pointerEvents: 'none' }}>
        <div style={{
          transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
          transformOrigin: '50% 40%',
          pointerEvents: 'none',
        }}>
          {/* Drop shadow plane */}
          <div aria-hidden="true" style={{
            position: 'absolute',
            inset: '-30px',
            background: 'rgba(0,0,0,0.6)',
            filter: 'blur(40px)',
            transform: 'translateZ(-10px)',
            borderRadius: '8px',
            pointerEvents : 'none',
          }} />

          {/* Walnut outer frame */}
          <div style={{
            padding: '18px',
            borderRadius: '6px',
            background: 'linear-gradient(150deg, #7a3e14 0%, #5c2d0a 30%, #8b4513 60%, #4a1e06 100%)',
            boxShadow: [
              '0 0 0 1px rgba(255,200,80,0.14)',
              '0 0 0 2.5px #2a1004',
              'inset 0 1px 0 rgba(255,200,80,0.18)',
              'inset 0 -1px 0 rgba(0,0,0,0.6)',
              '0 30px 100px rgba(0,0,0,0.95)',
              '0 4px 24px rgba(180,100,20,0.25)',
            ].join(', '),
            pointerEvents: 'none',
          }}>
            {/* Wood grain on frame */}
            <div className="absolute inset-0 wood-grain rounded pointer-events-none opacity-40" aria-hidden="true" />

            {/* Gold bevel inset */}
            <div style={{
              padding: '3px',
              borderRadius: '3px',
              background: 'linear-gradient(135deg, rgba(255,200,80,0.28) 0%, rgba(90,45,8,0.9) 45%, rgba(255,200,80,0.14) 100%)',
              pointerEvents: 'none',
            }}>
              {/* Board grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8,1fr)',
                gridTemplateRows: 'repeat(8,1fr)',
                width: boardSize,
                height: boardSize,
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.35)',
                pointerEvents: 'auto',
                position: 'relative',
                transformStyle: 'flat',
              }}>
                {RANKS.map((rank, ri) =>
                  FILES.map((file, fi) => {
                    const sq = `${file}${rank}` as Square
                    const cell = board[ri][fi]
                    return (
                      <Square3D
                        key={sq} sq={sq} fileIdx={fi} rankIdx={ri}
                        piece={cell ? { type: cell.type, color: cell.color } : null}
                        isSelected={selectedSquare === sq}
                        isValid={validMoves.includes(sq)}
                        isLastMove={!!(lastMove && (lastMove.from === sq || lastMove.to === sq))}
                        isHint={!!(hintMove && (hintMove.from === sq || hintMove.to === sq))}
                        isInCheck={checkSquare === sq}
                        isParallel={isExploringParallel}
                        onClick={() => onSquareClick(sq)}
                      />
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Board thickness bottom */}
          <div aria-hidden="true" style={{
            position: 'absolute', bottom: 0, left: '18px', right: '18px', height: '18px',
            background: 'linear-gradient(to right, #280d04, #3d1a08, #280d04)',
            transform: 'translateY(100%) rotateX(-90deg)',
            transformOrigin: 'top center',
            pointerEvents: 'none',
          }} />
        </div>
      </div>

      {/* Promotion picker */}
      {pendingPromotion && (
        <PromotionPicker isWhite={turn === 'w'} onPick={onPromotion} />
      )}

      {/* Parallel explorer badge */}
      {isExploringParallel && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-semibold pointer-events-none select-none"
          style={{ background: 'rgba(59,130,246,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(147,197,253,0.3)', color: '#dbeafe' }}>
          Parallel Explorer — alternate line
        </div>
      )}

      {/* Click hint */}
      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs pointer-events-none select-none tracking-widest uppercase"
        style={{ color: 'rgba(240,234,216,0.15)' }}>
        Click to move
      </p>
    </div>
  )
}
