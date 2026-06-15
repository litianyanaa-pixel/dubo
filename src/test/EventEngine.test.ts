import { describe, it, expect, beforeEach } from 'vitest'
import { EventEngine } from '@/engine/event/EventEngine'
import { eventBus } from '@/engine/core/EventBus'

describe('EventEngine', () => {
  let engine: EventEngine

  beforeEach(() => {
    engine = new EventEngine()
    eventBus.removeAll()
  })

  it('tick sometimes returns null (random chance)', () => {
    let nulls = 0
    for (let i = 0; i < 100; i++) {
      if (engine.tick() === null) nulls++
    }
    // 40% chance of no event per tick, so expect some nulls
    expect(nulls).toBeGreaterThan(0)
  })

  it('tick sometimes returns an event', () => {
    let events = 0
    for (let i = 0; i < 100; i++) {
      if (engine.tick() !== null) events++
    }
    expect(events).toBeGreaterThan(0)
  })

  it('returned events have required fields', () => {
    for (let i = 0; i < 200; i++) {
      const event = engine.tick()
      if (event) {
        expect(event.id).toBeDefined()
        expect(event.title.length).toBeGreaterThan(0)
        expect(event.description.length).toBeGreaterThan(0)
        expect(typeof event.priceImpact).toBe('number')
        expect(typeof event.sentimentImpact).toBe('number')
        expect(typeof event.tier).toBe('number')
      }
    }
  })

  it('fires both tier-3 and tier-4 events', () => {
    const tiers = new Set<number>()
    for (let i = 0; i < 500; i++) {
      const event = engine.tick()
      if (event) tiers.add(event.tier)
    }
    expect(tiers.has(3)).toBe(true)
    expect(tiers.has(4)).toBe(true)
  })

  it('tier-4 events have larger price impact than tier-3', () => {
    let maxTier3 = 0
    let minTier4 = Infinity

    for (let i = 0; i < 500; i++) {
      const event = engine.tick()
      if (event) {
        const absImpact = Math.abs(event.priceImpact)
        if (event.tier === 3) maxTier3 = Math.max(maxTier3, absImpact)
        if (event.tier === 4) minTier4 = Math.min(minTier4, absImpact)
      }
    }

    // Tier 4 events should generally have larger impacts
    expect(minTier4).toBeGreaterThan(maxTier3 * 0.5)
  })

  it('some events target specific assets', () => {
    const targeted = new Set<string>()
    for (let i = 0; i < 500; i++) {
      const event = engine.tick()
      if (event?.targetAsset) targeted.add(event.targetAsset)
    }
    expect(targeted.size).toBeGreaterThan(0)
  })

  it('some events are global (no targetAsset)', () => {
    let globalCount = 0
    for (let i = 0; i < 500; i++) {
      const event = engine.tick()
      if (event && !event.targetAsset) globalCount++
    }
    expect(globalCount).toBeGreaterThan(0)
  })

  it('tick emits event:triggered on event bus', () => {
    let triggered = false
    eventBus.on('event:triggered', () => { triggered = true })

    for (let i = 0; i < 100; i++) {
      engine.tick()
      if (triggered) break
    }
    expect(triggered).toBe(true)
  })

  it('events include both positive and negative price impacts', () => {
    let hasPositive = false
    let hasNegative = false
    for (let i = 0; i < 500; i++) {
      const event = engine.tick()
      if (event) {
        if (event.priceImpact > 0) hasPositive = true
        if (event.priceImpact < 0) hasNegative = true
      }
    }
    expect(hasPositive).toBe(true)
    expect(hasNegative).toBe(true)
  })
})
