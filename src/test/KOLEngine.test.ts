import { describe, it, expect, beforeEach } from 'vitest'
import { KOLEngine, type KOLDirection } from '@/engine/kol/KOLEngine'
import { eventBus } from '@/engine/core/EventBus'

describe('KOLEngine', () => {
  let engine: KOLEngine

  beforeEach(() => {
    engine = new KOLEngine()
    eventBus.removeAll()
  })

  it('initializes with 5 KOLs from pool', () => {
    const kols = engine.getKOLs()
    expect(kols.length).toBe(5)
    expect(kols[0].name).toBe('华尔街狼王')
    expect(kols[0].specialty).toBe('KAL')
    expect(kols[0].hired).toBe(false)
    expect(kols[0].cooldown).toBe(0)
  })

  it('hire marks KOL as hired', () => {
    const kols = engine.getKOLs()
    const result = engine.hire(kols[0].id)
    expect(result).not.toBeNull()
    expect(result!.hired).toBe(true)
    expect(engine.getKOLs()[0].hired).toBe(true)
  })

  it('hire returns null for already hired KOL', () => {
    const kols = engine.getKOLs()
    engine.hire(kols[0].id)
    const result = engine.hire(kols[0].id)
    expect(result).toBeNull()
  })

  it('hire returns null for unknown id', () => {
    expect(engine.hire('nonexistent')).toBeNull()
  })

  it('command returns null for unhired KOL', () => {
    const kols = engine.getKOLs()
    const result = engine.command(kols[0].id, 'bullish', 1)
    expect(result).toBeNull()
  })

  it('command returns content and sentimentImpact for hired KOL', () => {
    const kols = engine.getKOLs()
    engine.hire(kols[0].id)
    const result = engine.command(kols[0].id, 'bullish', 1)
    expect(result).not.toBeNull()
    expect(result!.content).toContain(kols[0].name)
    expect(result!.content).toContain(kols[0].specialty)
    expect(typeof result!.sentimentImpact).toBe('number')
    expect(result!.specialty).toBe(kols[0].specialty)
    expect(typeof result!.priceDirection).toBe('number')
  })

  it('command direction affects sentiment sign', () => {
    const kols = engine.getKOLs()
    engine.hire(kols[0].id)

    const bullish = engine.command(kols[0].id, 'bullish', 1)!
    engine.getKOLs()[0].cooldown = 0 // reset
    const bearish = engine.command(kols[0].id, 'bearish', 2)!
    engine.getKOLs()[0].cooldown = 0
    const panic = engine.command(kols[0].id, 'panic', 3)!
    engine.getKOLs()[0].cooldown = 0
    const greed = engine.command(kols[0].id, 'greed', 4)!

    expect(bullish.sentimentImpact).toBeGreaterThan(0)
    expect(bearish.sentimentImpact).toBeLessThan(0)
    expect(panic.sentimentImpact).toBeLessThan(0)
    expect(greed.sentimentImpact).toBeGreaterThan(0)
  })

  it('command direction affects priceDirection sign', () => {
    const kols = engine.getKOLs()
    engine.hire(kols[0].id)

    const bullish = engine.command(kols[0].id, 'bullish', 1)!
    engine.getKOLs()[0].cooldown = 0
    const bearish = engine.command(kols[0].id, 'bearish', 2)!

    expect(bullish.priceDirection).toBeGreaterThan(0)
    expect(bearish.priceDirection).toBeLessThan(0)
  })

  it('panic has amplified multiplier vs bullish', () => {
    const kols = engine.getKOLs()
    engine.hire(kols[0].id)

    const bullish = engine.command(kols[0].id, 'bullish', 1)!
    engine.getKOLs()[0].cooldown = 0
    const panic = engine.command(kols[0].id, 'panic', 2)!

    // Panic has 2.0x multiplier, bullish has 1.0x
    expect(Math.abs(panic.sentimentImpact)).toBeGreaterThan(Math.abs(bullish.sentimentImpact) * 1.5)
  })

  it('command sets cooldown and blocks subsequent commands', () => {
    const kols = engine.getKOLs()
    engine.hire(kols[0].id)

    const first = engine.command(kols[0].id, 'bullish', 1)
    expect(first).not.toBeNull()

    const second = engine.command(kols[0].id, 'bearish', 2)
    expect(second).toBeNull()
  })

  it('tick reduces cooldown allowing command again', () => {
    const kols = engine.getKOLs()
    engine.hire(kols[0].id)

    engine.command(kols[0].id, 'bullish', 1)
    expect(kols[0].cooldown).toBe(3)

    engine.tick(2)
    expect(kols[0].cooldown).toBe(2)

    engine.tick(3)
    expect(kols[0].cooldown).toBe(1)

    engine.tick(4)
    expect(kols[0].cooldown).toBe(0)

    const result = engine.command(kols[0].id, 'bearish', 5)
    expect(result).not.toBeNull()
  })

  it('canPost returns true only for hired + off cooldown KOLs', () => {
    const kols = engine.getKOLs()

    expect(engine.canPost(kols[0].id)).toBe(false) // not hired

    engine.hire(kols[0].id)
    expect(engine.canPost(kols[0].id)).toBe(true) // hired, no cooldown

    engine.command(kols[0].id, 'bullish', 1)
    expect(engine.canPost(kols[0].id)).toBe(false) // on cooldown
  })

  it('command emits ai:kol:post event', () => {
    let received: any = null
    eventBus.on('ai:kol:post', (data) => { received = data })

    const kols = engine.getKOLs()
    engine.hire(kols[0].id)
    engine.command(kols[0].id, 'bullish', 1)

    expect(received).not.toBeNull()
    expect(received.agentId).toBe(kols[0].id)
    expect(received.content).toContain(kols[0].name)
  })
})
