import { create } from 'zustand'
import type { SpeedMultiplier } from '@/engine/core/types'
import type { Character } from '@/data/characters'

export type GamePhase = 'menu' | 'playing'

interface GameState {
  phase: GamePhase
  speed: SpeedMultiplier
  elapsed: number
  paused: boolean
  character: Character | null
  startCash: number
  setPhase: (phase: GamePhase) => void
  setSpeed: (speed: SpeedMultiplier) => void
  setElapsed: (ms: number) => void
  setCharacter: (char: Character) => void
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'menu',
  speed: 1,
  elapsed: 0,
  paused: false,
  character: null,
  startCash: 100_000,
  setPhase: (phase) => set({ phase }),
  setSpeed: (speed) => set({ speed, paused: speed === 0 }),
  setElapsed: (elapsed) => set({ elapsed }),
  setCharacter: (char) => set({ character: char, startCash: char.cash }),
}))
