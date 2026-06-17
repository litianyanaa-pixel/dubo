import { eventBus } from '@/engine/core/EventBus'
import type { Character } from '@/data/characters'
import { useNewsStore } from '@/stores/newsStore'
import type { Candle } from '@/stores/marketStore'
import { ALL_ASSETS } from '@/data/assets'

const INSIDER_NEWS = [
  '据可靠线人透露,{asset} {direction} {magnitude}%,预计{trend}',
  '某国央行内部纪要泄露:{asset} 即将 {direction} {magnitude}%',
  '大型机构正在暗中建仓/减持 {asset},预计 {direction} {magnitude}%',
  '{asset} 相关企业即将发布财报,内幕指向 {direction} {magnitude}%',
  '主权基金计划调整 {asset} 头寸,方向 {direction} {magnitude}%',
  '{asset} 供应链出现异动,监测到 {direction} {magnitude}% 资金流',
]

export interface Prediction {
  assetId: string
  direction: 'up' | 'down' | 'neutral'
  confidence: number // 0-1
  targetPrice: number
  currentPrice: number
}

export class TraitEngine {
  private character: Character | null = null
  private insiderTimer = 0
  private insiderInterval = 9 // L3 ticks = 9*5s = 45s
  private lastPrediction: Prediction | null = null
  private predictionCooldown = 0
  // 白鸽·公信力
  private credibility = 80
  private maxCredibility = 100
  private credibilityRecovery = 3 // per L3 tick

  setCharacter(char: Character): void {
    this.character = char
    // 白鸽 starts with 80 credibility
    if (char.id === 'dove') this.credibility = 80
  }

  getCharacter(): Character | null {
    return this.character
  }

  // --- 白鸽·公信力 ---

  getCredibility(): number {
    return this.credibility
  }

  /** Consume credibility for manipulative actions. Returns false if blocked. */
  consumeCredibility(cost: number): boolean {
    if (this.character?.id !== 'dove') return true // non-dove always allowed
    if (this.credibility < cost) return false // blocked!
    this.credibility = Math.max(0, this.credibility - cost)
    return true
  }

  /** Check if dove can perform a manipulative action */
  canManipulate(cost: number): boolean {
    if (this.character?.id !== 'dove') return true
    return this.credibility >= cost
  }

  /** Cost multiplier for dove actions (higher cost = more constrained) */
  getManipulationCost(action: 'fake_news' | 'kol_command' | 'rug_pull'): number {
    if (this.character?.id !== 'dove') return 0
    switch (action) {
      case 'fake_news': return 15
      case 'kol_command': return 8
      case 'rug_pull': return 25
    }
  }

  /** Fake news cost modifier */
  getFakeNewsCostMultiplier(): number {
    if (this.character?.id === 'z') return 0.7
    return 1.0
  }

  /** KOL sentiment impact multiplier */
  getKOLImpactMultiplier(): number {
    if (this.character?.id === 'z') return 1.5
    return 1.0
  }

  /** Fake news debunk probability modifier */
  getDebunkModifier(): number {
    if (this.character?.id === 'anon') return 0.5
    return 1.0
  }

  /** Whether to show prediction indicator on chart */
  showPrediction(): boolean {
    return this.character?.id === 'lin'
  }

  /** Lucky modifier for 50/50 events (returns true = lucky) */
  isLucky(): boolean {
    if (this.character?.id === 'jack') {
      return Math.random() < 0.65
    }
    return Math.random() < 0.5
  }

  /** Called on L3 tick. Character-specific periodic effects. */
  tick(): void {
    if (!this.character) return

    // 猎犬·陈: Insider news every 45s
    if (this.character.id === 'chen') {
      this.insiderTimer++
      if (this.insiderTimer >= this.insiderInterval) {
        this.insiderTimer = 0
        this.emitInsiderNews()
      }
    }

    // 白鸽: Credibility recovery
    if (this.character.id === 'dove' && this.credibility < this.maxCredibility) {
      this.credibility = Math.min(this.maxCredibility, this.credibility + this.credibilityRecovery)
    }

    // Prediction cooldown
    if (this.predictionCooldown > 0) this.predictionCooldown--
  }

  /** 先知·林: Generate a price prediction based on candle momentum */
  predict(assetId: string, candles: Candle[], currentPrice: number): Prediction | null {
    if (this.character?.id !== 'lin') return null
    if (this.predictionCooldown > 0) return this.lastPrediction
    if (candles.length < 5) return null

    this.predictionCooldown = 3 // 3 L3 ticks = 15s cooldown

    // Simple momentum: compare recent 3 candles vs prior 3 candles
    const recent = candles.slice(-3)
    const prior = candles.slice(-6, -3)

    const recentAvg = recent.reduce((s, c) => s + c.close, 0) / recent.length
    const priorAvg = prior.reduce((s, c) => s + c.close, 0) / prior.length

    const momentum = (recentAvg - priorAvg) / priorAvg
    const confidence = Math.min(0.85, 0.55 + Math.abs(momentum) * 20)

    // 60% accuracy: flip direction 40% of the time
    const accurate = Math.random() < 0.6
    const rawDirection: 'up' | 'down' = momentum > 0.001 ? 'up' : momentum < -0.001 ? 'down' : (Math.random() < 0.5 ? 'up' : 'down')
    const direction = accurate ? rawDirection : (rawDirection === 'up' ? 'down' : 'up')

    // Predict price move: 1-3% in the predicted direction
    const movePct = (0.01 + Math.random() * 0.02) * (direction === 'up' ? 1 : -1)
    const targetPrice = currentPrice * (1 + movePct)

    this.lastPrediction = { assetId, direction, confidence, targetPrice, currentPrice }
    return this.lastPrediction
  }

  getPrediction(): Prediction | null {
    return this.lastPrediction
  }

  canPredict(): boolean {
    return this.character?.id === 'lin' && this.predictionCooldown <= 0
  }

  /** 剩余预测冷却(L3 tick 数,每 tick=5s) */
  getPredictionCooldown(): number {
    return this.predictionCooldown
  }

  /** 猎犬·陈:距离下一条内幕消息的剩余 tick 数 */
  getInsiderCountdown(): number {
    return Math.max(0, this.insiderInterval - this.insiderTimer)
  }

  private emitInsiderNews(): void {
    const assets = ALL_ASSETS.map((a) => a.id)
    const asset = assets[Math.floor(Math.random() * assets.length)]
    const template = INSIDER_NEWS[Math.floor(Math.random() * INSIDER_NEWS.length)]
    // 生成方向(随机) + 幅度(1-4%) + 趋势描述
    const isUp = Math.random() > 0.5
    const magnitude = (1 + Math.random() * 3).toFixed(1)
    const trend = isUp ? '上涨' : '下跌'
    const direction = isUp ? '▲' : '▼'
    const content = template
      .replace('{asset}', asset)
      .replace('{direction}', direction)
      .replace('{magnitude}', magnitude)
      .replace('{trend}', trend)

    useNewsStore.getState().addEntry({
      id: `insider_${Date.now()}`,
      title: `🐕 内幕消息 · ${asset}`,
      description: `${content}(小道消息,真伪自辨)`,
      type: 'event',
    })
  }
}
