import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The codebase predates the React-Compiler-era ref rules and deliberately
      // uses the "latest ref" + effect-side-effect patterns (Stockfish worker,
      // stateRef mirrors). Keep those as warnings, not errors.
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'public/stockfish.js',
    'next-env.d.ts',
    'tsconfig.tsbuildinfo',
  ]),
])
