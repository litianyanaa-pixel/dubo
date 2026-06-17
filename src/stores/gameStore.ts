import { create } from 'zustand'
import type { SpeedMultiplier, GameMode } from '@/engine/core/types'
import type { Character } from '@/data/characters'

export type GamePhase = 'menu' | 'playing' | 'gameover'

interface GameState {
  phase: GamePhase
  speed: SpeedMultiplier
  elapsed: number
  paused: boolean
  character: Character | null
  startCash: number
  showHelp: boolean
  mode: GameMode
  /** 局内已解锁的功能 tab id */
  unlockedFeatures: string[]
  setPhase: (phase: GamePhase) => void
  setSpeed: (speed: SpeedMultiplier) => void
  setElapsed: (ms: number) => void
  setCharacter: (char: Character) => void
  setMode: (mode: GameMode) => void
  unlockFeature: (feature: string) => void
  resetFeatures: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  speed: 1,
  elapsed: 0,
  paused: false,
  character: null,
  startCash: 100_000,
  showHelp: false,
  mode: 'standard',
  unlockedFeatures: ['news', 'trades', 'social', 'create'],
  setPhase: (phase) => set({ phase }),
  setSpeed: (speed) => set({ speed, paused: speed === 0 }),
  setElapsed: (elapsed) => set({ elapsed }),
  setCharacter: (char) => set({ character: char, startCash: char.cash }),
  setMode: (mode) => set({ mode }),
  unlockFeature: (feature) => {
    if (!get().unlockedFeatures.includes(feature)) {
      set({ unlockedFeatures: [...get().unlockedFeatures, feature] })
    }
  },
  resetFeatures: () => set({ unlockedFeatures: ['news', 'trades', 'social', 'create'] }),
}))
