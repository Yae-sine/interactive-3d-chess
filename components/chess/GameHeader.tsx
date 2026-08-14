'use client'

import { Shield, Zap, Brain, Crown } from 'lucide-react'
import { Difficulty, DIFFICULTY_LABELS, DIFFICULTY_ELO } from '@/lib/chess-engine'
import { Crest } from './crest'

interface GameHeaderProps {
  difficulty: Difficulty
  turn: 'w' | 'b'
  isThinking: boolean
  isGameOver: boolean
  isCheck: boolean
  isCheckmate: boolean
  isDraw: boolean
  isExploringParallel: boolean
  moveCount: number
  onDifficultyChange: (d: Difficulty) => void
}

const DIFFICULTY_ICONS = {
  beginner: Shield,
  intermediate: Zap,
  advanced: Brain,
  master: Crown,
} as const

export default function GameHeader({
  difficulty, turn, isThinking, isGameOver, isCheck, isCheckmate, isDraw,
  isExploringParallel, moveCount, onDifficultyChange,
}: GameHeaderProps) {
  const status = isGameOver
    ? isCheckmate
      ? turn === 'w' ? 'You lost' : 'You won'
      : isDraw ? 'Draw' : 'Game over'
    : isThinking
      ? 'Engine is thinking'
      : isExploringParallel
        ? 'Exploring a line'
        : turn === 'w' ? 'Your move' : 'Engine to move'

  return (
    <header className="relative z-20 flex items-center gap-3 px-3 sm:px-5 h-14 shrink-0 border-b border-border/70 bg-[#0e0b09]/92 backdrop-blur-sm">
      {/* Brand */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 drop-shadow-[0_2px_6px_rgba(201,164,92,0.25)]">
          <Crest size={30} />
        </div>
        <div className="min-w-0 leading-tight">
          <h1 className="text-[15px] font-semibold tracking-tight text-foreground truncate">
            Chess Master <span className="font-serif italic text-brass">3D</span>
          </h1>
          <p className="label-caps hidden sm:block mt-0.5">The Atelier · Stockfish AI</p>
        </div>
      </div>

      {/* Status */}
      <div className="ml-auto flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2 px-3 h-8 rounded-full brass-border min-w-0" role="status" aria-live="polite">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              turn === 'w' ? 'bg-ivory' : 'bg-ebony ring-1 ring-brass/60'
            } ${isThinking ? 'thinking-dot' : 'turn-halo'}`}
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-foreground/90 truncate">{status}</span>
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
            Move {Math.ceil(moveCount / 2)}
          </span>
        </div>

        {isCheck && !isCheckmate && (
          <span
            className="px-2 py-1 text-[10px] font-semibold tracking-widest rounded-md shrink-0"
            style={{ background: 'rgba(194,85,46,0.16)', color: '#e07a52', border: '1px solid rgba(194,85,46,0.4)' }}
          >
            CHECK
          </span>
        )}

        {/* Difficulty segmented control */}
        <div
          role="group"
          className="hidden md:flex items-center gap-0.5 p-1 rounded-full brass-border shrink-0"
        >
          {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => {
            const Icon = DIFFICULTY_ICONS[d]
            const isActive = difficulty === d
            return (
              <button
                key={d}
                onClick={() => onDifficultyChange(d)}
                title={`${DIFFICULTY_LABELS[d]} · ~${DIFFICULTY_ELO[d]} ELO`}
                aria-pressed={isActive}
                className={`flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-brass ${
                  isActive
                    ? 'bg-brass/15 text-brass-bright shadow-[inset_0_1px_0_rgba(240,217,166,0.3),0_1px_6px_rgba(0,0,0,0.4)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden lg:inline">{DIFFICULTY_LABELS[d]}</span>
                <span className="font-mono text-[10px] opacity-70 hidden xl:inline">
                  {DIFFICULTY_ELO[d]}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}