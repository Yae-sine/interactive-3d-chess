# Chess Master 3D

An interactive 3D chess game with AI opponent powered by Stockfish, featuring real-time coaching, blunder detection, and a beautiful walnut-themed board.

## Features

- **3D Interactive Board** - Drag to rotate the board in 3D space with smooth CSS transforms
- **Stockfish AI** - Play against Stockfish chess engine with 4 difficulty levels:
  - Beginner (depth 2)
  - Intermediate (depth 8)
  - Advanced (depth 14)
  - Master (depth 20)
- **AI Coach "Magnus"** - Get real-time feedback on your moves with blunder detection and suggested improvements
- **Hint System** - Request move hints when you're stuck
- **Takeback** - Undo your last move to try a different approach
- **Parallel Explorer** - Explore alternate move lines without affecting the main game
- **Move History** - Track all moves in standard algebraic notation
- **Captured Pieces** - Visual display of captured pieces with material count

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first styling
- **chess.js** - Chess move validation and game logic
- **Stockfish.js** - Chess engine running as a Web Worker
- **Vercel Analytics** - Usage tracking

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to play.

## Project Structure

```
app/
  page.tsx          # Main chess page
  layout.tsx        # Root layout with fonts
  globals.css       # Theme and styling
  api/coach/        # AI coach API endpoint (optional)

components/chess/
  Board3D.tsx       # 3D chessboard with SVG pieces
  GameHUD.tsx       # Game controls and status
  CoachPanel.tsx    # AI coaching messages
  CapturedPieces.tsx # Captured pieces display

hooks/
  use-chess-game.ts # Main game state and logic
  use-stockfish.ts  # Stockfish engine integration

lib/
  chess-engine.ts   # Types, constants, evaluation

public/
  stockfish.js      # Stockfish engine (Web Worker)
```

## How It Works

1. **Game State** - Managed by `useChessGame` hook using React state
2. **Move Validation** - chess.js validates all moves and tracks game state
3. **AI Moves** - Stockfish runs in a Web Worker, receiving FEN positions and returning best moves via UCI protocol
4. **Coaching** - Local blunder detection compares move quality; messages displayed in real-time with streaming animation

## License

MIT
