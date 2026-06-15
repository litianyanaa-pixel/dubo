import { eventBus } from '@/engine/core/EventBus'
import { NEUTRAL } from './types'
import type { CountryEngine } from '@/engine/country/CountryEngine'
import type { MarketEngine } from '@/engine/market/MarketEngine'
import { INITIAL_COUNTRIES } from '@/data/countries'

export class SentimentEngine {
  private global = NEUTRAL
  private countries: Map<string, number> = new Map()
  private assets: Map<string, number> = new Map()

  constructor() {
    // 初始化每国情绪为50
    for (const c of INITIAL_COUNTRIES) {
      this.countries.set(c.id, NEUTRAL)
    }
  }

  // ─── 查询 ───────────────────────────────────────────

  getGlobal(): number {
    return this.global
  }

  getCountry(countryId: string): number {
    return this.countries.get(countryId) ?? NEUTRAL
  }

  getAsset(assetId: string): number {
    return this.assets.get(assetId) ?? NEUTRAL
  }

  /** 获取三层完整数据 */
  getAll(): { global: number; countries: Record<string, number>; assets: Record<string, number> } {
    return {
      global: this.global,
      countries: Object.fromEntries(this.countries),
      assets: Object.fromEntries(this.assets),
    }
  }

  // ─── 冲击 ───────────────────────────────────────────

  applyShock(impact: number): void {
    this.global = Math.max(0, Math.min(100, this.global + impact))
    this.emit()
  }

  applyCountryShock(countryId: string, impact: number): void {
    const current = this.countries.get(countryId) ?? NEUTRAL
    this.countries.set(countryId, Math.max(0, Math.min(100, current + impact)))
    this.emit()
  }

  applyAssetShock(assetId: string, impact: number): void {
    const current = this.assets.get(assetId) ?? NEUTRAL
    this.assets.set(assetId, Math.max(0, Math.min(100, current + impact)))
    this.emit()
  }

  // ─── 更新（L2 tick） ───────────────────────────────

  update(countryEngine: CountryEngine | null, market: MarketEngine | null): void {
    // 1. 全局情绪：向50回归 + 随机扰动
    const diff = NEUTRAL - this.global
    this.global += diff * 0.02 + (Math.random() - 0.5) * 1.0
    this.global = Math.max(0, Math.min(100, this.global))

    if (!countryEngine) {
      this.emit()
      return
    }

    // 国家情绪传导
    const totalGdp = INITIAL_COUNTRIES.reduce((s, c) => s + c.gdp, 0)

    for (const countryState of countryEngine.getAllCountries()) {
      let countrySentiment = this.countries.get(countryState.id) ?? NEUTRAL

      // 全局 → 国家传导
      countrySentiment += (this.global - countrySentiment) * 0.1

      // 国内因素：GDP增长利好、高通胀利空、满意度影响
      if (countryState.gdpGrowth > 3) countrySentiment += 0.3
      if (countryState.gdpGrowth < 0) countrySentiment -= 0.5
      if (countryState.inflation > 5) countrySentiment -= 0.3
      countrySentiment += (countryState.satisfaction - 50) * 0.01

      // 回归中性
      countrySentiment += (NEUTRAL - countrySentiment) * 0.03
      countrySentiment += (Math.random() - 0.5) * 0.5
      countrySentiment = Math.max(0, Math.min(100, countrySentiment))

      this.countries.set(countryState.id, countrySentiment)

      // 国家 → 全局反馈（按GDP权重）
      this.global += (countrySentiment - this.global) * (countryState.gdp / totalGdp) * 0.02
    }

    this.global = Math.max(0, Math.min(100, this.global))

    // 资产情绪（如果market可用）
    if (market) {
      for (const asset of market.getAllAssets()) {
        let assetSentiment = this.assets.get(asset.id) ?? NEUTRAL

        // 所属国家情绪传导
        if (asset.countryId) {
          const countrySent = this.countries.get(asset.countryId) ?? NEUTRAL
          assetSentiment += (countrySent - assetSentiment) * 0.15
        }

        // 价格走势反馈（涨→情绪升，跌→情绪降）
        const priceChange = (asset.currentPrice - asset.basePrice) / asset.basePrice
        assetSentiment += priceChange * 100 * 0.02

        // 回归中性（速度较快）
        assetSentiment += (NEUTRAL - assetSentiment) * 0.05
        assetSentiment += (Math.random() - 0.5) * 0.8
        assetSentiment = Math.max(0, Math.min(100, assetSentiment))

        this.assets.set(asset.id, assetSentiment)
      }
    }

    this.emit()
  }

  private emit(): void {
    eventBus.emit('sentiment:changed', {
      global: this.global,
      countries: Object.fromEntries(this.countries),
      assets: Object.fromEntries(this.assets),
    })
  }
}
