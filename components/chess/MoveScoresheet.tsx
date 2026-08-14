'use client'

import { useEffect, useRef } from 'react'

interface MoveScoresheetProps {
  moves: string[]
}

/** Tournament scoresheet: pairs of White/Black SAN moves, newest highlighted. */
export default function MoveScoresheet({ moves }: MoveScoresheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const pairs: Array<{ n: number; white: string; black: string }> = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({ n: i / 2 + 1, white: moves[i], black: moves[i + 1] ?? '' })
  }

  const latestPairIndex = pairs.length - 1

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [moves.length])

  if (moves.length === 0) return null

  return (
    <section className="order-3 px-4 pt-3 border-t border-border/70 bg-white/[0.015] min-h-0">
      <h3 className="label-caps mb-2">Scoresheet</h3>
      <div
        ref={scrollRef}
        className="overflow-y-auto atelier-scroll max-h-36 pr-1"
        role="log"
        aria-label="Move history"
        aria-live="polite"
      >
        <div className="grid grid-cols-[28px_1fr_1fr] gap-x-2">
          {pairs.map((p, i) => (
            <div
              key={p.n}
              className={`grid grid-cols-subgrid col-span-3 items-center py-[3px] px-1.5 rounded-md ${
                i === latestPairIndex ? 'bg-brass/10' : ''
              } ${i === latestPairIndex ? 'move-in' : ''}`}
            >
              <span className="text-[11px] font-mono text-muted-foreground">{p.n}.</span>
              <span
                className={`text-[12px] font-mono ${
                  i === latestPairIndex ? 'text-brass-bright' : 'text-foreground/80'
                }`}
                data-white
              >
                {p.white}
              </span>
              <span
                className={`text-[12px] font-mono ${
                  i === latestPairIndex && p.black ? 'text-foreground/80' : 'text-foreground/55'
                }`}
                data-black
              >
                {p.black || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}