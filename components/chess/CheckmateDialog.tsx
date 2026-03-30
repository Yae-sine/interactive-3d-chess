'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Crown, RefreshCw, MessageSquare, X, Send, Sparkles, User } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CheckmateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  winner: 'player' | 'ai'
  moveHistory: string[]
  onNewGame: () => void
}

// Helper to extract text content from a message
function getMessageContent(message: { parts?: Array<{ type: string; text?: string }> }): string {
  if (message.parts) {
    return message.parts
      .filter((part): part is { type: 'text'; text: string } => part.type === 'text' && typeof part.text === 'string')
      .map(part => part.text)
      .join('')
  }
  return ''
}

export default function CheckmateDialog({
  open,
  onOpenChange,
  winner,
  moveHistory,
  onNewGame,
}: CheckmateDialogProps) {
  const [showChat, setShowChat] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Use refs to always get current values in the transport body function
  const moveHistoryRef = useRef(moveHistory)
  const winnerRef = useRef(winner)
  moveHistoryRef.current = moveHistory
  winnerRef.current = winner

  // Compute move count once (full moves, not half-moves)
  const moveCount = Math.ceil(moveHistory.length / 2)

  // Create transport - body function uses refs to always get fresh values
  const transport = useMemo(() => new DefaultChatTransport({
    body: () => ({
      moveHistory: moveHistoryRef.current,
      result: winnerRef.current === 'player' ? 'Player (White) won by checkmate' : 'AI (Black) won by checkmate',
      playerColor: 'w',
    }),
  }), []) // Empty deps - refs provide fresh values

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Reset chat when showChat becomes true - compute message inline with current values
  useEffect(() => {
    if (showChat) {
      setInputValue('')
      const welcomeText = winner === 'player'
        ? `Congratulations on your victory! That was a well-played game. I watched all ${moveCount} moves. What would you like to discuss? I can analyze specific positions, explain key moments, or suggest where you could improve even further.`
        : `That was a tough game! The AI played well, but I noticed several instructive moments. I watched all ${moveCount} moves. Would you like me to analyze where things went wrong, or discuss any specific moment from the game?`

      setMessages([{
        id: 'welcome',
        role: 'assistant',
        parts: [{ type: 'text', text: welcomeText }],
      }])
    }
  }, [showChat, winner, moveCount, setMessages])

  const handleNewGame = () => {
    setShowChat(false)
    onOpenChange(false)
    onNewGame()
  }

  const handleClose = () => {
    setShowChat(false)
    onOpenChange(false)
  }

  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const trimmedInput = inputValue.trim()
    if (!trimmedInput || isLoading) return

    sendMessage({ text: trimmedInput })
    setInputValue('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "bg-[#0d0b09] border-[#1a1612] shadow-2xl",
          showChat ? "sm:max-w-xl" : "sm:max-w-md"
        )}
      >
        {!showChat ? (
          <>
            <DialogHeader className="text-center space-y-4">
              {/* Crown animation */}
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-600/20 to-amber-900/20 border border-amber-500/30 flex items-center justify-center animate-pulse">
                <Crown className={cn(
                  "w-10 h-10",
                  winner === 'player' ? "text-amber-400" : "text-red-400"
                )} />
              </div>

              <div>
                <DialogTitle className={cn(
                  "text-2xl font-bold",
                  winner === 'player' ? "text-amber-400" : "text-red-400"
                )}>
                  {winner === 'player' ? 'Checkmate!' : 'Checkmate'}
                </DialogTitle>
                <p className="text-[#8a8478] mt-2">
                  {winner === 'player'
                    ? 'Congratulations! You delivered checkmate.'
                    : 'The AI has won this game.'}
                </p>
              </div>

              {/* Move count badge */}
              <div className="inline-flex mx-auto px-3 py-1.5 rounded-full bg-[#1a1612] border border-[#2a2420]">
                <span className="text-xs text-[#6a6258]">
                  Game completed in <span className="text-[#c9c2b4] font-medium">{moveCount}</span> moves
                </span>
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-3 mt-6">
              <Button
                onClick={handleNewGame}
                className="w-full h-12 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-amber-100 border-0"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Play New Game
              </Button>

              <Button
                onClick={() => setShowChat(true)}
                variant="outline"
                className="w-full h-12 border-purple-500/40 bg-purple-950/20 hover:bg-purple-950/40 text-purple-300 hover:text-purple-200"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat with AI about the Game
              </Button>

              <Button
                onClick={handleClose}
                variant="ghost"
                className="w-full h-10 text-[#6a6258] hover:text-[#8a8478] hover:bg-[#1a1612]"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="flex flex-row items-center justify-between border-b border-[#1a1612] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 shadow-lg">
                  <Sparkles className="w-4 h-4 text-purple-200" />
                </div>
                <div>
                  <DialogTitle className="text-[#e8e2d4] text-base">Magnus</DialogTitle>
                  <p className="text-xs text-[#6a6258]">AI Coach - Game Analysis</p>
                </div>
              </div>
              <Button
                onClick={() => setShowChat(false)}
                variant="ghost"
                size="icon-sm"
                className="text-[#6a6258] hover:text-[#8a8478] hover:bg-[#1a1612]"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogHeader>

            {/* Chat messages */}
            <div
              ref={scrollRef}
              className="flex-1 min-h-[300px] max-h-[400px] overflow-y-auto space-y-3 py-4 coach-scroll"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      message.role === 'user'
                        ? "bg-amber-900/30 border border-amber-700/30 text-[#e8e2d4]"
                        : "bg-[#1a1612] border border-[#2a2420] text-[#c9c2b4]"
                    )}
                  >
                    {getMessageContent(message)}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-900/40 border border-amber-700/30 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                  </div>
                  <div className="bg-[#1a1612] border border-[#2a2420] rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat input */}
            <form onSubmit={handleChatSubmit} className="flex gap-2 pt-3 border-t border-[#1a1612]">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about the game..."
                className="flex-1 h-10 px-3 rounded-lg bg-[#111010] border border-[#1a1612] text-[#e8e2d4] text-sm placeholder:text-[#5a554d] focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              <Button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                size="icon"
                className="h-10 w-10 bg-purple-700 hover:bg-purple-600 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>

            {/* Quick actions */}
            <div className="flex gap-2 pt-3">
              <Button
                onClick={handleNewGame}
                variant="outline"
                size="sm"
                className="flex-1 border-amber-500/30 bg-amber-950/10 hover:bg-amber-950/25 text-amber-400 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1.5" />
                New Game
              </Button>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="sm"
                className="flex-1 text-[#6a6258] hover:text-[#8a8478] hover:bg-[#1a1612] text-xs"
              >
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
