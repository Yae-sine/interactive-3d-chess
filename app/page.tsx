'use client'

import { useChessGame } from '@/hooks/use-chess-game'
import GameHUD from '@/components/chess/GameHUD'
import CoachPanel from '@/components/chess/CoachPanel'
import CapturedPieces from '@/components/chess/CapturedPieces'
import Board3D from '@/components/chess/Board3D'

export default function ChessPage() {
  const {
    state,
    handleSquareClick,
    handlePromotion,
    takeback,
    requestHint,
    startParallelExploration,
    exitParallelExploration,
    setDifficulty,
    newGame,
  } = useChessGame()

  return (
    <main className="flex h-screen overflow-hidden font-sans" style={{ background: 'var(--background)' }}>

      {/* ── Left sidebar ──────────────────────────────────────────── */}
      <aside
        className="w-60 shrink-0 flex flex-col gap-3 p-4 overflow-y-auto thin-scroll"
        style={{ borderRight: '1px solid rgba(201,146,42,0.12)', background: 'var(--card)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 pb-3" style={{ borderBottom: '1px solid rgba(201,146,42,0.12)' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #3d1e08, #6b3410)', border: '1px solid rgba(201,146,42,0.3)', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            <span style={{ fontSize: '18px', lineHeight: 1, color: '#c9922a' }}>♛</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>Chess Master 3D</h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Powered by Stockfish</p>
          </div>
        </div>

        <GameHUD
          difficulty={state.difficulty}
          turn={state.turn}
          isThinking={state.isThinking}
          isGameOver={state.isGameOver}
          isCheck={state.isCheck}
          isCheckmate={state.isCheckmate}
          isDraw={state.isDraw}
          isExploringParallel={state.isExploringParallel}
          parallelMoveCount={state.parallelMoves.length}
          moveCount={state.moveCount}
          canTakeback={state.history.length >= 2}
          onTakeback={takeback}
          onHint={requestHint}
          onNewGame={newGame}
          onDifficultyChange={setDifficulty}
          onStartParallel={() => startParallelExploration(state.fen)}
          onExitParallel={exitParallelExploration}
        />

        <CapturedPieces
          capturedWhite={state.capturedWhite}
          capturedBlack={state.capturedBlack}
        />

        {/* Legend */}
        <div className="rounded-lg p-3 text-xs space-y-1.5"
          style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
          <p className="font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>LEGEND</p>
          {[
            { color: '#7fc97f', label: 'Selected piece' },
            { color: '#f0f069', label: 'Last move' },
            { color: '#e6a817', label: 'Hint square' },
            { color: '#e84040', label: 'King in check' },
            { color: '#4a90c4', label: 'Parallel line' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: color }} />
              <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main board ────────────────────────────────────────────── */}
      <div className="flex-1 relative min-w-0">
        <Board3D
          fen={state.fen}
          parallelFen={state.parallelFen}
          selectedSquare={state.selectedSquare}
          validMoves={state.validMoves}
          lastMove={state.lastMove}
          hintMove={state.hintMove}
          isExploringParallel={state.isExploringParallel}
          pendingPromotion={state.pendingPromotion}
          onSquareClick={handleSquareClick}
          onPromotion={handlePromotion}
        />
      </div>

      {/* ── Right sidebar — Coach ─────────────────────────────────── */}
      <aside
        className="w-72 shrink-0 flex flex-col"
        style={{ borderLeft: '1px solid rgba(201,146,42,0.12)', background: 'var(--card)' }}
      >
        <CoachPanel
          messages={state.coachMessages}
          isThinking={state.isThinking}
          isExploringParallel={state.isExploringParallel}
          moveHistory={state.history.map(m => m.san)}
        />
      </aside>
    </main>
  )
}
