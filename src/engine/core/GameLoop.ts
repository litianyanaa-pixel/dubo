import { eventBus } from './EventBus'
import { TICK_INTERVALS, type SpeedMultiplier, type TickLayer } from './types'

export class GameLoop {
  private lastTime = 0
  private running = false
  private rafId = 0
  private speed: SpeedMultiplier = 1
  private elapsed = 0
  private tick = 0
  private accumulators: Record<TickLayer, number> = {
    0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  }

  private layerCallbacks = new Map<TickLayer, Set<(tick: number, elapsed: number) => void>>()

  onLayer(layer: TickLayer, cb: (tick: number, elapsed: number) => void): () => void {
    if (!this.layerCallbacks.has(layer)) {
      this.layerCallbacks.set(layer, new Set())
    }
    const set = this.layerCallbacks.get(layer)!
    set.add(cb)
    return () => set.delete(cb)
  }

  setSpeed(speed: SpeedMultiplier): void {
    if (this.speed === speed) return
    const prev = this.speed
    this.speed = speed
    if (prev === 0 && speed > 0) {
      this.lastTime = performance.now()
    }
    eventBus.emit('speed:changed', { speed })
    if (speed === 0) {
      eventBus.emit('game:pause', undefined as never)
    } else if (prev === 0) {
      eventBus.emit('game:resume', undefined as never)
    }
  }

  getSpeed(): SpeedMultiplier { return this.speed }
  getTick(): number { return this.tick }
  getElapsed(): number { return this.elapsed }
  isRunning(): boolean { return this.running }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.loop(this.lastTime)
  }

  stop(): void {
    this.running = false
    if (this.rafId) cancelAnimationFrame(this.rafId)
  }

  private loop = (now: number): void => {
    if (!this.running) return
    this.rafId = requestAnimationFrame(this.loop)

    if (this.speed === 0) return

    const rawDelta = now - this.lastTime
    this.lastTime = now
    const delta = rawDelta * this.speed
    this.elapsed += delta

    for (let layer = 0; layer <= 5; layer++) {
      this.accumulators[layer as TickLayer] += delta
      const interval = TICK_INTERVALS[layer as TickLayer]
      while (this.accumulators[layer as TickLayer] >= interval) {
        this.accumulators[layer as TickLayer] -= interval
        this.tick++
        const callbacks = this.layerCallbacks.get(layer as TickLayer)
        if (callbacks) {
          for (const cb of callbacks) {
            cb(this.tick, this.elapsed)
          }
        }
      }
    }
  }
}
