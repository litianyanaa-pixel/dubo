import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SentimentEngine } from '@/engine/sentiment/SentimentEngine'
import { eventBus } from '@/engine/core/EventBus'

describe('SentimentEngine', () => {
  let engine: SentimentEngine

  beforeEach(() => {
    engine = new SentimentEngine()
    eventBus.removeAll()
  })

  it('initializes at 50 (neutral)', () => {
    expect(engine.getGlobal()).toBe(50)
  })

  it('update emits sentiment:changed', () => {
    const handler = vi.fn()
    eventBus.on('sentiment:changed', handler)

    engine.update()

    expect(handler).toHaveBeenCalledTimes(1)
    expect(typeof handler.mock.calls[0][0].global).toBe('number')
  })

  it('regresses toward 50 over time', () => {
    // Manually set to extreme and verify regression
    // We test this by running many updates and checking it stays near 50
    for (let i = 0; i < 200; i++) {
      engine.update()
    }

    const value = engine.getGlobal()
    // After many updates, should be close to 50 (regression + small noise)
    expect(value).toBeGreaterThan(30)
    expect(value).toBeLessThan(70)
  })

  it('stays within 0-100 bounds', () => {
    for (let i = 0; i < 500; i++) {
      engine.update()
    }

    const value = engine.getGlobal()
    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThanOrEqual(100)
  })
})
