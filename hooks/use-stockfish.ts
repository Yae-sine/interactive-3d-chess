'use client'

import { useEffect, useRef, useCallback } from 'react'
import { DIFFICULTY_DEPTH, type Difficulty } from '@/lib/chess-engine'

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
    // Load Stockfish from local public folder (browsers block cross-origin workers)
    const worker = new Worker('/stockfish.js')

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
        // Run any pending commands
        if (pendingRef.current) {
          const cmds = pendingRef.current.split('\n')
          cmds.forEach(cmd => worker.postMessage(cmd))
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

    if (!readyRef.current || !workerRef.current) {
      // Store pending command - stockfish.js 10 uses depth-only for difficulty
      pendingRef.current = `position fen ${fen}\ngo depth ${depth}`
      return
    }

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
