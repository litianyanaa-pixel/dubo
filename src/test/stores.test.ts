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
    useMarketStore.getState().updatePrice('USD', 1.01)
    expect(useMarketStore.getState().prices['USD']).toBe(1.01)

    useMarketStore.getState().updatePrice('USD', 1.02)
    expect(useMarketStore.getState().prices['USD']).toBe(1.02)
    expect(useMarketStore.getState().prevPrices['USD']).toBe(1.01)
  })

  it('tracks candles', () => {
    useMarketStore.getState().updatePrice('USD', 1.01)
    useMarketStore.getState().updatePrice('USD', 1.02)

    const candles = useMarketStore.getState().candles['USD']
    expect(candles).toBeDefined()
    expect(candles!.length).toBeGreaterThanOrEqual(1)
    const last = candles![candles!.length - 1]
    expect(last.close).toBe(1.02)
    expect(last.high).toBeGreaterThanOrEqual(last.low)
  })

  it('candles caps at 300 entries', () => {
    for (let i = 0; i < 350; i++) {
      useMarketStore.getState().updatePrice('USD', 1 + i * 0.001)
    }

    const candles = useMarketStore.getState().candles['USD']
    expect(candles!.length).toBeLessThanOrEqual(300)
  })
})

describe('playerStore', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      cash: 100000,
      positions: {},
      shorts: {},
      totalTrades: 0,
    })
  })

  it('initial state', () => {
    const state = usePlayerStore.getState()
    expect(state.cash).toBe(100000)
    expect(state.totalTrades).toBe(0)
  })

  it('openLong deducts cash and creates position', () => {
    const result = usePlayerStore.getState().openLong('USD', 1.0, 1000)

    expect(result).toBe(true)
    const state = usePlayerStore.getState()
    expect(state.cash).toBe(99000)
    expect(state.positions['USD']!.amount).toBe(1000)
    expect(state.positions['USD']!.avgCost).toBe(1.0)
    expect(state.totalTrades).toBe(1)
  })

  it('openLong fails if insufficient cash', () => {
    expect(usePlayerStore.getState().openLong('USD', 1.0, 200000)).toBe(false)
    expect(usePlayerStore.getState().totalTrades).toBe(0)
  })

  it('closeLong adds cash and reduces position', () => {
    usePlayerStore.getState().openLong('USD', 1.0, 1000)
    expect(usePlayerStore.getState().closeLong('USD', 1.05, 500)).toBe(true)
    expect(usePlayerStore.getState().cash).toBe(99000 + 525)
    expect(usePlayerStore.getState().positions['USD']!.amount).toBe(500)
  })

  it('closeLong fails if insufficient position', () => {
    usePlayerStore.getState().openLong('USD', 1.0, 100)
    expect(usePlayerStore.getState().closeLong('USD', 1.0, 200)).toBe(false)
  })

  it('closeLong removes position when amount reaches 0', () => {
    usePlayerStore.getState().openLong('USD', 1.0, 100)
    usePlayerStore.getState().closeLong('USD', 1.0, 100)
    expect(usePlayerStore.getState().positions['USD']).toBeUndefined()
  })

  it('openLong averages cost on second purchase', () => {
    usePlayerStore.getState().openLong('USD', 1.0, 100)
    usePlayerStore.getState().openLong('USD', 2.0, 100)
    const pos = usePlayerStore.getState().positions['USD']!
    expect(pos.amount).toBe(200)
    expect(pos.avgCost).toBe(1.5)
  })

  it('openShort creates short position', () => {
    expect(usePlayerStore.getState().openShort('USD', 1.0, 1000)).toBe(true)
    const state = usePlayerStore.getState()
    expect(state.shorts['USD']!.amount).toBe(1000)
    expect(state.shorts['USD']!.avgEntry).toBe(1.0)
    expect(state.cash).toBe(99000)
    expect(state.totalTrades).toBe(1)
  })

  it('openShort fails if insufficient margin', () => {
    expect(usePlayerStore.getState().openShort('USD', 100, 2000)).toBe(false)
  })

  it('closeShort removes short and adjusts cash', () => {
    usePlayerStore.getState().openShort('USD', 1.0, 1000)
    // Cover at lower price = profit $200
    expect(usePlayerStore.getState().closeShort('USD', 0.8, 1000)).toBe(true)
    expect(usePlayerStore.getState().cash).toBe(100200) // 99000 + margin(1000) + pnl(200)
    expect(usePlayerStore.getState().shorts['USD']).toBeUndefined()
  })

  it('closeShort fails if insufficient short position', () => {
    usePlayerStore.getState().openShort('USD', 1.0, 100)
    expect(usePlayerStore.getState().closeShort('USD', 1.0, 200)).toBe(false)
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
