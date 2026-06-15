import { create } from 'zustand'

interface SentimentState {
  global: number
  countries: Record<string, number>
  assets: Record<string, number>
  setGlobal: (value: number) => void
  setLayer: (data: { global: number; countries: Record<string, number>; assets: Record<string, number> }) => void
}

export const useSentimentStore = create<SentimentState>((set) => ({
  global: 50,
  countries: {},
  assets: {},
  setGlobal: (global) => set({ global }),
  setLayer: (data) => set({ global: data.global, countries: data.countries, assets: data.assets }),
}))
