import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GameLoop } from '@/engine/core/GameLoop'
import { eventBus } from '@/engine/core/EventBus'

describe('GameLoop', () => {
  let loop: GameLoop

  beforeEach(() => {
    loop = new GameLoop()
    eventBus.removeAll()
  })

  afterEach(() => {
    loop.stop()
  })

  it('starts and stops', () => {
    expect(loop.isRunning()).toBe(false)
    loop.start()
    expect(loop.isRunning()).toBe(true)
    loop.stop()
    expect(loop.isRunning()).toBe(false)
  })

  it('speed defaults to 1x', () => {
    expect(loop.getSpeed()).toBe(1)
  })

  it('setSpeed changes speed', () => {
    loop.setSpeed(2)
    expect(loop.getSpeed()).toBe(2)
  })

  it('setSpeed(0) pauses and emits game:pause', () => {
    const handler = vi.fn()
    eventBus.on('game:pause', handler)

    loop.setSpeed(0)

    expect(loop.getSpeed()).toBe(0)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('resuming from pause emits game:resume', () => {
    const handler = vi.fn()
    eventBus.on('game:resume', handler)

    loop.setSpeed(0)
    loop.setSpeed(1)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('setSpeed emits speed:changed', () => {
    const handler = vi.fn()
    eventBus.on('speed:changed', handler)

    loop.setSpeed(2)

    expect(handler).toHaveBeenCalledWith({ speed: 2 })
  })

  it('layer callbacks can be registered', () => {
    const cb = vi.fn()
    const unsub = loop.onLayer(0, cb)
    expect(typeof unsub).toBe('function')
  })

  it('layer unsubscribe works', () => {
    const cb = vi.fn()
    const unsub = loop.onLayer(0, cb)
    unsub()
    // No error = success
  })

  it('getTick starts at 0', () => {
    expect(loop.getTick()).toBe(0)
  })

  it('getSpeed returns current speed', () => {
    loop.setSpeed(3)
    expect(loop.getSpeed()).toBe(3)
  })
})
