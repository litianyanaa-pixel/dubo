/**
 * 国家经济模拟引擎
 * 管理7国经济指标演化、央行AI、国际关系、战争系统
 */
import { eventBus } from '@/engine/core/EventBus'
import type { MarketEngine } from '@/engine/market/MarketEngine'
import type { SentimentEngine } from '@/engine/sentiment/SentimentEngine'
import { INITIAL_COUNTRIES, type CountryState } from '@/data/countries'

// ─── 类型定义 ───────────────────────────────────────────

export interface EconomicEvent {
  id: string
  countryId: string
  type: 'rate_change' | 'gdp_shift' | 'inflation_spike' | 'domestic_crisis' | 'domestic_boom' | 'tiansuan_adjust'
  title: string
  description: string
  sentimentImpact: number
}

export interface GeopoliticalEvent {
  id: string
  title: string
  description: string
  type: 'war_start' | 'war_end' | 'war_update' | 'sanction' | 'trade_deal' | 'arrest_risk' | 'special_auction'
  targetCountry?: string
  targetAsset?: string
  volatilityMultiplier?: number
  sentimentImpact: number
  duration: number
}

interface ActiveWar {
  id: string
  attacker: string
  defender: string
  phase: 'espionage' | 'friction' | 'outbreak' | 'warfare' | 'resolution'
  phaseTicks: number
  scoreA: number
  scoreD: number
  warFatigue: number
}

// ─── 模板 ───────────────────────────────────────────

const WAR_TEMPLATES = [
  { title: '{a}与{b}边境冲突升级', desc: '两国军队在边境地区发生激烈交火，全面战争风险上升' },
  { title: '{a}对{b}发动军事打击', desc: '巡航导弹袭击多处军事目标，国际社会紧急斡旋' },
  { title: '{a}宣布进入战时状态', desc: '全国总动员，金融市场剧烈动荡' },
]

const PEACE_TEMPLATES = [
  { title: '{a}与{b}签署停火协议', desc: '双方同意立即停火，市场松了一口气' },
  { title: '多国斡旋促成{a}和平谈判', desc: '外交取得突破，地缘紧张局势缓解' },
]

const SANCTION_TEMPLATES = [
  { title: '{a}对{b}实施全面经济制裁', desc: '制裁涵盖能源、金融、科技领域' },
  { title: '国际组织冻结{a}海外资产', desc: '数千亿资产被冻结，该国货币暴跌' },
]

const WAR_UPDATES = [
  { text: '{a}军队取得局部胜利', sentiment: 5, impactMul: 0.8 },
  { text: '{b}发动反攻', sentiment: -5, impactMul: 0.8 },
  { text: '{a}后方遭导弹袭击', sentiment: -8, impactMul: 1.0 },
  { text: '外交谈判破裂', sentiment: -10, impactMul: 1.2 },
  { text: '双方进入僵持阶段', sentiment: -3, impactMul: 0.5 },
]

let eventCounter = 0

// ─── 国家引擎 ───────────────────────────────────────────

export class CountryEngine {
  private countries: Map<string, CountryState> = new Map()
  private activeWars: ActiveWar[] = []
  private manipulationScore = 0
  private arrestThreshold = 15
  private tiansuanCounter = 0 // 伽蓝天算计数器

  constructor() {
    for (const c of INITIAL_COUNTRIES) {
      // 深拷贝，每局独立
      this.countries.set(c.id, {
        ...c,
        relations: { ...c.relations },
      })
    }
  }

  // ─── 查询 ───────────────────────────────────────────

  getCountry(id: string): CountryState | undefined {
    return this.countries.get(id)
  }

  getAllCountries(): CountryState[] {
    return [...this.countries.values()]
  }

  getRelation(a: string, b: string): number {
    return this.countries.get(a)?.relations[b] ?? 0
  }

  getWarVolatilityMultiplier(assetId: string): number {
    let mul = 1.0
    for (const war of this.activeWars) {
      const attacker = this.countries.get(war.attacker)
      const defender = this.countries.get(war.defender)
      if (attacker?.currencyId === assetId || defender?.currencyId === assetId) {
        mul *= war.phase === 'outbreak' || war.phase === 'warfare' ? 2.0 : 1.5
      }
    }
    return mul
  }

  getActiveWars(): ActiveWar[] { return this.activeWars }
  getManipulationScore(): number { return this.manipulationScore }

  // ─── 玩家操作 ───────────────────────────────────────────

  recordManipulation(level: number): void {
    this.manipulationScore += level
  }

  // ─── L2 tick: 资本流动 ────────────────────────────────

  updateCapitalFlows(): void {
    // 利率差驱动资本流动：高利率国家吸引资本
    const avgRate = [...this.countries.values()].reduce((s, c) => s + c.interestRate, 0) / 7

    for (const c of this.countries.values()) {
      const rateDiff = c.interestRate - avgRate
      // 资本流入 = 利率差 × 系数，加入随机性
      const flowChange = rateDiff * 0.5 + (Math.random() - 0.5) * 0.2
      c.capitalFlow = Math.max(-10, Math.min(10, c.capitalFlow + flowChange * 0.1))
    }
  }

  // ─── L4 tick: 经济指标演化 ────────────────────────────

  updateEconomics(): EconomicEvent | null {
    let event: EconomicEvent | null = null

    for (const c of this.countries.values()) {
      // GDP 增速微调：根据资本流动和利率
      const flowImpact = c.capitalFlow * 0.02
      const rateDrag = c.interestRate > 5 ? -0.05 : 0.02
      c.gdpGrowth += flowImpact + rateDrag + (Math.random() - 0.5) * 0.1
      c.gdpGrowth = Math.max(-5, Math.min(12, c.gdpGrowth))

      // 通胀：高利率压通胀，低利率推通胀
      const rateEffect = -(c.interestRate - 3.0) * 0.02
      c.inflation += rateEffect + (Math.random() - 0.5) * 0.05
      c.inflation = Math.max(0.1, Math.min(15, c.inflation))

      // 满意度：跟随GDP和通胀
      if (c.gdpGrowth > 3) c.satisfaction += 0.3
      if (c.inflation > 5) c.satisfaction -= 0.5
      c.satisfaction = Math.max(5, Math.min(95, c.satisfaction + (Math.random() - 0.5) * 0.5))

      // 稳定性：跟随满意度，差距大的国家更不稳定
      c.stability += (c.satisfaction - c.stability) * 0.05
      c.stability = Math.max(5, Math.min(95, c.stability))

      // ─── 央行AI ───
      // 如果通胀偏离2%超过1个百分点，有30%概率调整利率
      if (Math.abs(c.inflation - 2.0) > 1.0 && Math.random() < 0.3) {
        const adjust = c.inflation > 2.0 ? 0.25 : -0.25
        c.interestRate += adjust
        c.interestRate = Math.max(0.0, Math.min(15, c.interestRate))

        if (Math.abs(adjust) >= 0.25) {
          event = {
            id: `eco_${eventCounter++}`,
            countryId: c.id,
            type: 'rate_change',
            title: `🏦 ${c.name}央行${adjust > 0 ? '加息' : '降息'}${Math.abs(adjust).toFixed(2)}%`,
            description: `${c.name}央行宣布${adjust > 0 ? '上调' : '下调'}利率至${c.interestRate.toFixed(2)}%`,
            sentimentImpact: adjust > 0 ? -3 : 5,
          }
        }
      }
    }

    // ─── 伽蓝"天算"特殊机制 ───
    this.tiansuanCounter++
    if (this.tiansuanCounter >= 2) { // 每2个L4 tick（约60秒）
      this.tiansuanCounter = 0
      const kalan = this.countries.get('kalan')
      if (kalan) {
        // 天算随机微调一个经济参数
        const actions = ['rate', 'subsidy', 'tax'] as const
        const action = actions[Math.floor(Math.random() * actions.length)]
        let title = ''
        let desc = ''
        let impact = 0

        if (action === 'rate') {
          const adjust = (Math.random() - 0.5) * 0.1
          kalan.interestRate += adjust
          kalan.interestRate = Math.max(0, Math.min(10, kalan.interestRate))
          title = '🤖 天算系统调整利率'
          desc = `伽蓝AI"天算"将利率微调至${kalan.interestRate.toFixed(2)}%`
          impact = adjust > 0 ? -2 : 2
        } else if (action === 'subsidy') {
          title = '🤖 天算系统调整产业补贴'
          desc = '伽蓝AI优化了科技产业补贴分配'
          impact = 3
        } else {
          title = '🤖 天算系统调整税率'
          desc = '伽蓝AI微调了资本利得税'
          impact = -1
        }

        // 只在没有更重要的利率事件时才发出天算事件
        if (!event) {
          event = {
            id: `eco_tiansuan_${eventCounter++}`,
            countryId: 'kalan',
            type: 'tiansuan_adjust',
            title,
            description: desc,
            sentimentImpact: impact,
          }
        }
      }
    }

    return event
  }

  // ─── L5 tick: 地缘事件 ───────────────────────────────

  tick(market: MarketEngine, sentiment: SentimentEngine): GeopoliticalEvent | null {
    // 衰减操纵分数
    this.manipulationScore = Math.max(0, this.manipulationScore - 1)

    // 国际关系缓慢回归中性（每tick +1）
    for (const c of this.countries.values()) {
      for (const otherId of Object.keys(c.relations)) {
        if (c.relations[otherId] !== 0) {
          c.relations[otherId] += c.relations[otherId] > 0 ? -0.5 : 0.5
        }
      }
    }

    // 更新现有战争
    const warEvents = this.updateWars()

    // 逮捕风险
    if (this.manipulationScore >= this.arrestThreshold) {
      const arrestChance = (this.manipulationScore - this.arrestThreshold) * 0.05
      if (Math.random() < arrestChance) {
        this.manipulationScore = 0
        return {
          id: `geo_${eventCounter++}`,
          title: '⚠️ 监管机构调查',
          description: '你的操纵行为引起了监管机构注意，被短暂限制交易',
          type: 'arrest_risk',
          sentimentImpact: -10,
          duration: 1,
        }
      }
    }

    // 如果有战争事件，优先返回
    if (warEvents.length > 0) return warEvents[0]

    // 随机地缘事件（25%概率）
    if (Math.random() > 0.25) return null

    const roll = Math.random()
    const countries = [...this.countries.values()]

    // 30% 新战争
    if (roll < 0.3 && this.activeWars.length < 2) {
      return this.startWar(countries, sentiment)
    }

    // 25% 制裁
    if (roll < 0.55) {
      return this.applySanction(countries, sentiment)
    }

    // 20% 和平（如果有战争）
    if (roll < 0.75 && this.activeWars.length > 0) {
      return this.endWar()
    }

    // 25% 贸易协议
    return this.tradeDeal(countries)
  }

  // ─── 战争系统 ───────────────────────────────────────────

  private startWar(countries: CountryState[], sentiment: SentimentEngine): GeopoliticalEvent {
    // 优先选择关系差的国家对
    let bestPair = { a: countries[0], b: countries[1], relation: 0 }
    for (let i = 0; i < countries.length; i++) {
      for (let j = i + 1; j < countries.length; j++) {
        const rel = countries[i].relations[countries[j].id]
        if (rel < bestPair.relation || (bestPair.a === countries[0] && bestPair.b === countries[1])) {
          bestPair = { a: countries[i], b: countries[j], relation: rel }
        }
      }
    }

    // 但也有随机性
    const a = Math.random() < 0.6 ? bestPair.a : countries[Math.floor(Math.random() * countries.length)]
    let b = Math.random() < 0.6 ? bestPair.b : countries[Math.floor(Math.random() * countries.length)]
    while (b.id === a.id) b = countries[Math.floor(Math.random() * countries.length)]

    const template = WAR_TEMPLATES[Math.floor(Math.random() * WAR_TEMPLATES.length)]
    const war: ActiveWar = {
      id: `war_${eventCounter++}`,
      attacker: a.id,
      defender: b.id,
      phase: 'espionage',
      phaseTicks: 0,
      scoreA: 50,
      scoreD: 50,
      warFatigue: 0,
    }
    this.activeWars.push(war)

    // 关系恶化
    a.relations[b.id] = Math.max(-100, (a.relations[b.id] ?? 0) - 30)
    b.relations[a.id] = Math.max(-100, (b.relations[a.id] ?? 0) - 30)

    // 经济冲击
    a.gdpGrowth -= 0.5
    b.gdpGrowth -= 0.5
    a.satisfaction -= 5
    b.satisfaction -= 5

    return {
      id: `geo_${eventCounter++}`,
      title: template.title.replace('{a}', a.name).replace('{b}', b.name),
      description: template.desc,
      type: 'war_start',
      targetCountry: a.id,
      targetAsset: a.currencyId,
      volatilityMultiplier: 2.0,
      sentimentImpact: -15,
      duration: 1,
    }
  }

  private updateWars(): GeopoliticalEvent[] {
    const events: GeopoliticalEvent[] = []

    this.activeWars = this.activeWars.filter(war => {
      war.phaseTicks++
      war.warFatigue += 0.5

      // 阶段转换
      const phaseDurations: Record<string, number> = {
        espionage: 2, // 2个L5 tick = 2分钟
        friction: 1,
        outbreak: 1,
        warfare: 10, // 最长10个tick
      }

      if (war.phase !== 'resolution' && war.phaseTicks >= (phaseDurations[war.phase] ?? 5)) {
        const phases: ActiveWar['phase'][] = ['espionage', 'friction', 'outbreak', 'warfare', 'resolution']
        const idx = phases.indexOf(war.phase)
        if (idx < phases.length - 1) {
          war.phase = phases[idx + 1]
          war.phaseTicks = 0

          if (war.phase === 'outbreak') {
            // 战争爆发：大幅冲击
            const attacker = this.countries.get(war.attacker)
            const defender = this.countries.get(war.defender)
            if (attacker && defender) {
              return true // 继续战争，事件在下面处理
            }
          }
        }
      }

      // 战争期间：随机战况更新
      if (war.phase === 'warfare' && Math.random() < 0.5) {
        const update = WAR_UPDATES[Math.floor(Math.random() * WAR_UPDATES.length)]
        const attacker = this.countries.get(war.attacker)
        const defender = this.countries.get(war.defender)
        if (attacker && defender) {
          // 战争分数变化
          const scoreChange = (Math.random() - 0.5) * 15
          war.scoreA += scoreChange
          war.scoreD -= scoreChange
          war.scoreA = Math.max(0, Math.min(100, war.scoreA))
          war.scoreD = Math.max(0, Math.min(100, war.scoreD))

          events.push({
            id: `geo_${eventCounter++}`,
            title: `💥 ${update.text.replace('{a}', attacker.name).replace('{b}', defender.name)}`,
            description: `战争分数: ${attacker.name} ${war.scoreA.toFixed(0)} - ${defender.name} ${war.scoreD.toFixed(0)}`,
            type: 'war_update',
            targetCountry: war.attacker,
            targetAsset: attacker.currencyId,
            volatilityMultiplier: update.impactMul,
            sentimentImpact: update.sentiment,
            duration: 1,
          })
        }
      }

      // 战争结束条件
      const shouldEnd =
        war.phase === 'resolution' ||
        war.warFatigue > 100 ||
        war.phaseTicks > (phaseDurations[war.phase] ?? 5) + 5

      if (shouldEnd) {
        // 战后处理
        this.resolveWar(war)
        return false // 移除战争
      }

      return true // 继续战争
    })

    return events
  }

  private resolveWar(war: ActiveWar): void {
    const attacker = this.countries.get(war.attacker)
    const defender = this.countries.get(war.defender)
    if (!attacker || !defender) return

    // 关系回升到冷战水平
    attacker.relations[war.defender] = Math.min(-20, attacker.relations[war.defender] + 10)
    defender.relations[war.attacker] = Math.min(-20, defender.relations[war.attacker] + 10)

    // 经济损失
    attacker.gdpGrowth -= 1.0
    defender.gdpGrowth -= 1.5
    attacker.satisfaction -= 5
    defender.satisfaction -= 10

    // 胜方获利
    if (war.scoreA > war.scoreD) {
      attacker.capitalFlow += 2
      defender.capitalFlow -= 3
    } else {
      defender.capitalFlow += 2
      attacker.capitalFlow -= 3
    }
  }

  private endWar(): GeopoliticalEvent {
    const war = this.activeWars[0]
    this.activeWars.shift()

    const attacker = this.countries.get(war.attacker)
    const defender = this.countries.get(war.defender)
    const template = PEACE_TEMPLATES[Math.floor(Math.random() * PEACE_TEMPLATES.length)]

    this.resolveWar(war)

    return {
      id: `geo_${eventCounter++}`,
      title: template.title.replace('{a}', attacker?.name ?? '交战方').replace('{b}', defender?.name ?? '对手'),
      description: '停火协议生效，市场情绪回升',
      type: 'war_end',
      targetCountry: war.attacker,
      targetAsset: attacker?.currencyId,
      sentimentImpact: 12,
      duration: 1,
    }
  }

  private applySanction(countries: CountryState[], _sentiment: SentimentEngine): GeopoliticalEvent {
    const a = countries[Math.floor(Math.random() * countries.length)]
    let b = countries[Math.floor(Math.random() * countries.length)]
    while (b.id === a.id) b = countries[Math.floor(Math.random() * countries.length)]

    const template = SANCTION_TEMPLATES[Math.floor(Math.random() * SANCTION_TEMPLATES.length)]

    // 关系恶化
    a.relations[b.id] = Math.max(-100, (a.relations[b.id] ?? 0) - 15)
    b.relations[a.id] = Math.max(-100, (b.relations[a.id] ?? 0) - 15)

    // 被制裁方经济受冲击
    b.gdpGrowth -= 0.3
    b.capitalFlow -= 1

    return {
      id: `geo_${eventCounter++}`,
      title: template.title.replace('{a}', a.name).replace('{b}', b.name),
      description: template.desc,
      type: 'sanction',
      targetCountry: b.id,
      targetAsset: b.currencyId,
      volatilityMultiplier: 1.5,
      sentimentImpact: -8,
      duration: 2,
    }
  }

  private tradeDeal(countries: CountryState[]): GeopoliticalEvent {
    const a = countries[Math.floor(Math.random() * countries.length)]
    let b = countries[Math.floor(Math.random() * countries.length)]
    while (b.id === a.id) b = countries[Math.floor(Math.random() * countries.length)]

    // 关系改善
    a.relations[b.id] = Math.min(100, (a.relations[b.id] ?? 0) + 10)
    b.relations[a.id] = Math.min(100, (b.relations[a.id] ?? 0) + 10)

    // 双方经济利好
    a.gdpGrowth += 0.1
    b.gdpGrowth += 0.1

    return {
      id: `geo_${eventCounter++}`,
      title: `${a.name}与${b.name}签署贸易协议`,
      description: `双方达成新协定，促进经济合作`,
      type: 'trade_deal',
      targetCountry: a.id,
      sentimentImpact: 8,
      duration: 1,
    }
  }
}
