'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Stars } from '@react-three/drei'
import { Chess } from 'chess.js'
import type { Square } from 'chess.js'
import ChessBoard from './ChessBoard'
import ChessPiece from './ChessPiece'

interface ChessSceneProps {
  fen: string
  parallelFen: string | null
  selectedSquare: Square | null
  validMoves: Square[]
  lastMove: { from: Square; to: Square } | null
  hintMove: { from: Square; to: Square } | null
  isExploringParallel: boolean
  onSquareClick: (square: Square) => void
}

function BoardAndPieces({
  fen,
  selectedSquare,
  validMoves,
  lastMove,
  hintMove,
  isExploringParallel,
  onSquareClick,
}: {
  fen: string
  selectedSquare: Square | null
  validMoves: Square[]
  lastMove: { from: Square; to: Square } | null
  hintMove: { from: Square; to: Square } | null
  isExploringParallel: boolean
  onSquareClick: (square: Square) => void
}) {
  const chess = new Chess(fen)
  const board = chess.board()

  const pieces = board.flatMap((row, rankIdx) =>
    row.map((cell, fileIdx) => {
      if (!cell) return null
      const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
      const square = `${files[fileIdx]}${8 - rankIdx}` as Square
      return { ...cell, square }
    }).filter(Boolean)
  )

  return (
    <>
      <ChessBoard
        selectedSquare={selectedSquare}
        validMoves={validMoves}
        lastMove={lastMove}
        hintMove={hintMove}
        isExploringParallel={isExploringParallel}
        onSquareClick={onSquareClick}
      />
      {pieces.map((piece) => (
        <ChessPiece
          key={`${piece!.square}-${piece!.type}-${piece!.color}`}
          type={piece!.type}
          color={piece!.color}
          square={piece!.square}
          isSelected={selectedSquare === piece!.square}
          isParallel={isExploringParallel}
          onClick={() => onSquareClick(piece!.square)}
        />
      ))}
    </>
  )
}

function LoadingFallback() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#333" />
    </mesh>
  )
}

export default function ChessScene({
  fen,
  parallelFen,
  selectedSquare,
  validMoves,
  lastMove,
  hintMove,
  isExploringParallel,
  onSquareClick,
}: ChessSceneProps) {
  const displayFen = isExploringParallel && parallelFen ? parallelFen : fen

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 10, 8], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 12, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.5}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <pointLight position={[-5, 8, -5]} intensity={0.3} color="#c0a0ff" />
        <pointLight position={[5, 4, -5]} intensity={0.2} color="#ffd700" />

        {/* Background */}
        <Stars radius={80} depth={50} count={3000} factor={3} saturation={0.5} fade speed={0.5} />

        {/* Environment */}
        <Environment preset="studio" />

        {/* Board and pieces */}
        <Suspense fallback={<LoadingFallback />}>
          <BoardAndPieces
            fen={displayFen}
            selectedSquare={selectedSquare}
            validMoves={validMoves}
            lastMove={lastMove}
            hintMove={hintMove}
            isExploringParallel={isExploringParallel}
            onSquareClick={onSquareClick}
          />
        </Suspense>

        {/* Ground shadow */}
        <ContactShadows
          position={[0, -0.2, 0]}
          opacity={0.6}
          scale={15}
          blur={2}
          far={5}
          color="#000000"
        />

        {/* Camera controls */}
        <OrbitControls
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={8}
          maxDistance={22}
          target={[0, 0, 0]}
          enablePan={false}
          autoRotate={false}
          dampingFactor={0.08}
          enableDamping
        />
      </Canvas>
    </div>
  )
}
