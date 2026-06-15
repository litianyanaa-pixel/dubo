import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MarketEngine } from '@/engine/market/MarketEngine'
import { ALL_ASSETS } from '@/data/assets'
import { eventBus } from '@/engine/core/EventBus'

const KAL_ASSET = ALL_ASSETS.find(a => a.id === 'KAL')!

describe('MarketEngine', () => {
  let engine: MarketEngine

  beforeEach(() => {
    engine = new MarketEngine()
    eventBus.removeAll()
  })

  it('registers and retrieves assets', () => {
    engine.registerAsset(KAL_ASSET)
    const asset = engine.getAsset('KAL')

    expect(asset).toBeDefined()
    expect(asset!.id).toBe('KAL')
    expect(asset!.currentPrice).toBe(1.0)
  })

  it('getAsset returns undefined for unknown id', () => {
    expect(engine.getAsset('UNKNOWN')).toBeUndefined()
  })

  it('updatePrices emits price:updated events', () => {
    engine.registerAsset(KAL_ASSET)

    const handler = vi.fn()
    eventBus.on('price:updated', handler)

    engine.updatePrices(1, { global: 50 })

    expect(handler).toHaveBeenCalledTimes(1)
    const data = handler.mock.calls[0][0]
    expect(data.assetId).toBe('KAL')
    expect(typeof data.price).toBe('number')
    expect(typeof data.prevPrice).toBe('number')
    expect(typeof data.change).toBe('number')
  })

  it('price stays positive after many updates', () => {
    engine.registerAsset(KAL_ASSET)

    for (let i = 0; i < 1000; i++) {
      engine.updatePrices(i, { global: 50 })
    }

    const asset = engine.getAsset('KAL')
    expect(asset!.currentPrice).toBeGreaterThan(0)
  })

  it('price changes are within expected volatility range', () => {
    engine.registerAsset(KAL_ASSET)

    const handler = vi.fn()
    eventBus.on('price:updated', handler)

    engine.updatePrices(1, { global: 50 })

    const data = handler.mock.calls[0][0]
    // Volatility is 0.0015, so max change per tick = ±0.003 (0.3%)
    expect(Math.abs(data.change)).toBeLessThanOrEqual(0.003)
  })

  it('handles multiple assets', () => {
    engine.registerAsset(KAL_ASSET)
    engine.registerAsset({
      id: 'TEST',
      name: 'Test Coin',
      type: 'crypto',
      basePrice: 100,
      currentPrice: 100,
      volatility: 0.002,
      sentimentSensitivity: 1.0,
    })

    const handler = vi.fn()
    eventBus.on('price:updated', handler)

    engine.updatePrices(1, { global: 50 })

    expect(handler).toHaveBeenCalledTimes(2)
  })
})
