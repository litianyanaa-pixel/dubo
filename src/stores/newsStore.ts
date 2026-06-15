import { create } from 'zustand'

export type FeedType = 'event' | 'fake_news' | 'ai_trade' | 'player_trade' | 'kol_post' | 'social' | 'debunked'

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

export interface ActiveFakeNews {
  id: string
  assetId: string
  priceDirection: 'up' | 'down'
  priceMagnitude: number
  sentimentMagnitude: number
  credibility: number // higher = harder to debunk
  tickAge: number // how many L4 ticks since published
}

const FAKE_NEWS_DEBUNK_THRESHOLD = 3 // L4 ticks before debunk check starts

const FLUSH_INTERVAL = 300 // ms between each entry appearing

interface NewsState {
  entries: NewsEntry[]
  activeFakeNews: ActiveFakeNews[]
  addEntry: (entry: Omit<NewsEntry, 'time'>) => void
  addFakeNews: (news: ActiveFakeNews) => void
  tickFakeNews: () => ActiveFakeNews[] // returns debunked items
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
  activeFakeNews: [],

  addEntry: (entry) => {
    pending.push(entry)
    startFlushTimer()
  },

  addFakeNews: (news) => {
    set({ activeFakeNews: [...get().activeFakeNews, news] })
  },

  tickFakeNews: (luckyMod = 1.0) => {
    const state = get()
    const debunked: ActiveFakeNews[] = []
    const remaining: ActiveFakeNews[] = []

    for (const news of state.activeFakeNews) {
      news.tickAge++
      if (news.tickAge >= FAKE_NEWS_DEBUNK_THRESHOLD) {
        // Debunk chance: lower credibility = higher chance
        // Base: 20% per tick after threshold, reduced by credibility
        const debunkChance = (1 - news.credibility / 100) * 0.35 * luckyMod
        if (Math.random() < debunkChance) {
          debunked.push(news)
          continue
        }
      }
      // Expire after 10 L4 ticks (5 minutes)
      if (news.tickAge < 10) {
        remaining.push(news)
      }
    }

    set({ activeFakeNews: remaining })
    return debunked
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
    set({ entries: entries.slice(-2000) })
  },
}))

export const NEWS_TYPES: FeedType[] = ['event', 'fake_news', 'debunked']
export const TRADE_TYPES: FeedType[] = ['ai_trade', 'player_trade']
export const SOCIAL_TYPES: FeedType[] = ['kol_post', 'social']
