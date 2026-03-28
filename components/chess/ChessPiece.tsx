'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Square } from 'chess.js'

interface ChessPieceProps {
  type: string
  color: 'w' | 'b'
  square: Square
  isSelected: boolean
  isParallel?: boolean
  onClick: () => void
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8']

function squareToXZ(square: Square): [number, number] {
  const file = FILES.indexOf(square[0])
  const rank = RANKS.indexOf(square[1])
  return [file - 3.5, rank - 3.5]
}

// Pawn shape
function PawnMesh({ color, isSelected }: { color: 'w' | 'b'; isSelected: boolean }) {
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.12, 16]} />
        <meshStandardMaterial color={color === 'w' ? '#f0e6d0' : '#1a1a2e'} roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 0.22, 12]} />
        <meshStandardMaterial color={color === 'w' ? '#f0e6d0' : '#1a1a2e'} roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.44, 0]}>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshStandardMaterial
          color={color === 'w' ? '#f5f0e8' : '#252540'}
          roughness={0.2}
          metalness={0.5}
          emissive={isSelected ? (color === 'w' ? '#ffffffaa' : '#6666ff') : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
    </group>
  )
}

// Rook shape
function RookMesh({ color, isSelected }: { color: 'w' | 'b'; isSelected: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.14, 16]} />
        <meshStandardMaterial color={color === 'w' ? '#f0e6d0' : '#1a1a2e'} roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.28, 12]} />
        <meshStandardMaterial color={color === 'w' ? '#f0e6d0' : '#1a1a2e'} roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.26, 0.22, 0.1, 16]} />
        <meshStandardMaterial color={color === 'w' ? '#f0e6d0' : '#1a1a2e'} roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Battlements */}
      {[0, 1, 2, 3].map(i => (
        <mesh key={i} position={[Math.cos(i * Math.PI / 2) * 0.18, 0.58, Math.sin(i * Math.PI / 2) * 0.18]}>
          <boxGeometry args={[0.1, 0.16, 0.1]} />
          <meshStandardMaterial
            color={color === 'w' ? '#f5f0e8' : '#252540'}
            roughness={0.2} metalness={0.6}
            emissive={isSelected ? '#ffffff' : '#000000'}
            emissiveIntensity={isSelected ? 0.2 : 0}
          />
        </mesh>
      ))}
    </group>
  )
}

// Knight shape
function KnightMesh({ color, isSelected }: { color: 'w' | 'b'; isSelected: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.14, 16]} />
        <meshStandardMaterial color={color === 'w' ? '#f0e6d0' : '#1a1a2e'} roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.14, 0.2, 0.22, 12]} />
        <meshStandardMaterial color={color === 'w' ? '#f0e6d0' : '#1a1a2e'} roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Horse head - angled box */}
      <mesh position={[0.05, 0.46, 0]} rotation={[0.3, 0, -0.2]}>
        <boxGeometry args={[0.22, 0.32, 0.18]} />
        <meshStandardMaterial
          color={color === 'w' ? '#f5f0e8' : '#252540'}
          roughness={0.2} metalness={0.5}
          emissive={isSelected ? '#ffffff' : '#000000'}
          emissiveIntensity={isSelected ? 0.25 : 0}
        />
      </mesh>
      {/* Snout */}
      <mesh position={[0.16, 0.38, 0]} rotation={[0, 0, 0.4]}>
        <boxGeometry args={[0.14, 0.1, 0.12]} />
        <meshStandardMaterial color={color === 'w' ? '#f0e6d0' : '#1a1a2e'} roughness={0.3} metalness={0.4} />
      </mesh>
    </group>
  )
}

// Bishop shape
function BishopMesh({ color, isSelected }: { color: 'w' | 'b'; isSelected: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.14, 16]} />
        <meshStandardMaterial color={color === 'w' ? '#f0e6d0' : '#1a1a2e'} roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.09, 0.18, 0.38, 12]} />
        <meshStandardMaterial color={color === 'w' ? '#f0e6d0' : '#1a1a2e'} roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.14, 12, 10]} />
        <meshStandardMaterial color={color === 'w' ? '#f5f0e8' : '#252540'} roughness={0.2} metalness={0.5} />
      </mesh>
      {/* Mitre top */}
      <mesh position={[0, 0.68, 0]}>
        <coneGeometry args={[0.06, 0.14, 8]} />
        <meshStandardMaterial
          color={color === 'w' ? '#ffffff' : '#3a3a6a'}
          roughness={0.1} metalness={0.7}
          emissive={isSelected ? '#ffffff' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
    </group>
  )
}

// Queen shape
function QueenMesh({ color, isSelected }: { color: 'w' | 'b'; isSelected: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.32, 0.36, 0.16, 20]} />
        <meshStandardMaterial color={color === 'w' ? '#f0e6d0' : '#1a1a2e'} roughness={0.25} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.12, 0.22, 0.38, 16]} />
        <meshStandardMaterial color={color === 'w' ? '#f0e6d0' : '#1a1a2e'} roughness={0.25} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.54, 0]}>
        <cylinderGeometry args={[0.22, 0.16, 0.1, 16]} />
        <meshStandardMaterial color={color === 'w' ? '#f0e6d0' : '#1a1a2e'} roughness={0.25} metalness={0.5} />
      </mesh>
      {/* Crown points */}
      {[0, 1, 2, 3, 4].map(i => (
        <mesh key={i} position={[Math.cos(i * 2 * Math.PI / 5) * 0.18, 0.72, Math.sin(i * 2 * Math.PI / 5) * 0.18]}>
          <coneGeometry args={[0.04, 0.14, 6]} />
          <meshStandardMaterial
            color={color === 'w' ? '#ffd700' : '#c0a000'}
            roughness={0.1} metalness={0.9}
            emissive={isSelected ? '#ffd700' : '#000000'}
            emissiveIntensity={isSelected ? 0.4 : 0}
          />
        </mesh>
      ))}
      {/* Orb */}
      <mesh position={[0, 0.64, 0]}>
        <sphereGeometry args={[0.1, 12, 10]} />
        <meshStandardMaterial
          color={color === 'w' ? '#ffefd0' : '#4040a0'}
          roughness={0.1} metalness={0.8}
          emissive={isSelected ? '#ffffff' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
    </group>
  )
}

// King shape
function KingMesh({ color, isSelected }: { color: 'w' | 'b'; isSelected: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.32, 0.36, 0.16, 20]} />
        <meshStandardMaterial color={color === 'w' ? '#f0e6d0' : '#1a1a2e'} roughness={0.25} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.14, 0.22, 0.4, 16]} />
        <meshStandardMaterial color={color === 'w' ? '#f0e6d0' : '#1a1a2e'} roughness={0.25} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.56, 0]}>
        <cylinderGeometry args={[0.22, 0.16, 0.1, 16]} />
        <meshStandardMaterial color={color === 'w' ? '#f0e6d0' : '#1a1a2e'} roughness={0.25} metalness={0.5} />
      </mesh>
      {/* Cross vertical */}
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[0.08, 0.28, 0.08]} />
        <meshStandardMaterial
          color={color === 'w' ? '#ffd700' : '#c0a000'}
          roughness={0.1} metalness={0.9}
          emissive={isSelected ? '#ffd700' : '#000000'}
          emissiveIntensity={isSelected ? 0.5 : 0}
        />
      </mesh>
      {/* Cross horizontal */}
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[0.22, 0.08, 0.08]} />
        <meshStandardMaterial
          color={color === 'w' ? '#ffd700' : '#c0a000'}
          roughness={0.1} metalness={0.9}
          emissive={isSelected ? '#ffd700' : '#000000'}
          emissiveIntensity={isSelected ? 0.5 : 0}
        />
      </mesh>
    </group>
  )
}

export default function ChessPiece({
  type,
  color,
  square,
  isSelected,
  isParallel = false,
  onClick,
}: ChessPieceProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [x, z] = squareToXZ(square)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const targetY = isSelected ? 0.22 : 0.06
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.12
    if (isSelected) {
      groupRef.current.rotation.y += delta * 0.8
    }
  })

  const pieceProps = { color, isSelected }

  return (
    <group
      ref={groupRef}
      position={[x, 0.06, z]}
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
      {type === 'p' && <PawnMesh {...pieceProps} />}
      {type === 'r' && <RookMesh {...pieceProps} />}
      {type === 'n' && <KnightMesh {...pieceProps} />}
      {type === 'b' && <BishopMesh {...pieceProps} />}
      {type === 'q' && <QueenMesh {...pieceProps} />}
      {type === 'k' && <KingMesh {...pieceProps} />}
      {/* Selection glow ring */}
      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.45, 32]} />
          <meshStandardMaterial
            color="#4ade80"
            emissive="#4ade80"
            emissiveIntensity={0.8}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}
      {/* Parallel mode tint overlay */}
      {isParallel && (
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.5, 8, 6]} />
          <meshStandardMaterial
            color="#3b82f6"
            transparent
            opacity={0.08}
          />
        </mesh>
      )}
    </group>
  )
}
