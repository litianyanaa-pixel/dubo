import { create } from 'zustand'

interface SentimentState {
  global: number
  setGlobal: (value: number) => void
}

export const useSentimentStore = create<SentimentState>((set) => ({
  global: 50,
  setGlobal: (global) => set({ global }),
}))
