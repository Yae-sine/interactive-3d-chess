'use client'

import { useEffect, useRef, useState } from 'react'
import { Brain, AlertTriangle, Lightbulb, CheckCircle, Info, ChevronDown, Sparkles, BookOpen } from 'lucide-react'
import type { CoachMessage } from '@/lib/chess-engine'

interface CoachPanelProps {
  messages: CoachMessage[]
  isThinking: boolean
  isExploringParallel: boolean
  moveHistory: string[]
}

const MESSAGE_ICONS = {
  blunder: AlertTriangle,
  hint: Lightbulb,
  good: CheckCircle,
  info: Info,
  analysis: Brain,
}

const MESSAGE_COLORS = {
  blunder: 'border-red-500/40 bg-red-950/20',
  hint: 'border-amber-500/40 bg-amber-950/20',
  good: 'border-green-500/40 bg-green-950/20',
  info: 'border-blue-500/40 bg-blue-950/20',
  analysis: 'border-purple-500/40 bg-purple-950/20',
}

const MESSAGE_ICON_COLORS = {
  blunder: 'text-red-400',
  hint: 'text-amber-400',
  good: 'text-green-400',
  info: 'text-blue-400',
  analysis: 'text-purple-400',
}

function StreamingMessage({ content }: { content: string }) {
  const [displayed, setDisplayed] = useState('')
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    indexRef.current = 0
    const interval = setInterval(() => {
      if (indexRef.current < content.length) {
        setDisplayed(content.slice(0, indexRef.current + 1))
        indexRef.current++
      } else {
        clearInterval(interval)
      }
    }, 12)
    return () => clearInterval(interval)
  }, [content])

  return <span>{displayed}<span className="animate-pulse">|</span></span>
}

function CoachCard({ message, isLatest }: { message: CoachMessage; isLatest: boolean }) {
  const Icon = MESSAGE_ICONS[message.type]
  const colorClass = MESSAGE_COLORS[message.type]
  const iconColor = MESSAGE_ICON_COLORS[message.type]
  const [expanded, setExpanded] = useState(isLatest)

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all duration-300 ${colorClass} ${
        isLatest ? 'opacity-100' : 'opacity-70'
      }`}
    >
      <button
        className="w-full flex items-center gap-2 p-3 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
        <span className="flex-1 text-sm font-medium text-foreground">{message.title}</span>
        <ChevronDown
          className={`w-3 h-3 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {expanded && (
        <div className="px-3 pb-3 text-xs text-muted-foreground leading-relaxed space-y-2">
          <p>{isLatest ? <StreamingMessage content={message.content} /> : message.content}</p>
          {message.move && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-700/30">
                {message.move}
              </span>
              {message.betterMove && (
                <>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-green-900/40 text-green-300 border border-green-700/30">
                    {message.betterMove}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ThinkingIndicator() {
  return (
    <div className="border border-border/40 rounded-lg p-3 bg-secondary/30">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary animate-pulse" />
        <span className="text-sm text-muted-foreground">AI is thinking...</span>
        <div className="flex gap-1 ml-auto">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CoachPanel({
  messages,
  isThinking,
  isExploringParallel,
  moveHistory,
}: CoachPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [messages.length])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1a1612]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 shadow-lg">
          <Sparkles className="w-4 h-4 text-purple-200" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#e8e2d4]">Magnus</h2>
          <p className="text-xs text-[#6a6258]">AI Coach</p>
        </div>
        {isExploringParallel && (
          <div className="ml-auto px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30">
            <span className="text-xs text-blue-400 font-medium">Explorer</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 coach-scroll"
      >
        {isThinking && <ThinkingIndicator />}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
            <BookOpen className="w-8 h-8 text-[#3a3630]" />
            <p className="text-xs text-[#5a554d]">
              Make your first move and I&apos;ll start coaching you!
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <CoachCard key={msg.id} message={msg} isLatest={i === 0} />
          ))
        )}
      </div>

      {/* Move history */}
      {moveHistory.length > 0 && (
        <div className="border-t border-[#1a1612] p-3 bg-[#0a0908]">
          <p className="text-[10px] uppercase tracking-wider text-[#5a554d] mb-2 font-medium">Move History</p>
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto coach-scroll">
            {moveHistory.map((move, i) => (
              <span
                key={i}
                className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                  i % 2 === 0
                    ? 'bg-[#1a1612] text-[#c9c2b4]'
                    : 'bg-[#111010] text-[#8a8478]'
                }`}
              >
                {i % 2 === 0 && <span className="text-[#5a554d] mr-1">{Math.floor(i / 2) + 1}.</span>}
                {move}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
