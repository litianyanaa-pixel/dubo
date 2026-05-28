import { eventBus } from '@/engine/core/EventBus'
import type { Asset } from './types'

export class MarketEngine {
  private assets = new Map<string, Asset>()

  registerAsset(asset: Asset): void {
    this.assets.set(asset.id, { ...asset })
  }

  getAsset(id: string): Asset | undefined {
    return this.assets.get(id)
  }

  updatePrices(_tick: number): void {
    for (const asset of this.assets.values()) {
      const prevPrice = asset.currentPrice

      const change = (Math.random() - 0.5) * 2 * asset.volatility
      asset.currentPrice = Math.max(0.0001, asset.currentPrice * (1 + change))

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
