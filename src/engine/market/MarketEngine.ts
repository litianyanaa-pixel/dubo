import { eventBus } from '@/engine/core/EventBus'
import type { Asset } from './types'
import type { CorrelationMatrix } from './CorrelationMatrix'
import type { CountryState } from '@/data/countries'

interface TradeFlow {
  buyVolume: number
  sellVolume: number
}

export class MarketEngine {
  private assets = new Map<string, Asset>()
  private flows = new Map<string, TradeFlow>()
  private drifts = new Map<string, number>()
  private rollingFlows = new Map<string, { buy: number; sell: number }>()
  private haltedAssets = new Map<string, number>()
  private correlationMatrix: CorrelationMatrix | null = null
  private getCountryState: ((id: string) => CountryState | undefined) | null = null

  constructor(
    correlationMatrix?: CorrelationMatrix,
    getCountryState?: (id: string) => CountryState | undefined,
  ) {
    if (correlationMatrix) this.correlationMatrix = correlationMatrix
    if (getCountryState) this.getCountryState = getCountryState
  }

  registerAsset(asset: Asset): void {
    this.assets.set(asset.id, { ...asset })
    this.flows.set(asset.id, { buyVolume: 0, sellVolume: 0 })
    this.drifts.set(asset.id, (Math.random() - 0.5) * 0.0004)
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

    const rolling = this.rollingFlows.get(assetId) ?? { buy: 0, sell: 0 }
    if (side === 'buy') rolling.buy += amount
    else rolling.sell += amount
    this.rollingFlows.set(assetId, rolling)
  }

  getFlowPressure(assetId: string): number {
    const r = this.rollingFlows.get(assetId)
    if (!r || (r.buy + r.sell) === 0) return 0.5
    return r.buy / (r.buy + r.sell)
  }

  isHalted(assetId: string): boolean {
    return this.haltedAssets.has(assetId)
  }

  updatePrices(tick: number, sentimentData: { global: number; countrySentiment?: (countryId: string) => number; assetSentiment?: (assetId: string) => number }): void {
    const allAssetIds = [...this.assets.keys()]
    const priceChanges: Record<string, number> = {}

    for (const asset of this.assets.values()) {
      // 跳过暂停的资产
      const haltRemaining = this.haltedAssets.get(asset.id)
      if (haltRemaining !== undefined) {
        if (haltRemaining <= 1) {
          this.haltedAssets.delete(asset.id)
          eventBus.emit('market:resume', undefined as never)
        } else {
          this.haltedAssets.set(asset.id, haltRemaining - 1)
          continue
        }
      }

      const prevPrice = asset.currentPrice
      const flow = this.flows.get(asset.id)!

      // 1. 漂移：缓慢随机切换方向
      let drift = this.drifts.get(asset.id) ?? 0
      if (Math.random() < 0.05) {
        drift = (Math.random() - 0.5) * 0.0006
        this.drifts.set(asset.id, drift)
      }

      // 2. 国家宏观经济（替代旧的硬编码MACRO_PROFILES）
      const countryMacro = this.calculateCountryMacro(asset)

      // 3. 情绪影响（使用三层情绪中的资产情绪，fallback到全局）
      const rawSentiment = sentimentData.assetSentiment?.(asset.id) ?? sentimentData.global
      // sentimentSensitivity：正数=同向（贪婪→涨），负数=反向（恐慌→涨，如龙头金）
      const sentimentBias = (rawSentiment - 50) / 100 * 0.002 * asset.sentimentSensitivity

      // 4. AI资金流
      const liquidity = asset.type === 'crypto' ? 100_000 : 1_000_000
      const netFlow = (flow.buyVolume - flow.sellVolume) / liquidity * 0.001
      flow.buyVolume = 0
      flow.sellVolume = 0

      // 5. 跨市场联动
      let correlation = 0
      if (this.correlationMatrix) {
        correlation = this.correlationMatrix.calculateImpact(
          asset.id,
          allAssetIds,
          (id) => this.assets.get(id)?.sector,
          sentimentData.global,
        )
      }

      // 6. 噪声
      const noise = (Math.random() - 0.5) * 2 * asset.volatility

      // 7. 均值回归
      const reversionStrength = 0.0002
      const deviation = (asset.currentPrice - asset.basePrice) / asset.basePrice
      const meanReversion = -deviation * reversionStrength

      // 合计
      const totalChange = drift + countryMacro + sentimentBias + correlation + netFlow + noise + meanReversion

      // 熔断阈值（按资产类型动态）
      const maxMove = asset.type === 'crypto' ? 0.15     // 虚拟币无硬熔断
                    : asset.type === 'safehaven' ? 0.05
                    : 0.03                                // 正常 ±3%
      const clamped = Math.max(-maxMove, Math.min(maxMove, totalChange))
      asset.currentPrice = Math.max(0.0001, asset.currentPrice * (1 + clamped))

      const pctChange = (asset.currentPrice - prevPrice) / prevPrice
      priceChanges[asset.id] = pctChange

      // 熔断检测
      const circuitBreakerThreshold = asset.type === 'crypto' ? 0.10 : 0.025
      if (Math.abs(pctChange) > circuitBreakerThreshold) {
        const haltTicks = asset.type === 'crypto' ? 2 : 5
        this.haltedAssets.set(asset.id, haltTicks)
        eventBus.emit('market:halt', {
          reason: `${asset.id} ${pctChange > 0 ? '暴涨' : '暴跌'} ${(Math.abs(pctChange) * 100).toFixed(1)}%, 触发熔断`,
        } as never)
      }

      eventBus.emit('price:updated', {
        assetId: asset.id,
        price: asset.currentPrice,
        prevPrice,
        change: pctChange,
      })

      // 衰减滚动资金流
      const rolling = this.rollingFlows.get(asset.id)
      if (rolling) {
        rolling.buy *= 0.95
        rolling.sell *= 0.95
      }
    }

    // 记录价格变化到关联矩阵
    if (this.correlationMatrix) {
      for (const [id, change] of Object.entries(priceChanges)) {
        this.correlationMatrix.recordPriceChange(id, change)
      }
    }
  }

  /** 根据资产类型和国家经济状态计算宏观漂移 */
  private calculateCountryMacro(asset: Asset): number {
    if (!this.getCountryState || !asset.countryId) return 0
    const country = this.getCountryState(asset.countryId)
    if (!country) return 0

    if (asset.type === 'currency') {
      return country.interestRate * 0.0001       // 高利率吸引资本
           - country.inflation * 0.00005         // 高通胀贬值
           + country.gdpGrowth * 0.00003         // 高增长升值
           + country.capitalFlow * 0.00001       // 资本流入升值
    }

    if (asset.type === 'stock') {
      return country.gdpGrowth * 0.0001
           + country.satisfaction / 100 * 0.0002
           - country.interestRate * 0.0001
           + country.capitalFlow * 0.00002
    }

    // 商品、避险、虚拟币无国家基本面因子
    return 0
  }
}
