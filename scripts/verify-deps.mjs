// This script verifies the chess dependencies are listed in package.json
import { readFileSync } from 'fs'
import { resolve } from 'path'

const pkg = JSON.parse(readFileSync(resolve('/vercel/share/v0-project/package.json'), 'utf8'))

const required = ['chess.js', '@react-three/fiber', '@react-three/drei', 'three', 'ai', '@ai-sdk/react']
const missing = required.filter(dep => !pkg.dependencies[dep])

if (missing.length > 0) {
  console.log('[v0] Missing deps:', missing.join(', '))
} else {
  console.log('[v0] All required dependencies are present in package.json:', required.join(', '))
}
