import { create } from 'zustand'
import type { SpeedMultiplier } from '@/engine/core/types'

interface GameState {
  speed: SpeedMultiplier
  elapsed: number
  paused: boolean
  setSpeed: (speed: SpeedMultiplier) => void
  setElapsed: (ms: number) => void
}

export const useGameStore = create<GameState>((set) => ({
  speed: 1,
  elapsed: 0,
  paused: false,
  setSpeed: (speed) => set({ speed, paused: speed === 0 }),
  setElapsed: (elapsed) => set({ elapsed }),
}))
