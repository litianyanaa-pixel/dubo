import { create } from 'zustand'

interface NewsEntry {
  id: string
  title: string
  description: string
  time: number
  type: 'event' | 'ai_trade' | 'player' | 'fake_news'
}

interface NewsState {
  entries: NewsEntry[]
  addEntry: (entry: Omit<NewsEntry, 'time'>) => void
}

export const useNewsStore = create<NewsState>((set, get) => ({
  entries: [],
  addEntry: (entry) => {
    const entries = [...get().entries, { ...entry, time: Date.now() }]
    set({ entries: entries.slice(-100) })
  },
}))
