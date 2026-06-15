import { eventBus } from '@/engine/core/EventBus'
import { MarketEngine } from '@/engine/market/MarketEngine'
import type { AIAgent, AITradeLog, AIType } from './types'

const LEEK_NAMES = ['小韭菜A', '追涨侠', '抄底王', '梭哈哥', '佛系散', '涨停猎人', '技术派小明', '消息灵通者']
const WHALE_NAMES = ['巨鲸Alpha', '暗流机构', '资本之镰', '深渊猎手']
const SCAMMER_NAMES = ['内幕大师', '带单老师', '币圈巴菲特']

function pickName(pool: string[], used: Set<string>): string {
  const available = pool.filter((n) => !used.has(n))
  if (available.length === 0) return pool[Math.floor(Math.random() * pool.length)] + Math.floor(Math.random() * 100)
  const name = available[Math.floor(Math.random() * available.length)]
  used.add(name)
  return name
}

export class AIEngine {
  private agents: AIAgent[] = []
  private usedNames = new Set<string>()
  private tradeLog: AITradeLog[] = []

  constructor(
    leekCount = 20,
    whaleCount = 4,
    scammerCount = 2,
  ) {
    let id = 0
    for (let i = 0; i < leekCount; i++) {
      this.agents.push({
        id: `ai_${id++}`,
        name: pickName(LEEK_NAMES, this.usedNames),
        type: 'leek',
        cash: 1000 + Math.random() * 9000,
        holdings: {},
        riskTolerance: 0.3 + Math.random() * 0.4,
      })
    }
    for (let i = 0; i < whaleCount; i++) {
      this.agents.push({
        id: `ai_${id++}`,
        name: pickName(WHALE_NAMES, this.usedNames),
        type: 'whale',
        cash: 500_000 + Math.random() * 1_500_000,
        holdings: {},
        riskTolerance: 0.2 + Math.random() * 0.3,
      })
    }
    for (let i = 0; i < scammerCount; i++) {
      this.agents.push({
        id: `ai_${id++}`,
        name: pickName(SCAMMER_NAMES, this.usedNames),
        type: 'scammer',
        cash: 50_000 + Math.random() * 200_000,
        holdings: {},
        riskTolerance: 0.6 + Math.random() * 0.3,
      })
    }
  }

  getAgents(): AIAgent[] {
    return this.agents
  }

  getRecentTrades(count = 20): AITradeLog[] {
    return this.tradeLog.slice(-count)
  }

  /** Called on L1 tick (every 2s). Each agent decides whether to trade. */
  tick(market: MarketEngine, sentiment: number): void {
    for (const agent of this.agents) {
      this.decideAndTrade(agent, market, sentiment)
    }
  }

  /** Called on L2 tick (every 3s). Some agents post on social media. */
  socialTick(sentiment: number): { agentId: string; content: string; agentName: string } | null {
    if (Math.random() > 0.4) return null
    const agent = this.agents[Math.floor(Math.random() * this.agents.length)]
    const content = this.generateSocialPost(agent, sentiment)
    return { agentId: agent.id, content, agentName: agent.name }
  }

  private generateSocialPost(agent: AIAgent, sentiment: number): string {
    const type = agent.type
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

    if (sentiment > 70) {
      const posts = type === 'leek'
        ? [
          '涨疯了！再不买就来不及了！',
          '这波牛市要上天',
          '梭哈梭哈，ALL IN！',
          '旁边的老王都赚了，我也要！',
          'To the moon！钻石手！',
          '今天又在车上赚了一台车',
          '均线多头排列，完美！',
          '突破新高了，加仓加仓！',
          '这波行情没上车的人要后悔一辈子',
          '券商营业部都在排队开户',
        ]
        : type === 'whale'
        ? [
          '市场过热，注意风险',
          '泡沫正在形成，谨慎为上',
          '我已减仓50%，落袋为安',
          '流动性过剩的产物，不具持续性',
          '估值偏离基本面太远了',
          '历史上的顶部都是这么形成的',
          '聪明钱已经在撤了',
        ]
        : [
          '跟着我买，稳赚不赔！',
          '内部消息：明天还有一波大涨',
          '限时机会，错过拍大腿',
          '我上个月预测的行情全中了',
          'VIP群里已经提前布局了，涨了30%',
          '这个币目标价翻倍，信不信由你',
          '赶紧加我群，今晚有重磅消息',
          '不信我的先截图，一周后见分晓',
        ]
      return pick(posts)
    } else if (sentiment < 30) {
      const posts = type === 'leek'
        ? [
          '完了完了，要崩了',
          '我已经亏了50%了...',
          '割肉跑了，受不了了',
          '有人救救市场吗',
          '跌得我心脏都要停了',
          '老婆发现我亏钱了要离婚',
          '这辈子再也不碰金融了',
          '杠杆爆仓了，一觉醒来什么都没了',
          '底部在哪？还有底吗？',
          '谁来管管啊，这也太离谱了',
        ]
        : type === 'whale'
        ? [
          '恐慌是买入的好时机',
          '别人恐惧我贪婪',
          '抄底机会到了，准备加仓',
          '下跌空间有限，风险收益比很好',
          '市场情绪指标已经极度恐慌',
          '这次下跌只是技术性调整',
          '我在跌停板挂了买单',
        ]
        : [
          '赶紧清仓！别问了！',
          '内部消息：还会继续跌',
          '跑得快的吃肉跑得慢的吃屎',
          '我早就说了要跌，不听话的活该',
          '下一个支撑位在哪？没有支撑位',
          '这次要跌到骨头里',
          '大庄家在出货，散户还在抄底？',
          '止损不止损？那就等着归零吧',
        ]
      return pick(posts)
    } else {
      const posts = type === 'leek'
        ? [
          '今天横盘无聊',
          '有没有大佬分析一下？',
          '等方向明确再操作',
          '看了看钱包叹了口气',
          '涨也不涨，跌也不跌，急死人了',
          '今天的行情看不懂',
          '大家觉得接下来怎么走？',
          '持币观望，不急不急',
          '反正我的钱也不多，随缘吧',
          '又到了选择方向的时候了',
        ]
        : type === 'whale'
        ? [
          '观望中',
          '等待信号',
          '市场进入整理期',
          '量能萎缩，突破需要时间',
          '多空分歧加大，方向不明',
          '策略上保持中性',
          '耐心等待趋势确认',
        ]
        : [
          '关注我，每日分析',
          '技术面看支撑位在关键位置',
          '消息面平静，继续持有',
          'MACD即将金叉，注意变盘',
          '布林带收窄，大行情要来了',
          '这波调整很健康，别慌',
          '我的会员今天收益3%，稳定盈利',
          '即将突破，做好准备',
          ' subscribe my channel for signals',
        ]
      return pick(posts)
    }
  }

  private decideAndTrade(agent: AIAgent, market: MarketEngine, sentiment: number): void {
    const assets = market.getAllAssets()
    if (assets.length === 0) return

    // Each agent has a chance to act
    if (Math.random() > agent.riskTolerance) return

    const asset = assets[Math.floor(Math.random() * assets.length)]
    const price = asset.currentPrice

    let side: 'buy' | 'sell'
    let amount: number

    switch (agent.type) {
      case 'leek':
        // Trend followers: buy when sentiment high, sell when low (buy high sell low)
        side = sentiment > 55 ? 'buy' : sentiment < 45 ? 'sell' : (Math.random() > 0.5 ? 'buy' : 'sell')
        amount = agent.cash * (0.05 + Math.random() * 0.15)
        break

      case 'whale':
        // Contrarian: buy when sentiment low, sell when high
        side = sentiment < 40 ? 'buy' : sentiment > 60 ? 'sell' : (Math.random() > 0.5 ? 'buy' : 'sell')
        amount = agent.cash * (0.1 + Math.random() * 0.3)
        break

      case 'scammer':
        // Pump and dump: buy aggressively then sell
        const hasPosition = (agent.holdings[asset.id] ?? 0) > 0
        side = hasPosition ? 'sell' : 'buy'
        amount = agent.cash * (0.15 + Math.random() * 0.25)
        break
    }

    // Execute trade
    if (side === 'buy') {
      const qty = amount / price
      if (amount > agent.cash) return
      agent.cash -= amount
      agent.holdings[asset.id] = (agent.holdings[asset.id] ?? 0) + qty
    } else {
      const held = agent.holdings[asset.id] ?? 0
      if (held <= 0) return
      const sellQty = held * (0.2 + Math.random() * 0.5)
      const revenue = sellQty * price
      agent.holdings[asset.id] = held - sellQty
      agent.cash += revenue
      amount = revenue
    }

    // Impact market
    market.addTradeFlow(asset.id, side, amount)

    const log: AITradeLog = {
      agentId: agent.id,
      agentName: agent.name,
      agentType: agent.type,
      assetId: asset.id,
      side,
      amount,
      price,
    }
    this.tradeLog.push(log)
    if (this.tradeLog.length > 200) this.tradeLog.shift()

    eventBus.emit('ai:trade', {
      agentId: agent.id,
      assetId: asset.id,
      side,
      amount,
    })
  }
}
