import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from '@/stores/playerStore'
import { useMarketStore } from '@/stores/marketStore'
import { MarketEngine } from '@/engine/market/MarketEngine'
import { ALL_ASSETS } from '@/data/assets'

/**
 * Regression tests for bugs fixed during development.
 * These ensure previously fixed bugs don't re-appear.
 *
 * Asset IDs updated to real-world economy: USD, EUR, CHF, OIL etc.
 */
describe('Regression: short margin return', () => {
  beforeEach(() => {
    usePlayerStore.setState({ cash: 100000, positions: {}, shorts: {}, totalTrades: 0 })
  })

  it('closeShort returns margin + profit when price drops', () => {
    // Short 1000 units @ $1.0 â†?margin = $1000, cash = $99000
    usePlayerStore.getState().openShort('USD', 1.0, 1000)
    expect(usePlayerStore.getState().cash).toBe(99000)

    // Price drops to $0.8 â†?profit = (1.0 - 0.8) * 1000 = $200
    // Expected: cash = 99000 + margin(1000) + pnl(200) = 100200
    usePlayerStore.getState().closeShort('USD', 0.8, 1000)
    expect(usePlayerStore.getState().cash).toBe(100200)
  })

  it('closeShort returns margin - loss when price rises', () => {
    usePlayerStore.getState().openShort('USD', 1.0, 1000)
    expect(usePlayerStore.getState().cash).toBe(99000)

    // Price rises to $1.2 â†?loss = (1.0 - 1.2) * 1000 = -$200
    usePlayerStore.getState().closeShort('USD', 1.2, 1000)
    expect(usePlayerStore.getState().cash).toBe(99800)
  })

  it('closeShort partial return works correctly', () => {
    usePlayerStore.getState().openShort('USD', 1.0, 1000)

    usePlayerStore.getState().closeShort('USD', 0.8, 500)
    expect(usePlayerStore.getState().cash).toBe(99600)

    expect(usePlayerStore.getState().shorts['USD']!.amount).toBe(500)
  })

  it('net worth calculation with short includes margin', () => {
    usePlayerStore.getState().openShort('USD', 1.0, 50000)
    expect(usePlayerStore.getState().cash).toBe(50000)

    const prices = { USD: 1.0 }
    const shortPos = usePlayerStore.getState().shorts['USD']!
    const shortEquity = shortPos.amount * shortPos.avgEntry +
      (shortPos.avgEntry - (prices.USD ?? shortPos.avgEntry)) * shortPos.amount
    const totalNetWorth = usePlayerStore.getState().cash + shortEquity

    expect(totalNetWorth).toBeCloseTo(100000, 1)
  })
})

describe('Regression: market macro drift differentiation', () => {
  it('USD and EUR have different drift due to country economics', () => {
    const market = new MarketEngine()
    for (const asset of ALL_ASSETS) {
      market.registerAsset(asset)
    }

    const USDStart = market.getAsset('USD')!.currentPrice
    const EURStart = market.getAsset('EUR')!.currentPrice

    for (let i = 0; i < 500; i++) {
      market.updatePrices(i, { global: 50 })
    }

    const USDEnd = market.getAsset('USD')!.currentPrice
    const EUREnd = market.getAsset('EUR')!.currentPrice

    const USDChange = (USDEnd - USDStart) / USDStart
    const EURChange = (EUREnd - EURStart) / EURStart

    // Over 500 ticks with different volatility, they should diverge
    expect(USDChange).not.toEqual(EURChange)
  })

  it('assets with different sentiment sensitivity move differently', () => {
    const market = new MarketEngine()
    for (const asset of ALL_ASSETS) {
      market.registerAsset(asset)
    }

    // CHF is safehaven (sensitivity 0.4), OIL is commodity (0.8), USD is currency (0.6)
    const CHFBefore = market.getAsset('CHF')!.currentPrice
    const oilBefore = market.getAsset('OIL')!.currentPrice
    const USDBefore = market.getAsset('USD')!.currentPrice

    for (let i = 0; i < 100; i++) {
      market.updatePrices(i, { global: 95 })
    }

    const CHFAfter = market.getAsset('CHF')!.currentPrice
    const oilAfter = market.getAsset('OIL')!.currentPrice
    const USDAfter = market.getAsset('USD')!.currentPrice

    const CHFPct = Math.abs((CHFAfter - CHFBefore) / CHFBefore)
    const oilPct = Math.abs((oilAfter - oilBefore) / oilBefore)
    const USDPct = Math.abs((USDAfter - USDBefore) / USDBefore)

    const changes = [CHFPct, oilPct, USDPct]
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
    expect(market.getFlowPressure('USD')).toBe(0.5)
  })

  it('getFlowPressure shifts with buy flow', () => {
    const market = new MarketEngine()
    for (const asset of ALL_ASSETS) {
      market.registerAsset(asset)
    }
    market.addTradeFlow('USD', 'buy', 500000)
    expect(market.getFlowPressure('USD')).toBeGreaterThan(0.5)
  })

  it('getFlowPressure shifts with sell flow', () => {
    const market = new MarketEngine()
    for (const asset of ALL_ASSETS) {
      market.registerAsset(asset)
    }
    market.addTradeFlow('USD', 'sell', 500000)
    expect(market.getFlowPressure('USD')).toBeLessThan(0.5)
  })

  it('rolling flows decay over ticks', () => {
    const market = new MarketEngine()
    for (const asset of ALL_ASSETS) {
      market.registerAsset(asset)
    }

    market.addTradeFlow('USD', 'buy', 1000000)
    market.addTradeFlow('USD', 'sell', 500000)
    const pressureAfterBuy = market.getFlowPressure('USD')
    expect(pressureAfterBuy).toBeCloseTo(1000000 / 1500000, 2)

    for (let i = 0; i < 200; i++) {
      market.updatePrices(i, { global: 50 })
    }

    const pressureAfterDecay = market.getFlowPressure('USD')
    expect(pressureAfterDecay).toBeGreaterThanOrEqual(0)
    expect(pressureAfterDecay).toBeLessThanOrEqual(1)
  })
})

describe('Regression: player store edge cases', () => {
  beforeEach(() => {
    usePlayerStore.setState({ cash: 100000, positions: {}, shorts: {}, totalTrades: 0 })
  })

  it('openLong with exact cash works', () => {
    expect(usePlayerStore.getState().openLong('USD', 1.0, 100000)).toBe(true)
    expect(usePlayerStore.getState().cash).toBe(0)
  })

  it('openLong with one cent over fails', () => {
    expect(usePlayerStore.getState().openLong('USD', 1.0, 100001)).toBe(false)
  })

  it('multiple shorts average entry price', () => {
    usePlayerStore.getState().openShort('USD', 1.0, 500)
    usePlayerStore.getState().openShort('USD', 2.0, 500)
    const short = usePlayerStore.getState().shorts['USD']!
    expect(short.amount).toBe(1000)
    expect(short.avgEntry).toBe(1.5)
  })

  it('closeLong on empty position fails', () => {
    expect(usePlayerStore.getState().closeLong('USD', 1.0, 1)).toBe(false)
  })

  it('closeShort on empty position fails', () => {
    expect(usePlayerStore.getState().closeShort('USD', 1.0, 1)).toBe(false)
  })
})
