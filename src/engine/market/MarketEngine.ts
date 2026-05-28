import { eventBus } from '@/engine/core/EventBus'
import type { Asset } from './types'

interface TradeFlow {
  buyVolume: number
  sellVolume: number
}

export class MarketEngine {
  private assets = new Map<string, Asset>()
  private flows = new Map<string, TradeFlow>()

  registerAsset(asset: Asset): void {
    this.assets.set(asset.id, { ...asset })
    this.flows.set(asset.id, { buyVolume: 0, sellVolume: 0 })
  }

  getAsset(id: string): Asset | undefined {
    return this.assets.get(id)
  }

  getAllAssets(): Asset[] {
    return [...this.assets.values()]
  }

  addTradeFlow(assetId: string, side: 'buy' | 'sell', amount: number): void {
    const flow = this.flows.get(assetId)
    if (!flow) return
    if (side === 'buy') flow.buyVolume += amount
    else flow.sellVolume += amount
  }

  updatePrices(tick: number, sentiment: number): void {
    for (const asset of this.assets.values()) {
      const prevPrice = asset.currentPrice
      const flow = this.flows.get(asset.id)!
      const liquidity = 1_000_000

      // f_sentiment: 0-100 mapped to price pressure
      const sentimentBias = (sentiment - 50) / 100 * 0.002

      // f_ai_flow: net buying pressure
      const netFlow = (flow.buyVolume - flow.sellVolume) / liquidity * 0.001
      flow.buyVolume = 0
      flow.sellVolume = 0

      // f_noise: random walk
      const noise = (Math.random() - 0.5) * 2 * asset.volatility

      // Combine factors
      const totalChange = sentimentBias + netFlow + noise

      // Price protection: max ±3% per tick
      const clamped = Math.max(-0.03, Math.min(0.03, totalChange))
      asset.currentPrice = Math.max(0.0001, asset.currentPrice * (1 + clamped))

      const pctChange = (asset.currentPrice - prevPrice) / prevPrice

      eventBus.emit('price:updated', {
        assetId: asset.id,
        price: asset.currentPrice,
        prevPrice,
        change: pctChange,
      })
    }
  }
}
