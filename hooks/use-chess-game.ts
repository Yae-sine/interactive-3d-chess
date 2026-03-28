'use client'

import { useState, useCallback, useRef } from 'react'
import { Chess, Square, Move, Piece } from 'chess.js'
import {
  GameState, INITIAL_STATE, DIFFICULTY_DEPTH,
  getBestMove, getMoveDelta, evaluateBoard,
  CoachMessage, Difficulty
} from '@/lib/chess-engine'

function generateId() {
  return Math.random().toString(36).slice(2)
}

function buildState(chess: Chess, partial: Partial<GameState>): Partial<GameState> {
  const { capturedWhite, capturedBlack } = getCapturedFromChess(chess)
  const history = chess.history({ verbose: true }) as Move[]
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
    ...partial,
  }
}

function getCapturedFromChess(chess: Chess) {
  const capturedWhite: Piece[] = []
  const capturedBlack: Piece[] = []
  const history = chess.history({ verbose: true }) as Move[]
  for (const move of history) {
    if (move.captured) {
      const piece: Piece = { type: move.captured, color: move.color === 'w' ? 'b' : 'w' } as Piece
      if (move.color === 'w') capturedWhite.push(piece)
      else capturedBlack.push(piece)
    }
  }
  return { capturedWhite, capturedBlack }
}

export function useChessGame() {
  const [state, setState] = useState<GameState>(() => ({
    ...INITIAL_STATE,
    coachMessages: [{
      id: generateId(),
      type: 'info',
      title: 'Welcome to Chess Master 3D',
      content: "I'm Magnus, your AI chess coach. Play your first move and I'll guide you! Remember: control the center, develop your pieces, and castle early.",
      timestamp: Date.now(),
    }],
  }))

  const thinkingTimeout = useRef<NodeJS.Timeout | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const addMessage = useCallback((msg: Omit<CoachMessage, 'id' | 'timestamp'>) => {
    const newMsg: CoachMessage = { ...msg, id: generateId(), timestamp: Date.now() }
    setState(prev => ({
      ...prev,
      coachMessages: [newMsg, ...prev.coachMessages.slice(0, 19)],
    }))
  }, [])

  // AI move executor — reads from stateRef so it's always fresh
  const doAIMove = useCallback(() => {
    const prev = stateRef.current
    const chess = new Chess(prev.fen)
    if (chess.turn() !== 'b' || chess.isGameOver()) {
      setState(s => ({ ...s, isThinking: false }))
      return
    }

    const depth = DIFFICULTY_DEPTH[prev.difficulty]
    const bestMove = getBestMove(chess, depth)
    if (!bestMove) {
      setState(s => ({ ...s, isThinking: false }))
      return
    }

    chess.move(bestMove)
    const newState = buildState(chess, {
      lastMove: { from: bestMove.from as Square, to: bestMove.to as Square },
      selectedSquare: null,
      validMoves: [],
      isThinking: false,
      hintMove: null,
    })

    setState(prev => ({ ...prev, ...newState, moveCount: prev.moveCount + 1 }))

    // Coach feedback after AI move
    if (chess.isCheckmate()) {
      addMessage({ type: 'info', title: 'Checkmate', content: 'The AI delivers checkmate. Review the game to learn from the pattern and keep practicing!' })
    } else if (chess.isCheck()) {
      addMessage({ type: 'info', title: 'AI puts you in check!', content: `The AI played ${bestMove.san}, putting your king in check. You must address this immediately — look for ways to block, capture, or move your king.` })
    } else if (bestMove.captured) {
      addMessage({ type: 'info', title: 'AI captures a piece', content: `The AI took your ${bestMove.captured.toUpperCase()} with ${bestMove.san}. Think about how to recapture or compensate for the material loss.` })
    }
  }, [addMessage])

  // Schedule AI move with thinking delay
  const scheduleAIMove = useCallback((delay: number) => {
    setState(s => ({ ...s, isThinking: true }))
    if (thinkingTimeout.current) clearTimeout(thinkingTimeout.current)
    thinkingTimeout.current = setTimeout(doAIMove, delay)
  }, [doAIMove])

  // Handle square click
  const handleSquareClick = useCallback((square: Square) => {
    setState(prev => {
      if (prev.isGameOver || prev.isThinking) return prev

      const chess = new Chess(prev.isExploringParallel && prev.parallelFen ? prev.parallelFen : prev.fen)

      // ---- PARALLEL EXPLORER MODE ----
      if (prev.isExploringParallel) {
        if (prev.selectedSquare && prev.selectedSquare !== square) {
          const movesToSquare = chess.moves({ square: prev.selectedSquare, verbose: true }) as Move[]
          const match = movesToSquare.find(m => m.to === square)
          if (match) {
            chess.move(match)
            return {
              ...prev,
              parallelFen: chess.fen(),
              parallelMoves: [...prev.parallelMoves, match],
              selectedSquare: null,
              validMoves: [],
            }
          }
        }
        const piece = chess.get(square)
        if (piece && piece.color === chess.turn()) {
          const moves = chess.moves({ square, verbose: true }) as Move[]
          return { ...prev, selectedSquare: square, validMoves: moves.map(m => m.to as Square) }
        }
        return { ...prev, selectedSquare: null, validMoves: [] }
      }

      // ---- NORMAL GAME (white's turn) ----
      if (chess.turn() !== 'w') return prev

      if (prev.selectedSquare && prev.selectedSquare !== square) {
        const movesToSquare = chess.moves({ square: prev.selectedSquare, verbose: true }) as Move[]
        const match = movesToSquare.find(m => m.to === square)

        if (match) {
          const fenBefore = prev.fen

          // Detect blunder: compare move quality vs best available
          let isBlunder = false
          let bestForPlayer: Move | null = null
          {
            const evalChess = new Chess(fenBefore)
            const allMoves = evalChess.moves({ verbose: true }) as Move[]
            let bestVal = Infinity
            for (const m of allMoves) {
              evalChess.move(m)
              const v = evaluateBoard(evalChess)
              evalChess.undo()
              if (v < bestVal) { bestVal = v; bestForPlayer = m }
            }
            const moveChess = new Chess(fenBefore)
            moveChess.move(match)
            const moveVal = evaluateBoard(moveChess)
            isBlunder = moveVal - bestVal > 150 && bestForPlayer?.san !== match.san
          }

          chess.move(match)
          const newState = buildState(chess, {
            selectedSquare: null,
            validMoves: [],
            lastMove: { from: prev.selectedSquare, to: square },
            hintMove: null,
          })

          const fullNew: GameState = {
            ...prev,
            ...newState,
            moveCount: prev.moveCount + 1,
          }

          if (!chess.isGameOver()) {
            // Queue coaching message + AI move
            const delay = isBlunder ? 800 : 300
            setTimeout(() => {
              if (isBlunder && bestForPlayer) {
                addMessage({
                  type: 'blunder',
                  title: 'Blunder Detected!',
                  content: `Playing ${match.san} is a mistake — it gives away a significant positional or material advantage. The better move was ${bestForPlayer.san}.`,
                  move: match.san,
                  betterMove: bestForPlayer.san,
                })
                // Set up parallel exploration from before the blunder
                setState(s => ({ ...s, parallelFen: fenBefore, parallelMoves: [] }))
              } else if (chess.isCheck()) {
                addMessage({ type: 'good', title: 'Check!', content: `Well done — ${match.san} puts the opponent in check! Maintain pressure and look for follow-up tactics.` })
              } else if (match.captured) {
                addMessage({ type: 'good', title: 'Capture!', content: `Good capture with ${match.san}. You've gained material. Watch for any counterplay from the AI.` })
              } else if (match.flags.includes('k') || match.flags.includes('q')) {
                addMessage({ type: 'good', title: 'Castled!', content: `Excellent — castling improves your king safety and connects your rooks. Now focus on activating all your pieces.` })
              }
              scheduleAIMove(delay)
            }, 0)
          }

          return fullNew
        }
      }

      // Select or re-select a piece
      const piece = chess.get(square)
      if (piece && piece.color === 'w') {
        const moves = chess.moves({ square, verbose: true }) as Move[]
        return { ...prev, selectedSquare: square, validMoves: moves.map(m => m.to as Square) }
      }

      return { ...prev, selectedSquare: null, validMoves: [] }
    })
  }, [addMessage, scheduleAIMove])

  // Takeback: undo the last player + AI move pair
  const takeback = useCallback(() => {
    setState(prev => {
      if (prev.history.length < 2) return prev
      const chess = new Chess(prev.fen)
      chess.undo() // AI move
      chess.undo() // player move
      const newState = buildState(chess, {
        selectedSquare: null,
        validMoves: [],
        hintMove: null,
        isThinking: false,
        lastMove: chess.history({ verbose: true }).length > 0
          ? (() => {
              const h = chess.history({ verbose: true }) as Move[]
              const last = h[h.length - 1]
              return { from: last.from as Square, to: last.to as Square }
            })()
          : null,
      })
      setTimeout(() => addMessage({
        type: 'info',
        title: 'Move Taken Back',
        content: 'Your last move has been undone. Use this opportunity to try a different approach and learn from the position.',
      }), 0)
      return {
        ...prev,
        ...newState,
        moveCount: Math.max(0, prev.moveCount - 2),
        isCheckmate: false,
        isDraw: false,
        isGameOver: false,
      }
    })
    if (thinkingTimeout.current) clearTimeout(thinkingTimeout.current)
  }, [addMessage])

  // Hint: show the best move highlighted on the board
  const requestHint = useCallback(() => {
    setState(prev => {
      if (prev.turn !== 'w' || prev.isThinking || prev.isGameOver) return prev
      const chess = new Chess(prev.fen)
      const best = getBestMove(chess, 3)
      if (!best) return prev
      setTimeout(() => addMessage({
        type: 'hint',
        title: 'Hint',
        content: `Consider playing ${best.san}. This move follows strong chess principles — look at how it affects piece activity, center control, or king safety.`,
        move: best.san,
      }), 0)
      return { ...prev, hintMove: { from: best.from as Square, to: best.to as Square } }
    })
  }, [addMessage])

  // Start parallel board exploration from a given FEN
  const startParallelExploration = useCallback((fromFen: string) => {
    setState(prev => ({
      ...prev,
      parallelFen: fromFen,
      parallelMoves: [],
      isExploringParallel: true,
      selectedSquare: null,
      validMoves: [],
    }))
    addMessage({
      type: 'analysis',
      title: 'Parallel Explorer Active',
      content: 'You are now exploring an alternate line in parallel. Make moves freely to see how the game could have unfolded differently. Click "Exit Explorer" when done.',
    })
  }, [addMessage])

  const exitParallelExploration = useCallback(() => {
    setState(prev => ({
      ...prev,
      isExploringParallel: false,
      parallelFen: null,
      parallelMoves: [],
      selectedSquare: null,
      validMoves: [],
    }))
  }, [])

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setState(prev => ({ ...prev, difficulty }))
    addMessage({
      type: 'info',
      title: 'Difficulty Changed',
      content: `Difficulty set to ${difficulty}. ${
        difficulty === 'beginner' ? 'The AI will make occasional mistakes — good for learning fundamentals.' :
        difficulty === 'intermediate' ? 'The AI plays solid fundamental chess — a good challenge for improving players.' :
        difficulty === 'advanced' ? 'The AI plays strong tactical chess — test your calculation skills!' :
        'The AI plays at near-grandmaster level. Only for the brave!'
      }`,
    })
  }, [addMessage])

  const newGame = useCallback(() => {
    if (thinkingTimeout.current) clearTimeout(thinkingTimeout.current)
    setState(prev => ({
      ...INITIAL_STATE,
      difficulty: prev.difficulty,
      coachMessages: [{
        id: generateId(),
        type: 'info',
        title: 'New Game Started',
        content: "Good luck! Focus on controlling the center with pawns and knights, develop bishops early, and castle to protect your king. I'll coach you through every move.",
        timestamp: Date.now(),
      }],
    }))
  }, [])

  return {
    state,
    handleSquareClick,
    takeback,
    requestHint,
    startParallelExploration,
    exitParallelExploration,
    setDifficulty,
    newGame,
  }
}
