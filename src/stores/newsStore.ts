import { create } from 'zustand'

export type FeedType = 'event' | 'fake_news' | 'ai_trade' | 'player_trade' | 'kol_post' | 'social'

export interface NewsEntry {
  id: string
  title: string
  description: string
  time: number
  type: FeedType
  icon?: string
}

interface NewsState {
  entries: NewsEntry[]
  addEntry: (entry: Omit<NewsEntry, 'time'>) => void
}

export const useNewsStore = create<NewsState>((set, get) => ({
  entries: [],
  addEntry: (entry) => {
    const entries = [...get().entries, { ...entry, time: Date.now() }]
    set({ entries: entries.slice(-200) })
  },
}))

// Filter helpers
export const NEWS_TYPES: FeedType[] = ['event', 'fake_news']
export const TRADE_TYPES: FeedType[] = ['ai_trade', 'player_trade']
export const SOCIAL_TYPES: FeedType[] = ['kol_post', 'social']
