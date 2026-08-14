'use client'

import { useRef, useCallback } from 'react'
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
 *
 * The worker is spawned LAZILY on the first engine request (first player move
 * or hint) rather than on mount: stockfish.js is ~1.5 MB and must never
 * compete with first paint. Commands issued before the worker reports
 * 'readyok' are queued and flushed automatically.
 */
export function useStockfish({ onBestMove, onReady }: UseStockfishOptions) {
  const workerRef = useRef<Worker | null>(null)
  const readyRef = useRef(false)
  const pendingRef = useRef<string[]>([])
  const onBestMoveRef = useRef(onBestMove)
  const onReadyRef = useRef(onReady)
  onBestMoveRef.current = onBestMove
  onReadyRef.current = onReady

  const spawn = useCallback(() => {
    if (workerRef.current) return

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
        // Flush any commands issued before the engine was ready
        const cmds = pendingRef.current
        pendingRef.current = []
        cmds.forEach(cmd => cmd.split('\n').forEach(c => worker.postMessage(c)))
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
  }, [])

  const requestMove = useCallback((fen: string, difficulty: Difficulty) => {
    const depth = DIFFICULTY_DEPTH[difficulty]

    if (!workerRef.current) spawn()

    if (!readyRef.current || !workerRef.current) {
      // Store pending command - stockfish.js 10 uses depth-only for difficulty
      pendingRef.current.push(`position fen ${fen}\ngo depth ${depth}`)
      return
    }

    workerRef.current.postMessage(`position fen ${fen}`)
    workerRef.current.postMessage(`go depth ${depth}`)
  }, [spawn])

  const requestHintMove = useCallback((fen: string) => {
    if (!workerRef.current) spawn()

    if (!readyRef.current || !workerRef.current) {
      pendingRef.current.push(`position fen ${fen}\ngo depth 10`)
      return
    }

    workerRef.current.postMessage(`position fen ${fen}`)
    workerRef.current.postMessage('go depth 10')
  }, [spawn])

  const stop = useCallback(() => {
    workerRef.current?.postMessage('stop')
  }, [])

  return { requestMove, requestHintMove, stop }
}