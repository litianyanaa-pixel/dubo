import { eventBus } from '@/engine/core/EventBus'

export interface GameEvent {
  id: string
  title: string
  description: string
  targetAsset?: string
  priceImpact: number // -1 to +1, multiplier
  sentimentImpact: number // -20 to +20
  tier: number
}

const EVENT_POOL: Omit<GameEvent, 'id'>[] = [
  { title: '伽蓝联邦加息25个基点', description: '央行意外加息，KAL走强', targetAsset: 'KAL', priceImpact: 0.01, sentimentImpact: -3, tier: 3 },
  { title: '焰砂汗国发现超大油田', description: '地质勘探确认新储量，原油承压', targetAsset: 'OIL', priceImpact: -0.015, sentimentImpact: 5, tier: 3 },
  { title: '银脊共和国银行挤兑', description: '多家银行出现挤兑潮，避险资产飙升', targetAsset: 'GOLD', priceImpact: 0.02, sentimentImpact: -10, tier: 3 },
  { title: '铸链联合体基建大单', description: '万亿基建计划公布，FOR看涨', targetAsset: 'FOR', priceImpact: 0.01, sentimentImpact: 5, tier: 3 },
  { title: '暗棘帝国网络攻击', description: '大规模网络攻击瘫痪多国金融系统', priceImpact: -0.008, sentimentImpact: -15, tier: 4 },
  { title: '碧芒同盟粮食丰收', description: '创纪录粮食产量稳定物价', targetAsset: 'EMK', priceImpact: -0.005, sentimentImpact: 8, tier: 3 },
  { title: '汐潮自由邦赌场丑闻', description: '巨型赌场洗钱案曝光', priceImpact: -0.01, sentimentImpact: -8, tier: 3 },
  { title: '全球芯片短缺加剧', description: '供应链危机蔓延，科技股承压', targetAsset: 'KAL', priceImpact: -0.008, sentimentImpact: -5, tier: 3 },
  { title: '稀土出口禁令', description: '铸链联合体限制稀土出口', targetAsset: 'FOR', priceImpact: 0.012, sentimentImpact: -3, tier: 4 },
  { title: '龙头金矿脉枯竭', description: '全球最大金矿宣布储量下调30%', targetAsset: 'GOLD', priceImpact: 0.02, sentimentImpact: -5, tier: 3 },
  { title: '跨国贸易协议达成', description: '六国签署零关税协议，市场欢欣', priceImpact: 0.005, sentimentImpact: 10, tier: 4 },
  { title: '飓风摧毁焰砂港口', description: '主要出口港口瘫痪，原油运输受阻', targetAsset: 'OIL', priceImpact: 0.02, sentimentImpact: -8, tier: 3 },
]

let eventCounter = 0

export class EventEngine {
  private recentEvents: GameEvent[] = []

  getRecentEvents(count = 20): GameEvent[] {
    return this.recentEvents.slice(-count)
  }

  /** Called on L3 tick (every 5s). Chance to trigger a random event. */
  tick(): GameEvent | null {
    if (Math.random() > 0.4) return null

    const template = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)]
    const event: GameEvent = {
      ...template,
      id: `evt_${eventCounter++}`,
    }

    this.recentEvents.push(event)
    if (this.recentEvents.length > 50) this.recentEvents.shift()

    eventBus.emit('event:triggered', { id: event.id, tier: event.tier })
    eventBus.emit('news:published', {
      id: event.id,
      templateId: event.id,
      targetCountry: event.targetAsset ?? 'global',
    })

    return event
  }
}
