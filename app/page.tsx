'use client'

import { useChessGame } from '@/hooks/use-chess-game'
import GameHUD from '@/components/chess/GameHUD'
import CoachPanel from '@/components/chess/CoachPanel'
import CapturedPieces from '@/components/chess/CapturedPieces'
import Board3D from '@/components/chess/Board3D'
import CheckmateDialog from '@/components/chess/CheckmateDialog'

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

  // Determine winner: if it's white's turn and checkmate, AI (black) won; otherwise player (white) won
  const checkmateWinner = state.turn === 'w' ? 'ai' : 'player'

  return (
    <main className="flex h-screen overflow-hidden bg-[#0a0908]">
      {/* Left Panel - Controls */}
      <aside className="w-64 flex flex-col border-r border-[#1a1612] bg-[#0d0b09]">
        {/* Header */}
        <header className="px-4 py-4 border-b border-[#1a1612]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center shadow-lg">
              <span className="text-xl text-amber-200">♛</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-[#e8e2d4]">Chess Master</h1>
              <p className="text-xs text-[#6a6258]">Stockfish AI</p>
            </div>
          </div>
        </header>

        {/* Game Controls */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

          {/* Board Legend */}
          <div className="rounded-lg p-3 bg-[#111010] border border-[#1a1612]">
            <p className="text-[10px] uppercase tracking-wider text-[#5a554d] mb-2 font-medium">Legend</p>
            <div className="space-y-1.5 text-xs">
              {[
                { color: '#7fc97f', label: 'Selected' },
                { color: '#f0f069', label: 'Last move' },
                { color: '#e6a817', label: 'Hint' },
                { color: '#e84040', label: 'Check' },
                { color: '#4a90c4', label: 'Exploring' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                  <span className="text-[#6a6258]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Center - Chess Board */}
      <div className="flex-1 relative isolate" style={{ overflow: 'visible' }}>
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

      {/* Right Panel - Coach */}
      <aside className="w-80 border-l border-[#1a1612] bg-[#0d0b09]">
        <CoachPanel
          messages={state.coachMessages}
          isThinking={state.isThinking}
          isExploringParallel={state.isExploringParallel}
          moveHistory={state.history.map(m => m.san)}
        />
      </aside>

      {/* Checkmate Dialog */}
      <CheckmateDialog
        open={showCheckmateDialog}
        onOpenChange={closeCheckmateDialog}
        winner={checkmateWinner}
        moveHistory={state.history.map(m => m.san)}
        onNewGame={newGame}
      />
    </main>
  )
}
