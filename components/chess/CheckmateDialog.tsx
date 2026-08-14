'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { RefreshCw, MessageSquare, X, Send, User, ChevronLeft } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Crest } from './crest'

interface CheckmateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  winner: 'player' | 'ai'
  moveHistory: string[]
  onNewGame: () => void
}

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

  const moveHistoryRef = useRef(moveHistory)
  const winnerRef = useRef(winner)
  moveHistoryRef.current = moveHistory
  winnerRef.current = winner

  const moveCount = Math.ceil(moveHistory.length / 2)

  const transport = useMemo(() => new DefaultChatTransport({
    body: () => ({
      moveHistory: moveHistoryRef.current,
      result: winnerRef.current === 'player' ? 'Player (White) won by checkmate' : 'AI (Black) won by checkmate',
      playerColor: 'w',
    }),
  }), [])

  const { messages, sendMessage, status, setMessages } = useChat({ transport })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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
          "brass-border bg-[#100d0a]/95 shadow-[0_40px_120px_rgba(0,0,0,0.9),0_0_0_1px_rgba(240,217,166,0.08)] gap-0 rounded-2xl p-0 overflow-hidden",
          showChat ? "sm:max-w-2xl" : "sm:max-w-md"
        )}
      >
        {!showChat ? (
          <>
            {/* Winner banner */}
            <div
              className="relative px-6 pt-7 pb-5 text-center"
              style={{
                background: winner === 'player'
                  ? 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(135,160,138,0.14) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(194,85,46,0.14) 0%, transparent 70%)',
              }}
            >
              <div className="mx-auto mb-3 w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(201,164,92,0.08)', border: '1px solid rgba(201,164,92,0.35)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                <Crest size={42} />
              </div>
              <DialogTitle
                className={cn(
                  "font-serif text-2xl",
                  winner === 'player' ? "text-brass-bright" : "text-[#e07a52]"
                )}
              >
                Checkmate
              </DialogTitle>
              <p className="mt-2 text-sm text-foreground/70">
                {winner === 'player'
                  ? 'A game well won — clean, deliberate, and clinical.'
                  : 'The engine prevailed this time. The position rewards study.'}
              </p>
              <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full brass-border">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {moveCount} move{moveCount === 1 ? '' : 's'} ·{' '}
                  <span className="text-brass">{winner === 'player' ? 'Victory' : 'Defeat'}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 px-6 pb-6 pt-2">
              <Button
                onClick={handleNewGame}
                className="w-full h-11 text-sm font-medium"
                style={{
                  background: 'linear-gradient(180deg, #e0bb74, #b98f45)',
                  color: '#1a1208',
                  boxShadow: '0 10px 24px rgba(201,164,92,0.28), inset 0 1px 0 rgba(255,244,214,0.5)',
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Play New Game
              </Button>

              <Button
                onClick={() => setShowChat(true)}
                variant="outline"
                className="w-full h-11 text-sm font-medium brass-border bg-transparent text-brass hover:bg-brass/10"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Discuss the Game with Magnus
              </Button>

              <Button
                onClick={handleClose}
                variant="ghost"
                className="w-full h-9 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              >
                <X className="w-3.5 h-3.5 mr-2" />
                Close
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="flex flex-row items-center gap-3 px-5 py-3.5 border-b border-border/70">
              <Button
                onClick={() => setShowChat(false)}
                variant="ghost"
                size="icon-sm"
                aria-label="Back"
                className="text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Crest size={30} />
              <div className="leading-tight">
                <DialogTitle className="text-[15px] font-serif italic text-foreground">Magnus</DialogTitle>
                <p className="label-caps !text-[9px] mt-0.5">Post-game analysis</p>
              </div>
            </DialogHeader>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 min-h-[320px] max-h-[420px] overflow-y-auto space-y-3.5 px-5 py-4 atelier-scroll"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2.5 msg-in",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-7 h-7 mt-0.5 opacity-90">
                      <Crest size={28} />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[82%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                      message.role === 'user'
                        ? "bg-[#1a1208] border border-brass/25 text-foreground/90"
                        : "bg-white/[0.04] border border-border/80 text-foreground/80 font-serif"
                    )}
                  >
                    {getMessageContent(message)}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-7 h-7 mt-0.5 rounded-full bg-white/[0.05] border border-border flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2.5">
                  <div className="flex-shrink-0 w-7 h-7 opacity-90">
                    <Crest size={28} />
                  </div>
                  <div className="bg-white/[0.04] border border-border/80 rounded-xl px-3.5 py-2.5 flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-brass thinking-dot"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleChatSubmit} className="flex gap-2 px-5 py-3.5 border-t border-border/70">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Magnus about the game…"
                aria-label="Ask Magnus about the game"
                className="flex-1 h-10 px-3.5 rounded-xl bg-[#0e0b09] border border-border text-foreground text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-brass/50 transition-colors"
              />
              <Button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                aria-label="Send message"
                className="h-10 w-10 shrink-0"
                style={{
                  background: 'linear-gradient(180deg, #e0bb74, #b98f45)',
                  color: '#1a1208',
                  boxShadow: 'inset 0 1px 0 rgba(255,244,214,0.5)',
                }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}