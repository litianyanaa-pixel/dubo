import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '@/stores/gameStore'
import { useMarketStore } from '@/stores/marketStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useSentimentStore } from '@/stores/sentimentStore'

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.setState({ speed: 1, elapsed: 0, paused: false })
  })

  it('initial state', () => {
    const state = useGameStore.getState()
    expect(state.speed).toBe(1)
    expect(state.elapsed).toBe(0)
    expect(state.paused).toBe(false)
  })

  it('setSpeed updates speed and paused', () => {
    useGameStore.getState().setSpeed(0)
    expect(useGameStore.getState().speed).toBe(0)
    expect(useGameStore.getState().paused).toBe(true)

    useGameStore.getState().setSpeed(3)
    expect(useGameStore.getState().speed).toBe(3)
    expect(useGameStore.getState().paused).toBe(false)
  })

  it('setElapsed updates elapsed', () => {
    useGameStore.getState().setElapsed(5000)
    expect(useGameStore.getState().elapsed).toBe(5000)
  })
})

describe('marketStore', () => {
  beforeEach(() => {
    useMarketStore.setState({ prices: {}, prevPrices: {}, candles: {} })
  })

  it('initial state is empty', () => {
    const state = useMarketStore.getState()
    expect(Object.keys(state.prices)).toHaveLength(0)
  })

  it('updatePrice sets current and previous price', () => {
    useMarketStore.getState().updatePrice('KAL', 1.01)
    expect(useMarketStore.getState().prices['KAL']).toBe(1.01)

    useMarketStore.getState().updatePrice('KAL', 1.02)
    expect(useMarketStore.getState().prices['KAL']).toBe(1.02)
    expect(useMarketStore.getState().prevPrices['KAL']).toBe(1.01)
  })

  it('tracks candles', () => {
    useMarketStore.getState().updatePrice('KAL', 1.01)
    useMarketStore.getState().updatePrice('KAL', 1.02)

    const candles = useMarketStore.getState().candles['KAL']
    expect(candles).toBeDefined()
    expect(candles!.length).toBeGreaterThanOrEqual(1)
    const last = candles![candles!.length - 1]
    expect(last.close).toBe(1.02)
    expect(last.high).toBeGreaterThanOrEqual(last.low)
  })

  it('candles caps at 300 entries', () => {
    for (let i = 0; i < 350; i++) {
      useMarketStore.getState().updatePrice('KAL', 1 + i * 0.001)
    }

    const candles = useMarketStore.getState().candles['KAL']
    expect(candles!.length).toBeLessThanOrEqual(300)
  })
})

describe('playerStore', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      cash: 100000,
      positions: {},
      totalTrades: 0,
    })
  })

  it('initial state', () => {
    const state = usePlayerStore.getState()
    expect(state.cash).toBe(100000)
    expect(state.totalTrades).toBe(0)
  })

  it('buy deducts cash and creates position', () => {
    const result = usePlayerStore.getState().buy('KAL', 1.0, 1000)

    expect(result).toBe(true)
    const state = usePlayerStore.getState()
    expect(state.cash).toBe(99000)
    expect(state.positions['KAL']).toBeDefined()
    expect(state.positions['KAL']!.amount).toBe(1000)
    expect(state.positions['KAL']!.avgCost).toBe(1.0)
    expect(state.totalTrades).toBe(1)
  })

  it('buy fails if insufficient cash', () => {
    const result = usePlayerStore.getState().buy('KAL', 1.0, 200000)

    expect(result).toBe(false)
    expect(usePlayerStore.getState().cash).toBe(100000)
    expect(usePlayerStore.getState().totalTrades).toBe(0)
  })

  it('sell adds cash and reduces position', () => {
    usePlayerStore.getState().buy('KAL', 1.0, 1000)
    const result = usePlayerStore.getState().sell('KAL', 1.05, 500)

    expect(result).toBe(true)
    const state = usePlayerStore.getState()
    expect(state.cash).toBe(99000 + 525)
    expect(state.positions['KAL']!.amount).toBe(500)
    expect(state.totalTrades).toBe(2)
  })

  it('sell fails if insufficient position', () => {
    usePlayerStore.getState().buy('KAL', 1.0, 100)
    const result = usePlayerStore.getState().sell('KAL', 1.0, 200)

    expect(result).toBe(false)
    expect(usePlayerStore.getState().totalTrades).toBe(1)
  })

  it('sell removes position when amount reaches 0', () => {
    usePlayerStore.getState().buy('KAL', 1.0, 100)
    usePlayerStore.getState().sell('KAL', 1.0, 100)

    expect(usePlayerStore.getState().positions['KAL']).toBeUndefined()
  })

  it('buy averages cost on second purchase', () => {
    usePlayerStore.getState().buy('KAL', 1.0, 100)
    usePlayerStore.getState().buy('KAL', 2.0, 100)

    const pos = usePlayerStore.getState().positions['KAL']!
    expect(pos.amount).toBe(200)
    expect(pos.avgCost).toBe(1.5)
  })
})

describe('sentimentStore', () => {
  beforeEach(() => {
    useSentimentStore.setState({ global: 50 })
  })

  it('initial state', () => {
    expect(useSentimentStore.getState().global).toBe(50)
  })

  it('setGlobal updates value', () => {
    useSentimentStore.getState().setGlobal(75)
    expect(useSentimentStore.getState().global).toBe(75)
  })
})
