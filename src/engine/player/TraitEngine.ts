import { eventBus } from '@/engine/core/EventBus'
import type { Character } from '@/data/characters'
import { useNewsStore } from '@/stores/newsStore'
import type { Candle } from '@/stores/marketStore'

const INSIDER_NEWS = [
  '【内幕】据可靠线人透露，{asset}即将迎来重大利好政策',
  '【内幕】某国央行内部会议纪要泄露：{asset}利率将调整',
  '【内幕】大型机构正在暗中建仓{asset}，预计下周公告',
  '【内幕】{asset}相关企业即将发布超预期财报',
  '【内幕】政府高层已批准{asset}领域重大投资项目',
  '【内幕】某主权基金计划增持{asset}头寸',
  '【内幕】监管机构即将对{asset}市场出台新规',
  '【内幕】{asset}供应链出现突发事件，影响待评估',
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

  private emitInsiderNews(): void {
    const assets = ['USD', 'EUR', 'GBP', 'CHF', 'OIL', 'GOLD']
    const asset = assets[Math.floor(Math.random() * assets.length)]
    const template = INSIDER_NEWS[Math.floor(Math.random() * INSIDER_NEWS.length)]
    const content = template.replace('{asset}', asset)

    useNewsStore.getState().addEntry({
      id: `insider_${Date.now()}`,
      title: '🐕 内幕消息',
      description: content,
      type: 'event',
    })
  }
}
