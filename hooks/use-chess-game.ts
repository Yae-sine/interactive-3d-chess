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

export function useChessGame() {
  const [state, setState] = useState<GameState>(INITIAL_STATE)
  const thinkingTimeout = useRef<NodeJS.Timeout | null>(null)

  const getChess = useCallback((fen: string) => {
    return new Chess(fen)
  }, [])

  const addCoachMessage = useCallback((msg: Omit<CoachMessage, 'id' | 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      coachMessages: [
        { ...msg, id: generateId(), timestamp: Date.now() },
        ...prev.coachMessages.slice(0, 19),
      ]
    }))
  }, [])

  // Calculate captured pieces from history
  const getCaptured = useCallback((chess: Chess) => {
    const capturedWhite: Piece[] = []
    const capturedBlack: Piece[] = []
    const history = chess.history({ verbose: true })
    for (const move of history) {
      if (move.captured) {
        const piece: Piece = { type: move.captured, color: move.color === 'w' ? 'b' : 'w' } as Piece
        if (move.color === 'w') capturedWhite.push(piece)
        else capturedBlack.push(piece)
      }
    }
    return { capturedWhite, capturedBlack }
  }, [])

  // Handle square click
  const handleSquareClick = useCallback((square: Square) => {
    setState(prev => {
      if (prev.isGameOver || prev.isThinking) return prev

      const chess = getChess(prev.isExploringParallel ? prev.parallelFen! : prev.fen)
      const currentTurn = chess.turn()

      // If exploring parallel, only allow moves
      if (prev.isExploringParallel) {
        if (prev.selectedSquare) {
          // Try to make a move
          const movesToSquare = chess.moves({ square: prev.selectedSquare, verbose: true })
            .filter(m => m.to === square)

          if (movesToSquare.length > 0) {
            const move = movesToSquare[0]
            chess.move(move)
            const newParallelFen = chess.fen()
            const newParallelMoves = [...prev.parallelMoves, move]
            return {
              ...prev,
              parallelFen: newParallelFen,
              parallelMoves: newParallelMoves,
              selectedSquare: null,
              validMoves: [],
            }
          }
        }

        // Select a piece
        const piece = chess.get(square)
        if (piece && piece.color === currentTurn) {
          const moves = chess.moves({ square, verbose: true })
          return {
            ...prev,
            selectedSquare: square,
            validMoves: moves.map(m => m.to as Square),
          }
        }
        return { ...prev, selectedSquare: null, validMoves: [] }
      }

      // Normal game - only white can move
      if (currentTurn !== 'w') return prev

      if (prev.selectedSquare) {
        // Try to complete a move
        const movesToSquare = chess.moves({ square: prev.selectedSquare, verbose: true })
          .filter(m => m.to === square)

        if (movesToSquare.length > 0) {
          // Make the move
          const move = movesToSquare[0]
          const fenBefore = prev.fen
          chess.move(move)
          const newFen = chess.fen()
          const { capturedWhite, capturedBlack } = getCaptured(chess)
          const history = chess.history({ verbose: true })

          // Evaluate move quality
          const delta = getMoveDelta(fenBefore, move)

          // Check for good/bad moves
          const beforeChess = getChess(fenBefore)
          const allMoves = beforeChess.moves({ verbose: true })
          let isBlunder = false
          let bestMoveForPlayer: Move | null = null

          if (allMoves.length > 0) {
            // Find best white move (minimize score for white = most negative)
            let bestVal = Infinity
            for (const m of allMoves) {
              beforeChess.move(m)
              const val = evaluateBoard(beforeChess)
              beforeChess.undo()
              if (val < bestVal) {
                bestVal = val
                bestMoveForPlayer = m
              }
            }
            // If move is significantly worse than best available
            const moveChess = getChess(fenBefore)
            moveChess.move(move)
            const moveVal = evaluateBoard(moveChess)
            isBlunder = moveVal - bestVal > 150 && bestMoveForPlayer?.san !== move.san
          }

          const newState: GameState = {
            ...prev,
            fen: newFen,
            history,
            capturedWhite,
            capturedBlack,
            turn: 'b',
            isCheck: chess.isCheck(),
            isCheckmate: chess.isCheckmate(),
            isDraw: chess.isDraw(),
            isGameOver: chess.isGameOver(),
            selectedSquare: null,
            validMoves: [],
            lastMove: { from: prev.selectedSquare, to: square },
            hintMove: null,
            moveCount: prev.moveCount + 1,
          }

          // Don't trigger AI if game over
          if (chess.isGameOver()) return newState

          // Queue blunder message + AI move
          setTimeout(() => {
            if (isBlunder && bestMoveForPlayer) {
              addCoachMessage({
                type: 'blunder',
                title: 'Blunder Detected!',
                content: `Moving ${move.san} loses significant material. Your king\'s safety and piece activity were compromised. Consider the better alternative shown.`,
                move: move.san,
                betterMove: bestMoveForPlayer.san,
              })
              // Start parallel exploration
              setState(s => ({
                ...s,
                parallelFen: fenBefore,
                parallelMoves: [],
                isExploringParallel: false,
              }))
            } else if (chess.isCheck()) {
              addCoachMessage({
                type: 'info',
                title: 'Check!',
                content: `You put the opponent in check with ${move.san}. Watch out for counterattacks.`,
              })
            } else if (move.flags.includes('e') || move.flags.includes('c')) {
              addCoachMessage({
                type: 'good',
                title: 'Capture!',
                content: `Good capture with ${move.san}. You gained material.`,
              })
            }

            // Trigger AI response
            triggerAIMove(newState)
          }, isBlunder ? 600 : 200)

          return newState
        }

        // Deselect or select new piece
        const piece = chess.get(square)
        if (piece && piece.color === 'w') {
          const moves = chess.moves({ square, verbose: true })
          return {
            ...prev,
            selectedSquare: square,
            validMoves: moves.map(m => m.to as Square),
          }
        }
        return { ...prev, selectedSquare: null, validMoves: [] }
      }

      // Select a piece
      const piece = chess.get(square)
      if (piece && piece.color === 'w') {
        const moves = chess.moves({ square, verbose: true })
        return {
          ...prev,
          selectedSquare: square,
          validMoves: moves.map(m => m.to as Square),
        }
      }
      return prev
    })
  }, [getChess, getCaptured, addCoachMessage])

  const triggerAIMove = useCallback((gameState: GameState) => {
    setState(prev => ({ ...prev, isThinking: true }))
    const depth = DIFFICULTY_DEPTH[gameState.difficulty]
    const delay = 400 + Math.random() * 600

    if (thinkingTimeout.current) clearTimeout(thinkingTimeout.current)
    thinkingTimeout.current = setTimeout(() => {
      setState(prev => {
        const chess = getChess(prev.fen)
        if (chess.turn() !== 'b' || chess.isGameOver()) {
          return { ...prev, isThinking: false }
        }

        const bestMove = getBestMove(chess, depth)
        if (!bestMove) return { ...prev, isThinking: false }

        chess.move(bestMove)
        const newFen = chess.fen()
        const { capturedWhite, capturedBlack } = getCaptured(chess)
        const history = chess.history({ verbose: true })

        if (chess.isCheckmate()) {
          addCoachMessage({
            type: 'info',
            title: 'Checkmate',
            content: 'The AI delivers checkmate. Review the game to learn from the pattern.',
          })
        } else if (chess.isCheck()) {
          addCoachMessage({
            type: 'info',
            title: 'AI puts you in check',
            content: `The AI played ${bestMove.san}, putting your king in check. You must address this immediately.`,
          })
        }

        return {
          ...prev,
          fen: newFen,
          history,
          capturedWhite,
          capturedBlack,
          turn: 'w',
          isCheck: chess.isCheck(),
          isCheckmate: chess.isCheckmate(),
          isDraw: chess.isDraw(),
          isGameOver: chess.isGameOver(),
          lastMove: { from: bestMove.from as Square, to: bestMove.to as Square },
          isThinking: false,
          moveCount: prev.moveCount + 1,
        }
      })
    }, delay)
  }, [getChess, getCaptured, addCoachMessage])

  // Takeback
  const takeback = useCallback(() => {
    setState(prev => {
      const chess = getChess(prev.fen)
      // Undo AI move + player move
      chess.undo()
      chess.undo()
      if (!chess.fen()) return prev
      const newFen = chess.fen()
      const { capturedWhite, capturedBlack } = getCaptured(chess)
      const history = chess.history({ verbose: true })

      addCoachMessage({
        type: 'info',
        title: 'Move Taken Back',
        content: 'You took back your last move. Use this to explore better alternatives.',
      })

      return {
        ...prev,
        fen: newFen,
        history,
        capturedWhite,
        capturedBlack,
        turn: 'w',
        isCheck: chess.isCheck(),
        isCheckmate: false,
        isDraw: false,
        isGameOver: false,
        selectedSquare: null,
        validMoves: [],
        lastMove: history.length > 0 ? {
          from: history[history.length - 1].from as Square,
          to: history[history.length - 1].to as Square,
        } : null,
        isThinking: false,
        hintMove: null,
        moveCount: Math.max(0, prev.moveCount - 2),
      }
    })
  }, [getChess, getCaptured, addCoachMessage])

  // Hint
  const requestHint = useCallback(() => {
    setState(prev => {
      if (prev.isThinking || prev.turn !== 'w') return prev
      const chess = getChess(prev.fen)
      const bestMove = getBestMove(chess, 3)
      if (!bestMove) return prev

      addCoachMessage({
        type: 'hint',
        title: 'Hint',
        content: `Consider playing ${bestMove.san}. This move improves your position by developing your pieces and controlling key squares.`,
        move: bestMove.san,
      })

      return {
        ...prev,
        hintMove: { from: bestMove.from as Square, to: bestMove.to as Square },
      }
    })
  }, [getChess, addCoachMessage])

  // Start parallel exploration
  const startParallelExploration = useCallback((fromFen: string) => {
    setState(prev => ({
      ...prev,
      parallelFen: fromFen,
      parallelMoves: [],
      isExploringParallel: true,
      selectedSquare: null,
      validMoves: [],
    }))
    addCoachMessage({
      type: 'analysis',
      title: 'Parallel Explorer Active',
      content: 'You are now exploring an alternate line. Make moves to see how the game could have gone. Click "Exit Explorer" to return.',
    })
  }, [addCoachMessage])

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
    addCoachMessage({
      type: 'info',
      title: 'Difficulty Changed',
      content: `Difficulty set to ${difficulty}. ${
        difficulty === 'beginner' ? 'The AI will make occasional mistakes.' :
        difficulty === 'intermediate' ? 'The AI plays solid fundamental chess.' :
        difficulty === 'advanced' ? 'The AI plays strong tactical chess.' :
        'The AI plays at near-grandmaster level.'
      }`,
    })
  }, [addCoachMessage])

  const newGame = useCallback(() => {
    if (thinkingTimeout.current) clearTimeout(thinkingTimeout.current)
    setState(prev => ({
      ...INITIAL_STATE,
      difficulty: prev.difficulty,
      coachMessages: [{
        id: generateId(),
        type: 'info',
        title: 'New Game Started',
        content: 'Good luck! Remember: control the center, develop your pieces, and castle early. I\'ll guide you throughout the game.',
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
