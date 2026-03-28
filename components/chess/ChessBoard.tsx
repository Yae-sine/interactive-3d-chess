'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { Square } from 'chess.js'

interface ChessBoardProps {
  selectedSquare: Square | null
  validMoves: Square[]
  lastMove: { from: Square; to: Square } | null
  hintMove: { from: Square; to: Square } | null
  isExploringParallel: boolean
  onSquareClick: (square: Square) => void
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8']

function squareToXZ(square: Square): [number, number] {
  const file = FILES.indexOf(square[0])
  const rank = RANKS.indexOf(square[1])
  return [file - 3.5, rank - 3.5]
}

function SquareMesh({
  square,
  isLight,
  isSelected,
  isValidMove,
  isLastMove,
  isHint,
  isParallel,
  onClick,
}: {
  square: Square
  isLight: boolean
  isSelected: boolean
  isValidMove: boolean
  isLastMove: boolean
  isHint: boolean
  isParallel: boolean
  onClick: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    if (isSelected || isHint) {
      const t = Date.now() * 0.003
      const mat = meshRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.3 + Math.sin(t) * 0.15
    }
  })

  const [x, z] = squareToXZ(square)

  let color: THREE.ColorRepresentation
  let emissive: THREE.ColorRepresentation = '#000000'
  let emissiveIntensity = 0

  if (isSelected) {
    color = '#4ade80'
    emissive = '#4ade80'
    emissiveIntensity = 0.3
  } else if (isHint) {
    color = '#f59e0b'
    emissive = '#f59e0b'
    emissiveIntensity = 0.4
  } else if (isValidMove) {
    color = isLight ? '#86efac' : '#22c55e'
    emissive = '#22c55e'
    emissiveIntensity = 0.15
  } else if (isLastMove) {
    color = isLight ? '#fde68a' : '#d97706'
    emissive = '#d97706'
    emissiveIntensity = 0.1
  } else if (isParallel) {
    color = isLight ? '#bfdbfe' : '#3b82f6'
    emissive = '#3b82f6'
    emissiveIntensity = 0.08
  } else {
    color = isLight ? '#e8d5b0' : '#6b93a0'
  }

  return (
    <mesh
      ref={meshRef}
      position={[x, 0, z]}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      receiveShadow
    >
      <boxGeometry args={[1, 0.12, 1]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.8}
        metalness={0.05}
      />
      {isValidMove && (
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.04, 16]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#22c55e"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </mesh>
  )
}

function BoardBorder() {
  return (
    <>
      {/* Outer frame */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[9.6, 0.18, 9.6]} />
        <meshStandardMaterial color="#2d1a0e" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Inner inlay */}
      <mesh position={[0, -0.03, 0]}>
        <boxGeometry args={[9.0, 0.02, 9.0]} />
        <meshStandardMaterial color="#4a2e1a" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Corner ornaments */}
      {[[-4.4, -4.4], [-4.4, 4.4], [4.4, -4.4], [4.4, 4.4]].map(([cx, cz], i) => (
        <mesh key={i} position={[cx, 0.05, cz]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshStandardMaterial color="#c97c2a" roughness={0.3} metalness={0.7} />
        </mesh>
      ))}
    </>
  )
}

function BoardLabels() {
  // We'll skip Three.js Text labels to avoid font loading issues
  // Labels are shown in the HUD overlay instead
  return null
}

export default function ChessBoard({
  selectedSquare,
  validMoves,
  lastMove,
  hintMove,
  isExploringParallel,
  onSquareClick,
}: ChessBoardProps) {
  const squares: Square[] = []
  for (const rank of RANKS) {
    for (const file of FILES) {
      squares.push(`${file}${rank}` as Square)
    }
  }

  return (
    <group>
      <BoardBorder />
      {squares.map((sq) => {
        const fileIdx = FILES.indexOf(sq[0])
        const rankIdx = RANKS.indexOf(sq[1])
        const isLight = (fileIdx + rankIdx) % 2 !== 0

        return (
          <SquareMesh
            key={sq}
            square={sq}
            isLight={isLight}
            isSelected={selectedSquare === sq}
            isValidMove={validMoves.includes(sq)}
            isLastMove={!!(lastMove && (lastMove.from === sq || lastMove.to === sq))}
            isHint={!!(hintMove && (hintMove.from === sq || hintMove.to === sq))}
            isParallel={isExploringParallel}
            onClick={() => onSquareClick(sq)}
          />
        )
      })}
    </group>
  )
}
