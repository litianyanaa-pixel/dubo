import { eventBus } from '@/engine/core/EventBus'

export interface GameEvent {
  id: string
  title: string
  description: string
  targetAsset?: string
  priceImpact: number
  sentimentImpact: number
  tier: number
}

const EVENT_POOL: Omit<GameEvent, 'id'>[] = [
  // === L3: Normal events ===
  // USD
  { title: '美联储意外加息25个基点', description: '美联储宣布紧急加息，美元走强', targetAsset: 'USD', priceImpact: 0.01, sentimentImpact: -5, tier: 3 },
  { title: '美国非农数据超预期', description: '就业市场强劲，美元指数攀升', targetAsset: 'USD', priceImpact: 0.008, sentimentImpact: 3, tier: 3 },
  { title: '美国国债收益率飙升', description: '10年期美债收益率突破新高', targetAsset: 'USD', priceImpact: 0.012, sentimentImpact: -4, tier: 3 },
  { title: '硅谷科技巨头财报亮眼', description: '科技股暴涨带动美元需求', targetAsset: 'USD', priceImpact: 0.006, sentimentImpact: 5, tier: 3 },

  // EUR
  { title: '欧盟粮食大丰收', description: '创纪录粮食产量稳定欧元区物价', targetAsset: 'EUR', priceImpact: -0.005, sentimentImpact: 8, tier: 3 },
  { title: '欧洲央行暗示降息', description: '通胀回落，鸽派信号释放', targetAsset: 'EUR', priceImpact: -0.01, sentimentImpact: -3, tier: 3 },
  { title: '德国工业产出超预期', description: '制造业PMI重回扩张区间', targetAsset: 'EUR', priceImpact: 0.008, sentimentImpact: 6, tier: 3 },
  { title: '法国罢工潮持续', description: '全国性罢工影响欧元信心', targetAsset: 'EUR', priceImpact: -0.006, sentimentImpact: -4, tier: 3 },

  // GBP
  { title: '英国万亿基建计划', description: '英国政府公布万亿基建方案，英镑看涨', targetAsset: 'GBP', priceImpact: 0.01, sentimentImpact: 5, tier: 3 },
  { title: '印度稀土出口禁令', description: '印度限制稀土出口，英镑受益', targetAsset: 'GBP', priceImpact: 0.012, sentimentImpact: -3, tier: 3 },
  { title: '英国脱欧后贸易协议', description: '与亚太国家达成新自贸协定', targetAsset: 'GBP', priceImpact: 0.007, sentimentImpact: 4, tier: 3 },

  // CHF
  { title: '瑞士央行干预汇市', description: '瑞士央行出手稳定瑞郎汇率', targetAsset: 'CHF', priceImpact: -0.008, sentimentImpact: 2, tier: 3 },
  { title: '全球避险情绪升温', description: '地缘政治紧张推动资金流入瑞郎', targetAsset: 'CHF', priceImpact: 0.01, sentimentImpact: -6, tier: 3 },

  // OIL
  { title: '沙特发现超大油田', description: '地质勘探确认新储量，原油承压', targetAsset: 'OIL', priceImpact: -0.015, sentimentImpact: 5, tier: 3 },
  { title: '飓风摧毁休斯敦港口', description: '美国主要出口港口瘫痪，原油运输受阻', targetAsset: 'OIL', priceImpact: 0.02, sentimentImpact: -8, tier: 3 },
  { title: 'OPEC+延长减产协议', description: '主要产油国同意继续减产', targetAsset: 'OIL', priceImpact: 0.015, sentimentImpact: -3, tier: 3 },
  { title: '新能源技术突破', description: '太阳能效率提升50%，原油需求预期下调', targetAsset: 'OIL', priceImpact: -0.012, sentimentImpact: 6, tier: 3 },

  // GOLD
  { title: '瑞士银行挤兑潮', description: '多家瑞士银行出现挤兑，避险资产飙升', targetAsset: 'GOLD', priceImpact: 0.02, sentimentImpact: -10, tier: 3 },
  { title: '南非金矿脉枯竭', description: '全球最大金矿宣布储量下调30%', targetAsset: 'GOLD', priceImpact: 0.02, sentimentImpact: -5, tier: 3 },
  { title: '各国央行增持黄金', description: '新兴市场央行黄金储备创历史新高', targetAsset: 'GOLD', priceImpact: 0.01, sentimentImpact: 3, tier: 3 },

  // Global
  { title: '俄罗斯网络攻击', description: '大规模网络攻击瘫痪多国金融系统', priceImpact: -0.008, sentimentImpact: -15, tier: 3 },
  { title: '华尔街对冲基金丑闻', description: '巨型对冲基金洗钱案曝光', priceImpact: -0.01, sentimentImpact: -8, tier: 3 },
  { title: 'G20零关税协议', description: '二十国集团签署零关税协议，市场欢欣', priceImpact: 0.005, sentimentImpact: 10, tier: 3 },
  { title: '全球芯片短缺加剧', description: '供应链危机蔓延，美元承压', targetAsset: 'USD', priceImpact: -0.008, sentimentImpact: -5, tier: 3 },
  { title: '跨国贸易协议达成', description: '亚太六国签署零关税协议', priceImpact: 0.006, sentimentImpact: 8, tier: 3 },
  { title: '北极航道开通', description: '新航道缩短亚欧航线30%', priceImpact: 0.003, sentimentImpact: 5, tier: 3 },
  { title: '全球疫情反弹', description: '新型病毒变种引发市场恐慌', priceImpact: -0.012, sentimentImpact: -12, tier: 3 },
  { title: '核电站泄漏事故', description: '某国核电站发生严重泄漏事故', priceImpact: -0.008, sentimentImpact: -10, tier: 3 },

  // === L4: Black swan events (30s) ===
  { title: '世界大战爆发', description: '多国正式宣战，全球金融市场崩盘', priceImpact: -0.05, sentimentImpact: -30, tier: 4 },
  { title: '美元体系崩溃', description: '多国宣布去美元化，美元信任危机', targetAsset: 'USD', priceImpact: -0.08, sentimentImpact: -25, tier: 4 },
  { title: '黄金发现超大型矿藏', description: '南极洲发现万亿级金矿，黄金暴跌', targetAsset: 'GOLD', priceImpact: -0.1, sentimentImpact: 15, tier: 4 },
  { title: '全球央行联合降息', description: '六大央行同步降息至零，流动性洪灾', priceImpact: 0.04, sentimentImpact: 20, tier: 4 },
  { title: '核武器试验引爆恐慌', description: '某国进行地下核试验，避险情绪爆表', targetAsset: 'GOLD', priceImpact: 0.06, sentimentImpact: -20, tier: 4 },
  { title: '人工智能取代金融业', description: 'GPT-7通过CFA考试，交易员大规模失业', priceImpact: -0.03, sentimentImpact: -15, tier: 4 },
  { title: '石油输出国联盟瓦解', description: 'OPEC解散，成员国各自为政', targetAsset: 'OIL', priceImpact: -0.07, sentimentImpact: -10, tier: 4 },
  { title: '比特币突破100万美元', description: '加密货币全面爆发，传统市场资金外流', priceImpact: -0.02, sentimentImpact: 10, tier: 4 },
]

let eventCounter = 0

/** Map event title -> possible follow-up events with delay in L3 ticks */
const EVENT_CHAINS: Record<string, { title: string; chance: number; delayTicks: number }[]> = {
  '美联储意外加息25个基点': [
    { title: '美国银行业危机', chance: 0.4, delayTicks: 2 },
    { title: '美元体系崩溃', chance: 0.1, delayTicks: 6 },
  ],
  '飓风摧毁休斯敦港口': [
    { title: 'OPEC+延长减产协议', chance: 0.5, delayTicks: 3 },
    { title: '原油管道破裂', chance: 0.3, delayTicks: 1 },
  ],
  '瑞士银行挤兑潮': [
    { title: '全球避险情绪升温', chance: 0.6, delayTicks: 2 },
    { title: '各国央行增持黄金', chance: 0.4, delayTicks: 3 },
  ],
  '俄罗斯网络攻击': [
    { title: '华尔街对冲基金丑闻', chance: 0.3, delayTicks: 4 },
    { title: '核武器试验引爆恐慌', chance: 0.15, delayTicks: 6 },
  ],
  '全球疫情反弹': [
    { title: '全球央行联合降息', chance: 0.4, delayTicks: 4 },
    { title: '核电站泄漏事故', chance: 0.2, delayTicks: 3 },
  ],
  '美国国债收益率飙升': [
    { title: '华尔街对冲基金丑闻', chance: 0.35, delayTicks: 3 },
    { title: '美联储意外加息25个基点', chance: 0.2, delayTicks: 5 },
  ],
  '法国罢工潮持续': [
    { title: '欧洲央行暗示降息', chance: 0.3, delayTicks: 2 },
  ],
  '军事冲突升级': [
    { title: '核武器试验引爆恐慌', chance: 0.25, delayTicks: 4 },
    { title: '全球避险情绪升温', chance: 0.5, delayTicks: 1 },
  ],
}

interface PendingChain {
  tickDue: number
  title: string
}

export class EventEngine {
  private recentEvents: GameEvent[] = []
  private pendingChains: PendingChain[] = []
  private l3Tick = 0

  getRecentEvents(count = 20): GameEvent[] {
    return this.recentEvents.slice(-count)
  }

  /** Called on L3 tick (every 5s). Chance to trigger a random event. */
  tick(): GameEvent | null {
    this.l3Tick++

    // Check pending chains first
    this.processPendingChains()

    if (Math.random() > 0.4) return null

    // 80% L3, 20% L4
    const pool = Math.random() < 0.8
      ? EVENT_POOL.filter(e => e.tier === 3)
      : EVENT_POOL.filter(e => e.tier === 4)

    const template = pool[Math.floor(Math.random() * pool.length)]
    const event: GameEvent = {
      ...template,
      id: `evt_${eventCounter++}`,
    }

    this.recentEvents.push(event)
    if (this.recentEvents.length > 50) this.recentEvents.shift()

    // Schedule chain follow-ups
    const chains = EVENT_CHAINS[event.title]
    if (chains) {
      for (const chain of chains) {
        if (Math.random() < chain.chance) {
          this.pendingChains.push({
            tickDue: this.l3Tick + chain.delayTicks,
            title: chain.title,
          })
        }
      }
    }

    eventBus.emit('event:triggered', { id: event.id, tier: event.tier })
    eventBus.emit('news:published', {
      id: event.id,
      templateId: event.id,
      targetCountry: event.targetAsset ?? 'global',
    })

    return event
  }

  private processPendingChains(): void {
    const due: PendingChain[] = []
    const remaining: PendingChain[] = []

    for (const chain of this.pendingChains) {
      if (chain.tickDue <= this.l3Tick) {
        due.push(chain)
      } else {
        remaining.push(chain)
      }
    }
    this.pendingChains = remaining

    for (const chain of due) {
      const template = EVENT_POOL.find(e => e.title === chain.title)
      if (!template) continue

      const event: GameEvent = { ...template, id: `evt_${eventCounter++}` }
      this.recentEvents.push(event)
      if (this.recentEvents.length > 50) this.recentEvents.shift()

      eventBus.emit('event:triggered', { id: event.id, tier: event.tier })
      eventBus.emit('event:chain', { eventId: event.id, node: event.title })
      eventBus.emit('news:published', {
        id: event.id,
        templateId: event.id,
        targetCountry: event.targetAsset ?? 'global',
      })
    }
  }
}
