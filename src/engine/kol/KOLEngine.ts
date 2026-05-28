import { eventBus } from '@/engine/core/EventBus'

export interface KOL {
  id: string
  name: string
  followers: number
  credibility: number // 0-100
  hireCost: number
  hired: boolean
  speciality: string
  lastPostTick: number
}

const KOL_POOL: Omit<KOL, 'id' | 'hired' | 'lastPostTick'>[] = [
  { name: '金手指Jeff', followers: 520000, credibility: 75, hireCost: 50000, speciality: 'KAL' },
  { name: '焰砂王子', followers: 310000, credibility: 60, hireCost: 35000, speciality: 'EMK' },
  { name: '链上女神', followers: 280000, credibility: 70, hireCost: 40000, speciality: 'FOR' },
  { name: '暗影操盘手', followers: 150000, credibility: 50, hireCost: 25000, speciality: 'OIL' },
  { name: '银脊之声', followers: 200000, credibility: 80, hireCost: 45000, speciality: 'SRD' },
]

const KOL_POSTS = [
  '{name}: 各位注意！{asset}即将起飞，这是最后的上车机会！',
  '{name}: 刚收到可靠消息，{asset}基本面发生重大变化',
  '{name}: 技术面分析——{asset}已经突破关键阻力位',
  '{name}: 内部人士透露{asset}将有利好公布，大家注意',
  '{name}: 市场恐慌过度了，{asset}被严重低估，抄底机会',
  '{name}: 警告！{asset}泡沫严重，建议立即清仓',
  '{name}: 我的量化模型显示{asset}即将大跌',
  '{name}: 庄家在出货，{asset}散户小心被割',
]

let kolIdCounter = 0

export class KOLEngine {
  private kols: KOL[] = []

  constructor() {
    this.kols = KOL_POOL.map((k) => ({
      ...k,
      id: `kol_${kolIdCounter++}`,
      hired: false,
      lastPostTick: 0,
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

  /** Called on L3 tick (5s). Hired KOLs post periodically. */
  tick(tick: number): void {
    for (const kol of this.kols) {
      if (!kol.hired) continue
      if (tick - kol.lastPostTick < 3) continue // Post every ~15s
      if (Math.random() > 0.5) continue

      kol.lastPostTick = tick
      const post = KOL_POSTS[Math.floor(Math.random() * KOL_POSTS.length)]
        .replace('{name}', kol.name)
        .replace('{asset}', kol.speciality)

      // KOL post affects sentiment
      const sentimentImpact = (kol.followers / 1_000_000) * (kol.credibility / 100) * 3

      eventBus.emit('ai:kol:post', {
        agentId: kol.id,
        content: post,
      })

      // Store impact data for useGameLoop to pick up
      this.lastKOLImpact = { asset: kol.speciality, sentimentImpact }
    }
  }

  lastKOLImpact: { asset: string; sentimentImpact: number } | null = null
}
