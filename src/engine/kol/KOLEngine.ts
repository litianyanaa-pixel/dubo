import { eventBus } from '@/engine/core/EventBus'

export interface KOL {
  id: string
  name: string
  followers: number
  credibility: number
  hireCost: number
  hired: boolean
  specialty: string
  lastPostTick: number
  cooldown: number
}

export type KOLDirection = 'bullish' | 'bearish' | 'panic' | 'greed'

const KOL_POOL: Omit<KOL, 'id' | 'hired' | 'lastPostTick' | 'cooldown'>[] = [
  { name: '华尔街狼王', followers: 520000, credibility: 75, hireCost: 50000, specialty: 'USD' },
  { name: '法兰克福之鹰', followers: 310000, credibility: 60, hireCost: 35000, specialty: 'EUR' },
  { name: '伦敦金融城之花', followers: 280000, credibility: 70, hireCost: 40000, specialty: 'GBP' },
  { name: '原油大鳄', followers: 150000, credibility: 50, hireCost: 25000, specialty: 'OIL' },
  { name: '苏黎世金舌', followers: 200000, credibility: 80, hireCost: 45000, specialty: 'CHF' },
]

const DIRECTION_TEMPLATES: Record<KOLDirection, string[]> = {
  bullish: [
    '{name}：{asset}即将起飞！技术面完美突破，最后上车机会！',
    '{name}：刚收到可靠消息，{asset}基本面发生重大利好变化',
    '{name}：我的量化模型显示{asset}即将大涨，已满仓',
    '{name}：独家研报——{asset}未来三个月看涨30%，目标上调',
  ],
  bearish: [
    '{name}：警告！{asset}泡沫严重，建议立即清仓',
    '{name}：{asset}的大资金正在出逃，散户小心被割',
    '{name}：机构调研发现{asset}有重大利空未披露',
    '{name}：我的模型显示{asset}即将破位下行，止损要快',
  ],
  panic: [
    '{name}：紧急！{asset}要崩盘了！快跑！',
    '{name}：{asset}市场出现踩踏式抛售，流动性枯竭',
    '{name}：完了，{asset}已经失控，不要抄底！',
    '{name}：这是{asset}的雷曼时刻，系统性风险爆发',
  ],
  greed: [
    '{name}：{asset}是本世纪最佳投资机会，错过拍大腿！',
    '{name}：全仓{asset}！闭着眼睛赚！To the moon！',
    '{name}：历史性时刻——{asset}将改变世界格局',
    '{name}：我要把房子抵押了全部买入{asset}！',
  ],
}

const COOLDOWN_TICKS = 3 // 3 L3 ticks = 15s

let kolIdCounter = 0

export class KOLEngine {
  private kols: KOL[] = []

  constructor() {
    this.kols = KOL_POOL.map((k) => ({
      ...k,
      id: `kol_${kolIdCounter++}`,
      hired: false,
      lastPostTick: 0,
      cooldown: 0,
    }))
  }

  getKOLs(): KOL[] {
    return this.kols
  }

  hire(kolId: string): KOL | null {
    const kol = this.kols.find((k) => k.id === kolId)
    if (!kol || kol.hired) return null
    kol.hired = true
    return kol
  }

  /** Called on L3 tick. Reduce cooldowns. */
  tick(tick: number): void {
    for (const kol of this.kols) {
      if (kol.cooldown > 0) kol.cooldown--
    }
  }

  /** Player commands a hired KOL to post. Returns null if on cooldown or not hired. */
  command(kolId: string, direction: KOLDirection, tick: number): { content: string; sentimentImpact: number; specialty: string; priceDirection: number } | null {
    const kol = this.kols.find((k) => k.id === kolId)
    if (!kol || !kol.hired || kol.cooldown > 0) return null

    kol.cooldown = COOLDOWN_TICKS
    kol.lastPostTick = tick

    const templates = DIRECTION_TEMPLATES[direction]
    const content = templates[Math.floor(Math.random() * templates.length)]
      .replace('{name}', kol.name)
      .replace('{asset}', kol.specialty)

    const baseImpact = (kol.followers / 1_000_000) * (kol.credibility / 100)
    const directionMul = direction === 'panic' ? 2.0 : direction === 'greed' ? 1.8 : 1.0
    const sentimentImpact = baseImpact * 5 * directionMul * (direction === 'bullish' || direction === 'greed' ? 1 : -1)

    const priceDirection = direction === 'bullish' || direction === 'greed' ? 1 : -1
    const priceImpact = baseImpact * directionMul * 0.03 * priceDirection

    eventBus.emit('ai:kol:post', {
      agentId: kol.id,
      content,
    })

    return { content, sentimentImpact, specialty: kol.specialty, priceDirection: priceImpact }
  }

  canPost(kolId: string): boolean {
    const kol = this.kols.find((k) => k.id === kolId)
    return !!kol && kol.hired && kol.cooldown <= 0
  }

  lastKOLImpact: { asset: string; sentimentImpact: number } | null = null
}
