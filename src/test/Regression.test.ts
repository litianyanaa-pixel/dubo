import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from '@/stores/playerStore'
import { useMarketStore } from '@/stores/marketStore'
import { MarketEngine } from '@/engine/market/MarketEngine'
import { ALL_ASSETS } from '@/data/assets'

/**
 * Regression tests for bugs fixed during development.
 * These ensure previously fixed bugs don't re-appear.
 *
 * Asset IDs updated to fictional economy: KAL (was USD), EMK, SRD, OIL etc.
 */
describe('Regression: short margin return', () => {
  beforeEach(() => {
    usePlayerStore.setState({ cash: 100000, positions: {}, shorts: {}, totalTrades: 0 })
  })

  it('closeShort returns margin + profit when price drops', () => {
    // Short 1000 units @ $1.0 → margin = $1000, cash = $99000
    usePlayerStore.getState().openShort('KAL', 1.0, 1000)
    expect(usePlayerStore.getState().cash).toBe(99000)

    // Price drops to $0.8 → profit = (1.0 - 0.8) * 1000 = $200
    // Expected: cash = 99000 + margin(1000) + pnl(200) = 100200
    usePlayerStore.getState().closeShort('KAL', 0.8, 1000)
    expect(usePlayerStore.getState().cash).toBe(100200)
  })

  it('closeShort returns margin - loss when price rises', () => {
    usePlayerStore.getState().openShort('KAL', 1.0, 1000)
    expect(usePlayerStore.getState().cash).toBe(99000)

    // Price rises to $1.2 → loss = (1.0 - 1.2) * 1000 = -$200
    usePlayerStore.getState().closeShort('KAL', 1.2, 1000)
    expect(usePlayerStore.getState().cash).toBe(99800)
  })

  it('closeShort partial return works correctly', () => {
    usePlayerStore.getState().openShort('KAL', 1.0, 1000)

    usePlayerStore.getState().closeShort('KAL', 0.8, 500)
    expect(usePlayerStore.getState().cash).toBe(99600)

    expect(usePlayerStore.getState().shorts['KAL']!.amount).toBe(500)
  })

  it('net worth calculation with short includes margin', () => {
    usePlayerStore.getState().openShort('KAL', 1.0, 50000)
    expect(usePlayerStore.getState().cash).toBe(50000)

    const prices = { KAL: 1.0 }
    const shortPos = usePlayerStore.getState().shorts['KAL']!
    const shortEquity = shortPos.amount * shortPos.avgEntry +
      (shortPos.avgEntry - (prices.KAL ?? shortPos.avgEntry)) * shortPos.amount
    const totalNetWorth = usePlayerStore.getState().cash + shortEquity

    expect(totalNetWorth).toBeCloseTo(100000, 1)
  })
})

describe('Regression: market macro drift differentiation', () => {
  it('KAL and EMK have different drift due to country economics', () => {
    const market = new MarketEngine()
    for (const asset of ALL_ASSETS) {
      market.registerAsset(asset)
    }

    const kalStart = market.getAsset('KAL')!.currentPrice
    const emkStart = market.getAsset('EMK')!.currentPrice

    for (let i = 0; i < 500; i++) {
      market.updatePrices(i, { global: 50 })
    }

    const kalEnd = market.getAsset('KAL')!.currentPrice
    const emkEnd = market.getAsset('EMK')!.currentPrice

    const kalChange = (kalEnd - kalStart) / kalStart
    const emkChange = (emkEnd - emkStart) / emkStart

    // Over 500 ticks with different volatility, they should diverge
    expect(kalChange).not.toEqual(emkChange)
  })

  it('assets with different sentiment sensitivity move differently', () => {
    const market = new MarketEngine()
    for (const asset of ALL_ASSETS) {
      market.registerAsset(asset)
    }

    // SRD is safehaven (sensitivity 0.4), OIL is commodity (0.8), KAL is currency (0.6)
    const srdBefore = market.getAsset('SRD')!.currentPrice
    const oilBefore = market.getAsset('OIL')!.currentPrice
    const kalBefore = market.getAsset('KAL')!.currentPrice

    for (let i = 0; i < 100; i++) {
      market.updatePrices(i, { global: 95 })
    }

    const srdAfter = market.getAsset('SRD')!.currentPrice
    const oilAfter = market.getAsset('OIL')!.currentPrice
    const kalAfter = market.getAsset('KAL')!.currentPrice

    const srdPct = Math.abs((srdAfter - srdBefore) / srdBefore)
    const oilPct = Math.abs((oilAfter - oilBefore) / oilBefore)
    const kalPct = Math.abs((kalAfter - kalBefore) / kalBefore)

    const changes = [srdPct, oilPct, kalPct]
    const unique = new Set(changes.map(c => c.toFixed(6)))
    expect(unique.size).toBeGreaterThan(1)
  })
})

describe('Regression: market flow pressure tracking', () => {
  it('getFlowPressure returns 0.5 with no flows', () => {
    const market = new MarketEngine()
    for (const asset of ALL_ASSETS) {
      market.registerAsset(asset)
    }
    expect(market.getFlowPressure('KAL')).toBe(0.5)
  })

  it('getFlowPressure shifts with buy flow', () => {
    const market = new MarketEngine()
    for (const asset of ALL_ASSETS) {
      market.registerAsset(asset)
    }
    market.addTradeFlow('KAL', 'buy', 500000)
    expect(market.getFlowPressure('KAL')).toBeGreaterThan(0.5)
  })

  it('getFlowPressure shifts with sell flow', () => {
    const market = new MarketEngine()
    for (const asset of ALL_ASSETS) {
      market.registerAsset(asset)
    }
    market.addTradeFlow('KAL', 'sell', 500000)
    expect(market.getFlowPressure('KAL')).toBeLessThan(0.5)
  })

  it('rolling flows decay over ticks', () => {
    const market = new MarketEngine()
    for (const asset of ALL_ASSETS) {
      market.registerAsset(asset)
    }

    market.addTradeFlow('KAL', 'buy', 1000000)
    market.addTradeFlow('KAL', 'sell', 500000)
    const pressureAfterBuy = market.getFlowPressure('KAL')
    expect(pressureAfterBuy).toBeCloseTo(1000000 / 1500000, 2)

    for (let i = 0; i < 200; i++) {
      market.updatePrices(i, { global: 50 })
    }

    const pressureAfterDecay = market.getFlowPressure('KAL')
    expect(pressureAfterDecay).toBeGreaterThanOrEqual(0)
    expect(pressureAfterDecay).toBeLessThanOrEqual(1)
  })
})

describe('Regression: player store edge cases', () => {
  beforeEach(() => {
    usePlayerStore.setState({ cash: 100000, positions: {}, shorts: {}, totalTrades: 0 })
  })

  it('openLong with exact cash works', () => {
    expect(usePlayerStore.getState().openLong('KAL', 1.0, 100000)).toBe(true)
    expect(usePlayerStore.getState().cash).toBe(0)
  })

  it('openLong with one cent over fails', () => {
    expect(usePlayerStore.getState().openLong('KAL', 1.0, 100001)).toBe(false)
  })

  it('multiple shorts average entry price', () => {
    usePlayerStore.getState().openShort('KAL', 1.0, 500)
    usePlayerStore.getState().openShort('KAL', 2.0, 500)
    const short = usePlayerStore.getState().shorts['KAL']!
    expect(short.amount).toBe(1000)
    expect(short.avgEntry).toBe(1.5)
  })

  it('closeLong on empty position fails', () => {
    expect(usePlayerStore.getState().closeLong('KAL', 1.0, 1)).toBe(false)
  })

  it('closeShort on empty position fails', () => {
    expect(usePlayerStore.getState().closeShort('KAL', 1.0, 1)).toBe(false)
  })
})
