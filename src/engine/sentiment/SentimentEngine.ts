import { eventBus } from '@/engine/core/EventBus'
import { NEUTRAL } from './types'

export class SentimentEngine {
  private global = NEUTRAL

  getGlobal(): number {
    return this.global
  }

  applyShock(impact: number): void {
    this.global = Math.max(0, Math.min(100, this.global + impact))
    eventBus.emit('sentiment:changed', { global: this.global })
  }

  update(): void {
    const diff = NEUTRAL - this.global
    this.global += diff * 0.02

    this.global += (Math.random() - 0.5) * 1.0

    this.global = Math.max(0, Math.min(100, this.global))

    eventBus.emit('sentiment:changed', { global: this.global })
  }
}
