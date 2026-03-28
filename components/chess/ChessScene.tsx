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

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1']

const PIECE_SYMBOLS: Record<string, string> = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
}

function getPieceSymbol(type: string, color: string) {
  return PIECE_SYMBOLS[`${color}${type}`] ?? ''
}

// Deterministic star positions (no Math.random to avoid hydration mismatch)
const STARS = Array.from({ length: 80 }, (_, i) => {
  const a = Math.sin(i * 9301 + 49297) * 233280
  const b = Math.sin(i * 7691 + 13337) * 233280
  const c = Math.sin(i * 1234 + 5678) * 233280
  const d = Math.sin(i * 4321 + 8765) * 233280
  return {
    top: ((a % 1) + 1) % 1 * 100,
    left: ((b % 1) + 1) % 1 * 100,
    size: ((c % 1) + 1) % 1 * 2 + 1,
    opacity: ((d % 1) + 1) % 1 * 0.7 + 0.1,
  }
})

interface BoardSquareProps {
  square: Square
  fileIdx: number
  rankIdx: number
  piece: { type: string; color: string } | null
  isSelected: boolean
  isValidMove: boolean
  isLastMove: boolean
  isHint: boolean
  isExploringParallel: boolean
  onClick: () => void
}

function BoardSquare({
  square, fileIdx, rankIdx, piece,
  isSelected, isValidMove, isLastMove, isHint, isExploringParallel, onClick,
}: BoardSquareProps) {
  const isLight = (fileIdx + rankIdx) % 2 === 0
  const isWhitePiece = piece?.color === 'w'

  let bgColor: string
  if (isSelected) {
    bgColor = '#4ade80'
  } else if (isHint) {
    bgColor = '#f59e0b'
  } else if (isLastMove) {
    bgColor = isLight ? '#fde68a' : '#ca8a04'
  } else if (isExploringParallel) {
    bgColor = isLight ? '#bfdbfe' : '#1d4ed8'
  } else {
    bgColor = isLight ? '#f0d9b5' : '#b58863'
  }

  return (
    <div
      role="button"
      aria-label={`Square ${square}${piece ? ` with ${piece.color === 'w' ? 'white' : 'black'} ${piece.type}` : ''}`}
      onClick={onClick}
      style={{ backgroundColor: bgColor, aspectRatio: '1 / 1' }}
      className="relative flex items-center justify-center cursor-pointer select-none
        transition-[filter] duration-100 hover:brightness-110 active:brightness-90"
    >
      {/* Valid move dot (empty square) */}
      {isValidMove && !piece && (
        <div className="w-[33%] h-[33%] rounded-full bg-black/20 pointer-events-none" />
      )}

      {/* Valid capture ring */}
      {isValidMove && piece && (
        <div className="absolute inset-0 ring-[3px] ring-inset ring-black/25 pointer-events-none" />
      )}

      {/* Piece symbol */}
      {piece && (
        <span
          className={`leading-none pointer-events-none select-none transition-transform duration-150
            ${isSelected ? 'scale-110' : 'scale-100'}`}
          style={{
            fontFamily: '"Segoe UI Symbol", "Apple Color Emoji", serif',
            fontSize: 'clamp(18px, 4cqi, 46px)',
            color: isWhitePiece ? '#ffffff' : '#1a1a1a',
            textShadow: isWhitePiece
              ? '0 0 2px #000, 0 1px 4px rgba(0,0,0,0.9), 0 0 1px #000'
              : '0 0 2px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.4)',
            filter: isSelected ? 'drop-shadow(0 0 6px rgba(0,200,100,0.8))' : 'none',
          }}
        >
          {getPieceSymbol(piece.type, piece.color)}
        </span>
      )}

      {/* Rank label (left edge) */}
      {fileIdx === 0 && (
        <span
          className="absolute top-0.5 left-0.5 text-[9px] font-bold leading-none pointer-events-none opacity-50"
          style={{ color: isLight ? '#b58863' : '#f0d9b5' }}
        >
          {RANKS[rankIdx]}
        </span>
      )}

      {/* File label (bottom edge) */}
      {rankIdx === 7 && (
        <span
          className="absolute bottom-0.5 right-0.5 text-[9px] font-bold leading-none pointer-events-none opacity-50"
          style={{ color: isLight ? '#b58863' : '#f0d9b5' }}
        >
          {FILES[fileIdx]}
        </span>
      )}
    </div>
  )
}

export default function ChessScene({
  fen, parallelFen, selectedSquare, validMoves,
  lastMove, hintMove, isExploringParallel, onSquareClick,
}: ChessSceneProps) {
  const displayFen = isExploringParallel && parallelFen ? parallelFen : fen
  const chess = new Chess(displayFen)
  const board = chess.board()

  const [tilt, setTilt] = useState({ x: 20, y: 0 })
  const dragStart = useRef<{ mx: number; my: number; tx: number; ty: number } | null>(null)
  const isDragging = useRef(false)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    isDragging.current = false
    dragStart.current = { mx: e.clientX, my: e.clientY, tx: tilt.x, ty: tilt.y }
  }, [tilt])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStart.current) return
    const dx = e.clientX - dragStart.current.mx
    const dy = e.clientY - dragStart.current.my
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging.current = true
    setTilt({
      x: Math.max(5, Math.min(50, dragStart.current.tx - dy * 0.25)),
      y: dragStart.current.ty + dx * 0.25,
    })
  }, [])

  const onMouseUp = useCallback(() => { dragStart.current = null }, [])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    dragStart.current = { mx: t.clientX, my: t.clientY, tx: tilt.x, ty: tilt.y }
  }, [tilt])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragStart.current) return
    const t = e.touches[0]
    const dx = t.clientX - dragStart.current.mx
    const dy = t.clientY - dragStart.current.my
    setTilt({
      x: Math.max(5, Math.min(50, dragStart.current.tx - dy * 0.25)),
      y: dragStart.current.ty + dx * 0.25,
    })
  }, [])

  const onTouchEnd = useCallback(() => { dragStart.current = null }, [])

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden relative"
      style={{
        background: 'radial-gradient(ellipse at 55% 40%, #1a1040 0%, #0d0d1a 55%, #050510 100%)',
      }}
    >
      {/* Starfield */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {STARS.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: star.size,
              height: star.size,
              top: `${star.top}%`,
              left: `${star.left}%`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {/* Perspective wrapper (drag to tilt) */}
      <div
        className="relative"
        style={{ perspective: '1000px', perspectiveOrigin: '50% 40%' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: 'preserve-3d',
            transition: dragStart.current ? 'none' : 'transform 0.18s ease-out',
            cursor: dragStart.current ? 'grabbing' : 'grab',
          }}
        >
          {/* Drop shadow depth layer */}
          <div
            style={{
              position: 'absolute',
              inset: '-12px',
              background: 'rgba(0,0,0,0.6)',
              filter: 'blur(24px)',
              transform: 'translateZ(-4px)',
              borderRadius: '4px',
            }}
          />

          {/* Wooden frame */}
          <div
            style={{
              padding: '14px',
              borderRadius: '4px',
              background: 'linear-gradient(145deg, #5c2e0a 0%, #8b4513 35%, #6b3410 60%, #3d1f0a 100%)',
              boxShadow: '0 0 0 2px #c97c2a44, 0 0 0 3px #7a4010, inset 0 0 16px rgba(0,0,0,0.4), 0 24px 80px rgba(0,0,0,0.85)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* The 8×8 board */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gridTemplateRows: 'repeat(8, 1fr)',
                width: 'min(58vh, 500px)',
                height: 'min(58vh, 500px)',
                containerType: 'inline-size',
                boxShadow: 'inset 0 0 24px rgba(0,0,0,0.25)',
              }}
            >
              {RANKS.map((rank, rankIdx) =>
                FILES.map((file, fileIdx) => {
                  const sq = `${file}${rank}` as Square
                  const cell = board[rankIdx][fileIdx]
                  const piece = cell ? { type: cell.type, color: cell.color } : null
                  return (
                    <BoardSquare
                      key={sq}
                      square={sq}
                      fileIdx={fileIdx}
                      rankIdx={rankIdx}
                      piece={piece}
                      isSelected={selectedSquare === sq}
                      isValidMove={validMoves.includes(sq)}
                      isLastMove={!!(lastMove && (lastMove.from === sq || lastMove.to === sq))}
                      isHint={!!(hintMove && (hintMove.from === sq || hintMove.to === sq))}
                      isExploringParallel={isExploringParallel}
                      onClick={() => onSquareClick(sq)}
                    />
                  )
                })
              )}
            </div>
          </div>

          {/* Board bottom face (3D thickness) */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '14px',
              right: '14px',
              height: '14px',
              background: '#2a0e04',
              transform: 'translateY(100%) rotateX(-90deg)',
              transformOrigin: 'top center',
            }}
          />
        </div>
      </div>

      {/* UI overlays */}
      <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/25 text-xs pointer-events-none select-none">
        Drag to tilt the board
      </p>

      {isExploringParallel && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full
          bg-blue-600/80 backdrop-blur-sm border border-blue-400/30 text-blue-100 text-xs font-semibold
          pointer-events-none">
          Parallel Explorer — exploring alternate line
        </div>
      )}
    </div>
  )
}
