'use client'

import { useEffect, useState } from 'react'
import { RotateCcw, Lightbulb, GitBranch, X, RefreshCw, Crown, Shield, Zap, Brain } from 'lucide-react'
import { Difficulty, DIFFICULTY_LABELS } from '@/lib/chess-engine'

interface GameHUDProps {
  difficulty: Difficulty
  turn: 'w' | 'b'
  isThinking: boolean
  isGameOver: boolean
  isCheck: boolean
  isCheckmate: boolean
  isDraw: boolean
  isExploringParallel: boolean
  parallelMoveCount: number
  moveCount: number
  canTakeback: boolean
  onTakeback: () => void
  onHint: () => void
  onNewGame: () => void
  onDifficultyChange: (d: Difficulty) => void
  onStartParallel: () => void
  onExitParallel: () => void
}

const DIFFICULTY_ICONS = {
  beginner: Shield,
  intermediate: Zap,
  advanced: Brain,
  master: Crown,
}

const DIFFICULTY_COLORS = {
  beginner: 'text-green-400 border-green-500/40 bg-green-950/20',
  intermediate: 'text-blue-400 border-blue-500/40 bg-blue-950/20',
  advanced: 'text-amber-400 border-amber-500/40 bg-amber-950/20',
  master: 'text-red-400 border-red-500/40 bg-red-950/20',
}

export default function GameHUD({
  difficulty,
  turn,
  isThinking,
  isGameOver,
  isCheck,
  isCheckmate,
  isDraw,
  isExploringParallel,
  parallelMoveCount,
  moveCount,
  canTakeback,
  onTakeback,
  onHint,
  onNewGame,
  onDifficultyChange,
  onStartParallel,
  onExitParallel,
}: GameHUDProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const DiffIcon = DIFFICULTY_ICONS[difficulty]
  const diffColor = DIFFICULTY_COLORS[difficulty]
  const isTakebackDisabled = !isHydrated || !canTakeback || isThinking || isExploringParallel
  const isHintDisabled = !isHydrated || isThinking || turn !== 'w' || isGameOver || isExploringParallel
  const isParallelDisabled = !isHydrated || isThinking

  return (
    <div className="flex flex-col gap-3">
      {/* Status bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-card border border-border/40">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-3 h-3 rounded-full shrink-0 ${turn === 'w' ? 'bg-white ring-2 ring-white/30' : 'bg-slate-800 ring-2 ring-slate-600/50'}`} />
          <span className="text-sm font-medium text-foreground truncate">
            {isGameOver
              ? isCheckmate
                ? turn === 'w' ? 'You Lost' : 'You Won!'
                : isDraw ? 'Draw'
                : 'Game Over'
              : isThinking
                ? 'AI thinking...'
                : isExploringParallel
                  ? 'Exploring alternate line'
                  : turn === 'w'
                    ? 'Your turn'
                    : 'AI turn'
            }
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isCheck && !isCheckmate && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-red-900/40 text-red-300 border border-red-700/30 animate-pulse">
              CHECK
            </span>
          )}
          <span className="text-xs text-muted-foreground font-mono">
            Move {Math.ceil(moveCount / 2)}
          </span>
        </div>
      </div>

      {/* Parallel explorer banner */}
      {isExploringParallel && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-950/30 border border-blue-500/30">
          <GitBranch className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-blue-300">Parallel Explorer</p>
            <p className="text-xs text-blue-400/70">{parallelMoveCount} moves explored</p>
          </div>
          <button
            onClick={onExitParallel}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-900/40 hover:bg-blue-900/60 border border-blue-700/30 text-blue-300 text-xs transition-colors"
          >
            <X className="w-3 h-3" />
            Exit
          </button>
        </div>
      )}

      {/* Game over banner */}
      {isGameOver && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/30">
          <Crown className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs font-medium text-primary flex-1">
            {isCheckmate
              ? turn === 'w' ? 'Checkmate - AI wins! Great game, keep practicing.' : 'Checkmate - You win! Excellent play!'
              : 'Game ended in a draw.'}
          </p>
          <button
            onClick={onNewGame}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            New
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onTakeback}
          disabled={isTakebackDisabled}
          className="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border border-border/40 bg-card hover:bg-secondary/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all group"
        >
          <RotateCcw className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Takeback</span>
        </button>

        <button
          onClick={onHint}
          disabled={isHintDisabled}
          className="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border border-amber-500/30 bg-amber-950/10 hover:bg-amber-950/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all group"
        >
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-amber-400">Hint</span>
        </button>

        <button
          onClick={onNewGame}
          className="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border border-border/40 bg-card hover:bg-secondary/60 transition-all group"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">New Game</span>
        </button>
      </div>

      {/* Parallel explorer button */}
      {!isExploringParallel && !isGameOver && moveCount >= 2 && (
        <button
          onClick={onStartParallel}
          disabled={isParallelDisabled}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-500/30 bg-blue-950/10 hover:bg-blue-950/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <GitBranch className="w-4 h-4 text-blue-400" />
          <div className="flex-1 text-left">
            <p className="text-xs font-medium text-blue-300">Explore Alternate Line</p>
            <p className="text-xs text-blue-400/60">Try a different path in parallel</p>
          </div>
        </button>
      )}

      {/* Difficulty selector */}
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
        <p className="text-xs text-muted-foreground px-3 py-2 border-b border-border/40">AI Difficulty</p>
        <div className="grid grid-cols-2 gap-1 p-2">
          {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => {
            const Icon = DIFFICULTY_ICONS[d]
            const isActive = difficulty === d
            return (
              <button
                key={d}
                onClick={() => onDifficultyChange(d)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-all ${
                  isActive
                    ? DIFFICULTY_COLORS[d]
                    : 'border-transparent text-muted-foreground hover:bg-secondary/40'
                }`}
              >
                <Icon className="w-3 h-3" />
                {DIFFICULTY_LABELS[d]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
