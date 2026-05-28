type Listener<T = unknown> = (data: T) => void

export interface EventMap {
  'game:start': void
  'game:pause': void
  'game:resume': void
  'game:tick': { tick: number; elapsed: number; layer: number }
  'game:end': { reason: string }
  'price:updated': { assetId: string; price: number; prevPrice: number; change: number }
  'sentiment:changed': { global: number }
  'speed:changed': { speed: number }
  // Phase 2 events
  'ai:trade': { agentId: string; assetId: string; amount: number }
  'ai:kol:post': { agentId: string; content: string }
  'news:published': { id: string; templateId: string; targetCountry: string }
  'news:debunked': { id: string }
  'event:triggered': { id: string; tier: number }
  'event:chain': { eventId: string; node: string }
  'war:started': { participants: string[] }
  'war:ended': { winner: string; loser: string }
  'player:trade': { assetId: string; side: 'buy' | 'sell'; amount: number }
  'player:arrested': { country: string }
  'kol:duel:start': { participants: string[] }
  'kol:duel:end': { winner: string; loser: string }
  'kol:follower:change': { delta: number }
  'rug:launched': { tokenId: string }
  'rug:completed': { tokenId: string }
  'market:halt': { reason: string }
  'market:resume': void
  'achievement:unlocked': { id: string }
  'meta:earned': { amount: number }
  'tutorial:unlock': { feature: string }
}

type EventKey = keyof EventMap

class EventBus {
  private listeners = new Map<string, Set<Listener>>()

  on<K extends EventKey>(event: K, listener: Listener<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    const set = this.listeners.get(event)!
    set.add(listener as Listener)

    return () => {
      set.delete(listener as Listener)
      if (set.size === 0) this.listeners.delete(event)
    }
  }

  emit<K extends EventKey>(event: K, data: EventMap[K]): void {
    const set = this.listeners.get(event)
    if (!set) return
    for (const listener of set) {
      listener(data)
    }
  }

  removeAll(): void {
    this.listeners.clear()
  }
}

export const eventBus = new EventBus()
