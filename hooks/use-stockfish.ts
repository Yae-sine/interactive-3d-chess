'use client'

import { useEffect, useRef, useCallback } from 'react'
import { DIFFICULTY_DEPTH, DIFFICULTY_ELO, type Difficulty } from '@/lib/chess-engine'

interface StockfishMove {
  from: string
  to: string
  promotion?: string
  san?: string
}

interface UseStockfishOptions {
  onBestMove: (move: StockfishMove) => void
  onReady: () => void
}

/**
 * Manages a Stockfish.js worker instance.
 * Stockfish runs as a Web Worker using the `stockfish` npm package.
 */
export function useStockfish({ onBestMove, onReady }: UseStockfishOptions) {
  const workerRef = useRef<Worker | null>(null)
  const readyRef = useRef(false)
  const pendingRef = useRef<string | null>(null)
  const onBestMoveRef = useRef(onBestMove)
  const onReadyRef = useRef(onReady)
  onBestMoveRef.current = onBestMove
  onReadyRef.current = onReady

  useEffect(() => {
    // Stockfish worker via CDN — zero npm dependency issues
    const worker = new Worker(
      'https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish-nnue-16.js',
      { type: 'classic' }
    )

    worker.onmessage = (e: MessageEvent<string>) => {
      const line = e.data
      if (!line) return

      if (line === 'uciok') {
        worker.postMessage('isready')
        return
      }
      if (line === 'readyok') {
        readyRef.current = true
        onReadyRef.current()
        // Run any pending position
        if (pendingRef.current) {
          worker.postMessage(pendingRef.current)
          pendingRef.current = null
        }
        return
      }
      if (line.startsWith('bestmove')) {
        const parts = line.split(' ')
        const moveStr = parts[1]
        if (!moveStr || moveStr === '(none)') return
        const from = moveStr.slice(0, 2)
        const to = moveStr.slice(2, 4)
        const promotion = moveStr.length > 4 ? moveStr[4] : undefined
        onBestMoveRef.current({ from, to, promotion })
      }
    }

    worker.onerror = (e) => {
      console.error('[Stockfish] Worker error:', e)
    }

    workerRef.current = worker
    worker.postMessage('uci')

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  const requestMove = useCallback((fen: string, difficulty: Difficulty) => {
    const depth = DIFFICULTY_DEPTH[difficulty]
    const elo = DIFFICULTY_ELO[difficulty]
    const cmd = [
      `setoption name UCI_LimitStrength value ${difficulty !== 'master' ? 'true' : 'false'}`,
      `setoption name UCI_Elo value ${elo}`,
      `position fen ${fen}`,
      `go depth ${depth}`,
    ].join('\n')

    if (!readyRef.current || !workerRef.current) {
      pendingRef.current = cmd
      return
    }

    workerRef.current.postMessage(`setoption name UCI_LimitStrength value ${difficulty !== 'master' ? 'true' : 'false'}`)
    workerRef.current.postMessage(`setoption name UCI_Elo value ${elo}`)
    workerRef.current.postMessage(`position fen ${fen}`)
    workerRef.current.postMessage(`go depth ${depth}`)
  }, [])

  const requestHintMove = useCallback((fen: string) => {
    if (!readyRef.current || !workerRef.current) return
    workerRef.current.postMessage(`position fen ${fen}`)
    workerRef.current.postMessage('go depth 10')
  }, [])

  const stop = useCallback(() => {
    workerRef.current?.postMessage('stop')
  }, [])

  return { requestMove, requestHintMove, stop }
}
