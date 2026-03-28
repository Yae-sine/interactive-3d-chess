'use client'

import dynamic from 'next/dynamic'
import { useChessGame } from '@/hooks/use-chess-game'
import GameHUD from '@/components/chess/GameHUD'
import CoachPanel from '@/components/chess/CoachPanel'
import CapturedPieces from '@/components/chess/CapturedPieces'
import { Loader2 } from 'lucide-react'

// Dynamically import the 3D scene to avoid SSR issues
const ChessScene = dynamic(() => import('@/components/chess/ChessScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading 3D Board...</p>
      </div>
    </div>
  ),
})

export default function ChessPage() {
  const {
    state,
    handleSquareClick,
    takeback,
    requestHint,
    startParallelExploration,
    exitParallelExploration,
    setDifficulty,
    newGame,
  } = useChessGame()

  const moveHistory = state.history.map(m => m.san)

  return (
    <main className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Left sidebar - Game controls */}
      <aside className="w-64 shrink-0 flex flex-col gap-3 p-4 border-r border-border/40 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 pb-2 border-b border-border/40">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-primary text-lg">♛</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">Chess Master 3D</h1>
            <p className="text-xs text-muted-foreground">Learn as you play</p>
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

        {/* Board coordinate legend */}
        <div className="rounded-xl border border-border/40 bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground font-medium mb-2">Board Legend</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-green-500/60" />
              <span className="text-muted-foreground">Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-green-600/40" />
              <span className="text-muted-foreground">Valid move</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-yellow-500/50" />
              <span className="text-muted-foreground">Last move</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-amber-500/60" />
              <span className="text-muted-foreground">Hint</span>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-xl border border-border/40 bg-card px-3 py-2">
          <p className="text-xs text-muted-foreground font-medium mb-1.5">Quick Tips</p>
          <ul className="space-y-1">
            {[
              'Drag to rotate the board',
              'Scroll to zoom in/out',
              'Click a piece to select it',
              'Click a green dot to move',
            ].map((tip, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Main 3D board */}
      <div className="flex-1 relative">
        <ChessScene
          fen={state.fen}
          parallelFen={state.parallelFen}
          selectedSquare={state.selectedSquare}
          validMoves={state.validMoves}
          lastMove={state.lastMove}
          hintMove={state.hintMove}
          isExploringParallel={state.isExploringParallel}
          onSquareClick={handleSquareClick}
        />

        {/* Board file/rank labels overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-0 pointer-events-none">
          {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(f => (
            <div key={f} className="w-[52px] text-center text-xs text-white/30 font-mono">{f}</div>
          ))}
        </div>
      </div>

      {/* Right sidebar - Coach panel */}
      <aside className="w-72 shrink-0 flex flex-col border-l border-border/40 bg-card">
        <CoachPanel
          messages={state.coachMessages}
          isThinking={state.isThinking}
          isExploringParallel={state.isExploringParallel}
          currentFen={state.fen}
          moveHistory={moveHistory}
        />
      </aside>
    </main>
  )
}
