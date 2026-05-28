export type GameMode = 'flash' | 'standard' | 'marathon' | 'sandbox'
export type SpeedMultiplier = 0 | 1 | 2 | 3

export interface TickContext {
  tick: number
  elapsed: number
  deltaMs: number
  speed: SpeedMultiplier
}

export type TickLayer = 0 | 1 | 2 | 3 | 4 | 5

export const TICK_INTERVALS: Record<TickLayer, number> = {
  0: 500,
  1: 2000,
  2: 3000,
  3: 5000,
  4: 30000,
  5: 60000,
}
