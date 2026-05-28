import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eventBus } from '@/engine/core/EventBus'

describe('EventBus', () => {
  beforeEach(() => {
    eventBus.removeAll()
  })

  it('emits and receives typed events', () => {
    const handler = vi.fn()
    eventBus.on('price:updated', handler)

    eventBus.emit('price:updated', {
      assetId: 'KAL',
      price: 1.05,
      prevPrice: 1.0,
      change: 0.05,
    })

    expect(handler).toHaveBeenCalledWith({
      assetId: 'KAL',
      price: 1.05,
      prevPrice: 1.0,
      change: 0.05,
    })
  })

  it('unsubscribe via returned function', () => {
    const handler = vi.fn()
    const unsub = eventBus.on('price:updated', handler)

    unsub()
    eventBus.emit('price:updated', { assetId: 'KAL', price: 1.0, prevPrice: 1.0, change: 0 })

    expect(handler).not.toHaveBeenCalled()
  })

  it('supports multiple listeners on same event', () => {
    const h1 = vi.fn()
    const h2 = vi.fn()
    eventBus.on('price:updated', h1)
    eventBus.on('price:updated', h2)

    eventBus.emit('price:updated', { assetId: 'KAL', price: 1.0, prevPrice: 1.0, change: 0 })

    expect(h1).toHaveBeenCalledTimes(1)
    expect(h2).toHaveBeenCalledTimes(1)
  })

  it('does not call listeners for other events', () => {
    const handler = vi.fn()
    eventBus.on('price:updated', handler)

    eventBus.emit('sentiment:changed', { global: 60 })

    expect(handler).not.toHaveBeenCalled()
  })

  it('emit with no listeners does not throw', () => {
    expect(() => {
      eventBus.emit('game:end', { reason: 'test' })
    }).not.toThrow()
  })

  it('removeAll clears all listeners', () => {
    const h1 = vi.fn()
    const h2 = vi.fn()
    eventBus.on('price:updated', h1)
    eventBus.on('sentiment:changed', h2)

    eventBus.removeAll()

    eventBus.emit('price:updated', { assetId: 'KAL', price: 1, prevPrice: 1, change: 0 })
    eventBus.emit('sentiment:changed', { global: 50 })

    expect(h1).not.toHaveBeenCalled()
    expect(h2).not.toHaveBeenCalled()
  })
})
