import { create } from 'zustand'

interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
}

const CANDLE_INTERVAL_MS = 5000

interface MarketState {
  prices: Record<string, number>
  prevPrices: Record<string, number>
  candles: Record<string, Candle[]>
  updatePrice: (assetId: string, price: number) => void
}

export type { Candle }
export type MarketStateType = MarketState

export const useMarketStore = create<MarketState>((set, get) => ({
  prices: {},
  prevPrices: {},
  candles: {},

  updatePrice: (assetId, price) => {
    const prev = get().prices[assetId] ?? price
    const now = Date.now()
    const candleTime = Math.floor(now / CANDLE_INTERVAL_MS) * CANDLE_INTERVAL_MS / 1000
    const candles = get().candles[assetId] ?? []
    const currentCandle = candles.length > 0 ? candles[candles.length - 1] : null

    let newCandles: Candle[]

    if (currentCandle && currentCandle.time === candleTime) {
      newCandles = [
        ...candles.slice(0, -1),
        {
          time: candleTime,
          open: currentCandle.open,
          high: Math.max(currentCandle.high, price),
          low: Math.min(currentCandle.low, price),
          close: price,
        },
      ]
    } else {
      newCandles = [
        ...candles,
        { time: candleTime, open: price, high: price, low: price, close: price },
      ]
    }

    set({
      prices: { ...get().prices, [assetId]: price },
      prevPrices: { ...get().prevPrices, [assetId]: prev },
      candles: { ...get().candles, [assetId]: newCandles.slice(-300) },
    })
  },
}))
