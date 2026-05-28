import { create } from 'zustand'

export type FeedType = 'event' | 'fake_news' | 'ai_trade' | 'player_trade' | 'kol_post' | 'social'

export interface NewsEntry {
  id: string
  title: string
  description: string
  time: number
  type: FeedType
  icon?: string
  side?: 'buy' | 'sell'
  assetId?: string
  lots?: number
  isBigOrder?: boolean
  agentType?: 'leek' | 'whale' | 'scammer'
}

const FLUSH_INTERVAL = 300 // ms between each entry appearing

interface NewsState {
  entries: NewsEntry[]
  addEntry: (entry: Omit<NewsEntry, 'time'>) => void
  flushQueue: () => void
}

// Module-level queue: entries wait here before being shown
const pending: Omit<NewsEntry, 'time'>[] = []
let flushTimer: ReturnType<typeof setInterval> | null = null

function startFlushTimer() {
  if (flushTimer) return
  flushTimer = setInterval(() => {
    useNewsStore.getState().flushQueue()
  }, FLUSH_INTERVAL)
}

export const useNewsStore = create<NewsState>((set, get) => ({
  entries: [],

  addEntry: (entry) => {
    pending.push(entry)
    startFlushTimer()
  },

  flushQueue: () => {
    if (pending.length === 0) {
      // No more pending entries, stop the timer
      if (flushTimer) {
        clearInterval(flushTimer)
        flushTimer = null
      }
      return
    }
    const next = pending.shift()!
    const entries = [...get().entries, { ...next, time: Date.now() }]
    set({ entries: entries.slice(-200) })
  },
}))

export const NEWS_TYPES: FeedType[] = ['event', 'fake_news']
export const TRADE_TYPES: FeedType[] = ['ai_trade', 'player_trade']
export const SOCIAL_TYPES: FeedType[] = ['kol_post', 'social']
