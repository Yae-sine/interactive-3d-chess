'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Chess, Square, Move, Piece } from 'chess.js'
import {
  GameState, INITIAL_STATE, CoachMessage, Difficulty,
  getBlunderSeverity,
} from '@/lib/chess-engine'
import { useStockfish } from './use-stockfish'

let _idCounter = 0
function genId() { return `msg_${++_idCounter}_${Date.now()}` }

function derivedState(chess: Chess, prevHistory: Move[], newMove: Move | null): Partial<GameState> {
  // Append the new move to existing history (chess.history() resets when created from FEN)
  const history = newMove ? [...prevHistory, newMove] : prevHistory
  const capturedWhite: Piece[] = []
  const capturedBlack: Piece[] = []
  for (const m of history) {
    if(m.captured){
      // The captured piece has opposite color of the mover
      const capturedColor = m.color === 'w' ? 'b' : 'w'
      const p: Piece = { type: m.captured, color: capturedColor } as Piece
      // Push to array based on captured piece's color
      if (capturedColor === 'w') capturedWhite.push(p)
      else capturedBlack.push(p)
    }
  }
  
  return {
    fen: chess.fen(),
    history,
    capturedWhite,
    capturedBlack,
    turn: chess.turn() as 'w' | 'b',
    isCheck: chess.isCheck(),
    isCheckmate: chess.isCheckmate(),
    isDraw: chess.isDraw(),
    isGameOver: chess.isGameOver(),
  }
}

export function useChessGame() {
  const [state, setState] = useState<GameState>(() => ({
    ...INITIAL_STATE,
    coachMessages: [{
      id: genId(),
      type: 'info',
      title: 'Welcome to Chess Master 3D',
      content: 'Your AI coach is ready. Play your first move — I\'ll watch for blunders, offer hints, and explain every key moment. Control the center, develop early, castle soon!',
      timestamp: Date.now(),
    }],
  }))

  // Track checkmate dialog visibility separately to avoid re-triggering
  const [showCheckmateDialog, setShowCheckmateDialog] = useState(false)
  const checkmateShownRef = useRef(false)

  const stateRef = useRef(state)
  stateRef.current = state

  // Track whether we're currently awaiting a hint (vs a game move)
  const hintPendingRef = useRef(false)

  const addMsg = useCallback((msg: Omit<CoachMessage, 'id' | 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      coachMessages: [{ ...msg, id: genId(), timestamp: Date.now() }, ...prev.coachMessages.slice(0, 24)],
    }))
  }, [])

  // ── Stockfish callbacks ────────────────────────────────────────────────────
  const handleBestMove = useCallback((move: { from: string; to: string; promotion?: string }) => {
    if (hintPendingRef.current) {
      // This was a hint request
      hintPendingRef.current = false
      setState(prev => {
        const chess = new Chess(prev.fen)
        const legal = chess.moves({ verbose: true }) as Move[]
        const match = legal.find(m => m.from === move.from && m.to === move.to)
        if (!match) return prev
        setTimeout(() => {
          addMsg({
            type: 'hint',
            title: 'Hint',
            content: `Consider ${match.san}. This move ${
              match.captured ? 'captures material' :
              match.flags.includes('k') || match.flags.includes('q') ? 'castles for king safety' :
              'improves your position'
            }. Look at how it affects piece activity and center control.`,
            move: match.san,
          })
        }, 0)
        return { ...prev, hintMove: { from: move.from as Square, to: move.to as Square } }
      })
      return
    }

    // Normal AI move
    setState(prev => {
      if (prev.turn !== 'b' || prev.isGameOver) return { ...prev, isThinking: false }

      const chess = new Chess(prev.fen)
      const legal = chess.moves({ verbose: true }) as Move[]
      const match = legal.find(m =>
        m.from === move.from && m.to === move.to &&
        (!move.promotion || m.promotion === move.promotion)
      )
      if (!match) return { ...prev, isThinking: false }

      chess.move(match)
      const derived = derivedState(chess, prev.history, match)

      setTimeout(() => {
        if (chess.isCheckmate()) {
          addMsg({ type: 'info', title: 'Checkmate', content: 'Stockfish delivers checkmate. Study the final position to understand the winning pattern and apply it in future games.' })
        } else if (chess.isCheck()) {
          addMsg({ type: 'info', title: 'Check!', content: `Stockfish plays ${match.san}, putting your king in check. You must block, capture the attacker, or move your king.` })
        } else if (match.captured) {
          addMsg({ type: 'info', title: 'Stockfish captures', content: `${match.san} — Stockfish takes your ${pieceLabel(match.captured)}. Think about how to recover material balance or find compensation.` })
        }
      }, 0)

      return {
        ...prev,
        ...derived,
        lastMove: { from: match.from as Square, to: match.to as Square },
        selectedSquare: null,
        validMoves: [],
        isThinking: false,
        hintMove: null,
      }
    })
  }, [addMsg])

  const { requestMove, requestHintMove, stop } = useStockfish({
    onBestMove: handleBestMove,
    onReady: () => {
      // Engine ready — nothing to do at start
    },
  })

  // Show checkmate dialog when checkmate occurs
  useEffect(() => {
    if (state.isCheckmate && !checkmateShownRef.current) {
      checkmateShownRef.current = true
      // Small delay to let the final move animate
      const timer = setTimeout(() => setShowCheckmateDialog(true), 500)
      return () => clearTimeout(timer)
    }
  }, [state.isCheckmate])

  // ── Square click handler ──────────────────────────────────────────────────
  const handleSquareClick = useCallback((square: Square) => {
    setState(prev => {
      if (prev.isGameOver || prev.isThinking || prev.pendingPromotion) return prev

      const fen = prev.isExploringParallel && prev.parallelFen ? prev.parallelFen : prev.fen
      const chess = new Chess(fen)

      // ── PARALLEL EXPLORER ──
      if (prev.isExploringParallel) {
        if (prev.selectedSquare && prev.selectedSquare !== square) {
          const legal = chess.moves({ square: prev.selectedSquare, verbose: true }) as Move[]
          const destinationMoves = legal.filter(m => m.to === square)
          const promotionMoves = destinationMoves.filter(m => !!m.promotion)
          if (promotionMoves.length > 0) {
            return {
              ...prev,
              pendingPromotion: { from: prev.selectedSquare, to: square, isParallel: true },
              selectedSquare: null,
              validMoves: [],
            }
          }
          const match = destinationMoves[0]
          if (match) {
            chess.move(match)
            return { ...prev, parallelFen: chess.fen(), parallelMoves: [...prev.parallelMoves, match], selectedSquare: null, validMoves: [] }
          }
        }
        const piece = chess.get(square)
        if (piece && piece.color === chess.turn()) {
          const legal = chess.moves({ square, verbose: true }) as Move[]
          return { ...prev, selectedSquare: square, validMoves: legal.map(m => m.to as Square) }
        }
        return { ...prev, selectedSquare: null, validMoves: [] }
      }

      // ── NORMAL GAME (white's turn only) ──
      if (chess.turn() !== 'w') return prev

      if (prev.selectedSquare && prev.selectedSquare !== square) {
        const legal = chess.moves({ square: prev.selectedSquare, verbose: true }) as Move[]
        const destinationMoves = legal.filter(m => m.to === square)
        const promotionMoves = destinationMoves.filter(m => !!m.promotion)

        if (promotionMoves.length > 0) {
          return {
            ...prev,
            pendingPromotion: { from: prev.selectedSquare, to: square, isParallel: false },
            selectedSquare: null,
            validMoves: [],
          }
        }

        const match = destinationMoves[0]

        if (match) {
          const fenBefore = prev.fen

          // Blunder detection (quick local eval)
          const { isBlunder, bestSan } = getBlunderSeverity(fenBefore, match)

          chess.move(match)
          const derived = derivedState(chess, prev.history, match)

          const newState: GameState = {
            ...prev,
            ...derived,
            lastMove: { from: prev.selectedSquare, to: square },
            selectedSquare: null,
            validMoves: [],
            hintMove: null,
            isThinking: !chess.isGameOver(),
            moveCount: prev.moveCount + 1,
          }

          if (!chess.isGameOver()) {
            setTimeout(() => {
              if (isBlunder && bestSan) {
                addMsg({
                  type: 'blunder',
                  title: 'Blunder Detected!',
                  content: `Playing ${match.san} loses significant advantage. The engine suggests ${bestSan} was stronger. Use the Explore button to see how ${bestSan} plays out.`,
                  move: match.san,
                  betterMove: bestSan,
                })
                setState(s => ({ ...s, parallelFen: fenBefore, parallelMoves: [] }))
              } else if (chess.isCheck()) {
                addMsg({ type: 'good', title: 'Check!', content: `${match.san} puts the king in check — great tactical vision! Now look for follow-up threats.` })
              } else if (match.captured) {
                addMsg({ type: 'good', title: 'Capture!', content: `${match.san} wins the ${pieceLabel(match.captured)}. Evaluate if Stockfish has any dangerous recaptures before continuing your plan.` })
              } else if (match.flags.includes('k') || match.flags.includes('q')) {
                addMsg({ type: 'good', title: 'Castled!', content: 'Good — your king is safer now and your rooks are connected. Focus on activating your remaining pieces.' })
              }
              requestMove(chess.fen(), stateRef.current.difficulty)
            }, 0)
          } else {
            setTimeout(() => {
              if (chess.isCheckmate()) {
                addMsg({ type: 'good', title: 'Checkmate — You Win!', content: 'Excellent play! You delivered checkmate. Study the mating pattern to use it again in future games.' })
              }
            }, 0)
          }

          return newState
        }
      }

      // Select a piece
      const piece = chess.get(square)
      if (piece && piece.color === 'w') {
        const legal = chess.moves({ square, verbose: true }) as Move[]
        return { ...prev, selectedSquare: square, validMoves: legal.map(m => m.to as Square) }
      }

      return { ...prev, selectedSquare: null, validMoves: [] }
    })
  }, [addMsg, requestMove])

  // ── Promotion ──────────────────────────────────────────────────────────────
  const handlePromotion = useCallback((piece: 'q' | 'r' | 'b' | 'n') => {
    setState(prev => {
      if (!prev.pendingPromotion) return prev
      const { from, to, isParallel } = prev.pendingPromotion
      const sourceFen = isParallel ? (prev.parallelFen ?? prev.fen) : prev.fen
      const chess = new Chess(sourceFen)
      const match = (chess.moves({ verbose: true }) as Move[]).find(
        m => m.from === from && m.to === to && m.promotion === piece
      )
      if (!match) return { ...prev, pendingPromotion: null }

      chess.move(match)

      if (isParallel) {
        return {
          ...prev,
          parallelFen: chess.fen(),
          parallelMoves: [...prev.parallelMoves, match],
          pendingPromotion: null,
          selectedSquare: null,
          validMoves: [],
        }
      }

      const derived = derivedState(chess, prev.history, match)
      const newState: GameState = {
        ...prev, ...derived,
        lastMove: { from, to },
        pendingPromotion: null,
        selectedSquare: null,
        validMoves: [],
        hintMove: null,
        isThinking: !chess.isGameOver(),
        moveCount: prev.moveCount + 1,
      }
      if (!chess.isGameOver()) {
        setTimeout(() => requestMove(chess.fen(), stateRef.current.difficulty), 0)
      }
      return newState
    })
  }, [requestMove])

  // ── Takeback ──────────────────────────────────────────────────────────────
  const takeback = useCallback(() => {
    stop()
    setState(prev => {
      if (prev.history.length < 2) return prev
      // Remove last 2 moves from history
      const newHistory = prev.history.slice(0, -2)
      // Recreate position by replaying moves from scratch (FEN-loaded Chess has no undo history)
      const chess = new Chess()
      for (const move of newHistory) {
        chess.move(move)
      }
      const derived = derivedState(chess, newHistory, null)
      const lastMove = newHistory.length > 0 ? { from: newHistory[newHistory.length - 1].from as Square, to: newHistory[newHistory.length - 1].to as Square } : null
      setTimeout(() => addMsg({ type: 'info', title: 'Takeback', content: 'Move undone. Use this chance to find a stronger continuation — think about what the engine might exploit.' }), 0)
      return { ...prev, ...derived, lastMove, selectedSquare: null, validMoves: [], hintMove: null, pendingPromotion: null, isThinking: false, moveCount: Math.max(0, prev.moveCount - 2), isCheckmate: false, isDraw: false, isGameOver: false }
    })
  }, [addMsg, stop])

  // ── Hint ──────────────────────────────────────────────────────────────────
  const requestHint = useCallback(() => {
    setState(prev => {
      if (prev.turn !== 'w' || prev.isThinking || prev.isGameOver || prev.pendingPromotion) return prev
      hintPendingRef.current = true
      setTimeout(() => requestHintMove(prev.fen), 0)
      return prev
    })
  }, [requestHintMove])

  // ── Parallel exploration ───────────────────────────────────────────────────
  const startParallelExploration = useCallback((fromFen: string) => {
    setState(prev => ({ ...prev, parallelFen: fromFen, parallelMoves: [], isExploringParallel: true, pendingPromotion: null, selectedSquare: null, validMoves: [] }))
    addMsg({ type: 'analysis', title: 'Parallel Explorer Active', content: 'Exploring an alternate line. Move freely to see how the position could have unfolded. Click Exit Explorer when done.' })
  }, [addMsg])

  const exitParallelExploration = useCallback(() => {
    setState(prev => ({ ...prev, isExploringParallel: false, parallelFen: null, parallelMoves: [], pendingPromotion: null, selectedSquare: null, validMoves: [] }))
  }, [])

  // ── Difficulty ────────────────────────────────────────────────────────────
  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setState(prev => ({ ...prev, difficulty }))
    addMsg({
      type: 'info',
      title: 'Difficulty Updated',
      content: difficulty === 'beginner' ? 'Beginner mode: Stockfish plays at ~800 ELO. Good for learning basics.' :
               difficulty === 'intermediate' ? 'Intermediate: ~1500 ELO. Solid tactical play.' :
               difficulty === 'advanced' ? 'Advanced: ~2000 ELO. Near-expert level.' :
               'Master: Full Stockfish strength. Prepare for a serious challenge!',
    })
  }, [addMsg])

  // ── New game ──────────────────────────────────────────────────────────────
  const newGame = useCallback(() => {
    stop()
    checkmateShownRef.current = false
    setShowCheckmateDialog(false)
    setState(prev => ({
      ...INITIAL_STATE,
      difficulty: prev.difficulty,
      coachMessages: [{
        id: genId(),
        type: 'info',
        title: 'New Game',
        content: 'Game reset. Good luck! Remember: control the center, develop your pieces, and castle early. I\'ll coach you through every move.',
        timestamp: Date.now(),
      }],
    }))
  }, [stop])

  // ── Close checkmate dialog ──────────────────────────────────────────────────
  const closeCheckmateDialog = useCallback(() => {
    setShowCheckmateDialog(false)
  }, [])

  return {
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
  }
}

function pieceLabel(type: string): string {
  return ({ p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' })[type] ?? type
}
