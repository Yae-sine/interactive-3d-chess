# AGENTS.md

Interactive 3D chess game ("Chess Master 3D"): Next.js 16 App Router, React 19, TypeScript (strict), Tailwind CSS 4, chess.js v1. Single-page game, everything client-side.

## Commands

- `npm run dev` — dev server on :3000
- `npm run lint` — eslint
- `npm run build` — production build
- No test suite exists (no test framework installed).

## Gotchas

- `next.config.mjs` sets `typescript.ignoreBuildErrors: true`, so `npm run build` passes even with TypeScript errors. For real typechecking run `npx tsc --noEmit` (incremental: `tsconfig.tsbuildinfo` lives at repo root).
- Tailwind 4 has no `tailwind.config` file — theme tokens (incl. `--sq-*` board colors) are CSS vars in `app/globals.css`.
- `.claude/` and `.github/` are gitignored (local-only). Their `rules/*.md` files encode the project's quality rules (UI polish, performance/hydration, coach API reliability, design system consistency) — worth following, but only root `AGENTS.md` is committed.
- `.env.local` holds `GROQ_API_KEY`; never commit it.

## Architecture

- `app/page.tsx` (`'use client'`) wires `useChessGame` into `Board3D`, `GameHUD`, `CoachPanel`, `CapturedPieces`, `CheckmateDialog`.
- `hooks/use-chess-game.ts` is the single source of truth for `GameState` (types in `lib/chess-engine.ts`). Player is always White; Stockfish plays Black.
- Stockfish runs as a Web Worker loaded from `public/stockfish.js` (`new Worker('/stockfish.js')` in `hooks/use-stockfish.ts`) — keep the engine file in `public/` (browsers block cross-origin workers). Difficulty = UCI search depth (`DIFFICULTY_DEPTH` in `lib/chess-engine.ts`).
- The "3D" board is CSS perspective transforms + inline SVG pieces in `Board3D.tsx` — fixed tilt, no drag-rotate, no WebGL.
- Blunder detection is local and synchronous (`getBlunderSeverity`, 1-ply eval in `lib/chess-engine.ts`), not API-driven.
- Parallel Explorer plays moves on a `parallelFen`/`parallelMoves` clone; it never mutates the main game.
- `app/api/chat/route.ts` (Groq llama-3.3-70b, needs `GROQ_API_KEY`) and `app/api/coach/route.ts` (`openai/gpt-4o-mini` model string, needs `OPENAI_API_KEY`) are currently **unused** by client code — no component calls them.

## Conventions (from git history and local rules)

- Hydration safety: no `Math.random`, `Date.now`, or window reads in SSR render paths; initial render must be deterministic.
- Decorative/`aria-hidden` layers must get `pointer-events: none` — past bugs were decorative wrappers swallowing square clicks in `Board3D.tsx`.
- Performance: keep the 64-square board tree memoized, pass stable props, avoid object/function allocation in hot paths; reliably clean up workers/timers.
- Defensive checks at worker/API boundaries: validate incoming data, explicit loading/error UI states, no silent failures.
- UI: board-first hierarchy, walnut/amber palette from `globals.css` tokens, extend `components/ui` primitives instead of one-off components.
