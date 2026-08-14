import type { CSSProperties } from 'react'

export type PieceType = 'k' | 'q' | 'r' | 'b' | 'n' | 'p'

/**
 * Hand-crafted 2.5D "carved wood" piece set for the Atelier.
 * One hidden <PieceDefs/> (mounted once per page) provides all gradients;
 * every PieceGlyph is a plain SVG with deterministic IDs — hydration-safe,
 * zero network requests, cheap to render 64x.
 */

export function PieceDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="g-wood-light-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf3df" />
          <stop offset="0.55" stopColor="#eedeC4" />
          <stop offset="1" stopColor="#d4b484" />
        </linearGradient>
        <linearGradient id="g-wood-light-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff9ea" />
          <stop offset="1" stopColor="#a9834f" />
        </linearGradient>
        <linearGradient id="g-wood-dark-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#53351f" />
          <stop offset="0.55" stopColor="#3a2213" />
          <stop offset="1" stopColor="#170d07" />
        </linearGradient>
        <linearGradient id="g-wood-dark-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#94693f" />
          <stop offset="1" stopColor="#2b1810" />
        </linearGradient>
        <linearGradient id="g-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0d9a6" />
          <stop offset="0.5" stopColor="#c9a45c" />
          <stop offset="1" stopColor="#8a6f3f" />
        </linearGradient>
        <linearGradient id="g-walnut" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b3d1c" />
          <stop offset="1" stopColor="#3a1e0c" />
        </linearGradient>
        <linearGradient id="g-felt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d3126" />
          <stop offset="1" stopColor="#101d16" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ── Silhouettes (Staunton geometry) ─────────────────────────────── */

const SILHOUETTES: Record<PieceType, string> = {
  k: 'M22.5 11.63V6M20 8h5M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-3.5-6 1 3.5 4.5 3.5 4.5v4.5c-2 4 .5 7 1.5 7.5M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0',
  q: 'M6 12.4C7.4 12 10 13.8 9 26M39 12.4C37.6 12 35 13.8 36 26M6 12c-1.5 8 3.5 14 5 16M39 12c1.5 8-3.5 14-5 16M9 26c8.5-8.5 15.5-4 18-2l-1.5 4h-13L9 26zM9 26c0 2 1.5 2 2.5 4h21c1-2 2.5-2 2.5-4M11.5 30c0 1 1 1 1 1h20s1 0 1-1M11.5 30c5.5 3.5 15.5 3.5 21 0M11.5 33.5c5.5 3.5 15.5 3.5 21 0M11.5 37c5.5-3 15.5-3 21 0v-7c-5.5 3-15.5 3-21 0z',
  r: 'M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5M34 14l-3 3H14l-3-3M31 17v12.5H14V17M31 29.5l1.5 2.5h-19l1.5-2.5M11 14h23',
  b: 'M9 36c3.4-1 10.1.4 13.5-2 3.4 2.4 10.1 1 13.5 2 0 0 1.6.5 3 2-.7 1-1.7 1-3 .5-3.4-1-10.1.5-13.5-1-3.4 1.5-10.1 0-13.5 1-1.4.5-2.3.5-3-.5 1.4-1.9 3-2 3-2zM15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2zM17.5 26h10M15 30h15M22.5 15.5v5M20 18h5',
  n: 'M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21M24 18c.38 5.12-5.4 6.6-8 9.5-3 3-2.82 6.5-.5 7.5 9.5 3 12.5-4 12.5-4',
  p: 'M22.5 9.5a4.5 4.5 0 1 0 .01 0zM14.5 22.5a7.5 5.5 0 1 0 16 0M11.5 37c5.5 3.5 15.5 3.5 21 0v-7c-5.5 3-15.5 3-21 0zM11.5 30c5.5-3 15.5-3 21 0',
}

/* Extra small decorative marks per type — carve highlights & details */
const DETAILS: Record<PieceType, React.ReactNode> = {
  k: (
    <>
      <path d="M22.5 11.63V6M20 8h5" fill="none" />
    </>
  ),
  q: (
    <>
      <circle cx="6" cy="12" r="1.1" />
      <circle cx="14" cy="9" r="1.1" />
      <circle cx="22.5" cy="8" r="1.1" />
      <circle cx="31" cy="9" r="1.1" />
      <circle cx="39" cy="12" r="1.1" />
    </>
  ),
  r: (
    <>
      <path d="M11 14V9h4v2h5V9h5v2h5V9h4v5" fill="none" />
    </>
  ),
  b: <circle cx="22.5" cy="8" r="1.6" />,
  n: (
    <>
      <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="#120b07" stroke="none" />
      <path d="M14.933 15.75a5 5.52 0 1 1-10 1.04 5 5.52 0 0 1 10-1.04z" fill="none" />
    </>
  ),
  p: null,
}

/** Specular "polish" streaks — light bounces on carved wood */
const SPECULAR: Record<PieceType, { x: number; y: number; r: number } | null> = {
  k: { x: 22.5, y: 9, r: 4.5 },
  q: { x: 22.5, y: 10, r: 7 },
  r: { x: 22.5, y: 10.5, r: 5.5 },
  b: { x: 22.5, y: 8.5, r: 5.5 },
  n: { x: 19, y: 12, r: 7 },
  p: { x: 22.5, y: 9.5, r: 4.2 },
}

interface PieceGlyphProps {
  type: PieceType
  color: 'w' | 'b'
  className?: string
  style?: CSSProperties
}

export function PieceGlyph({ type, color, className, style }: PieceGlyphProps) {
  const body = color === 'w' ? 'url(#g-wood-light-body)' : 'url(#g-wood-dark-body)'
  const rim = color === 'w' ? 'url(#g-wood-light-rim)' : 'url(#g-wood-dark-rim)'
  const spec = SPECULAR[type]

  return (
    <svg
      viewBox="0 0 45 45"
      width="100%"
      height="100%"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <g
        stroke={rim}
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={SILHOUETTES[type]} fill={body} />
        <g fill="none" strokeWidth="0.65">
          {DETAILS[type]}
        </g>
      </g>
      {spec && (
        <ellipse
          cx={spec.x}
          cy={spec.y}
          rx={spec.r}
          ry={spec.r * 0.55}
          fill={color === 'w' ? 'rgba(255,250,236,0.55)' : 'rgba(255,214,140,0.28)'}
          transform="rotate(-12 22.5 22.5)"
        />
      )}
    </svg>
  )
}
