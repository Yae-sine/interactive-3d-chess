import { streamText, convertToModelMessages } from 'ai'
import { groq } from '@ai-sdk/groq'

export const maxDuration = 60

export async function POST(req: Request) {
  const body = await req.json()
  const { messages } = body

  // Extract game context from body (sent via transport)
  const moveHistory: string[] = body.moveHistory ?? []
  const result: string = body.result ?? 'Unknown result'
  const playerColor: string = body.playerColor ?? 'w'

  // Debug: log what we received
  console.log('API received:', {
    messageCount: messages?.length,
    moveHistoryLength: moveHistory.length,
    result,
    playerColor,
    fullBody: JSON.stringify(body, null, 2)
  })

  const systemPrompt = `You are Magnus, a world-class chess coach and former world champion. You've just finished watching a chess game and are ready to discuss it with the player.

GAME DETAILS:
- The player played as: ${playerColor === 'w' ? 'White' : 'Black'}
- Game result: ${result}
- Complete move history (in algebraic notation): ${moveHistory.length > 0 ? moveHistory.join(' ') : 'No moves recorded'}
- Total moves: ${moveHistory.length} half-moves (${Math.ceil(moveHistory.length / 2)} full moves)

YOUR ROLE:
1. You have complete knowledge of all the moves played in this game
2. When the user asks about specific moves or moments, reference the actual moves from the history
3. Provide insightful analysis, point out key moments, blunders, and brilliant moves
4. Be encouraging but honest about mistakes
5. Suggest what the player could have done differently at critical points
6. If asked, explain tactical or strategic concepts that appeared in the game
7. Keep responses conversational but educational (2-5 sentences unless a detailed analysis is requested)

Remember: You watched the ENTIRE game, so you can discuss any move or position that occurred.`

  // Convert UI messages (parts format) to model messages (content format)
  const modelMessages = await convertToModelMessages(messages)

  const result_stream = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: systemPrompt,
    messages: modelMessages,
  })

  return result_stream.toUIMessageStreamResponse()
}
