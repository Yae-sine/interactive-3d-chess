'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import type { CoachMessage } from '@/lib/chess-engine'
import { Crest } from './crest'

interface CoachPanelProps {
  messages: CoachMessage[]
  isThinking: boolean
  isExploringParallel: boolean
}

const TONE: Record<CoachMessage['type'], { border: string; label: string; chip: CSSProperties; betterChip: CSSProperties }> = {
  blunder: {
    border: '#c2552e',
    label: 'Blunder',
    chip: { background: 'rgba(194,85,46,0.14)', color: '#e07a52', border: '1px solid rgba(194,85,46,0.4)' },
    betterChip: { background: 'rgba(135,160,138,0.14)', color: '#a9c2ab', border: '1px solid rgba(135,160,138,0.4)' },
  },
  hint: {
    border: '#d9ab62',
    label: 'Hint',
    chip: { background: 'rgba(217,171,98,0.12)', color: '#d9ab62', border: '1px solid rgba(217,171,98,0.35)' },
    betterChip: { background: 'rgba(217,171,98,0.12)', color: '#d9ab62', border: '1px solid rgba(217,171,98,0.35)' },
  },
  good: {
    border: '#87a08a',
    label: 'Well played',
    chip: { background: 'rgba(135,160,138,0.12)', color: '#a9c2ab', border: '1px solid rgba(135,160,138,0.35)' },
    betterChip: { background: 'rgba(135,160,138,0.12)', color: '#a9c2ab', border: '1px solid rgba(135,160,138,0.35)' },
  },
  info: {
    border: '#b8ab93',
    label: 'Note',
    chip: { background: 'rgba(184,171,147,0.1)', color: '#c9bea8', border: '1px solid rgba(184,171,147,0.3)' },
    betterChip: { background: 'rgba(184,171,147,0.1)', color: '#c9bea8', border: '1px solid rgba(184,171,147,0.3)' },
  },
  analysis: {
    border: '#6e95ad',
    label: 'Analysis',
    chip: { background: 'rgba(110,149,173,0.12)', color: '#9fb8c8', border: '1px solid rgba(110,149,173,0.35)' },
    betterChip: { background: 'rgba(110,149,173,0.12)', color: '#9fb8c8', border: '1px solid rgba(110,149,173,0.35)' },
  },
}

/** rAF-driven typewriter — smooth, pauses on punctuation, honors reduced motion */
function useTypewriter(text: string, active: boolean) {
  const [shown, setShown] = useState(active ? '' : text)
  const reducedRef = useRef(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
  }, [])

  useEffect(() => {
    if (!active || reducedRef.current) {
      setShown(text)
      return
    }
    setShown('')
    let i = 0
    let raf = 0
    let last = 0
    const step = (t: number) => {
      if (t - last < 26) { raf = requestAnimationFrame(step); return }
      last = t
      i = Math.min(i + 2, text.length)
      setShown(text.slice(0, i))
      if (i < text.length) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [text, active])

  return shown
}

function VoiceCard({ message, isLatest }: { message: CoachMessage; isLatest: boolean }) {
  const [expanded, setExpanded] = useState(isLatest)
  const reduceMotion = useReducedMotion()
  const tone = TONE[message.type]
  const streamed = useTypewriter(message.content, isLatest && expanded)

  return (
    <div
      className={`rounded-xl transition-all ${isLatest ? 'opacity-100' : 'opacity-75 hover:opacity-95'} ${
        expanded ? 'bg-white/[0.035]' : 'bg-white/[0.015]'
      }`}
      style={{
        border: '1px solid rgba(42,33,24,0.9)',
        borderLeft: `2px solid ${tone.border}44`,
      }}
    >
      <button
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left"
      >
        <span className="label-caps !text-[9px]" style={{ color: tone.border }}>{tone.label}</span>
        <span className="flex-1 text-[13px] font-serif italic text-foreground/95 truncate">{message.title}</span>
        <ChevronDown
          className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        transition={reduceMotion ? { duration: 0 } : { height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.2 } }}
        style={{ overflow: 'hidden' }}
      >
        <div className="px-3.5 pb-3 text-[12.5px] leading-relaxed text-foreground/75 space-y-2">
          <p>
            {streamed}
            {isLatest && expanded && streamed.length < message.content.length && (
              <span className="voice-caret text-brass ml-0.5" aria-hidden="true">▍</span>
            )}
          </p>
          {message.move && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="text-[11px] font-mono px-2 py-0.5 rounded-md"
                style={tone.chip}
              >
                {message.move}
              </span>
              {message.betterMove && (
                <>
                  <span className="text-muted-foreground text-[11px]">→</span>
                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded-md"
                    style={tone.betterChip}
                  >
                    {message.betterMove}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function ThinkingPause() {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl brass-border msg-in" role="status">
      <Crest size={22} />
      <span className="text-xs italic font-serif text-foreground/80">Magnus is deliberating…</span>
      <div className="flex gap-1 ml-auto" aria-hidden="true">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-brass thinking-dot"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function CoachPanel({ messages, isThinking, isExploringParallel }: CoachPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [messages.length])

  const isPaused = isThinking || isExploringParallel
  const statusText = isExploringParallel
    ? 'Watching an alternate line'
    : isThinking
      ? 'Analyzing your position'
      : 'Watching your game'

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Magnus header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/70 shrink-0">
        <div className="relative shrink-0">
          <Crest size={36} />
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${
              isThinking ? 'bg-brass thinking-dot' : 'bg-sage/80'
            } ring-2 ring-[#0e0b09]`}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 leading-tight">
          <h2 className="text-[15px] font-serif italic text-foreground">Magnus</h2>
          <p className="label-caps !text-[9px] mt-0.5">{statusText}</p>
        </div>
        {isExploringParallel && (
          <span
            className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ background: 'rgba(110,149,173,0.15)', color: '#9fb8c8', border: '1px solid rgba(110,149,173,0.35)' }}
          >
            Explorer
          </span>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 atelier-scroll min-h-0">
        {isPaused && <ThinkingPause />}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
            <Crest size={40} className="opacity-40" />
            <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
              Make your first move — Magnus will offer an observation on every key moment.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <VoiceCard key={msg.id} message={msg} isLatest={i === 0} />
          ))
        )}
      </div>
    </div>
  )
}