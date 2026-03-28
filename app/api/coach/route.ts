import { streamText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const { fen, move, betterMove, type, history } = await req.json()

  let systemPrompt = `You are a world-class chess coach named Magnus. You teach in a clear, encouraging, and educational style. 
Keep responses concise (2-4 sentences max). Focus on chess principles: piece activity, king safety, pawn structure, material, and tactics.`

  let userPrompt = ''

  if (type === 'blunder') {
    userPrompt = `The player just played ${move} in this position (FEN: ${fen}). 
This was a blunder. The better move was ${betterMove}. 
Explain in 2-3 sentences WHY it's a blunder (what threat it missed or what advantage it gives away) and what makes ${betterMove} better. Be specific about tactics or positional factors.`
  } else if (type === 'hint') {
    userPrompt = `The player is stuck in this position (FEN: ${fen}). 
The best move is ${betterMove}. Give them a hint about the KEY idea behind this move without fully revealing it. 
Mention what principle it follows (development, tactics, king safety, etc). Keep it to 2 sentences.`
  } else if (type === 'analysis') {
    userPrompt = `Analyze the current chess position (FEN: ${fen}). 
The move history so far: ${history?.slice(-5).join(', ') || 'opening'}. 
Give a brief assessment of which side has the advantage and why, in 2-3 sentences. Mention the key strategic factors.`
  }

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    maxOutputTokens: 150,
  })

  return result.toUIMessageStreamResponse()
}
