'use client'

import { RotateCcw, Lightbulb, RefreshCw, GitBranch, X, Crown, Check } from 'lucide-react'

interface GameHUDProps {
  turn: 'w' | 'b'
  isThinking: boolean
  isGameOver: boolean
  isCheckmate: boolean
  isDraw: boolean
  isExploringParallel: boolean
  parallelMoveCount: number
  canTakeback: boolean
  onTakeback: () => void
  onHint: () => void
  onNewGame: () => void
  onStartParallel: () => void
  onExitParallel: () => void
}

/** Brass control plaque docked beneath the board. */
export default function GameHUD({
  turn, isThinking, isGameOver, isCheckmate, isDraw, isExploringParallel,
  parallelMoveCount, canTakeback,
  onTakeback, onHint, onNewGame, onStartParallel, onExitParallel,
}: GameHUDProps) {
  const isHintDisabled = isThinking || turn !== 'w' || isGameOver || isExploringParallel
  const isTakebackDisabled = !canTakeback || isThinking || isExploringParallel || isGameOver
  const isParallelDisabled = isThinking || isGameOver

  const resultLine = isGameOver
    ? isCheckmate
      ? turn === 'w'
        ? 'Checkmate — the engine prevailed. Study the pattern, then reset.'
        : 'Checkmate — an excellent victory.'
      : isDraw
        ? 'The game ended in a draw.'
        : 'Game over.'
    : isExploringParallel
      ? `Parallel line — ${parallelMoveCount} move${parallelMoveCount === 1 ? '' : 's'} explored, main game untouched.`
      : null

  return (
    <div
      role="toolbar"
      className="brass-border rounded-2xl px-3 py-2 flex items-center gap-2 flex-wrap justify-center shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
    >
      {/* Status line */}
      {(resultLine || isGameOver) && (
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
            isGameOver
              ? 'bg-brass/10 border border-brass/30 text-brass-bright'
              : 'bg-steel/10 border border-steel/30 text-steel'
          }`}
          role="status"
        >
          <Crown className="w-3.5 h-3.5" />
          <span className="font-medium">{resultLine}</span>
        </div>
      )}

      <button
        onClick={onTakeback}
        disabled={isTakebackDisabled}
        className="group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-brass"
      >
        <RotateCcw className="w-4 h-4 text-brass-dim group-hover:text-brass transition-colors" />
        Takeback
      </button>

      <div className="w-px h-5 bg-border/70" aria-hidden="true" />

      <button
        onClick={onHint}
        disabled={isHintDisabled}
        className="group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-brass"
      >
        <Lightbulb className="w-4 h-4 text-brass group-hover:text-brass-bright transition-colors" />
        Hint
      </button>

      <div className="w-px h-5 bg-border/70" aria-hidden="true" />

      {!isExploringParallel ? (
        <button
          onClick={onStartParallel}
          disabled={isParallelDisabled}
          className="group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-brass"
          title="Explore an alternate line without affecting the main game"
        >
          <GitBranch className="w-4 h-4 text-steel group-hover:text-[#8db4cc] transition-colors" />
          Explore
        </button>
      ) : (
        <button
          onClick={onExitParallel}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-brass"
          style={{ background: 'rgba(110,149,173,0.14)', color: '#c4d8e6', border: '1px solid rgba(110,149,173,0.35)' }}
        >
          <X className="w-4 h-4" />
          Exit line
        </button>
      )}

      <div className="w-px h-5 bg-border/70" aria-hidden="true" />

      <button
        onClick={onNewGame}
        className="group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-brass"
      >
        <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        New Game
      </button>

      {/* Parallel progress ticks */}
      {isExploringParallel && parallelMoveCount > 0 && (
        <div className="flex items-center gap-1 ml-1" aria-hidden="true">
          {Array.from({ length: Math.min(parallelMoveCount, 8) }).map((_, i) => (
            <Check key={i} className="w-3 h-3 text-steel" />
          ))}
        </div>
      )}
    </div>
  )
}