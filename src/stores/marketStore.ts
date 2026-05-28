import { create } from 'zustand'

interface PricePoint {
  price: number
  time: number
}

interface MarketState {
  prices: Record<string, number>
  prevPrices: Record<string, number>
  history: Record<string, PricePoint[]>
  updatePrice: (assetId: string, price: number) => void
}

export const useMarketStore = create<MarketState>((set, get) => ({
  prices: {},
  prevPrices: {},
  history: {},
  updatePrice: (assetId, price) => {
    const prev = get().prices[assetId] ?? price
    const hist = get().history[assetId] ?? []
    set({
      prices: { ...get().prices, [assetId]: price },
      prevPrices: { ...get().prevPrices, [assetId]: prev },
      history: {
        ...get().history,
        [assetId]: [...hist.slice(-199), { price, time: Date.now() }],
      },
    })
  },
}))
