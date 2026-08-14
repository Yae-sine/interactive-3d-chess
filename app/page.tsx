'use client'

import { useMemo } from 'react'
import { useChessGame } from '@/hooks/use-chess-game'
import GameHeader from '@/components/chess/GameHeader'
import GameHUD from '@/components/chess/GameHUD'
import CoachPanel from '@/components/chess/CoachPanel'
import CapturedPieces from '@/components/chess/CapturedPieces'
import MoveScoresheet from '@/components/chess/MoveScoresheet'
import Board3D from '@/components/chess/Board3D'
import CheckmateDialog from '@/components/chess/CheckmateDialog'

/** SSR-safe entrance: CSS animation (no JS-flash), staggered by inline delay */
function riseIn(style?: React.CSSProperties) {
  return {
    className: 'rise-in',
    style,
  }
}

export default function ChessPage() {
  const {
    state,
    showCheckmateDialog,
    closeCheckmateDialog,
    handleSquareClick,
    handlePromotion,
    takeback,
    requestHint,
    startParallelExploration,
    exitParallelExploration,
    setDifficulty,
    newGame,
  } = useChessGame()

  const sanHistory = useMemo(() => state.history.map(m => m.san), [state.history])

  // Deterministic winner derivation: if it's white's turn at checkmate, engine (black) won
  const checkmateWinner = state.turn === 'w' ? 'ai' : 'player'

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-background">
      <div {...riseIn({ animationDelay: '0.02s' })}>
        <GameHeader
          difficulty={state.difficulty}
          turn={state.turn}
          isThinking={state.isThinking}
          isGameOver={state.isGameOver}
          isCheck={state.isCheck}
          isCheckmate={state.isCheckmate}
          isDraw={state.isDraw}
          isExploringParallel={state.isExploringParallel}
          moveCount={state.moveCount}
          onDifficultyChange={setDifficulty}
        />
      </div>

      {/* Single DOM: stacked on mobile (page scrolls), side-by-side on desktop */}
      <main className="flex-1 min-h-0 flex flex-col overflow-y-auto atelier-scroll lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
        {/* Board stage */}
        <div
          {...riseIn({ animationDelay: '0.1s' })}
          className="relative flex flex-col shrink-0 min-h-0 h-[calc(100svh-56px)] lg:h-auto lg:flex-1"
        >
          <div className="relative flex-1 min-h-0 flex items-center justify-center">
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

          {/* Control dock */}
          <div className="relative z-10 shrink-0 flex justify-center px-3 pb-3">
            <GameHUD
              turn={state.turn}
              isThinking={state.isThinking}
              isGameOver={state.isGameOver}
              isCheckmate={state.isCheckmate}
              isDraw={state.isDraw}
              isExploringParallel={state.isExploringParallel}
              parallelMoveCount={state.parallelMoves.length}
              canTakeback={state.history.length >= 2}
              onTakeback={takeback}
              onHint={requestHint}
              onNewGame={newGame}
              onStartParallel={() => startParallelExploration(state.fen)}
              onExitParallel={exitParallelExploration}
            />
          </div>
        </div>

        {/* Magnus column — flex-order swaps layout per breakpoint, single DOM */}
        <aside
          {...riseIn({ animationDelay: '0.16s' })}
          className="flex flex-col min-h-0 shrink-0 atelier-skip lg:border-l lg:border-border/70 lg:bg-card/45"
        >
          <div className="order-1 lg:order-2 shrink-0 border-b border-border/70 lg:border-0">
            <CapturedPieces
              fen={state.fen}
              capturedWhite={state.capturedWhite}
              capturedBlack={state.capturedBlack}
            />
          </div>
          <div className="order-2 lg:order-1 h-[380px] shrink-0 border-b border-border/70 lg:h-auto lg:flex-1 lg:min-h-0 lg:border-0">
            <CoachPanel
              messages={state.coachMessages}
              isThinking={state.isThinking}
              isExploringParallel={state.isExploringParallel}
            />
          </div>
          <MoveScoresheet moves={sanHistory} />
        </aside>
      </main>

      <CheckmateDialog
        open={showCheckmateDialog}
        onOpenChange={closeCheckmateDialog}
        winner={checkmateWinner}
        moveHistory={sanHistory}
        onNewGame={newGame}
      />
    </div>
  )
}