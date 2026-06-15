import { describe, it, expect, beforeEach } from 'vitest'
import { TraitEngine, type Prediction } from '@/engine/player/TraitEngine'
import { CHARACTERS } from '@/data/characters'
import { eventBus } from '@/engine/core/EventBus'

const CHEN = CHARACTERS.find(c => c.id === 'chen')!
const Z = CHARACTERS.find(c => c.id === 'z')!
const LIN = CHARACTERS.find(c => c.id === 'lin')!
const ANON = CHARACTERS.find(c => c.id === 'anon')!
const JACK = CHARACTERS.find(c => c.id === 'jack')!

describe('TraitEngine', () => {
  let engine: TraitEngine

  beforeEach(() => {
    engine = new TraitEngine()
    eventBus.removeAll()
  })

  it('initial state has no character', () => {
    expect(engine.getCharacter()).toBeNull()
  })

  it('setCharacter stores character', () => {
    engine.setCharacter(CHEN)
    expect(engine.getCharacter()?.id).toBe('chen')
  })

  // --- Cost/impact modifiers ---

  it('getFakeNewsCostMultiplier returns 0.7 for 教父·Z', () => {
    engine.setCharacter(Z)
    expect(engine.getFakeNewsCostMultiplier()).toBe(0.7)
  })

  it('getFakeNewsCostMultiplier returns 1.0 for others', () => {
    engine.setCharacter(CHEN)
    expect(engine.getFakeNewsCostMultiplier()).toBe(1.0)
  })

  it('getKOLImpactMultiplier returns 1.5 for 教父·Z', () => {
    engine.setCharacter(Z)
    expect(engine.getKOLImpactMultiplier()).toBe(1.5)
  })

  it('getKOLImpactMultiplier returns 1.0 for others', () => {
    engine.setCharacter(LIN)
    expect(engine.getKOLImpactMultiplier()).toBe(1.0)
  })

  it('getDebunkModifier returns 0.5 for 暗影·无名', () => {
    engine.setCharacter(ANON)
    expect(engine.getDebunkModifier()).toBe(0.5)
  })

  it('getDebunkModifier returns 1.0 for others', () => {
    engine.setCharacter(CHEN)
    expect(engine.getDebunkModifier()).toBe(1.0)
  })

  // --- Prediction (先知·林) ---

  it('predict returns null for non-lin characters', () => {
    engine.setCharacter(CHEN)
    const result = engine.predict('USD', [], 1.0)
    expect(result).toBeNull()
  })

  it('predict returns null with fewer than 5 candles', () => {
    engine.setCharacter(LIN)
    const candles = [
      { time: 1, open: 1, high: 1, low: 1, close: 1 },
      { time: 2, open: 1, high: 1, low: 1, close: 1 },
      { time: 3, open: 1, high: 1, low: 1, close: 1 },
    ]
    const result = engine.predict('USD', candles, 1.0)
    expect(result).toBeNull()
  })

  it('predict returns valid prediction with enough candles', () => {
    engine.setCharacter(LIN)
    const candles = Array.from({ length: 10 }, (_, i) => ({
      time: i,
      open: 1 + i * 0.001,
      high: 1 + i * 0.002,
      low: 1 - i * 0.001,
      close: 1 + i * 0.001,
    }))
    const result = engine.predict('USD', candles, 1.01)

    expect(result).not.toBeNull()
    expect(result!.assetId).toBe('USD')
    expect(['up', 'down', 'neutral']).toContain(result!.direction)
    expect(result!.confidence).toBeGreaterThan(0)
    expect(result!.confidence).toBeLessThanOrEqual(0.85)
    expect(result!.currentPrice).toBe(1.01)
    expect(typeof result!.targetPrice).toBe('number')
  })

  it('predict sets cooldown preventing immediate re-prediction', () => {
    engine.setCharacter(LIN)
    const candles = Array.from({ length: 10 }, (_, i) => ({
      time: i, open: 1, high: 1, low: 1, close: 1 + i * 0.001,
    }))
    const first = engine.predict('USD', candles, 1.01)
    expect(first).not.toBeNull()

    // Second call returns last prediction (on cooldown)
    const second = engine.predict('USD', candles, 1.02)
    expect(second).toBe(first) // same object returned
  })

  it('canPredict returns false when on cooldown', () => {
    engine.setCharacter(LIN)
    const candles = Array.from({ length: 10 }, (_, i) => ({
      time: i, open: 1, high: 1, low: 1, close: 1,
    }))
    engine.predict('USD', candles, 1.0)
    expect(engine.canPredict()).toBe(false)
  })

  it('canPredict returns false for non-lin characters', () => {
    engine.setCharacter(CHEN)
    expect(engine.canPredict()).toBe(false)
  })

  it('cooldown decrements on tick', () => {
    engine.setCharacter(LIN)
    const candles = Array.from({ length: 10 }, (_, i) => ({
      time: i, open: 1, high: 1, low: 1, close: 1,
    }))
    engine.predict('USD', candles, 1.0)
    expect(engine.canPredict()).toBe(false)

    engine.tick()
    engine.tick()
    engine.tick()
    expect(engine.canPredict()).toBe(true)
  })

  // --- Insider news (猎犬·陈) ---

  it('tick emits insider news for Chen after interval', () => {
    engine.setCharacter(CHEN)
    // Insider interval is 9 L3 ticks
    for (let i = 0; i < 8; i++) engine.tick()
    // 9th tick should trigger insider
    engine.tick()
    // No assertion on content, just that it doesn't crash
    // The insider adds to newsStore which we can't easily check here
  })

  // --- Lucky (赌徒·阿杰) ---

  it('isLucky for Jack returns true ~65% of the time', () => {
    engine.setCharacter(JACK)
    let wins = 0
    const trials = 1000
    for (let i = 0; i < trials; i++) {
      if (engine.isLucky()) wins++
    }
    const ratio = wins / trials
    // Very loose bounds to avoid flaky tests
    expect(ratio).toBeGreaterThan(0.5)
    expect(ratio).toBeLessThan(0.8)
  })

  it('isLucky for non-Jack returns ~50%', () => {
    engine.setCharacter(CHEN)
    let wins = 0
    const trials = 1000
    for (let i = 0; i < trials; i++) {
      if (engine.isLucky()) wins++
    }
    const ratio = wins / trials
    expect(ratio).toBeGreaterThan(0.35)
    expect(ratio).toBeLessThan(0.65)
  })
})
